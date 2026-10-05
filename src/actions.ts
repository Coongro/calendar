/**
 * Acciones de calendar: el contrato que el Core valida y expone.
 *
 * Cada acción declara qué acepta y delega en su repositorio. En `create` y
 * `update` solo se escriben las columnas de datos: nunca `created_at`,
 * `updated_at` ni `deleted_at` (antes `update` aceptaba cualquier columna).
 * Las fechas llegan como texto por JSON y el repositorio las convierte.
 *
 * Los listados siguen devolviendo arrays. `create`, `update`, `softDelete`,
 * `restore` y `toggleVisibility` devuelven el registro a quien pide la forma
 * nueva y `[registro]` a los demás.
 */

import { createInsertSchema, mutation, query, z } from '@coongro/plugin-sdk/actions';

import { CalendarRepository } from './repositories/calendar.repository.js';
import { EventTypeRepository } from './repositories/event-type.repository.js';
import { EventRepository } from './repositories/event.repository.js';
import { calendarTable } from './schema/calendar.js';
import { eventTypeTable } from './schema/event-type.js';
import { eventTable } from './schema/event.js';

const Id = z.guid();
const ById = z.object({ id: Id }).strict();
const destructive = mutation.meta({ effect: 'destructive' });
/** Una fecha por JSON llega como texto; desde el servidor puede ser un Date. */
const When = z.union([z.string(), z.date()]);
const Metadata = z.record(z.string(), z.unknown()).nullable().optional();

const first = <T>(rows: T[]): T | null => rows[0] ?? null;

// ─── Calendarios ────────────────────────────────────────────────────────────

const CALENDAR = {
  name: true,
  description: true,
  color: true,
  is_visible: true,
  is_default: true,
} as const;
const calendarInsert = createInsertSchema(calendarTable);
const CalendarData = calendarInsert.pick(CALENDAR).extend({
  // El repositorio los completa si faltan.
  is_visible: z.boolean().optional(),
  is_default: z.boolean().optional(),
  metadata: Metadata,
});

export const calendarActions = {
  list: query.handler(({ context }) => context.repo(CalendarRepository).list()),
  getById: query
    .input(ById)
    .handler(
      async ({ input, context }) => (await context.repo(CalendarRepository).getById(input)) ?? null
    ),
  getDefault: query.handler(
    async ({ context }) => (await context.repo(CalendarRepository).getDefault()) ?? null
  ),
  create: mutation
    .meta({ legacy: 'first' })
    .input(z.object({ data: CalendarData.strict() }).strict())
    .handler(async ({ input, context }) =>
      first(await context.repo(CalendarRepository).create(input))
    ),
  update: mutation
    .meta({ legacy: 'first' })
    .input(z.object({ id: Id, data: CalendarData.partial().strict() }).strict())
    .handler(async ({ input, context }) =>
      first(await context.repo(CalendarRepository).update(input))
    ),
  toggleVisibility: mutation
    .meta({ legacy: 'first' })
    .input(ById)
    .handler(async ({ input, context }) =>
      first(await context.repo(CalendarRepository).toggleVisibility(input))
    ),
  softDelete: destructive
    .meta({ legacy: 'first' })
    .input(ById)
    .handler(async ({ input, context }) =>
      first(await context.repo(CalendarRepository).softDelete(input))
    ),
  restore: mutation
    .meta({ legacy: 'first' })
    .input(ById)
    .handler(async ({ input, context }) =>
      first(await context.repo(CalendarRepository).restore(input))
    ),
  delete: destructive
    .input(ById)
    .handler(({ input, context }) => context.repo(CalendarRepository).delete(input)),
};

// ─── Tipos de evento ────────────────────────────────────────────────────────

const EVENT_TYPE = { name: true, color: true, default_duration: true, description: true } as const;
const eventTypeInsert = createInsertSchema(eventTypeTable);
const EventTypeData = eventTypeInsert.pick(EVENT_TYPE).extend({ metadata: Metadata });

export const eventTypeActions = {
  list: query.handler(({ context }) => context.repo(EventTypeRepository).list()),
  getById: query
    .input(ById)
    .handler(
      async ({ input, context }) => (await context.repo(EventTypeRepository).getById(input)) ?? null
    ),
  search: query
    .input(
      z.object({ query: z.string().optional(), includeDeleted: z.boolean().optional() }).strict()
    )
    .handler(({ input, context }) => context.repo(EventTypeRepository).search(input)),
  create: mutation
    .meta({ legacy: 'first' })
    .input(z.object({ data: EventTypeData.strict() }).strict())
    .handler(async ({ input, context }) =>
      first(await context.repo(EventTypeRepository).create(input))
    ),
  update: mutation
    .meta({ legacy: 'first' })
    .input(z.object({ id: Id, data: EventTypeData.partial().strict() }).strict())
    .handler(async ({ input, context }) =>
      first(await context.repo(EventTypeRepository).update(input))
    ),
  softDelete: destructive
    .meta({ legacy: 'first' })
    .input(ById)
    .handler(async ({ input, context }) =>
      first(await context.repo(EventTypeRepository).softDelete(input))
    ),
  restore: mutation
    .meta({ legacy: 'first' })
    .input(ById)
    .handler(async ({ input, context }) =>
      first(await context.repo(EventTypeRepository).restore(input))
    ),
  delete: destructive
    .input(ById)
    .handler(({ input, context }) => context.repo(EventTypeRepository).delete(input)),
};

