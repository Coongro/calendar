/**
 * @coongro/calendar — Exportaciones server-only
 *
 * Schema tables y repositories (dependen de drizzle-orm).
 * NO importar desde el browser — usar '@coongro/calendar' para hooks/componentes.
 */

// Schema
export { calendarTable } from './schema/calendar.js';
export type { CalendarRow, NewCalendarRow } from './schema/calendar.js';
export { eventTypeTable } from './schema/event-type.js';
export type { EventTypeRow, NewEventTypeRow } from './schema/event-type.js';
export { eventTable } from './schema/event.js';
export type { EventRow, NewEventRow } from './schema/event.js';

// Repositories
export { CalendarRepository } from './repositories/calendar.repository.js';
export { EventTypeRepository } from './repositories/event-type.repository.js';
export { EventRepository } from './repositories/event.repository.js';
export type { EventSearchParams, CountResult } from './repositories/event.repository.js';
