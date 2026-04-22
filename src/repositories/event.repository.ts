import { dbNow, getDayRange, parseDateKey, toUTCTimestamp } from '@coongro/datetime';
import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { eq, and, or, ilike, isNull, gte, lte, asc, desc, sql, inArray } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { eventTable } from '../schema/event.js';
import type { EventRow, NewEventRow } from '../schema/event.js';
import type { CalendarEvent } from '../types/event.js';

/** Convierte filtros que llegan como string ISO desde el API a `Date` para Drizzle. */
function asDate(v: string | Date | undefined): Date | undefined {
  return typeof v === 'string' ? new Date(v) : v;
}

/**
 * Normaliza `start_at`/`end_at` que llegan como string ISO desde la accion a
 * `Date`. Drizzle con `mode: 'date'` requiere Date — si le llega un string,
 * falla con `value.toISOString is not a function`. Se usa en create/update
 * para evitar divergencia entre ambos paths.
 */
function coerceEventTimestamps(data: Partial<NewEventRow>): void {
  if (typeof data.start_at === 'string') data.start_at = new Date(data.start_at);
  if (typeof data.end_at === 'string') data.end_at = new Date(data.end_at);
}

/** Mapper boundary: row de DB (Date) → entidad de dominio (UTCTimestamp). */
function toCalendarEvent(row: EventRow): CalendarEvent {
  return {
    ...row,
    start_at: toUTCTimestamp(row.start_at),
    end_at: toUTCTimestamp(row.end_at),
    recurrence_end: row.recurrence_end ? toUTCTimestamp(row.recurrence_end) : null,
    deleted_at: row.deleted_at ? toUTCTimestamp(row.deleted_at) : null,
    created_at: toUTCTimestamp(row.created_at),
    updated_at: toUTCTimestamp(row.updated_at),
  };
}

export interface EventSearchParams {
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
  orderDir?: 'asc' | 'desc';
}

export interface CountResult {
  key: string;
  count: number;
}