// ─── Eventos ────────────────────────────────────────────────────────────────

const EVENT = {
  title: true,
  description: true,
  color: true,
  location: true,
  calendar_id: true,
  event_type_id: true,
  entity_id: true,
  entity_type: true,
  recurrence_rule: true,
  recurrence_parent_id: true,
  notes: true,
} as const;
const eventInsert = createInsertSchema(eventTable);
const EventData = eventInsert.pick(EVENT).extend({
  start_at: When,
  end_at: When,
  recurrence_end: When.nullable().optional(),
  // El repositorio completa estos si faltan.
  status: z.string().optional(),
  all_day: z.boolean().optional(),
  is_active: z.boolean().optional(),
  tags: z.array(z.string()).nullable().optional(),
  reminders: z.unknown().optional(),
  metadata: Metadata,
});

const Range = { from: When, to: When };
const OptionalRange = { from: z.string().optional(), to: z.string().optional() };

export const eventActions = {
  list: query.handler(({ context }) => context.repo(EventRepository).list()),
  getById: query
    .input(ById)
    .handler(
      async ({ input, context }) => (await context.repo(EventRepository).getById(input)) ?? null
    ),
  create: mutation
    .meta({ legacy: 'first' })
    .input(z.object({ data: EventData.extend({ id: Id.optional() }).strict() }).strict())
    .handler(async ({ input, context }) =>
      first(await context.repo(EventRepository).create(input as never))
    ),
  update: mutation
    .meta({ legacy: 'first' })
    .input(z.object({ id: Id, data: EventData.partial().strict() }).strict())
    .handler(async ({ input, context }) =>
      first(await context.repo(EventRepository).update(input as never))
    ),
  softDelete: destructive
    .meta({ legacy: 'first' })
    .input(ById)
    .handler(async ({ input, context }) =>
      first(await context.repo(EventRepository).softDelete(input))
    ),
  restore: mutation
    .meta({ legacy: 'first' })
    .input(ById)
    .handler(async ({ input, context }) =>
      first(await context.repo(EventRepository).restore(input))
    ),
  delete: destructive
    .input(ById)
    .handler(({ input, context }) => context.repo(EventRepository).delete(input)),
  search: query
    .input(
      z
        .object({
          query: z.string().optional(),
          status: z.string().optional(),
          calendarId: z.string().optional(),
          calendarIds: z.array(z.string()).optional(),
          eventTypeId: z.string().optional(),
          entityId: z.string().optional(),
          entityType: z.string().optional(),
          from: When.optional(),
          to: When.optional(),
          tags: z.array(z.string()).optional(),
          includeDeleted: z.boolean().optional(),
          limit: z.number().int().positive().optional(),
          offset: z.number().int().nonnegative().optional(),
          orderBy: z.string().optional(),
          orderDir: z.enum(['asc', 'desc']).optional(),
        })
        .strict()
    )
    .handler(({ input, context }) => context.repo(EventRepository).search(input)),
  listByDateRange: query
    .input(z.object({ ...Range, calendarIds: z.array(z.string()).optional() }).passthrough())
    .handler(({ input, context }) => context.repo(EventRepository).listByDateRange(input as never)),
  listByDate: query
    .input(z.object({ date: z.string(), tz: z.string() }).strict())
    .handler(({ input, context }) => context.repo(EventRepository).listByDate(input)),
  listByEntity: query
    .input(z.object({ entityId: z.string(), entityType: z.string() }).passthrough())
    .handler(({ input, context }) => context.repo(EventRepository).listByEntity(input as never)),
  listByCalendar: query
    .input(z.object({ calendarId: z.string(), ...OptionalRange }).strict())
    .handler(({ input, context }) => context.repo(EventRepository).listByCalendar(input)),
  listUpcoming: query
    .input(
      z
        .object({
          limit: z.number().int().positive().optional(),
          calendarIds: z.array(z.string()).optional(),
        })
        .strict()
        .optional()
    )
    .handler(({ input, context }) => context.repo(EventRepository).listUpcoming(input ?? {})),
  moveEvent: mutation
    .meta({ legacy: 'first' })
    .input(z.object({ id: Id, startAt: When, endAt: When }).passthrough())
    .handler(async ({ input, context }) =>
      first(await context.repo(EventRepository).moveEvent(input as never))
    ),
  countByStatus: query
    .input(z.object(OptionalRange).strict().optional())
    .handler(({ input, context }) => context.repo(EventRepository).countByStatus(input)),
  countByDate: query
    .input(z.object(Range).passthrough())
    .handler(({ input, context }) => context.repo(EventRepository).countByDate(input as never)),
  countByCalendar: query
    .input(z.object(OptionalRange).strict().optional())
    .handler(({ input, context }) => context.repo(EventRepository).countByCalendar(input)),
};

export type CalendarActions = typeof calendarActions;
export type EventTypeActions = typeof eventTypeActions;
export type EventActions = typeof eventActions;
