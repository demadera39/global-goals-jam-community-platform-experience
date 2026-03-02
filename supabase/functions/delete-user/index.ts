import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, userEmail, userName } = await req.json()

    if (!userId || !userEmail) {
      return new Response(JSON.stringify({ success: false, error: 'userId and userEmail are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = getSupabaseClient()

    // Send deletion confirmation email
    let emailSent = false
    try {
      const resendKey = Deno.env.get('RESEND_API_KEY')
      if (resendKey) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Global Goals Jam <marco@globalgoalsjam.org>',
            to: [userEmail],
            subject: 'Account Deleted - Global Goals Jam',
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="padding: 24px;">
                <h2>Account Deleted</h2>
                <p>Hi ${userName || 'there'},</p>
                <p>Your Global Goals Jam account has been permanently deleted. All associated data has been removed.</p>
                <p>If this was a mistake, please contact us at support@globalgoalsjam.org.</p>
              </div>
            </div>`,
          }),
        })
        emailSent = res.ok
      }
    } catch (e) {
      console.warn('Failed to send deletion email:', e)
    }

    // Cascade delete all user data
    const tables = [
      { table: 'courseProgress', field: 'userId' },
      { table: 'courseEnrollments', field: 'userId' },
      { table: 'hostApplications', field: 'userId' },
      { table: 'eventRegistrations', field: 'userId' },
      { table: 'userAchievements', field: 'userId' },
      { table: 'emailSchedule', field: 'userId' },
      { table: 'passwordResets', field: 'userId' },
    ]

    for (const { table, field } of tables) {
      try {
        await supabase.from(table).delete().eq(field, userId)
      } catch (e) {
        console.warn(`Failed to delete from ${table}:`, e)
      }
    }

    // Mark hosted events as orphaned
    try {
      await supabase.from('events').update({
        hostId: 'deleted-user',
        hostName: 'Former Host (Deleted)',
      }).eq('hostId', userId)
    } catch (e) {
      console.warn('Failed to update events:', e)
    }

    // Delete user record
    await supabase.from('users').delete().eq('id', userId)

    return new Response(JSON.stringify({ success: true, message: 'Account deleted', emailSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('delete-user error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
