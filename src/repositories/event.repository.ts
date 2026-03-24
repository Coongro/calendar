import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { eq, and, or, ilike, isNull, gte, lte, asc, desc, sql, inArray } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { eventTable } from '../schema/event.js';
import type { EventRow, NewEventRow } from '../schema/event.js';

export interface EventSearchParams {
  query?: string;
  status?: string;
  calendarId?: string;
  calendarIds?: string[];
  eventTypeId?: string;
  entityId?: string;
  entityType?: string;
  from?: string;
  to?: string;
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

  async list(): Promise<EventRow[]> {
    return this.db.ormQuery((tx) =>
      tx.select().from(eventTable).where(isNull(eventTable.deleted_at))
    );
  }

  async getById({ id }: { id: string }): Promise<EventRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(eventTable).where(eq(eventTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewEventRow }): Promise<EventRow[]> {
    const row = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
      status: data.status ?? 'scheduled',
      all_day: data.all_day ?? false,
      is_active: data.is_active ?? true,
    };
    return this.db.ormQuery((tx) => tx.insert(eventTable).values(row).returning());
  }

  async update({ id, data }: { id: string; data: Partial<NewEventRow> }): Promise<EventRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(eventTable)
        .set({ ...data, updated_at: new Date().toISOString() } as Partial<EventRow>)
        .where(eq(eventTable.id, id))
        .returning()
    );
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) => tx.delete(eventTable).where(eq(eventTable.id, id)));
  }

  async softDelete({ id }: { id: string }): Promise<EventRow[]> {
    const now = new Date().toISOString();
    return this.db.ormQuery((tx) =>
      tx
        .update(eventTable)
        .set({ deleted_at: now, updated_at: now } as Partial<EventRow>)
        .where(eq(eventTable.id, id))
        .returning()
    );
  }

  async restore({ id }: { id: string }): Promise<EventRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(eventTable)
        .set({ deleted_at: null, updated_at: new Date().toISOString() } as Partial<EventRow>)
        .where(eq(eventTable.id, id))
        .returning()
    );
  }

  async search(params: EventSearchParams): Promise<EventRow[]> {
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

    return this.db.ormQuery((tx) => {
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
      if (from) conditions.push(gte(eventTable.start_at, from));
      if (to) conditions.push(lte(eventTable.start_at, to));

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
  }

  async listByDateRange({ from, to }: { from: string; to: string }): Promise<EventRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .select()
        .from(eventTable)
        .where(
          and(
            isNull(eventTable.deleted_at),
            gte(eventTable.start_at, from),
            lte(eventTable.start_at, to)
          )
        )
        .orderBy(asc(eventTable.start_at))
    );
  }

  async listByDate({ date }: { date: string }): Promise<EventRow[]> {
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd = `${date}T23:59:59.999Z`;
    return this.listByDateRange({ from: dayStart, to: dayEnd });
  }

  async listByEntity({
    entityId,
    entityType,
  }: {
    entityId: string;
    entityType: string;
  }): Promise<EventRow[]> {
    return this.db.ormQuery((tx) =>
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
  }

  async listByCalendar({
    calendarId,
    from,
    to,
  }: {
    calendarId: string;
    from?: string;
    to?: string;
  }): Promise<EventRow[]> {
    return this.db.ormQuery((tx) => {
      const conditions: SQL[] = [
        isNull(eventTable.deleted_at),
        eq(eventTable.calendar_id, calendarId),
      ];
      if (from) conditions.push(gte(eventTable.start_at, from));
      if (to) conditions.push(lte(eventTable.start_at, to));

      return tx
        .select()
        .from(eventTable)
        .where(and(...conditions))
        .orderBy(asc(eventTable.start_at));
    });
  }

  async listUpcoming({
    limit = 10,
    calendarIds,
  }: {
    limit?: number;
    calendarIds?: string[];
  }): Promise<EventRow[]> {
    const now = new Date().toISOString();
    return this.db.ormQuery((tx) => {
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
  }

  async findConflicts({
    startAt,
    endAt,
    excludeId,
  }: {
    startAt: string;
    endAt: string;
    excludeId?: string;
  }): Promise<EventRow[]> {
    return this.db.ormQuery((tx) => {
      const conditions: SQL[] = [
        isNull(eventTable.deleted_at),
        // Solapamiento: evento existente empieza antes de que termine el nuevo Y termina después de que empiece
        lte(eventTable.start_at, endAt),
        gte(eventTable.end_at, startAt),
      ];

      if (excludeId) {
        conditions.push(sql`${eventTable.id} != ${excludeId}`);
      }

      return tx
        .select()
        .from(eventTable)
        .where(and(...conditions))
        .orderBy(asc(eventTable.start_at));
    });
  }

  async moveEvent({
    id,
    startAt,
    endAt,
  }: {
    id: string;
    startAt: string;
    endAt: string;
  }): Promise<EventRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(eventTable)
        .set({
          start_at: startAt,
          end_at: endAt,
          updated_at: new Date().toISOString(),
        } as Partial<EventRow>)
        .where(eq(eventTable.id, id))
        .returning()
    );
  }

  async countByStatus({ from, to }: { from?: string; to?: string } = {}): Promise<CountResult[]> {
    return this.db.ormQuery((tx) => {
      const conditions: SQL[] = [isNull(eventTable.deleted_at)];
      if (from) conditions.push(gte(eventTable.start_at, from));
      if (to) conditions.push(lte(eventTable.start_at, to));

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

  async countByDate({ from, to }: { from: string; to: string }): Promise<CountResult[]> {
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
            gte(eventTable.start_at, from),
            lte(eventTable.start_at, to)
          )
        )
        .groupBy(sql`${eventTable.start_at}::date`)
    );
  }

  async countByCalendar({ from, to }: { from?: string; to?: string } = {}): Promise<CountResult[]> {
    return this.db.ormQuery((tx) => {
      const conditions: SQL[] = [isNull(eventTable.deleted_at)];
      if (from) conditions.push(gte(eventTable.start_at, from));
      if (to) conditions.push(lte(eventTable.start_at, to));

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
