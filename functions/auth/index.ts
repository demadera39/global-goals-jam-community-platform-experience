import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "npm:@blinkdotnew/sdk"
import bcrypt from "npm:bcryptjs"

// Environment validation
const JWT_SECRET = Deno.env.get('JWT_SECRET')
const BLINK_PROJECT_ID = Deno.env.get('BLINK_PROJECT_ID') || 'global-goals-jam-community-platform-7uamgc2j'

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set')
}

const blink = createClient({
  projectId: BLINK_PROJECT_ID,
  authRequired: false
})

// JWT Helper Functions
async function createJWT(payload: any, secret: string, expiresIn = '7d'): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  
  const now = Math.floor(Date.now() / 1000)
  const exp = expiresIn === '1h' ? now + 3600 : 
             expiresIn === '7d' ? now + 604800 : 
             now + 604800 // default 7 days

  const jwtPayload = {
    ...payload,
    iat: now,
    exp: exp
  }

  const encoder = new TextEncoder()
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/[=]/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const encodedPayload = btoa(JSON.stringify(jwtPayload)).replace(/[=]/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  const data = encoder.encode(`${encodedHeader}.${encodedPayload}`)
  const keyData = encoder.encode(secret)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data)
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/[=]/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}

async function verifyJWT(token: string, secret: string): Promise<{ valid: boolean; payload?: any; error?: string }> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' }
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts
    
    const encoder = new TextEncoder()
    const data = encoder.encode(`${encodedHeader}.${encodedPayload}`)
    const keyData = encoder.encode(secret)
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    
    const signatureBytes = new Uint8Array(
      atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/'))
        .split('').map(char => char.charCodeAt(0))
    )
    
    const isValid = await crypto.subtle.verify('HMAC', cryptoKey, signatureBytes, data)
    
    if (!isValid) {
      return { valid: false, error: 'Invalid signature' }
    }

    const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')))
    
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' }
    }

    return { valid: true, payload }
  } catch (error) {
    return { valid: false, error: 'Token verification failed' }
  }
}

// Helper functions for PBKDF2 + base64url
function stringToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str)
}
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+/g, '')
}
function base64ToBuffer(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const standard = base64.replace(/-/g, '+').replace(/_/g, '/') + padding
  const binary = atob(standard)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

// Edge-safe password hashing using PBKDF2 (avoids bcrypt issues in edge environments)
async function pbkdf2Hash(password: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const salt = bufferToBase64Url(saltBytes.buffer)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    stringToBuffer(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: base64ToBuffer(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  const derivedB64 = bufferToBase64Url(derived)
  return `${salt}:${derivedB64}`
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + JWT_SECRET) // Use JWT_SECRET as salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    if (!hash) return false
    // bcrypt (legacy) format - use bcryptjs (Edge-safe, pure JS)
    if (hash.startsWith('$2')) {
      try {
        const anyBcrypt: any = bcrypt as any
        if (typeof anyBcrypt.compareSync === 'function') {
          return anyBcrypt.compareSync(password, hash)
        }
        if (typeof anyBcrypt.compare === 'function') {
          return await anyBcrypt.compare(password, hash)
        }
        return false
      } catch {
        return false
      }
    }
    // PBKDF2 format from earlier helpers: salt:hash (base64url)
    if (hash.includes(':')) {
      const [salt, stored] = hash.split(':')
      if (!salt || !stored) return false
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        stringToBuffer(password),
        'PBKDF2',
        false,
        ['deriveBits']
      )
      const derived = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: base64ToBuffer(salt), iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        256
      )
      const derivedB64 = bufferToBase64Url(derived)
      return `${salt}:${derivedB64}` === hash
    }
    // Legacy SHA-256(password + secret)
    const newHash = await hashPassword(password)
    return newHash === hash
  } catch (e) {
    return false
  }
}

interface SignupData {
  email: string
  password: string
  fullName?: string
}

