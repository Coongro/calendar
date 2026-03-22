/**
 * @coongro/calendar — Plugin de calendario reutilizable
 *
 * Schema + Repository → exportados via subpath '@coongro/calendar/server'
 * NO exportar aquí: contienen imports de drizzle-orm que no corren en el browser
 */

// Row types (type-only, browser safe)
export type { CalendarRow, NewCalendarRow } from './schema/calendar.js';
export type { EventTypeRow, NewEventTypeRow } from './schema/event-type.js';
export type { EventRow, NewEventRow } from './schema/event.js';
export type { EventSearchParams, CountResult } from './repositories/event.repository.js';

// Types
export type {
  CalendarEvent,
  EventCreateData,
  EventUpdateData,
  EventStatus,
} from './types/event.js';
export type {
  CalendarGroup,
  CalendarCreateData,
  CalendarUpdateData,
} from './types/calendar.js';
export type {
  EventType,
  EventTypeCreateData,
  EventTypeUpdateData,
} from './types/event-type.js';
export type { EventFilters, SortDirection } from './types/filters.js';
export type {
  CalendarViewMode,
  CalendarViewProps,
  MonthGridProps,
  WeekGridProps,
  DayColumnProps,
  AgendaListProps,
  MiniCalendarProps,
  EventFormProps,
  FieldDef,
  EventCardProps,
  EventDetailProps,
  EventPickerProps,
  EventListProps,
  ColumnDef,
  ActionDef,
  EventStatsProps,
  CreateEventButtonProps,
  CalendarBadgeProps,
  UpcomingEventsProps,
  DatePickerProps,
  TimePickerProps,
  ColorPickerProps,
} from './types/components.js';

// Hooks
export { useEvents } from './hooks/useEvents.js';
export type { UseEventsOptions, UseEventsResult } from './hooks/useEvents.js';
export { useEvent } from './hooks/useEvent.js';
export type { UseEventResult } from './hooks/useEvent.js';
export { useEventMutations } from './hooks/useEventMutations.js';
export type { UseEventMutationsResult } from './hooks/useEventMutations.js';
export { useEventStats } from './hooks/useEventStats.js';
export type { UseEventStatsResult } from './hooks/useEventStats.js';
export { useCalendars } from './hooks/useCalendars.js';
export type { UseCalendarsResult } from './hooks/useCalendars.js';
export { useCalendarMutations } from './hooks/useCalendarMutations.js';
export type { UseCalendarMutationsResult } from './hooks/useCalendarMutations.js';
export { useEventTypes } from './hooks/useEventTypes.js';
export type { UseEventTypesResult } from './hooks/useEventTypes.js';
export { useEventTypeMutations } from './hooks/useEventTypeMutations.js';
export type { UseEventTypeMutationsResult } from './hooks/useEventTypeMutations.js';
export { useCalendarSettings } from './hooks/useCalendarSettings.js';
export type { CalendarSettings } from './hooks/useCalendarSettings.js';
export { useUpcomingEvents } from './hooks/useUpcomingEvents.js';
export type { UseUpcomingEventsResult } from './hooks/useUpcomingEvents.js';
export { useEventsByEntity } from './hooks/useEventsByEntity.js';
export type { UseEventsByEntityResult } from './hooks/useEventsByEntity.js';
export { useDateNavigation } from './hooks/useDateNavigation.js';
export type { UseDateNavigationResult } from './hooks/useDateNavigation.js';

// Components
export { CalendarView } from './components/calendar/CalendarView.js';
export { MonthGrid } from './components/calendar/MonthGrid.js';
export { WeekGrid } from './components/calendar/WeekGrid.js';
export { DayColumn } from './components/calendar/DayColumn.js';
export { AgendaList } from './components/calendar/AgendaList.js';
export { MiniCalendar } from './components/calendar/MiniCalendar.js';
export { EventForm } from './components/event/EventForm.js';
export { EventCard } from './components/event/EventCard.js';
export { EventDetail } from './components/event/EventDetail.js';
export { EventPicker } from './components/event/EventPicker.js';
export { EventList } from './components/event/EventList.js';
export { EventStats } from './components/event/EventStats.js';
export { CreateEventButton } from './components/event/CreateEventButton.js';
export { CalendarBadge } from './components/event/CalendarBadge.js';
export { UpcomingEvents } from './components/event/UpcomingEvents.js';

// Utils
export { CALENDAR_SETTINGS } from './utils/settings.js';
export { STATUS_LABELS, STATUS_COLORS, formatStatus, toSelectOptions } from './utils/labels.js';
export {
  formatEventDate,
  formatEventTime,
  formatEventDateTime,
  getDayName,
  getShortDayName,
  getMonthName,
  getWeekStart,
  getWeekEnd,
  getWeekDays,
  getMonthStart,
  getMonthEnd,
  getMonthGridDays,
  generateTimeSlots,
  toDateString,
  isSameDay,
  diffMinutes,
  addMinutes,
} from './utils/date.js';
export { parseRRule, toRRule, formatRecurrence } from './utils/recurrence.js';
export type { RecurrenceRule } from './utils/recurrence.js';
