import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "npm:@blinkdotnew/sdk"

// Env
const JWT_SECRET = Deno.env.get('JWT_SECRET')
const BLINK_PROJECT_ID = Deno.env.get('BLINK_PROJECT_ID') || 'global-goals-jam-community-platform-7uamgc2j'

if (!JWT_SECRET) {
  console.error('[impersonate-user] FATAL: JWT_SECRET not set')
}

const blink = createClient({
  projectId: BLINK_PROJECT_ID,
  authRequired: false
})

// Helpers: base64url
function strToBuf(str: string): ArrayBuffer { return new TextEncoder().encode(str) }
function bufToB64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+/g, '')
}
function b64ToBuf(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const standard = base64.replace(/-/g, '+').replace(/_/g, '/') + padding
  const binary = atob(standard)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function createJWT(payload: any, secret: string, ttlMinutes = 30): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const exp = now + Math.max(5, ttlMinutes) * 60
  const full = { ...payload, iat: now, exp, iss: 'ggj-auth' }

  const encHeader = bufToB64Url(strToBuf(JSON.stringify(header)))
  const encPayload = bufToB64Url(strToBuf(JSON.stringify(full)))
  const signingInput = `${encHeader}.${encPayload}`

  const key = await crypto.subtle.importKey('raw', strToBuf(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, strToBuf(signingInput))
  const encSig = bufToB64Url(sig)
  return `${signingInput}.${encSig}`
}

async function verifyJWT(token: string, secret: string): Promise<{ valid: boolean; payload?: any }> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return { valid: false }
    const [h, p, s] = parts
    const signingInput = `${h}.${p}`
    const key = await crypto.subtle.importKey('raw', strToBuf(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const ok = await crypto.subtle.verify('HMAC', key, b64ToBuf(s), strToBuf(signingInput))
    if (!ok) return { valid: false }
    const payload = JSON.parse(new TextDecoder().decode(b64ToBuf(p)))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return { valid: false }
    return { valid: true, payload }
  } catch {
    return { valid: false }
  }
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() })
  }

  if (!JWT_SECRET) {
    return json({ error: 'Server misconfigured' }, 500)
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const authHeader = req.headers.get('authorization') || ''

    // Extract Bearer token (our custom JWT)
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    let requesterId: string | null = null

    if (bearer) {
      const v = await verifyJWT(bearer, JWT_SECRET)
      if (v.valid) {
        requesterId = v.payload.userId || v.payload.sub || v.payload.id || null
      }
    }

    // If still no requester, try Blink managed token (best-effort)
    if (!requesterId && bearer) {
      try {
        // @ts-ignore
        blink.auth.setToken(bearer)
        const me = await blink.auth.me()
        requesterId = me?.id || null
      } catch { /* ignore */ }
    }

    if (!requesterId) {
      return json({ error: 'Unauthorized' }, 401)
    }

    // Confirm requester is admin
    const admins = await blink.db.users.list({ where: { id: requesterId }, limit: 1 })
    const admin = admins?.[0]
    if (!admin || String(admin.role) !== 'admin') {
      return json({ error: 'Forbidden' }, 403)
    }

    const body = await req.json()
    const { userId, email, ttlMinutes } = body || {}

    let target: any = null
    if (userId) {
      const rows = await blink.db.users.list({ where: { id: String(userId) }, limit: 1 })
      target = rows?.[0]
    } else if (email) {
      const rows = await blink.db.users.list({ where: { email: String(email).trim().toLowerCase() }, limit: 1 })
      target = rows?.[0]
    }

    if (!target) {
      return json({ error: 'User not found' }, 404)
    }

    const minutes = Number(ttlMinutes) > 0 ? Math.min(120, Number(ttlMinutes)) : 30

    // Mark token as impersonated and include actorId for audit
    const token = await createJWT({
      userId: target.id,
      email: target.email,
      displayName: target.displayName,
      role: target.role,
      impersonated: true,
      actorId: requesterId
    }, JWT_SECRET!, minutes)

    const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString()

    return json({ success: true, token, user: {
      id: target.id,
      email: target.email,
      displayName: target.displayName,
      role: target.role
    }, expiresAt })
  } catch (e) {
    console.error('[impersonate-user] error', e)
    return json({ error: 'Internal error' }, 500)
  }
})

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  })
}