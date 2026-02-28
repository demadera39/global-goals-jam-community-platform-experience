import blink from './blink'

function getBaseUrl() {
  // Prefer current origin at runtime (works for trial subdomain and custom domains)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  // Edge/other runtimes that expose globalThis.location
  if (typeof globalThis !== 'undefined' && (globalThis as any).location?.origin) {
    return (globalThis as any).location.origin
  }
  // Fallback to primary domain (no hardcoded preview domain)
  return 'https://globalgoalsjam.org'
}

function wrapEmailHtml(title: string, bodyHtml: string) {
  return `
  <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #0B1324;">
    <div style="padding: 20px 0; text-align: center;">
      <a href="${getBaseUrl()}" style="text-decoration: none; color: #0B1324; font-weight: 700; font-size: 18px;">
        Global Goals Jam
      </a>
    </div>
    <div style="background: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden;">
      <div style="padding: 24px;">
        <h1 style="margin: 0 0 12px; font-size: 20px; line-height: 1.2;">${title}</h1>
        <div style="font-size: 14px; line-height: 1.6; color: #3F4654;">${bodyHtml}</div>
      </div>
      <div style="padding: 16px 24px; background: #F9FAFB; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280;">
        © ${new Date().getFullYear()} Global Goals Jam • <a href="${getBaseUrl()}" style="color:#00A651; text-decoration:none;">Visit website</a>
      </div>
    </div>
  </div>`
}

export async function sendHostApplicationReceived(to: string, location: string, motivation: string) {
  const dashboardUrl = `${getBaseUrl()}/login`
  const html = wrapEmailHtml(
    'We received your Host application',
    `
      <p>Thanks for applying to host a Global Goals Jam. Our team will review your request shortly.</p>
      <p><strong>Location:</strong> ${location || '—'}<br/>
      <strong>Why you want to host:</strong> ${motivation || '—'}</p>
      <p>We aim to respond within a few days. You can return to your portal anytime:</p>
      <p><a href="${dashboardUrl}" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#00A651;color:#ffffff;text-decoration:none;">Open Host Portal</a></p>
    `
  )

  try {
    const result = await blink.notifications.email({
      to,
      from: 'marco@globalgoalsjam.org',
      replyTo: 'marco@globalgoalsjam.org',
      subject: 'Global Goals Jam — Host application received',
      html,
      text: `Thanks for applying to host a Global Goals Jam. Location: ${location}. Motivation: ${motivation}. We'll review shortly. Portal: ${dashboardUrl}`
    })
    return result.success
  } catch (e) {
    console.error('sendHostApplicationReceived failed', e)
    return false
  }
}

export async function sendHostApproved(to: string, displayName?: string) {
  const portalUrl = `${getBaseUrl()}/host`
  const html = wrapEmailHtml(
    'You are approved as a Host 🎉',
    `
      <p>${displayName ? `Hi ${displayName},` : 'Hi,'} your host access has been approved.</p>
      <p>You now have access to the Host Dashboard, brand toolkit, and event management.</p>
      <p><a href="${portalUrl}" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#00A651;color:#ffffff;text-decoration:none;">Open Host Dashboard</a></p>
    `
  )

  try {
    const result = await blink.notifications.email({
      to,
      from: 'marco@globalgoalsjam.org',
      replyTo: 'marco@globalgoalsjam.org',
      subject: 'Global Goals Jam — Host access approved',
      html,
      text: `Your host access has been approved. Open your dashboard: ${portalUrl}`
    })
    return result.success
  } catch (e) {
    console.error('sendHostApproved failed', e)
    return false
  }
}

export async function sendHostRejected(to: string) {
  const infoUrl = `${getBaseUrl()}/about`
  const html = wrapEmailHtml(
    'Update on your Host application',
    `
      <p>Thank you for your interest in hosting a Global Goals Jam. After review, we’re unable to approve your host access at this time.</p>
      <p>You’re still welcome to participate in local Jams and explore our public toolkits.</p>
      <p><a href="${infoUrl}" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#111827;color:#ffffff;text-decoration:none;">Learn More</a></p>
    `
  )

  try {
    const result = await blink.notifications.email({
      to,
      from: 'marco@globalgoalsjam.org',
      replyTo: 'marco@globalgoalsjam.org',
      subject: 'Global Goals Jam — Application update',
      html,
      text: `We’re unable to approve your host access at this time. Learn more: ${infoUrl}`
    })
    return result.success
  } catch (e) {
    console.error('sendHostRejected failed', e)
    return false
  }
}

export async function sendHostInvite(
  to: string,
  invitedBy?: string,
  role: 'host' | 'admin' | 'participant' = 'host'
) {
  const loginUrl = `${getBaseUrl()}/login`
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)
  const html = wrapEmailHtml(
    `Invitation to become a Global Goals Jam ${roleLabel}`,
    `
      <p>${invitedBy ? `${invitedBy} invited you` : 'You are invited'} to join Global Goals Jam as a <strong>${roleLabel}</strong>.</p>
      <p>Click below to sign in with this email address. Your account will be auto-approved as <strong>${roleLabel}</strong>.</p>
      <p><a href="${loginUrl}" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#00A651;color:#ffffff;text-decoration:none;">Accept Invite & Sign In</a></p>
      <p style="color:#6B7280; font-size:12px">Note: you must sign in using this exact email: <strong>${to}</strong>.</p>
    `
  )

  try {
    const result = await blink.notifications.email({
      to,
      from: 'marco@globalgoalsjam.org',
      replyTo: 'marco@globalgoalsjam.org',
      subject: `You’re invited — Global Goals Jam ${roleLabel} Access`,
      html,
      text: `You are invited to join as ${roleLabel}. Sign in with this email to auto-activate access: ${loginUrl}`
    })
    return result.success
  } catch (e) {
    console.error('sendHostInvite failed', e)
    return false
  }
}

export async function sendTestReceiptEmail(email: string) {
  const receiptNumber = `GGJ-TEST-${Date.now().toString().slice(-6)}`
  const receiptDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  })
  const amount = '39.99'
  
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
    
    <!-- TEST BANNER -->
    <div style="background: #FEF3C7; padding: 12px 24px; text-align: center; border-left: 4px solid #F59E0B;">
      <p style="margin: 0; color: #92400E; font-weight: 600; font-size: 14px;">🧪 TEST EMAIL - This is a sample receipt for testing purposes</p>
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
      <p style="margin: 0; color: #6B7280; font-size: 12px;">© ${new Date().getFullYear()} Global Goals Jam • <a href="${getBaseUrl()}" style="color: #00A651;">globalgoalsjam.org</a></p>
    </div>
  </div>
  `
  
  const textContent = `
TEST PAYMENT RECEIPT - Global Goals Jam

Receipt #: ${receiptNumber}
Date: ${receiptDate}
Email: ${email}

Course: GGJ Host Certification Course
Amount: ${amount}

This is a test email for admin verification.

Questions? Contact support@globalgoalsjam.org

© Global Goals Jam
  `

  try {
    const result = await blink.notifications.email({
      to: email,
      from: 'marco@globalgoalsjam.org',
      replyTo: 'marco@globalgoalsjam.org',
      subject: `[TEST] Payment Receipt - GGJ Course Enrollment (${receiptNumber})`,
      html,
      text: textContent
    })
    return result.success
  } catch (e) {
    console.error('sendTestReceiptEmail failed', e)
    return false
  }
}
