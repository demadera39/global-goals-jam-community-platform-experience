export interface EmailTemplate {
  subject: string
  content: string
  placeholders: string[]
}

export const emailTemplates = {
  welcome: {
    subject: 'Welcome to Global Goals Jam Community!',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://global-goals-jam-community-platform-7uamgc2j.sites.blink.new/ggj-logo.svg" alt="Global Goals Jam" style="max-width: 200px; height: auto;" />
          <h1 style="color: #00A651; margin: 20px 0;">Welcome to Global Goals Jam!</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">Dear {{name}},</p>
          <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
            Welcome to the Global Goals Jam community! We're excited to have you join our global network of changemakers working toward the UN Sustainable Development Goals.
          </p>
          <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
            As a {{role}}, you now have access to our platform where you can connect with fellow participants, access exclusive resources, and make a real impact in your community.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://globalgoalsjam.org/dashboard" style="background: #00A651; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Access Your Dashboard</a>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
          <p>Best regards,<br/>The Global Goals Jam Team</p>
          <p style="margin-top: 15px;">
            <a href="https://globalgoalsjam.org" style="color: #00A651;">globalgoalsjam.org</a> | 
            <a href="mailto:hello@globalgoalsjam.org" style="color: #00A651;">hello@globalgoalsjam.org</a>
          </p>
        </div>
      </div>
    `,
    placeholders: ['{{name}}', '{{role}}']
  },

  payment_reminder: {
    subject: 'Complete Your Global Goals Jam Registration',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://global-goals-jam-community-platform-7uamgc2j.sites.blink.new/ggj-logo.svg" alt="Global Goals Jam" style="max-width: 200px; height: auto;" />
          <h1 style="color: #00A651; margin: 20px 0;">Complete Your Registration</h1>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">Dear {{name}},</p>
          <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
            We noticed your Global Goals Jam registration is still pending payment. Don't miss out on joining our incredible community of changemakers!
          </p>
          <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
            Complete your registration today to access exclusive resources, connect with hosts worldwide, and start making an impact.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://global-goals-jam-community-platform-7uamgc2j.sites.blink.new/course/enroll" style="background: #F59E0B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Registration</a>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
          <p>Questions? Reply to this email or contact us at <a href="mailto:hello@globalgoalsjam.org" style="color: #00A651;">hello@globalgoalsjam.org</a></p>
          <p style="margin-top: 15px;">
            <a href="https://globalgoalsjam.org" style="color: #00A651;">globalgoalsjam.org</a>
          </p>
        </div>
      </div>
    `,
    placeholders: ['{{name}}']
  },

  account_deletion: {
    subject: 'Your Global Goals Jam Account Has Been Deleted',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://global-goals-jam-community-platform-7uamgc2j.sites.blink.new/ggj-logo.svg" alt="Global Goals Jam" style="max-width: 200px; height: auto;" />
          <h1 style="color: #00A651; margin: 20px 0;">Account Deletion Notice</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">Dear {{name}},</p>
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
    `,
    placeholders: ['{{name}}']
  },

  custom: {
    subject: 'Message from Global Goals Jam',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://global-goals-jam-community-platform-7uamgc2j.sites.blink.new/ggj-logo.svg" alt="Global Goals Jam" style="max-width: 200px; height: auto;" />
          <h1 style="color: #00A651; margin: 20px 0;">{{subject}}</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">Dear {{name}},</p>
          <div style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
            {{message}}
          </div>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
          <p>Best regards,<br/>The Global Goals Jam Team</p>
          <p style="margin-top: 15px;">
            <a href="https://globalgoalsjam.org" style="color: #00A651;">globalgoalsjam.org</a> | 
            <a href="mailto:hello@globalgoalsjam.org" style="color: #00A651;">hello@globalgoalsjam.org</a>
          </p>
        </div>
      </div>
    `,
    placeholders: ['{{name}}', '{{subject}}', '{{message}}']
  }
}

export const getEmailTemplate = (type: string, customSubject?: string, customMessage?: string): EmailTemplate => {
  if (type === 'custom' && customSubject && customMessage) {
    return {
      subject: customSubject,
      content: emailTemplates.custom.content
        .replace(/{{subject}}/g, customSubject)
        .replace(/{{message}}/g, customMessage.split('\n').map(line => `<p style="margin: 0 0 15px;">${line}</p>`).join('')),
      placeholders: ['{{name}}']
    }
  }
  
  return emailTemplates[type as keyof typeof emailTemplates] || emailTemplates.custom
}