import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "npm:@blinkdotnew/sdk"

const blink = createClient({
  projectId: 'global-goals-jam-community-platform-7uamgc2j',
  authRequired: false
})

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  try {
    const { action } = await req.json()

    if (action === 'send_migration_emails') {
      return await sendMigrationEmails()
    } else if (action === 'get_users') {
      return await getExistingUsers()
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Migration function error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})

async function getExistingUsers() {
  try {
    const users = await blink.db.users.list({
      limit: 100
    })

    const userSummary = users.map(user => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      hasPassword: !!user.passwordHash,
      passwordType: user.passwordHash?.startsWith('$2b$') ? 'bcrypt' : 'new_format'
    }))

    return new Response(JSON.stringify({
      success: true,
      users: userSummary,
      total: users.length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error getting users:', error)
    return new Response(JSON.stringify({ error: 'Failed to get users' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

async function sendMigrationEmails() {
  try {
    const users = await blink.db.users.list({
      limit: 100
    })

    const results = []
    
    for (const user of users) {
      try {
        // Create password reset token for migration
        const resetUrl = `https://global-goals-jam-community-platform-7uamgc2j.sites.blink.new/reset-password?token=migration_${user.id}_${Date.now()}`
        
        await blink.notifications.email({
          to: user.email,
          from: 'Marco <marco@globalgoalsjam.org>',
          subject: 'Important: Updated Global Goals Jam Platform',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #00A651;">Global Goals Jam Platform Update</h2>
              <p>Hello ${user.displayName || user.email},</p>
              <p>We've updated the Global Goals Jam platform with improved security and new features!</p>
              
              <h3>What's Changed:</h3>
              <ul>
                <li>✅ More secure authentication system</li>
                <li>✅ Better password protection</li>
                <li>✅ Improved user experience</li>
              </ul>
              
              <h3>Action Required:</h3>
              <p>To continue accessing your account, please set up a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #00A651; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Set Up New Password</a>
              </div>
              
              <p><strong>Alternative:</strong> If you prefer, you can also create a new account at <a href="https://global-goals-jam-community-platform-7uamgc2j.sites.blink.new/signup">our signup page</a>.</p>
              
              <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
              
              <p>Thank you for being part of the Global Goals Jam community!</p>
              
              <p>Best regards,<br>The Global Goals Jam Team</p>
            </div>
          `,
          text: `Global Goals Jam Platform Update

Hello ${user.displayName || user.email},

We've updated the Global Goals Jam platform with improved security and new features!

What's Changed:
- More secure authentication system
- Better password protection  
- Improved user experience

Action Required:
To continue accessing your account, please set up a new password by visiting:
${resetUrl}

Alternative: You can also create a new account at:
https://global-goals-jam-community-platform-7uamgc2j.sites.blink.new/signup

If you have any questions, please don't hesitate to reach out to our support team.

Thank you for being part of the Global Goals Jam community!

Best regards,
The Global Goals Jam Team`
        })

        results.push({
          email: user.email,
          status: 'sent'
        })

      } catch (emailError) {
        console.error(`Failed to send email to ${user.email}:`, emailError)
        results.push({
          email: user.email,
          status: 'failed',
          error: emailError.message
        })
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Migration emails sent to ${results.length} users`,
      results
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Migration email error:', error)
    return new Response(JSON.stringify({ error: 'Failed to send migration emails' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}