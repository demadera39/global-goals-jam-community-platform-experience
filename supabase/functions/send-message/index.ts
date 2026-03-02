import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipients, template, messageType } = await req.json()

    if (!recipients?.length || !template?.subject || !template?.content) {
      return new Response(JSON.stringify({ success: false, error: 'Missing recipients or template' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      return new Response(JSON.stringify({ success: false, error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: any[] = []
    let sent = 0
    let failed = 0

    for (const recipient of recipients) {
      try {
        // Replace placeholders
        let html = template.content
          .replace(/\{\{name\}\}/g, recipient.name || 'there')
          .replace(/\{\{role\}\}/g, recipient.role || 'participant')

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Global Goals Jam <marco@globalgoalsjam.org>',
            to: [recipient.email],
            subject: template.subject,
            html,
          }),
        })

        const data = await res.json()

        if (res.ok) {
          sent++
          results.push({ recipientId: recipient.id, email: recipient.email, success: true, messageId: data.id })
        } else {
          failed++
          results.push({ recipientId: recipient.id, email: recipient.email, success: false, error: data.message })
        }

        // Rate limit protection
        await new Promise(r => setTimeout(r, 100))
      } catch (e) {
        failed++
        results.push({ recipientId: recipient.id, email: recipient.email, success: false, error: e.message })
      }
    }

    return new Response(JSON.stringify({ success: true, sent, failed, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('send-message error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
