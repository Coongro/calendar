import type { UTCTimestamp } from '@coongro/datetime';

export type EventStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'tentative';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_at: UTCTimestamp;
  end_at: UTCTimestamp;
  all_day: boolean;
  status: string;
  color: string | null;
  location: string | null;
  calendar_id: string | null;
  event_type_id: string | null;
  entity_id: string | null;
  entity_type: string | null;
  recurrence_rule: string | null;
  recurrence_end: UTCTimestamp | null;
  recurrence_parent_id: string | null;
  tags: unknown;
  metadata: unknown;
  reminders: unknown;
  notes: string | null;
  is_active: boolean;
  deleted_at: UTCTimestamp | null;
  created_at: UTCTimestamp;
  updated_at: UTCTimestamp;
}

export interface EventCreateData {
  id?: string;
  title: string;
  description?: string;
  start_at: UTCTimestamp;
  end_at: UTCTimestamp;
  all_day?: boolean;
  status?: EventStatus;
  color?: string;
  location?: string;
  calendar_id?: string;
  event_type_id?: string;
  entity_id?: string;
  entity_type?: string;
  recurrence_rule?: string;
  recurrence_end?: UTCTimestamp;
  recurrence_parent_id?: string;
  tags?: unknown;
  metadata?: unknown;
  reminders?: unknown;
  notes?: string;
  is_active?: boolean;
}

export type EventUpdateData = Partial<EventCreateData>;
