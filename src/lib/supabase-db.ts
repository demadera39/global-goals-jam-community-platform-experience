import { supabase } from './supabase'

/**
 * Helper to convert camelCase to snake_case
 */
const camelToSnake = (str: string) => str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

/**
 * Helper to convert snake_case to camelCase
 */
const snakeToCamel = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((v) => snakeToCamel(v))
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/(_\w)/g, (m) => m[1].toUpperCase())
      result[camelKey] = snakeToCamel(obj[key])
      return result
    }, {} as any)
  }
  return obj
}

/**
 * Helper to convert camelCase keys in object to snake_case
 */
const objToSnake = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((v) => objToSnake(v))
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = camelToSnake(key)
      result[snakeKey] = objToSnake(obj[key])
      return result
    }, {} as any)
  }
  return obj
}

class SupabaseTable {
  constructor(private tableName: string) {}

  private applyFilters(query: any, where: any) {
    if (!where) return query

    // Handle flat object
    Object.entries(where).forEach(([key, value]) => {
      const snakeKey = camelToSnake(key)
      if (value === null) {
        query = query.is(snakeKey, null)
      } else if (Array.isArray(value)) {
        query = query.in(snakeKey, value)
      } else if (typeof value === 'object' && value !== null) {
        // Handle basic operators if needed, or skip for now
        // For now just basic equality
      } else {
        query = query.eq(snakeKey, value)
      }
    })

    return query
  }

  async list(options?: any) {
    let query = supabase.from(this.tableName).select(options?.select?.map(camelToSnake).join(',') || '*')

    if (options?.where) {
      query = this.applyFilters(query, options.where)
    }

    if (options?.orderBy) {
      Object.entries(options.orderBy).forEach(([key, value]) => {
        query = query.order(camelToSnake(key), { ascending: value === 'asc' })
      })
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1)
    }

    const { data, error } = await query
    if (error) throw error
    return snakeToCamel(data)
  }

  async get(id: string) {
    const { data, error } = await supabase.from(this.tableName).select('*').eq('id', id).single()
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return snakeToCamel(data)
  }

  async create(data: any) {
    const snakeData = objToSnake(data)
    const { data: result, error } = await supabase.from(this.tableName).insert(snakeData).select().single()
    if (error) throw error
    return snakeToCamel(result)
  }

  async createMany(data: any[]) {
    const snakeData = data.map(objToSnake)
    const { data: result, error } = await supabase.from(this.tableName).insert(snakeData).select()
    if (error) throw error
    return snakeToCamel(result)
  }

  async update(id: string, data: any) {
    const snakeData = objToSnake(data)
    const { data: result, error } = await supabase.from(this.tableName).update(snakeData).eq('id', id).select().single()
    if (error) throw error
    return snakeToCamel(result)
  }

  async upsert(data: any) {
    const snakeData = objToSnake(data)
    const { data: result, error } = await supabase.from(this.tableName).upsert(snakeData).select().single()
    if (error) throw error
    return snakeToCamel(result)
  }

  async upsertMany(data: any[]) {
    const snakeData = data.map(objToSnake)
    const { data: result, error } = await supabase.from(this.tableName).upsert(snakeData).select()
    if (error) throw error
    return snakeToCamel(result)
  }

  async delete(id: string) {
    const { error } = await supabase.from(this.tableName).delete().eq('id', id)
    if (error) throw error
    return true
  }

  async count(options?: any) {
    let query = supabase.from(this.tableName).select('*', { count: 'exact', head: true })
    if (options?.where) {
      query = this.applyFilters(query, options.where)
    }
    const { count, error } = await query
    if (error) throw error
    return count || 0
  }

  async exists(options?: any) {
    const c = await this.count(options)
    return c > 0
  }
}

/**
 * Proxy object that mimics blink.db
 * Example: db.hostInvites.list() calls supabase.from('host_invites').select('*')
 */
export const db = new Proxy({} as any, {
  get(target, prop) {
    if (typeof prop === 'string') {
      const tableName = camelToSnake(prop)
      return new SupabaseTable(tableName)
    }
    return target[prop]
  }
})
