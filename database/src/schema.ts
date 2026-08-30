import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/**
 * Supported repurposing targets.
 * Stored as a Postgres enum so invalid platforms are rejected at the DB level.
 */
export const platformEnum = pgEnum('platform', [
  'linkedin',
  'newsletter',
  'twitter',
  'script',
])

export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const sourceContent = pgTable(
  'source_content',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    originalUrl: text('original_url'),
    originalText: text('original_text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index('source_user_id_idx').on(t.userId)],
)

export const generatedPosts = pgTable(
  'generated_posts',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => sourceContent.id, { onDelete: 'cascade' }),
    platform: platformEnum('platform').notNull(),
    contentText: text('content_text').notNull(),
    savedAt: timestamp('saved_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('posts_source_id_idx').on(t.sourceId),
    index('posts_platform_idx').on(t.platform),
  ],
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type SourceContent = typeof sourceContent.$inferSelect
export type NewSourceContent = typeof sourceContent.$inferInsert

export type GeneratedPost = typeof generatedPosts.$inferSelect
export type NewGeneratedPost = typeof generatedPosts.$inferInsert
