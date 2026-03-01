import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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
    Object.entries(where).forEach(([key, value]) => {
      const snakeKey = camelToSnake(key)
      if (value === null) {
        query = query.is(snakeKey, null)
      } else if (Array.isArray(value)) {
        query = query.in(snakeKey, value)
      } else {
        query = query.eq(snakeKey, value)
      }
    })
    return query
  }

  async list(options?: any) {
    let query = supabase.from(this.tableName).select(options?.select?.map(camelToSnake).join(',') || '*')
    if (options?.where) query = this.applyFilters(query, options.where)
    if (options?.orderBy) {
      Object.entries(options.orderBy).forEach(([key, value]) => {
        query = query.order(camelToSnake(key), { ascending: value === 'asc' })
      })
    }
    if (options?.limit) query = query.limit(options.limit)
    const { data, error } = await query
    if (error) throw error
    return snakeToCamel(data)
  }

  async get(id: string) {
    const { data, error } = await supabase.from(this.tableName).select('*').eq('id', id).single()
    if (error) return null
    return snakeToCamel(data)
  }

  async create(data: any) {
    const snakeData = objToSnake(data)
    const { data: result, error } = await supabase.from(this.tableName).insert(snakeData).select().single()
    if (error) throw error
    return snakeToCamel(result)
  }

  async update(id: string, data: any) {
    const snakeData = objToSnake(data)
    const { data: result, error } = await supabase.from(this.tableName).update(snakeData).eq('id', id).select().single()
    if (error) throw error
    return snakeToCamel(result)
  }

  async delete(id: string) {
    const { error } = await supabase.from(this.tableName).delete().eq('id', id)
    if (error) throw error
    return true
  }
}

export const db = new Proxy({} as any, {
  get(target, prop) {
    if (typeof prop === 'string') {
      const tableName = camelToSnake(prop)
      return new SupabaseTable(tableName)
    }
    return target[prop]
  }
})
