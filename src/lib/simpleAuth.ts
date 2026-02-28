// Simple auth system inspired by working project
import { blink } from './blink'

export type AppUser = {
  id: string
  email: string
  displayName?: string
  role?: string
}

const STORAGE_KEY = 'ggj_app_user'

type Listener = (user: AppUser | null) => void
const listeners = new Set<Listener>()

function notify(user: AppUser | null) {
  listeners.forEach((fn) => {
    try { fn(user) } catch (e) { /* ignore */ }
  })
}

export const appAuth = {
  get(): AppUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  },
  set(user: AppUser) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      notify(user)
    } catch { /* ignore */ }
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
      notify(null)
    } catch { /* ignore */ }
  },
  onChange(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
}

// Simple SHA-256 password hashing
export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder()
  const data = enc.encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function comparePassword(plain: string, storedHash: string): Promise<{ ok: boolean; reason?: 'bcrypt' | 'mismatch' }> {
  // If stored hash appears to be bcrypt (starts with $2), we can't verify in-browser
  if (typeof storedHash === 'string' && storedHash.startsWith('$2')) {
    return { ok: false, reason: 'bcrypt' }
  }
  const calc = await sha256Hex(plain)
  return { ok: calc === storedHash, reason: calc === storedHash ? undefined : 'mismatch' }
}

// DB helpers with retry logic
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

export async function withDbBackoff<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  let attempt = 0
  let lastError: any
  while (attempt <= maxRetries) {
    try {
      return await fn()
    } catch (err: any) {
      lastError = err
      const status = err?.status || err?.value?.status
      const code = err?.details?.code || err?.value?.details?.code
      const is429 = status === 429 || code === 'RATE_LIMIT_EXCEEDED'
      if (!is429) break
      const waitMs = Math.min(4000, 500 * Math.pow(2, attempt))
      await sleep(waitMs)
      attempt++
    }
  }
  throw lastError
}

