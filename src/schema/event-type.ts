import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const eventTypeTable = pgTable('module_calendar_event_types', {
  id: uuid('id').primaryKey().notNull(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  default_duration: integer('default_duration').notNull(),
  description: text('description'),
  metadata: jsonb('metadata'),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  created_at: timestamp('created_at', { mode: 'string' }).notNull().default(sql`now()`),
  updated_at: timestamp('updated_at', { mode: 'string' }).notNull().default(sql`now()`),
});

export type EventTypeRow = typeof eventTypeTable.$inferSelect;
export type NewEventTypeRow = typeof eventTypeTable.$inferInsert;
