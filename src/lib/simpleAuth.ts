/**
 * Simplified auth compatibility layer.
 * All Blink SDK references removed — delegates to Supabase via ./supabase.
 */
import { supabase, db, safeDbCall, notifications } from './supabase'

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
    try { fn(user) } catch { /* ignore */ }
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
  },
}

// Simple SHA-256 password hashing
export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder()
  const data = enc.encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function comparePassword(
  plain: string,
  storedHash: string
): Promise<{ ok: boolean; reason?: 'bcrypt' | 'mismatch' }> {
  if (typeof storedHash === 'string' && storedHash.startsWith('$2')) {
    return { ok: false, reason: 'bcrypt' }
  }
  const calc = await sha256Hex(plain)
  return { ok: calc === storedHash, reason: calc === storedHash ? undefined : 'mismatch' }
}

// DB helpers with retry logic
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

export async function withDbBackoff<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  return safeDbCall(fn, { retries: maxRetries })
}

// Email auth helper functions
export const emailAuth = {
  setLastEmail(email: string) {
    try {
      if (typeof window !== 'undefined' && email) {
        localStorage.setItem('ggj_last_email', email)
      }
    } catch {}
  },

  getLastEmail(): string {
    try {
      if (typeof window === 'undefined') return ''
      return localStorage.getItem('ggj_last_email') || ''
    } catch {
      return ''
    }
  },

  async findOrCreateUserByEmail(email: string) {
    const normalized = (email || '').trim().toLowerCase()
    if (!normalized) throw new Error('Email is required')

    const existing = await safeDbCall(() =>
      db.users.list({ where: { email: normalized }, limit: 1 })
    )

    if (existing.length > 0) return existing[0]

    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    try {
      return await safeDbCall(() =>
        db.users.create({
          id,
          email: normalized,
          displayName: normalized.split('@')[0],
          role: 'participant',
          status: 'approved',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      )
    } catch (createErr: any) {
      // Race condition — try find again
      const retry = await safeDbCall(() =>
        db.users.list({ where: { email: normalized }, limit: 1 })
      )
      if (retry.length > 0) return retry[0]
      throw createErr
    }
  },

  async sendConfirmationEmail(email: string) {
    if (!email) return { success: false, error: 'Email is required' }
    try {
      this.setLastEmail(email)
      const confirmationLink = `${window.location.origin}/auth/confirm?email=${encodeURIComponent(email)}`

      await notifications.email({
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
              <p style="color: #9ca3af; font-size: 13px;">If the button doesn't work, copy &amp; paste this link into your browser:</p>
              <p style="word-break: break-all; color: #00A651; font-size: 13px;">${confirmationLink}</p>
            </div>
          </div>
        `,
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

      // Use Supabase built-in password reset
      const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      return { success: true }
    } catch (err: any) {
      console.error('[Password Reset] Error:', err)
      return { success: false, error: err?.message || String(err) }
    }
  },
}
