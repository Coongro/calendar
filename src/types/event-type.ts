export interface EventType {
  id: string;
  name: string;
  color: string;
  default_duration: number;
  description: string | null;
  metadata: unknown;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventTypeCreateData {
  id?: string;
  name: string;
  color: string;
  default_duration: number;
  description?: string;
  metadata?: unknown;
}

export type EventTypeUpdateData = Partial<EventTypeCreateData>;
