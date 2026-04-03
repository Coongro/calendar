import type { ReactNode } from 'react';

import type { CalendarGroup } from './calendar.js';
import type { EventType } from './event-type.js';
import type { CalendarEvent, EventCreateData } from './event.js';
import type { EventFilters } from './filters.js';

// --- Calendario ---

export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarViewProps {
  enabledViews?: CalendarViewMode[];
  defaultView?: CalendarViewMode;
  renderEvent?: (event: CalendarEvent) => ReactNode;
  renderToolbar?: () => ReactNode;
  showCalendarSidebar?: boolean;
  extraToolbarActions?: ReactNode;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: string) => void;
  className?: string;
}

export interface MonthGridProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  renderEvent?: (event: CalendarEvent) => ReactNode;
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: string) => void;
  showWeekends?: boolean;
  className?: string;
}

export interface WeekGridProps {
  startDate: string;
  events: CalendarEvent[];
  startHour?: number;
  endHour?: number;
  slotDuration?: number;
  renderEvent?: (event: CalendarEvent) => ReactNode;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: string, hour: number) => void;
  showWeekends?: boolean;
  className?: string;
}

export interface DayColumnProps {
  date: string;
  events: CalendarEvent[];
  startHour?: number;
  endHour?: number;
  slotDuration?: number;
  renderEvent?: (event: CalendarEvent) => ReactNode;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (hour: number) => void;
  className?: string;
}

export interface AgendaListProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  emptyMessage?: string;
  className?: string;
}

export interface MiniCalendarProps {
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  eventDots?: Record<string, number>;
  className?: string;
}

// --- Evento ---

export interface EventFormProps {
  eventId?: string;
  defaults?: Partial<EventCreateData>;
  hiddenFields?: string[];
  hiddenSections?: string[];
  calendarOptions?: CalendarGroup[];
  eventTypeOptions?: EventType[];
  renderBeforeFields?: () => ReactNode;
  renderAfterFields?: () => ReactNode;
  renderEntitySection?: () => ReactNode;
  renderFooter?: () => ReactNode;
  extraFields?: FieldDef[];
  onSuccess?: (event: CalendarEvent) => void;
  onCancel?: () => void;
  className?: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
}

export interface EventCardProps {
  event: CalendarEvent;
  showDate?: boolean;
  showTime?: boolean;
  showStatus?: boolean;
  showLocation?: boolean;
  showCalendarColor?: boolean;
  badge?: ReactNode;
  subtitle?: ReactNode;
  render?: (event: CalendarEvent) => ReactNode;
  onClick?: (event: CalendarEvent) => void;
  className?: string;
}

export interface EventDetailProps {
  eventId: string;
  renderEntityInfo?: () => ReactNode;
  renderSections?: () => ReactNode;
  renderActions?: () => ReactNode;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
  className?: string;
}

export interface EventPickerProps {
  filters?: EventFilters;
  value?: string | null;
  onChange?: (event: CalendarEvent | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface EventListProps {
  filters?: EventFilters;
  columns?: ColumnDef[];
  extraColumns?: ColumnDef[];
  extraActions?: ActionDef[];
  statusConfig?: Record<string, { label: string; color: string }>;
  renderEvent?: (event: CalendarEvent) => ReactNode;
  onRowClick?: (event: CalendarEvent) => void;
  pageSize?: number;
  emptyMessage?: string;
  emptyStateAction?: ReactNode;
  className?: string;
}

export interface ColumnDef {
  key: string;
  header: string;
  render?: (event: CalendarEvent) => ReactNode;
  sortable?: boolean;
}

export interface ActionDef {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: (event: CalendarEvent) => void;
  variant?: 'default' | 'destructive';
}

export interface EventStatsProps {
  from?: string;
  to?: string;
  className?: string;
}

export interface CreateEventButtonProps {
  defaults?: Partial<EventCreateData>;
  label?: string;
  onSuccess?: (event: CalendarEvent) => void;
  className?: string;
}

export interface CalendarBadgeProps {
  count: number;
  label?: string;
  color?: string;
  className?: string;
}

export interface UpcomingEventsProps {
  limit?: number;
  calendarIds?: string[];
  onEventClick?: (event: CalendarEvent) => void;
  emptyMessage?: string;
  className?: string;
}

// --- Internos ---

export interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  disabledDates?: string[];
  minDate?: string;
  maxDate?: string;
  className?: string;
}

export interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  step?: number;
  minTime?: string;
  maxTime?: string;
  minuteStep?: number;
  use24Hour?: boolean;
  className?: string;
}

export interface DateTimePickerProps {
  /** Datetime string local (ej: 2026-04-03T09:30) */
  value?: string;
  /** Callback con datetime string local (YYYY-MM-DDTHH:MM) */
  onChange?: (datetime: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  /** Intervalo de la grilla rápida en minutos (default: 30) */
  step?: number;
  /** Hora mínima visible (default: '00:00') */
  minTime?: string;
  /** Hora máxima visible (default: '23:59') */
  maxTime?: string;
  /** Intervalo de minutos en columna exacta (default: 5, configurable via settings) */
  minuteStep?: number;
  /** Formato 24h vs 12h (default: true, configurable via settings) */
  use24Hour?: boolean;
  className?: string;
}

export interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  colors?: string[];
  className?: string;
}
