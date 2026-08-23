import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const storyHearts = pgTable('story_hearts', {
  storySlug: text('story_slug').primaryKey(),
  heartCount: integer('heart_count').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const storyComments = pgTable('story_comments', {
  id: serial().primaryKey(),
  storySlug: text('story_slug').notNull(),
  author: text().notNull(),
  message: text().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
