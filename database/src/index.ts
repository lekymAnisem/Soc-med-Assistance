import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema.js'

export { schema }
export * from './schema.js'

let cachedDb: ReturnType<typeof createDb> | null = null

/**
 * Neon serverless driver — a single SQL-over-HTTP connection, ideal for
 * serverless / edge runtimes. Drizzle wraps it with a schema-aware,
 * type-safe query builder.
 *
 * The connection is created lazily so that tiers can boot (health check)
 * even before DATABASE_URL is configured. Routes that touch the database
 * surface a clear error instead.
 */
function createDb() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy database/.env.example to database/.env (or set it in your deploy env) and add your Neon connection string.'
    )
  }

  const sql = neon(connectionString)
  return drizzle({ client: sql, schema })
}

export function getDb() {
  if (!cachedDb) cachedDb = createDb()
  return cachedDb
}

export type Database = ReturnType<typeof createDb>

export default getDb
