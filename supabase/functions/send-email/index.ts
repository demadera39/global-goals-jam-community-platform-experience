import { corsHeaders } from '../_shared/cors.ts'

/**
 * This function runs unauthenticated (verify_jwt = false) because the contact
 * form and the magic-link sign-in both need it before a session exists. That
 * makes it reachable by anyone who finds the URL, so the sender identity and
 * the blast radius are pinned here rather than trusted from the caller:
 *
 *  - `from` must be a globalgoalsjam.org address. Without this the endpoint
 *    can send mail as any brand from our verified domain (phishing, and it
 *    burns the domain's sending reputation).
 *  - at most MAX_RECIPIENTS addresses per call, so it can't be used to blast
 *    a list. Every real caller sends to one or two.
 */
const SENDER_DOMAIN = 'globalgoalsjam.org'
const MAX_RECIPIENTS = 5
const DEFAULT_FROM = `Global Goals Jam <marco@${SENDER_DOMAIN}>`

/** Pull the bare address out of "Name <a@b.c>" or "a@b.c". */
function bareAddress(value: string): string {
  const match = value.match(/<([^>]+)>/)
  return (match ? match[1] : value).trim().toLowerCase()
}

function isOwnDomain(value: string): boolean {
  return bareAddress(value).endsWith(`@${SENDER_DOMAIN}`)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, from, subject, html, text, replyTo } = await req.json()

    if (!to || !subject) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Never send as anyone but ourselves.
    if (from && !isOwnDomain(String(from))) {
      console.warn('send-email: rejected sender', from)
      return new Response(JSON.stringify({ error: `Sender must be a ${SENDER_DOMAIN} address` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const recipients = Array.isArray(to) ? to : [to]
    if (recipients.length > MAX_RECIPIENTS) {
      console.warn('send-email: rejected recipient count', recipients.length)
      return new Response(JSON.stringify({ error: `At most ${MAX_RECIPIENTS} recipients per message` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || DEFAULT_FROM,
        to: recipients,
        reply_to: replyTo || undefined,
        subject,
        html: html || undefined,
        text: text || undefined,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Resend error:', data)
      return new Response(JSON.stringify({ success: false, error: data.message || 'Email send failed' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, messageId: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('send-email error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
