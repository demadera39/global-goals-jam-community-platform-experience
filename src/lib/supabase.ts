import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] Missing environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.')
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '')

// ---------------------------------------------------------------------------
// Retry helper with exponential backoff (replaces Blink's safeDbCall)
// ---------------------------------------------------------------------------
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

export async function safeDbCall<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; initialDelayMs?: number }
): Promise<T> {
  const retries = options?.retries ?? 4
  const initialDelayMs = options?.initialDelayMs ?? 500

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      const status = err?.status ?? err?.code
      const isRateLimit = status === 429 || status === '429'

      if (!isRateLimit) throw err
      if (attempt === retries) {
        console.warn('safeDbCall: exhausted retries, throwing error')
        throw err
      }

      const backoff = initialDelayMs * Math.pow(2, attempt)
      console.warn(`safeDbCall: rate limited (attempt=${attempt}). retrying in ${backoff}ms`)
      await sleep(backoff)
    }
  }
  throw new Error('safeDbCall: unexpected exit')
}

// ---------------------------------------------------------------------------
// DB helpers — provide a table-based API compatible with old Blink patterns
// blink.db.TABLE.list/create/update/delete → db.TABLE.list/create/update/delete
// ---------------------------------------------------------------------------

// The live DB uses snake_case columns (display_name, created_at, etc.)
// but the app uses camelCase properties (displayName, createdAt, etc.).
// Convert between the two automatically.
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function mapKeys(obj: Record<string, any>, mapFn: (key: string) => string): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[mapFn(key)] = value
  }
  return result
}

function rowToCamel(row: any): any {
  if (!row || typeof row !== 'object') return row
  return mapKeys(row, snakeToCamel)
}

function rowsToCamel(rows: any[]): any[] {
  if (!rows) return []
  return rows.map(rowToCamel)
}

interface ListOptions {
  where?: Record<string, any>
  orderBy?: Record<string, 'asc' | 'desc'>
  limit?: number
  offset?: number
}

// The live DB uses snake_case for ALL table names and ALL column names.
// The `columnCase` parameter controls how app-side camelCase keys are mapped to DB columns.
const identity = (s: string) => s

function createTableHelper(tableName: string, columnCase: 'snake' | 'camel' = 'camel') {
  const toDbCol = columnCase === 'snake' ? camelToSnake : identity
  const toDbRecord = (rec: Record<string, any>) => mapKeys(rec, toDbCol)
  const fromDbRow = columnCase === 'snake' ? rowToCamel : identity
  const fromDbRows = columnCase === 'snake'
    ? (rows: any[]) => rowsToCamel(rows)
    : (rows: any[]) => rows || []

  return {
    async list(options?: ListOptions) {
      let query = supabase.from(tableName).select('*')

      if (options?.where) {
        for (const [key, value] of Object.entries(options.where)) {
          if (value !== undefined && value !== null) {
            // Guard: skip object/array values — only primitives are valid for .eq()
            if (typeof value === 'object') {
              console.warn(`[DB] Skipping non-primitive filter for "${key}":`, value)
              continue
            }
            query = query.eq(toDbCol(key), value)
          }
        }
      }

      if (options?.orderBy) {
        for (const [col, dir] of Object.entries(options.orderBy)) {
          query = query.order(toDbCol(col), { ascending: dir === 'asc' })
        }
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options?.limit || 100) - 1)
      }

      const { data, error } = await query
      if (error) throw error
      return fromDbRows(data || [])
    },

    async create(record: Record<string, any>) {
      const { data, error } = await supabase
        .from(tableName)
        .insert(toDbRecord(record))
        .select()
        .single()
      if (error) throw error
      return fromDbRow(data)
    },

    async update(id: string, updates: Record<string, any>) {
      const { data, error } = await supabase
        .from(tableName)
        .update(toDbRecord(updates))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return fromDbRow(data)
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
      if (error) throw error
    },
  }
}

