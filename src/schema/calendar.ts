import { sql } from 'drizzle-orm';
import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const calendarTable = pgTable('module_calendar_calendars', {
  id: uuid('id').primaryKey().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull(),
  is_visible: boolean('is_visible').notNull(),
  is_default: boolean('is_default').notNull(),
  metadata: jsonb('metadata'),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  created_at: timestamp('created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  updated_at: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

export type CalendarRow = typeof calendarTable.$inferSelect;
export type NewCalendarRow = typeof calendarTable.$inferInsert;