interface LoginData {
  email: string
  password: string
}

interface ForgotPasswordData {
  email: string
}

interface ResetPasswordData {
  token: string
  password: string
}

interface VerifyData {
  token?: string
}

interface AdminSetPasswordData {
  userId?: string
  email?: string
  password: string
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

  // Check critical environment variables
  if (!JWT_SECRET) {
    return new Response(JSON.stringify({ 
      error: 'Server configuration error: JWT_SECRET not configured',
      code: 'server_misconfigured' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  try {
    const { action, ...data } = await req.json()

    switch (action) {
      case 'signup':
        return await handleSignup(data as SignupData)
      case 'login':
        return await handleLogin(data as LoginData)
      case 'forgot-password':
        return await handleForgotPassword(data as ForgotPasswordData)
      case 'reset-password':
        return await handleResetPassword(data as ResetPasswordData)
      case 'admin-set-password':
        return await handleAdminSetPassword(req, data as AdminSetPasswordData)
      case 'verify':
        return await handleVerify(req, data as VerifyData)
      case 'test-hash': {
        // Debug endpoint to test password hashing
        const { password: testPass } = data
        const testHash = await hashPassword(testPass)
        return new Response(JSON.stringify({ 
          password: testPass,
          hash: testHash,
          jwtSecretPresent: !!JWT_SECRET,
          jwtSecretLength: JWT_SECRET?.length || 0
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
    }
  } catch (error) {
    console.error('Auth function error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      code: 'internal_error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})

async function handleSignup(data: SignupData) {
  const { email, password, fullName } = data

  // Validate input
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password are required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email format' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  if (password.length < 8) {
    return new Response(JSON.stringify({ error: 'Password must be at least 8 characters long' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  try {
    // Check if user already exists
    const existingUsers = await blink.db.users.list({
      where: { email: email.toLowerCase() },
      limit: 1
    })

    if (existingUsers && existingUsers.length > 0) {
      return new Response(JSON.stringify({ error: 'User with this email already exists' }), {
        status: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Hash password using PBKDF2 (Edge-safe)
    const hashedPassword = await pbkdf2Hash(password)

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    // Try to create user record
    try {
      await blink.db.users.create({
        id: userId,
        email: email.toLowerCase(),
        displayName: fullName || email.split('@')[0],
        role: 'participant',
        status: 'approved',
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    } catch (createError: any) {
      console.error('Create user error:', createError)
      
      // If it's a unique constraint error, the email might exist from a deleted user
      if (createError?.message?.includes('UNIQUE constraint') || 
          createError?.message?.includes('duplicate') ||
          createError?.details?.error_details?.includes('UNIQUE')) {
        
        // Try to use upsertMany to update the existing row
        console.log('Unique constraint hit, trying upsert approach for email:', email.toLowerCase())
        
        try {
          await blink.db.users.upsertMany([{
            id: userId,
            email: email.toLowerCase(),
            displayName: fullName || email.split('@')[0],
            role: 'participant',
            status: 'approved',
            passwordHash: hashedPassword,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }])
        } catch (upsertError: any) {
          console.error('Upsert also failed:', upsertError)
          
          // If upsert fails, the email truly exists, return appropriate error
          return new Response(JSON.stringify({
            error: 'An account with this email already exists. Please sign in instead.',
            code: 'email_exists'
          }), {
            status: 409,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          })
        }
      } else {
        // Some other error, re-throw
        throw createError
      }
    }

    // Generate JWT token
    const token = await createJWT({
      userId,
      email: email.toLowerCase(),
      displayName: fullName || email.split('@')[0],
      role: 'participant'
    }, JWT_SECRET!)

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userId,
        email: email.toLowerCase(),
        displayName: fullName || email.split('@')[0],
        role: 'participant'
      },
      token
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error: any) {
    console.error('Signup error:', error)
    
    // Check for specific error types
    if (error?.details?.error_details?.includes('UNIQUE constraint failed: users.email')) {
      return new Response(JSON.stringify({
        error: 'An account with this email already exists. Please sign in instead.',
        code: 'email_exists'
      }), {
        status: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
    
    // Generic error response
    return new Response(JSON.stringify({
      error: 'Failed to create account. Please try again later.',
      code: 'signup_failed',
      details: error?.message || 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

async function handleLogin(data: LoginData) {
  const { email, password } = data

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password are required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  try {
    // Find user by email (case-insensitive attempts)
    const normalized = email.toLowerCase().trim()
    let candidates = await blink.db.users.list({
      where: { email: normalized },
      orderBy: { updatedAt: 'desc' },
      limit: 5
    })
    if (!candidates || candidates.length === 0) {
      try {
        candidates = await blink.db.users.list({
          where: { OR: [{ email }, { email: normalized.toUpperCase() }] },
          orderBy: { updatedAt: 'desc' },
          limit: 5
        })
      } catch (_) { /* ignore */ }
    }

    if (!candidates || candidates.length === 0) {
      // Fallback: scan recent users for case/whitespace anomalies
      try {
        const recent = await blink.db.users.list({ orderBy: { createdAt: 'desc' }, limit: 1000 })
        const found = recent.find((u: any) => ((u.email || '').trim().toLowerCase()) === normalized)
        if (found) {
          candidates = [found]
        }
      } catch (_) { /* ignore fallback errors */ }
    }

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid email or password', code: 'invalid_credentials' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Robust candidate selection: try all duplicates and prefer most recent with a valid password hash
    const sorted = [...candidates].sort((a: any, b: any) => {
      const aTs = Date.parse(a.updatedAt || a.createdAt || '1970-01-01')
      const bTs = Date.parse(b.updatedAt || b.createdAt || '1970-01-01')
      return bTs - aTs
    })

    let matchedUser: any = null
    let sawNoHash = false
    let hadHashButNoVerify = false

    for (const c of sorted) {
      const hash = (c as any).passwordHash || (c as any).password_hash || ''
      if (!hash) { sawNoHash = true; continue }
      const ok = await verifyPassword(password, hash)
      if (ok) { matchedUser = c; break }
      else { hadHashButNoVerify = true }
    }

    if (!matchedUser) {
      if (sawNoHash) {
        return new Response(JSON.stringify({ error: 'No password set for this account. Please use Forgot password to set a password.', code: 'password_not_set' }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }
      if (hadHashButNoVerify) {
        return new Response(JSON.stringify({ error: 'We could not verify your password. Please reset it to continue.', code: 'password_reset_required' }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }
      return new Response(JSON.stringify({ error: 'Invalid email or password', code: 'invalid_credentials' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const user = matchedUser

    // Generate JWT token
    const token = await createJWT({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role
    }, JWT_SECRET!)

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      },
      token
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Login error:', error)
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

async function handleForgotPassword(data: ForgotPasswordData) {
  const { email } = data

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  try {
    // Find user by email (case-insensitive attempts)
    const normalized = email.toLowerCase().trim()
    let users = await blink.db.users.list({
      where: { email: normalized },
      limit: 1
    })
    console.log('[ForgotPassword] primary lookup by email:', normalized, '→ count:', users?.length || 0)
    if (!users || users.length === 0) {
      try {
        users = await blink.db.users.list({
          where: { OR: [{ email }, { email: normalized.toUpperCase() }] },
          limit: 1
        })
        console.log('[ForgotPassword] secondary OR lookup → count:', users?.length || 0)
      } catch (e) { console.log('[ForgotPassword] secondary OR lookup error:', e) }
    }

    // Fallback: scan recent users and match in code (handles stray whitespace/case anomalies)
    if (!users || users.length === 0) {
      try {
        const recent = await blink.db.users.list({ orderBy: { createdAt: 'desc' }, limit: 500 })
        const found = recent.find((u: any) => ((u.email || '').trim().toLowerCase()) === normalized)
        if (found) {
          users = [found]
          console.log('[ForgotPassword] fallback scan matched user id:', found.id)
        }
      } catch (e) { console.log('[ForgotPassword] fallback scan error:', e) }
    }

    // Always return success to prevent email enumeration
    if (!users || users.length === 0) {
      console.log('No user found for email (after all attempts):', normalized)
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'If an account exists with this email, you will receive a reset link.' 
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const user = users[0]
    console.log('Found user for password reset:', user.id, 'email:', user.email, 'displayName:', user.displayName)

    // Create password reset token (expires in 1 hour)
    const resetToken = await createJWT({
      userId: user.id,
      email: user.email,
      type: 'password_reset'
    }, JWT_SECRET!, '1h')

    // Store reset token in database
    const resetId = `reset_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    
    try {
      await blink.db.passwordResets.create({
        id: resetId,
        userId: user.id,
        email: user.email,
        token: resetToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        used: 0,
        createdAt: new Date().toISOString()
      })
      console.log('Reset token stored in database')
    } catch (dbError) {
      console.log('Note: Failed to store reset token in DB, continuing with email send:', dbError)
    }

    // Get site URL
    const siteUrl = 'https://global-goals-jam-community-platform-7uamgc2j.sites.blink.new'
    const resetUrl = `${siteUrl}/reset-password?token=${resetToken}`
    
    console.log('Sending password reset email to:', user.email)
    console.log('Reset URL:', resetUrl)

    // Send email using Blink notifications with simplified approach
    try {
      const emailResult = await blink.notifications.email({
        to: user.email,
        from: 'marco@globalgoalsjam.org',
        replyTo: 'marco@globalgoalsjam.org',
        subject: 'Reset Your Global Goals Jam Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #00A651; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0;">Global Goals Jam</h1>
            </div>
            <div style="padding: 24px; background: #ffffff;">
              <h2 style="color: #00A651; margin-top: 0;">Reset Your Password</h2>
              <p>Hello ${user.displayName || 'there'},</p>
              <p>We received a request to reset your password. Click the button below to set a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #00A651; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Reset Password</a>
              </div>
              <p>Or copy this link into your browser:</p>
              <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
              <p style="margin-top: 20px; color: #666;">This link expires in 1 hour.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            </div>
          </div>
        `,
        text: `Reset Your Password

Hello ${user.displayName || 'there'},

We received a request to reset your password for Global Goals Jam.

Click this link to set a new password:
${resetUrl}

This link expires in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
The Global Goals Jam Team`
      })
      
      console.log('Email send result:', JSON.stringify(emailResult))
      
      if (emailResult && emailResult.success) {
        console.log('✅ Password reset email sent successfully to:', user.email)
        console.log('Message ID:', emailResult.messageId)
      } else {
        console.error('❌ Email sending failed - result:', emailResult)
      }
    } catch (emailError: any) {
      console.error('❌ Failed to send reset email:', {
        message: emailError?.message || 'Unknown error',
        code: emailError?.code,
        details: JSON.stringify(emailError)
      })
      // Still return success to prevent email enumeration
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'If an account exists with this email, you will receive a reset link.' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error: any) {
    console.error('Forgot password error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to process password reset request',
      details: error?.message || 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

async function handleResetPassword(data: ResetPasswordData) {
  const { token, password } = data

  if (!token || !password) {
    return new Response(JSON.stringify({ error: 'Token and password are required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  if (password.length < 8) {
    return new Response(JSON.stringify({ error: 'Password must be at least 8 characters long' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  try {
    // Verify and decode the reset token
    const result = await verifyJWT(token, JWT_SECRET!)
    
    if (!result.valid || !result.payload) {
      throw new Error(result.error || 'Invalid token')
    }
    
    const payload = result.payload || {}
    const userId = payload.userId
    if (!userId) {
      throw new Error('Invalid token payload')
    }

    // Find user
    const users = await blink.db.users.list({
      where: { id: userId },
      limit: 1
    })

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or expired reset token' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const user = users[0]

    // Hash new password using PBKDF2 (Edge-safe)
    const hashedPassword = await pbkdf2Hash(password)

    // Update user password
    await blink.db.users.update(user.id, {
      passwordHash: hashedPassword,
      password_hash: hashedPassword,
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    return new Response(JSON.stringify({ success: true, message: 'Password reset successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error: any) {
    console.error('Reset password error:', error)
    
    if (error.message.includes('expired') || error.message.includes('Invalid token')) {
      return new Response(JSON.stringify({ error: 'Invalid or expired reset token' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    return new Response(JSON.stringify({ error: 'Failed to reset password' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

async function handleAdminSetPassword(req: Request, data: AdminSetPasswordData) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    try {
      // Set Blink auth token to identify requester
      // @ts-ignore
      blink.auth.setToken(token)
    } catch (_) { /* ignore */ }

    let me: any = null
    try {
      me = await blink.auth.me()
    } catch (_) { /* ignore */ }

    if (!me?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Check requester role in DB
    const profiles = await blink.db.users.list({ where: { id: me.id }, limit: 1 })
    const profile = profiles?.[0]
    if (!profile || (profile.role !== 'admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const { userId, email, password } = data || {}
    if (!password || (!userId && !email)) {
      return new Response(JSON.stringify({ error: 'Missing userId/email or password' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    let targetId = userId || ''
    if (!targetId && email) {
      const rows = await blink.db.users.list({ where: { email: (email || '').trim().toLowerCase() }, limit: 1 })
      if (!rows || rows.length === 0) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }
      targetId = rows[0].id
    }

    // Hash new password (PBKDF2)
    const hashed = await pbkdf2Hash(password)

    await blink.db.users.update(targetId, {
      passwordHash: hashed,
      password_hash: hashed,
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error: any) {
    console.error('admin-set-password error:', error)
    return new Response(JSON.stringify({ error: 'Failed to set password' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}

async function handleVerify(req: Request, data: VerifyData) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    let token = (data && data.token) || (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '')

    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized', code: 'missing_token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const result = await verifyJWT(token, JWT_SECRET!)
    if (!result.valid || !result.payload) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token', code: 'invalid_token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const payload = result.payload || {}
    const userId = payload.userId
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid token payload', code: 'invalid_payload' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Load latest user from DB
    const rows = await blink.db.users.list({ where: { id: userId }, limit: 1 })
    const dbUser = rows?.[0]
    if (!dbUser) {
      return new Response(JSON.stringify({ error: 'User not found', code: 'user_not_found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const user = {
      id: dbUser.id,
      email: dbUser.email,
      displayName: dbUser.displayName,
      role: dbUser.role
    }

    // Determine if refresh is needed
    const nowSec = Math.floor(Date.now() / 1000)
    const exp = Number(payload.exp || 0)
    const timeLeft = exp - nowSec
    const nearExpiry = isFinite(timeLeft) ? timeLeft < 6 * 60 * 60 : true // 6 hours

    const payloadChanged = (
      payload.email !== user.email ||
      payload.displayName !== user.displayName ||
      payload.role !== user.role
    )

    let refreshed = false
    let newToken = token
    let expiresAtMs: number | null = exp ? exp * 1000 : null

    if (nearExpiry || payloadChanged) {
      newToken = await createJWT({
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }, JWT_SECRET!)
      refreshed = true
      // createJWT in this file defaults to 7d expiry
      const newExp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
      expiresAtMs = newExp * 1000
    }

    return new Response(JSON.stringify({
      success: true,
      user,
      token: newToken,
      refreshed,
      expiresAt: expiresAtMs
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error: any) {
    console.error('verify error:', error)
    return new Response(JSON.stringify({ error: 'Verification failed', code: 'verify_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}