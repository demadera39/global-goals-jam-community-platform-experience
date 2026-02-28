import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from 'npm:stripe'
import { createClient } from 'npm:@blinkdotnew/sdk'

const blink = createClient({ projectId: 'global-goals-jam-community-platform-7uamgc2j', authRequired: false })

// Initialize Stripe client for optional server-side operations (uses STRIPE_SECRET_KEY from env if available)
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2022-11-15' })

function getBaseUrl() {
  return 'https://globalgoalsjam.org'
}

interface ReceiptEmailData {
  email: string
  enrollmentId: string
  amount: string
  paymentIntent?: string
  session?: any
}

async function sendPaymentReceiptEmail({ email, enrollmentId, amount, paymentIntent, session }: ReceiptEmailData) {
  const receiptNumber = `GGJ-${enrollmentId.substring(0, 8).toUpperCase()}`
  const receiptDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  })
  
  const html = `
  <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0B1324; background-color: #FAFAFA;">
    <!-- Header with Logo -->
    <div style="padding: 32px 24px; text-align: center; background: linear-gradient(135deg, #00A651 0%, #00B854 100%);">
      <div style="background: white; border-radius: 12px; padding: 16px; display: inline-block; margin-bottom: 16px;">
        <div style="width: 48px; height: 48px; background: #00A651; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
          <span style="color: white; font-weight: bold; font-size: 20px;">GGJ</span>
        </div>
      </div>
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">Payment Receipt</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Global Goals Jam Certification Course</p>
    </div>
    
    <!-- Receipt Details -->
    <div style="background: #ffffff; margin: 0 24px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
      <!-- Success Message -->
      <div style="padding: 24px; text-align: center; border-bottom: 1px solid #E5E7EB;">
        <div style="width: 64px; height: 64px; background: #00A651; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
          <span style="color: white; font-size: 32px;">✓</span>
        </div>
        <h2 style="margin: 0 0 8px; font-size: 22px; color: #0B1324;">Payment Successful!</h2>
        <p style="margin: 0; color: #6B7280; font-size: 16px;">Thank you for enrolling in the GGJ Host Certification Course</p>
      </div>
      
      <!-- Receipt Info -->
      <div style="padding: 24px;">
        <div style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 8px 0;">
            <span style="color: #6B7280; font-size: 14px;">Receipt Number:</span>
            <span style="color: #0B1324; font-weight: 600; font-size: 14px;">${receiptNumber}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 8px 0;">
            <span style="color: #6B7280; font-size: 14px;">Date:</span>
            <span style="color: #0B1324; font-size: 14px;">${receiptDate}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
            <span style="color: #6B7280; font-size: 14px;">Email:</span>
            <span style="color: #0B1324; font-size: 14px;">${email}</span>
          </div>
        </div>
        
        <!-- Course Details -->
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 16px; font-size: 16px; color: #0B1324;">Course Details</h3>
          <div style="background: #F9FAFB; border-radius: 8px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <p style="margin: 0 0 4px; font-weight: 600; color: #0B1324; font-size: 15px;">GGJ Host Certification Course</p>
                <p style="margin: 0 0 8px; color: #6B7280; font-size: 13px;">8-day comprehensive training program</p>
                <div style="display: flex; gap: 16px; font-size: 12px; color: #6B7280;">
                  <span>📧 Daily email lessons</span>
                  <span>📊 Learning dashboard</span>
                  <span>🏆 Official certificate</span>
                </div>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-size: 20px; font-weight: 600; color: #0B1324;">${amount}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Total -->
        <div style="border-top: 2px solid #00A651; padding-top: 16px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 16px; font-weight: 600; color: #0B1324;">Total Paid:</span>
            <span style="font-size: 24px; font-weight: 700; color: #00A651;">${amount}</span>
          </div>
        </div>
        
        <!-- Next Steps -->
        <div style="background: #EFF6FF; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px; font-size: 14px; color: #1E40AF; font-weight: 600;">What's Next?</h4>
          <ul style="margin: 0; padding-left: 16px; color: #1E40AF; font-size: 13px; line-height: 1.5;">
            <li>Your enrollment is now active</li>
            <li>Access your learning dashboard anytime</li>
            <li>Module 1 email will arrive shortly</li>
            <li>Complete all 8 modules to earn your certificate</li>
          </ul>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 24px 0;">
          <a href="${getBaseUrl()}/course/dashboard" style="display: inline-block; padding: 14px 32px; background: #00A651; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Start Learning Now →</a>
        </div>
        
        <!-- Support Info -->
        <div style="text-align: center; padding-top: 16px; border-top: 1px solid #E5E7EB;">
          <p style="margin: 0; color: #6B7280; font-size: 12px;">Questions? Contact us at <a href="mailto:support@globalgoalsjam.org" style="color: #00A651;">support@globalgoalsjam.org</a></p>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="padding: 24px; text-align: center;">
      <p style="margin: 0; color: #6B7280; font-size: 12px;">&copy; ${new Date().getFullYear()} Global Goals Jam &middot; <a href="${getBaseUrl()}" style="color: #00A651;">globalgoalsjam.org</a></p>
    </div>
  </div>
  `
  
  const textContent = `
PAYMENT RECEIPT - Global Goals Jam

Receipt #: ${receiptNumber}
Date: ${receiptDate}
Email: ${email}

Course: GGJ Host Certification Course
Amount: ${amount}

Your enrollment is now active! Access your learning dashboard: ${getBaseUrl()}/course/dashboard

Questions? Contact support@globalgoalsjam.org

&copy; Global Goals Jam
  `
  
  const result = await blink.notifications.email({
    to: email,
    from: 'Marco <marco@globalgoalsjam.org>',
    subject: `Payment Receipt - GGJ Course Enrollment (${receiptNumber})`,
    html,
    text: textContent
  })
  
  return result
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
      }
    })
  }

  try {
    // Read raw body for signature verification
    const rawBody = await req.text()
    const sig = req.headers.get('stripe-signature')
    let event: any = null

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

    if (webhookSecret && sig) {
      try {
        // Verify signature and construct event using Stripe SDK
        // In Deno Edge, sync crypto is not supported — always use async variant
        event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret)
      } catch (sigErr) {
        console.error('Stripe signature verification failed:', sigErr)
        return new Response(JSON.stringify({ error: 'invalid signature' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
      }
    } else {
      // Fallback: parse JSON body (less secure) if webhook secret not provided
      try {
        event = JSON.parse(rawBody || '{}')
      } catch (jsonErr) {
        console.error('Failed to parse webhook body:', jsonErr)
        return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
      }
    }

    // Idempotency protection: record event ID and skip if already processed
    try {
      const incomingEventId = event?.id || (event?.data?.object?.id) || null
      if (!incomingEventId) {
        console.warn('Stripe webhook received without event ID')
      } else {
        try {
          // Try to create a stripe_events record - if it already exists, skip processing
          await blink.db.stripeEvents.create({ id: incomingEventId, status: 'received', rawEvent: JSON.stringify(event) })
        } catch (e) {
          // If insertion fails because event already exists, assume it's a retry and skip processing
          console.log(`Stripe event already processed or recorded: ${incomingEventId} - skipping.`)
          return new Response(JSON.stringify({ received: true, skipped: true }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          })
        }
      }
    } catch (idErr) {
      console.error('Idempotency check failed:', idErr)
    }

    // Basic handling for Stripe events
    if (event?.type === 'checkout.session.completed') {
      const session = event.data?.object || {}
      const enrollmentId = session.metadata?.enrollment_id || session.client_reference_id
      const userId = session.metadata?.user_id || null
      const email = session.customer_details?.email || session.customer_email || ''
      const paymentIntent = session.payment_intent || ''
      const amountTotal = session.amount_total ? String(session.amount_total) : ''
      const purpose = session.metadata?.purpose || ''
      const tierName = session.metadata?.tier_name || ''
      const requiresForm = session.metadata?.requires_form === 'true'

      // Handle course enrollments
      if (enrollmentId && purpose !== 'platform_donation') {
        try {
          // Update enrollment status to active
          await blink.db.courseEnrollments.update(enrollmentId, {
            status: 'active',
            stripePaymentIntent: paymentIntent,
            paymentId: paymentIntent,
            amountPaid: amountTotal ? String(Number(amountTotal) / 100) : undefined,
            updatedAt: new Date().toISOString()
          })
        } catch (e) {
          console.error('Failed to update enrollment:', e)
        }

        // Auto-upgrade user role after payment (they get host privileges immediately after paying)
        if (userId) {
          try {
            // Check if user should be upgraded to host
            const { checkAndUpgradeUser } = await import('./userStatusHelper.ts')
            await checkAndUpgradeUser(userId)
          } catch (upgradeError) {
            console.warn('Auto-upgrade check failed (non-fatal):', upgradeError)
          }
        }

        // Send course confirmation email
        if (email) {
          try {
            const subject = 'Your GGJ Course enrollment is confirmed'
            const html = `
              <div style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #0f172a;">
                <h2>Thank you — your enrollment is confirmed</h2>
                <p>We've confirmed your enrollment for the GGJ Host Certification Course.</p>
                <p><strong>Enrollment ID:</strong> ${enrollmentId || 'N/A'}</p>
                <p><strong>Amount:</strong> ${amountTotal ? `${(Number(amountTotal)/100).toFixed(2)}` : 'Free'}</p>
                <p>If you have any questions, reply to this email.</p>
              </div>
            `

            await blink.notifications.email({
              to: email,
              from: 'Marco <marco@globalgoalsjam.org>',
              subject,
              html,
              text: `Thank you — your enrollment is confirmed. Enrollment ID: ${enrollmentId || 'N/A'}`
            })
          } catch (e) {
            console.error('Failed to send enrollment email:', e)
          }
        }
      }

      // Handle donations
      if (purpose === 'platform_donation') {
        try {
          const donationId = `donation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const amount = Number(amountTotal) || 0
          const amountDisplay = `${(amount / 100).toFixed(0)}`

          // Create donation record
          await blink.db.donations.create({
            id: donationId,
            userId: userId || null,
            stripeSessionId: session.id,
            stripePaymentIntent: paymentIntent,
            amount: amount,
            amountDisplay: amountDisplay,
            tierName: tierName || 'Supporter',
            status: 'completed',
            paidAt: new Date().toISOString()
          })

          // Send donation confirmation email
          if (email) {
            try {
              const subject = `Thank you for your ${tierName || 'donation'} to Global Goals Jam!`
              const html = `
                <div style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #0f172a; max-width: 600px; margin: 0 auto;">
                  <div style="text-align: center; padding: 32px 24px; background: linear-gradient(135deg, #00A651 0%, #00B854 100%); color: white;">
                    <div style="width: 64px; height: 64px; background: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                      <span style="color: #00A651; font-size: 32px;">💚</span>
                    </div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Thank you for your support!</h1>
                    <p style="margin: 8px 0 0; opacity: 0.9; font-size: 16px;">${amountDisplay} ${tierName || 'Donation'} to Global Goals Jam</p>
                  </div>
                  
                  <div style="padding: 24px; background: white;">
                    <p style="font-size: 16px; color: #0f172a; margin-bottom: 16px;">Your generous contribution helps us:</p>
                    <ul style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
                      <li>Train hosts worldwide to facilitate local Global Goals Jams</li>
                      <li>Maintain and improve our collaborative platform</li>
                      <li>Create new toolkits and resources for sustainability challenges</li>
                      <li>Support communities taking action on the SDGs</li>
                    </ul>
                    
                    ${requiresForm ? `
                    <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                      <h3 style="margin: 0 0 8px; color: #1e40af; font-size: 16px;">Next Step: Add Your Sponsor Information</h3>
                      <p style="margin: 0; color: #1e40af; font-size: 14px;">As a ${tierName}, you'll be recognized on our website! Please complete your sponsor details.</p>
                    </div>
                    ` : ''}
                    
                    <div style="text-align: center; margin: 24px 0;">
                      <a href="${getBaseUrl()}/" style="display: inline-block; padding: 12px 24px; background: #00A651; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Visit Global Goals Jam →</a>
                    </div>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px;">Receipt ID: ${session.id}</p>
                      <p style="margin: 4px 0 0; color: #6b7280; font-size: 12px;">Questions? Contact support@globalgoalsjam.org</p>
                    </div>
                  </div>
                </div>
              `

              await blink.notifications.email({
                to: email,
                from: 'Marco <marco@globalgoalsjam.org>',
                subject,
                html,
                text: `Thank you for your ${amountDisplay} ${tierName || 'donation'} to Global Goals Jam! Your support helps us train hosts worldwide and maintain our platform. Receipt ID: ${session.id}`
              })
            } catch (e) {
              console.error('Failed to send donation email:', e)
            }
          }
        } catch (e) {
          console.error('Failed to process donation:', e)
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })

  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
})