import { dbNow } from '@coongro/datetime';
import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { eq, and, or, ilike, isNull } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { eventTypeTable } from '../schema/event-type.js';
import type { EventTypeRow, NewEventTypeRow } from '../schema/event-type.js';

export class EventTypeRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  async list(): Promise<EventTypeRow[]> {
    return this.db.ormQuery((tx) =>
      tx.select().from(eventTypeTable).where(isNull(eventTypeTable.deleted_at))
    );
  }

  async getById({ id }: { id: string }): Promise<EventTypeRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(eventTypeTable).where(eq(eventTypeTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewEventTypeRow }): Promise<EventTypeRow[]> {
    const row = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
    };
    return this.db.ormQuery((tx) => tx.insert(eventTypeTable).values(row).returning());
  }

  async update({
    id,
    data,
  }: {
    id: string;
    data: Partial<NewEventTypeRow>;
  }): Promise<EventTypeRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(eventTypeTable)
        .set({ ...data, updated_at: dbNow() } as Partial<EventTypeRow>)
        .where(eq(eventTypeTable.id, id))
        .returning()
    );
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) => tx.delete(eventTypeTable).where(eq(eventTypeTable.id, id)));
  }

  async softDelete({ id }: { id: string }): Promise<EventTypeRow[]> {
    const now = dbNow();
    return this.db.ormQuery((tx) =>
      tx
        .update(eventTypeTable)
        .set({ deleted_at: now, updated_at: now } as Partial<EventTypeRow>)
        .where(eq(eventTypeTable.id, id))
        .returning()
    );
  }

  async restore({ id }: { id: string }): Promise<EventTypeRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(eventTypeTable)
        .set({ deleted_at: null, updated_at: dbNow() } as Partial<EventTypeRow>)
        .where(eq(eventTypeTable.id, id))
        .returning()
    );
  }

  async search({
    query,
    includeDeleted,
  }: {
    query?: string;
    includeDeleted?: boolean;
  }): Promise<EventTypeRow[]> {
    return this.db.ormQuery((tx) => {
      const conditions: (SQL | undefined)[] = [];

      if (!includeDeleted) {
        conditions.push(isNull(eventTypeTable.deleted_at));
      }

      if (query) {
        const pattern = `%${query}%`;
        conditions.push(
          or(ilike(eventTypeTable.name, pattern), ilike(eventTypeTable.description, pattern))
        );
      }

      return tx
        .select()
        .from(eventTypeTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
    });
  }
}
