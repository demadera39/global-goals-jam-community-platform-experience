import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@blinkdotnew/sdk'

interface MessageRequest {
  recipients: Array<{
    id: string
    email: string
    name: string
    role: string
  }>
  template: {
    subject: string
    content: string
    placeholders: string[]
  }
  messageType: 'individual' | 'role' | 'all'
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

    const { recipients, template, messageType }: MessageRequest = await req.json()

    if (!recipients || !recipients.length || !template) {
      return new Response('Missing required fields', { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      })
    }

    const results = []
    
    // Send email to each recipient
    for (const recipient of recipients) {
      try {
        // Replace placeholders in email content
        const personalizedContent = template.content
          .replace(/{{name}}/g, recipient.name)
          .replace(/{{role}}/g, recipient.role)

        const result = await blink.notifications.email({
          to: recipient.email,
          from: 'Marco <marco@globalgoalsjam.org>',
          subject: template.subject,
          html: personalizedContent,
          text: personalizedContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
        })

        results.push({ 
          recipientId: recipient.id, 
          email: recipient.email, 
          success: result.success,
          messageId: result.messageId 
        })

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error)
        results.push({ 
          recipientId: recipient.id, 
          email: recipient.email, 
          success: false, 
          error: error.message 
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return new Response(JSON.stringify({ 
      success: true, 
      sent: successCount,
      failed: failureCount,
      results: results
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Send message error:', error)
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