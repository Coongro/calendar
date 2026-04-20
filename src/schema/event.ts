import { sql } from 'drizzle-orm';
import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const eventTable = pgTable('module_calendar_events', {
  id: uuid('id').primaryKey().notNull(),
  title: text('title').notNull(),
  description: text('description'),
  start_at: timestamp('start_at', { mode: 'date', withTimezone: true }).notNull(),
  end_at: timestamp('end_at', { mode: 'date', withTimezone: true }).notNull(),
  all_day: boolean('all_day').notNull(),
  status: text('status').notNull(),
  color: text('color'),
  location: text('location'),
  calendar_id: text('calendar_id'),
  event_type_id: text('event_type_id'),
  entity_id: text('entity_id'),
  entity_type: text('entity_type'),
  recurrence_rule: text('recurrence_rule'),
  recurrence_end: timestamp('recurrence_end', { mode: 'date', withTimezone: true }),
  recurrence_parent_id: text('recurrence_parent_id'),
  tags: jsonb('tags'),
  metadata: jsonb('metadata'),
  reminders: jsonb('reminders'),
  notes: text('notes'),
  is_active: boolean('is_active').notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
  created_at: timestamp('created_at', { mode: 'date', withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updated_at: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type EventRow = typeof eventTable.$inferSelect;
export type NewEventRow = typeof eventTable.$inferInsert;
