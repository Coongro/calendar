export type SortDirection = 'asc' | 'desc';

export interface EventFilters {
  query?: string;
  status?: string;
  calendarId?: string;
  calendarIds?: string[];
  eventTypeId?: string;
  entityId?: string;
  entityType?: string;
  from?: string | Date;
  to?: string | Date;
  tags?: string[];
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: SortDirection;
}