export class EventRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  async list(): Promise<CalendarEvent[]> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(eventTable).where(isNull(eventTable.deleted_at))
    );
    return rows.map(toCalendarEvent);
  }

  async getById({ id }: { id: string }): Promise<CalendarEvent | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(eventTable).where(eq(eventTable.id, id)).limit(1)
    );
    return rows[0] ? toCalendarEvent(rows[0]) : undefined;
  }

  async create({ data }: { data: NewEventRow }): Promise<CalendarEvent[]> {
    coerceEventTimestamps(data);
    const row = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
      status: data.status ?? 'scheduled',
      all_day: data.all_day ?? false,
      is_active: data.is_active ?? true,
    };
    const rows = await this.db.ormQuery((tx) => tx.insert(eventTable).values(row).returning());
    return rows.map(toCalendarEvent);
  }

  async update({ id, data }: { id: string; data: Partial<NewEventRow> }): Promise<CalendarEvent[]> {
    coerceEventTimestamps(data);
    const rows = await this.db.ormQuery((tx) =>
      tx
        .update(eventTable)
        .set({ ...data, updated_at: dbNow() } as Partial<EventRow>)
        .where(eq(eventTable.id, id))
        .returning()
    );
    return rows.map(toCalendarEvent);
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) => tx.delete(eventTable).where(eq(eventTable.id, id)));
  }

  async softDelete({ id }: { id: string }): Promise<CalendarEvent[]> {
    const now = dbNow();
    const rows = await this.db.ormQuery((tx) =>
      tx
        .update(eventTable)
        .set({ deleted_at: now, updated_at: now } as Partial<EventRow>)
        .where(eq(eventTable.id, id))
        .returning()
    );
    return rows.map(toCalendarEvent);
  }

  async restore({ id }: { id: string }): Promise<CalendarEvent[]> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .update(eventTable)
        .set({ deleted_at: null, updated_at: dbNow() } as Partial<EventRow>)
        .where(eq(eventTable.id, id))
        .returning()
    );
    return rows.map(toCalendarEvent);
  }

  async search(params: EventSearchParams): Promise<CalendarEvent[]> {
    const {
      query,
      status,
      calendarId,
      calendarIds,
      eventTypeId,
      entityId,
      entityType,
      from,
      to,
      tags: _tags,
      includeDeleted,
      limit,
      offset,
      orderBy = 'start_at',
      orderDir = 'asc',
    } = params;

    const rows = await this.db.ormQuery((tx) => {
      const conditions: SQL[] = [];

      if (!includeDeleted) {
        conditions.push(isNull(eventTable.deleted_at));
      }

      if (query) {
        const pattern = `%${query}%`;
        conditions.push(
          or(
            ilike(eventTable.title, pattern),
            ilike(eventTable.description, pattern),
            ilike(eventTable.notes, pattern)
          )
        );
      }

      if (status) conditions.push(eq(eventTable.status, status));
      if (calendarId) conditions.push(eq(eventTable.calendar_id, calendarId));
      if (calendarIds && calendarIds.length > 0) {
        conditions.push(inArray(eventTable.calendar_id, calendarIds));
      }
      if (eventTypeId) conditions.push(eq(eventTable.event_type_id, eventTypeId));
      if (entityId) conditions.push(eq(eventTable.entity_id, entityId));
      if (entityType) conditions.push(eq(eventTable.entity_type, entityType));
      const fromDate = asDate(from);
      const toDate = asDate(to);
      if (fromDate) conditions.push(gte(eventTable.start_at, fromDate));
      if (toDate) conditions.push(lte(eventTable.start_at, toDate));

      const sortCol =
        orderBy === 'title'
          ? eventTable.title
          : orderBy === 'status'
            ? eventTable.status
            : orderBy === 'end_at'
              ? eventTable.end_at
              : eventTable.start_at;
      const sortFn = orderDir === 'desc' ? desc : asc;

      let q = tx
        .select()
        .from(eventTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(sortFn(sortCol));

      if (limit) q = q.limit(limit) as typeof q;
      if (offset) q = q.offset(offset) as typeof q;

      return q;
    });
    return rows.map(toCalendarEvent);
  }

  async listByDateRange({
    from,
    to,
  }: {
    from: string | Date;
    to: string | Date;
  }): Promise<CalendarEvent[]> {
    const fromDate = asDate(from);
    const toDate = asDate(to);
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select()
        .from(eventTable)
        .where(
          and(
            isNull(eventTable.deleted_at),
            gte(eventTable.start_at, fromDate),
            lte(eventTable.start_at, toDate)
          )
        )
        .orderBy(asc(eventTable.start_at))
    );
    return rows.map(toCalendarEvent);
  }

  async listByDate({ date, tz }: { date: string; tz: string }): Promise<CalendarEvent[]> {
    const { startUTC, endUTC } = getDayRange(parseDateKey(date), tz);
    return this.listByDateRange({ from: startUTC, to: endUTC });
  }

  async listByEntity({
    entityId,
    entityType,
  }: {
    entityId: string;
    entityType: string;
  }): Promise<CalendarEvent[]> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select()
        .from(eventTable)
        .where(
          and(
            isNull(eventTable.deleted_at),
            eq(eventTable.entity_id, entityId),
            eq(eventTable.entity_type, entityType)
          )
        )
        .orderBy(asc(eventTable.start_at))
    );
    return rows.map(toCalendarEvent);
  }

  async listByCalendar({
    calendarId,
    from,
    to,
  }: {
    calendarId: string;
    from?: string;
    to?: string;
  }): Promise<CalendarEvent[]> {
    const rows = await this.db.ormQuery((tx) => {
      const conditions: SQL[] = [
        isNull(eventTable.deleted_at),
        eq(eventTable.calendar_id, calendarId),
      ];
      const fromDate = asDate(from);
      const toDate = asDate(to);
      if (fromDate) conditions.push(gte(eventTable.start_at, fromDate));
      if (toDate) conditions.push(lte(eventTable.start_at, toDate));

      return tx
        .select()
        .from(eventTable)
        .where(and(...conditions))
        .orderBy(asc(eventTable.start_at));
    });
    return rows.map(toCalendarEvent);
  }

  async listUpcoming({
    limit = 10,
    calendarIds,
  }: {
    limit?: number;
    calendarIds?: string[];
  }): Promise<CalendarEvent[]> {
    const now = dbNow();
    const rows = await this.db.ormQuery((tx) => {
      const conditions: SQL[] = [isNull(eventTable.deleted_at), gte(eventTable.start_at, now)];
      if (calendarIds && calendarIds.length > 0) {
        conditions.push(inArray(eventTable.calendar_id, calendarIds));
      }

      return tx
        .select()
        .from(eventTable)
        .where(and(...conditions))
        .orderBy(asc(eventTable.start_at))
        .limit(limit);
    });
    return rows.map(toCalendarEvent);
  }

  async moveEvent({
    id,
    startAt,
    endAt,
  }: {
    id: string;
    startAt: string | Date;
    endAt: string | Date;
  }): Promise<CalendarEvent[]> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .update(eventTable)
        .set({
          start_at: asDate(startAt),
          end_at: asDate(endAt),
          updated_at: dbNow(),
        } as Partial<EventRow>)
        .where(eq(eventTable.id, id))
        .returning()
    );
    return rows.map(toCalendarEvent);
  }

  async countByStatus({ from, to }: { from?: string; to?: string } = {}): Promise<CountResult[]> {
    return this.db.ormQuery((tx) => {
      const conditions: SQL[] = [isNull(eventTable.deleted_at)];
      const fromDate = asDate(from);
      const toDate = asDate(to);
      if (fromDate) conditions.push(gte(eventTable.start_at, fromDate));
      if (toDate) conditions.push(lte(eventTable.start_at, toDate));

      return tx
        .select({
          key: eventTable.status,
          count: sql<number>`count(*)::int`,
        })
        .from(eventTable)
        .where(and(...conditions))
        .groupBy(eventTable.status);
    });
  }

  async countByDate({
    from,
    to,
  }: {
    from: string | Date;
    to: string | Date;
  }): Promise<CountResult[]> {
    const fromDate = asDate(from);
    const toDate = asDate(to);
    return this.db.ormQuery((tx) =>
      tx
        .select({
          key: sql<string>`${eventTable.start_at}::date::text`,
          count: sql<number>`count(*)::int`,
        })
        .from(eventTable)
        .where(
          and(
            isNull(eventTable.deleted_at),
            gte(eventTable.start_at, fromDate),
            lte(eventTable.start_at, toDate)
          )
        )
        .groupBy(sql`${eventTable.start_at}::date`)
    );
  }

  async countByCalendar({ from, to }: { from?: string; to?: string } = {}): Promise<CountResult[]> {
    return this.db.ormQuery((tx) => {
      const conditions: SQL[] = [isNull(eventTable.deleted_at)];
      const fromDate = asDate(from);
      const toDate = asDate(to);
      if (fromDate) conditions.push(gte(eventTable.start_at, fromDate));
      if (toDate) conditions.push(lte(eventTable.start_at, toDate));

      return tx
        .select({
          key: eventTable.calendar_id,
          count: sql<number>`count(*)::int`,
        })
        .from(eventTable)
        .where(and(...conditions))
        .groupBy(eventTable.calendar_id);
    });
  }
}