// All known tables — table names must match the actual Postgres table names exactly.
// All tables use snake_case names AND snake_case columns in the live DB.
export const db = {
  users: createTableHelper('users', 'snake'),
  courseEnrollments: createTableHelper('course_enrollments', 'snake'),
  courseModules: createTableHelper('course_modules', 'snake'),
  courseProgress: createTableHelper('course_progress', 'snake'),
  courseRegistrations: createTableHelper('course_registrations', 'snake'),
  donations: createTableHelper('donations', 'snake'),
  events: createTableHelper('events', 'snake'),
  eventRegistrations: createTableHelper('event_registrations', 'snake'),
  hostApplications: createTableHelper('host_applications', 'snake'),
  hostInvites: createTableHelper('host_invites', 'snake'),
  media: createTableHelper('media', 'snake'),
  certificates: createTableHelper('certificates', 'snake'),
  emailSchedule: createTableHelper('email_schedule', 'snake'),
  passwordResets: createTableHelper('password_resets', 'snake'),
  userAchievements: createTableHelper('user_achievements', 'snake'),
  stripeEvents: createTableHelper('stripe_events', 'snake'),
  toolkits: createTableHelper('toolkits', 'snake'),
  forumCategories: createTableHelper('forum_categories', 'snake'),
  forumThreads: createTableHelper('forum_threads', 'snake'),
  forumPosts: createTableHelper('forum_posts', 'snake'),
  jamHighlights: createTableHelper('jam_highlights', 'snake'),
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------
export const storage = {
  async upload(
    file: File,
    path: string,
    options?: { upsert?: boolean; bucket?: string }
  ): Promise<{ publicUrl: string }> {
    const bucket = options?.bucket || 'uploads'
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: options?.upsert ?? true })
    if (error) throw error

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return { publicUrl: data.publicUrl }
  },
}

// ---------------------------------------------------------------------------
// Notifications (email) — calls a Supabase Edge Function
// ---------------------------------------------------------------------------
export const notifications = {
  async email(params: {
    to: string
    from: string
    subject: string
    html: string
    text?: string
  }) {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    })
    if (error) throw error
    return data as { success: boolean; messageId?: string }
  },
}

// ---------------------------------------------------------------------------
// Auth compatibility layer — wraps Supabase Auth
// ---------------------------------------------------------------------------
export const auth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return {
      id: user.id,
      email: user.email || '',
      displayName: user.user_metadata?.display_name || user.email || '',
      avatar: user.user_metadata?.avatar_url || null,
    }
  },

  setToken(_token: string, _persist?: boolean) {
    // No-op: Supabase manages sessions automatically
  },

  async logout() {
    await supabase.auth.signOut()
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    localStorage.removeItem('ggj_app_user')
  },

  onAuthStateChanged(callback: (user: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          callback({
            id: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.display_name || session.user.email || '',
          })
        } else {
          callback(null)
        }
      }
    )
    return () => subscription.unsubscribe()
  },
}

// ---------------------------------------------------------------------------
// Legacy storage helpers (kept for backward compatibility)
// ---------------------------------------------------------------------------
export async function listBucketFiles(bucketName: string, folder = '') {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .list(folder, { limit: 100, sortBy: { column: 'name', order: 'asc' } })
  if (error) {
    console.error('[Supabase] Error listing files:', error)
    return []
  }
  return data || []
}

export function getPublicUrl(bucketName: string, filePath: string) {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)
  return data.publicUrl
}

export async function listBucketFilesWithUrls(bucketName: string, folder = '') {
  let allImageFiles: any[] = []
  const files = await listBucketFiles(bucketName, folder)

  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  const imageFiles = files.filter((file) => {
    if (!file.name || file.name.includes('.emptyFolderPlaceholder')) return false
    const name = file.name.toLowerCase()
    return imageExts.some((ext) => name.endsWith(ext))
  })

  allImageFiles.push(...imageFiles.map((f) => ({ ...f, folder })))

  // If root and no images, check subfolders
  if (folder === '' && imageFiles.length === 0) {
    const folders = files.filter((item) => {
      const name = item.name || ''
      return !name.includes('.') && name !== '.emptyFolderPlaceholder'
    })

    for (const subFolder of folders) {
      const subFiles = await listBucketFiles(bucketName, subFolder.name)
      const subImages = subFiles.filter((file) => {
        if (!file.name || file.name.includes('.emptyFolderPlaceholder')) return false
        return imageExts.some((ext) => file.name.toLowerCase().endsWith(ext))
      })
      allImageFiles.push(...subImages.map((f) => ({ ...f, folder: subFolder.name })))
    }
  }

  return allImageFiles.map((file) => {
    const filePath = file.folder ? `${file.folder}/${file.name}` : file.name
    return {
      name: file.name,
      folder: file.folder,
      url: getPublicUrl(bucketName, filePath),
      createdAt: file.created_at,
      metadata: file.metadata,
    }
  })
}