// Email auth helper functions
export const emailAuth = {
  setLastEmail(email: string) {
    try {
      if (typeof window !== 'undefined' && email) {
        localStorage.setItem('ggj_last_email', email)
      }
    } catch (e) {
      // ignore
    }
  },

  getLastEmail(): string {
    try {
      if (typeof window === 'undefined') return ''
      return localStorage.getItem('ggj_last_email') || ''
    } catch (e) {
      return ''
    }
  },

  async findOrCreateUserByEmail(email: string) {
    try {
      const normalized = (email || '').trim().toLowerCase()
      if (!normalized) throw new Error('Email is required')

      // Try to find existing user
      const existing = await withDbBackoff(() => 
        blink.db.users.list({ where: { email: normalized }, limit: 1 })
      )
      
      if (existing.length > 0) {
        // Return existing user - they can set password later
        console.log('Found existing user for email:', normalized)
        return existing[0]
      }

      // Create new user
      const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      
      try {
        const created = await withDbBackoff(() => 
          blink.db.users.create({
            id,
            email: normalized,
            displayName: normalized.split('@')[0],
            role: 'participant',
            status: 'approved',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        )
        console.log('Created new user for email:', normalized)
        return created
      } catch (createErr: any) {
        console.error('Failed to create user:', createErr)
        // If creation failed, try to find the user again (race condition)
        const retry = await withDbBackoff(() => 
          blink.db.users.list({ where: { email: normalized }, limit: 1 })
        )
        if (retry.length > 0) {
          console.log('Found user on retry for email:', normalized)
          return retry[0]
        }
        throw createErr
      }
    } catch (err: any) {
      console.error('findOrCreateUserByEmail error:', err)
      throw new Error('Unable to process account. Please try again or contact support.')
    }
  },

  async sendConfirmationEmail(email: string) {
    if (!email) return { success: false, error: 'Email is required' }
    try {
      this.setLastEmail(email)

      const confirmationLink = `${window.location.origin}/auth/confirm?email=${encodeURIComponent(email)}`

      await blink.notifications.email({
        to: email,
        from: 'Marco <marco@globalgoalsjam.org>',
        subject: 'Confirm your email - Global Goals Jam',
        html: `
          <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto;">
            <div style="background: #00A651; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">Global Goals Jam</h1>
            </div>
            <div style="padding: 28px; background: #fff; border-radius: 0 0 12px 12px;">
              <h2 style="color: #0F172A;">Confirm Your Email</h2>
              <p style="color: #6b7280; line-height: 1.6;">Welcome! Click the button below to confirm your email and access your account.</p>
              <div style="text-align:center; margin: 22px 0;">
                <a href="${confirmationLink}" style="background: #00A651; color: white; padding: 12px 22px; text-decoration: none; border-radius: 8px; font-weight: 600;">Confirm Email</a>
              </div>
              <p style="color: #9ca3af; font-size: 13px;">If the button doesn't work, copy & paste this link into your browser:</p>
              <p style="word-break: break-all; color: #00A651; font-size: 13px;">${confirmationLink}</p>
            </div>
          </div>
        `
      })

      return { success: true }
    } catch (err: any) {
      console.error('sendConfirmationEmail error', err)
      return { success: false, error: err?.message || String(err) }
    }
  },

  async sendPasswordResetEmail(email: string) {
    try {
      const normalized = (email || '').trim().toLowerCase()
      if (!normalized) throw new Error('Email is required')

      console.log('[Password Reset] Starting for email:', normalized)

      // Find user
      const rows = await withDbBackoff(() => 
        blink.db.users.list({ where: { email: normalized }, limit: 1 })
      )

      if (rows.length === 0) {
        console.log('[Password Reset] No user found for email:', normalized)
        // Privacy: pretend success even if no user
        return { success: true }
      }

      const user = rows[0]
      console.log('[Password Reset] Found user:', user.id, 'with role:', user.role)
      
      const token = `rt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

      // Store reset token in database
      const resetId = `reset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      await withDbBackoff(() => 
        blink.db.passwordResets.create({
          id: resetId,
          userId: user.id,
          email: user.email,
          token,
          expiresAt,
          used: 0,
          createdAt: new Date().toISOString()
        })
      )
      console.log('[Password Reset] Token stored in database')

      const resetLink = `${window.location.origin}/reset-password?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}`
      console.log('[Password Reset] Reset link generated:', resetLink)
      
      try {
        console.log('[Password Reset] Attempting to send email via Blink notifications...')
        const emailResult = await blink.notifications.email({
          to: user.email,
          from: 'Marco <marco@globalgoalsjam.org>',
          subject: 'Reset your password - Global Goals Jam',
          html: `
            <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: #00A651; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">Global Goals Jam</h1>
              </div>
              <div style="padding: 28px; background: #fff; border-radius: 0 0 12px 12px;">
                <h2 style="color: #0F172A;">Reset your password</h2>
                <p style="color: #6b7280; line-height: 1.6;">Hi ${user.displayName || 'there'},</p>
                <p style="color: #6b7280; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new password. This link expires in 60 minutes.</p>
                <div style="text-align:center; margin: 32px 0;">
                  <a href="${resetLink}" style="background: #00A651; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Set New Password</a>
                </div>
                <p style="color: #9ca3af; font-size: 13px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #00A651; font-size: 13px;">${resetLink}</p>
                <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px;">If you didn't request this password reset, you can safely ignore this email.</p>
              </div>
            </div>
          `,
          text: `Reset your password\n\nHi ${user.displayName || 'there'},\n\nWe received a request to reset your password for Global Goals Jam.\n\nClick this link to set a new password (expires in 60 minutes):\n${resetLink}\n\nIf you didn't request this password reset, you can safely ignore this email.\n\nBest regards,\nThe Global Goals Jam Team`
        })
        
        console.log('[Password Reset] Email send result:', emailResult)
        
        if (emailResult && emailResult.success) {
          console.log('[Password Reset] Email sent successfully, message ID:', emailResult.messageId)
        } else {
          console.error('[Password Reset] Email send failed:', emailResult)
        }
      } catch (emailErr: any) {
        console.error('[Password Reset] Email send error:', emailErr)
        console.error('[Password Reset] Error details:', {
          message: emailErr?.message,
          code: emailErr?.code,
          stack: emailErr?.stack
        })
        // Still return success to prevent email enumeration
      }

      return { success: true }
    } catch (err: any) {
      console.error('[Password Reset] General error:', err)
      return { success: false, error: err?.message || String(err) }
    }
  }
}