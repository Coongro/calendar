export interface CalendarGroup {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_visible: boolean;
  is_default: boolean;
  metadata: unknown;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarCreateData {
  id?: string;
  name: string;
  description?: string;
  color: string;
  is_visible?: boolean;
  is_default?: boolean;
  metadata?: unknown;
}

export type CalendarUpdateData = Partial<CalendarCreateData>;
