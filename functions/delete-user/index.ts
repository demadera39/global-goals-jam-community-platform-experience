import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@blinkdotnew/sdk'

interface DeleteUserRequest {
  userId: string
  userEmail: string
  userName?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }

  try {
    const blink = createClient({ 
      projectId: 'global-goals-jam-community-platform-7uamgc2j',
      authRequired: false 
    })

    const { userId, userEmail, userName }: DeleteUserRequest = await req.json()

    if (!userId || !userEmail) {
      return new Response('Missing userId or userEmail', { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      })
    }

    // First, send deletion notification email
    const deletionEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://globalgoalsjam.org/assets/ggj-logo.png" alt="Global Goals Jam" style="max-width: 200px; height: auto;" />
          <h1 style="color: #00A651; margin: 20px 0;">Account Deletion Notice</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">Dear ${userName || userEmail.split('@')[0]},</p>
          <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
            We're writing to inform you that your Global Goals Jam account has been deleted from our platform.
          </p>
          <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
            All your personal data, including profile information and activity history, has been permanently removed from our systems in accordance with our privacy policy.
          </p>
          <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
            If you believe this was done in error or would like to rejoin our community in the future, please don't hesitate to contact us.
          </p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
          <p>Thank you for being part of our community.<br/>The Global Goals Jam Team</p>
          <p style="margin-top: 15px;">
            Questions? Contact us at <a href="mailto:hello@globalgoalsjam.org" style="color: #00A651;">hello@globalgoalsjam.org</a>
          </p>
          <p style="margin-top: 10px;">
            <a href="https://globalgoalsjam.org" style="color: #00A651;">globalgoalsjam.org</a>
          </p>
        </div>
      </div>
    `

    try {
      // Send deletion notification email
      await blink.notifications.email({
        to: userEmail,
        from: 'Marco <marco@globalgoalsjam.org>',
        subject: 'Your Global Goals Jam Account Has Been Deleted',
        html: deletionEmailContent,
        text: deletionEmailContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
      })
    } catch (emailError) {
      console.warn('Failed to send deletion notification email:', emailError)
      // Continue with deletion even if email fails
    }

    // Delete user from users table
    await blink.db.users.delete(userId)
    
    // Delete related records
    try {
      // Delete course enrollments
      const enrollments = await blink.db.courseEnrollments.list({ where: { userId } })
      for (const enrollment of enrollments) {
        await blink.db.courseEnrollments.delete(enrollment.id)
      }

      // Delete course progress
      const progress = await blink.db.courseProgress.list({ where: { userId } })
      for (const prog of progress) {
        await blink.db.courseProgress.delete(prog.id)
      }

      // Delete host applications
      const applications = await blink.db.hostApplications.list({ where: { userId } })
      for (const app of applications) {
        await blink.db.hostApplications.delete(app.id)
      }

      // Delete event registrations
      const registrations = await blink.db.eventRegistrations.list({ where: { participantId: userId } })
      for (const reg of registrations) {
        await blink.db.eventRegistrations.delete(reg.id)
      }

      // Delete user achievements
      const achievements = await blink.db.userAchievements.list({ where: { userId } })
      for (const achievement of achievements) {
        await blink.db.userAchievements.delete(achievement.id)
      }

      // Update events hosted by this user to mark them as orphaned
      const hostedEvents = await blink.db.events.list({ where: { hostId: userId } })
      for (const event of hostedEvents) {
        await blink.db.events.update(event.id, { 
          hostId: 'deleted-user', 
          hostName: 'Former Host (Deleted)' 
        })
      }

    } catch (cleanupError) {
      console.warn('Some cleanup operations failed:', cleanupError)
      // Continue - main user deletion was successful
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'User account deleted successfully',
      emailSent: true
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})