import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { eq, and, isNull } from 'drizzle-orm';

import { calendarTable } from '../schema/calendar.js';
import type { CalendarRow, NewCalendarRow } from '../schema/calendar.js';

export class CalendarRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  async list(): Promise<CalendarRow[]> {
    return this.db.ormQuery((tx) =>
      tx.select().from(calendarTable).where(isNull(calendarTable.deleted_at))
    );
  }

  async getById({ id }: { id: string }): Promise<CalendarRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(calendarTable).where(eq(calendarTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewCalendarRow }): Promise<CalendarRow[]> {
    const row = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
      is_visible: data.is_visible ?? true,
      is_default: data.is_default ?? false,
    };
    return this.db.ormQuery((tx) => tx.insert(calendarTable).values(row).returning());
  }

  async update({
    id,
    data,
  }: {
    id: string;
    data: Partial<NewCalendarRow>;
  }): Promise<CalendarRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(calendarTable)
        .set({ ...data, updated_at: new Date().toISOString() } as Partial<CalendarRow>)
        .where(eq(calendarTable.id, id))
        .returning()
    );
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) => tx.delete(calendarTable).where(eq(calendarTable.id, id)));
  }

  async softDelete({ id }: { id: string }): Promise<CalendarRow[]> {
    const now = new Date().toISOString();
    return this.db.ormQuery((tx) =>
      tx
        .update(calendarTable)
        .set({ deleted_at: now, updated_at: now } as Partial<CalendarRow>)
        .where(eq(calendarTable.id, id))
        .returning()
    );
  }

  async restore({ id }: { id: string }): Promise<CalendarRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(calendarTable)
        .set({ deleted_at: null, updated_at: new Date().toISOString() } as Partial<CalendarRow>)
        .where(eq(calendarTable.id, id))
        .returning()
    );
  }

  async toggleVisibility({ id }: { id: string }): Promise<CalendarRow[]> {
    const existing = await this.getById({ id });
    if (!existing) return [];
    return this.db.ormQuery((tx) =>
      tx
        .update(calendarTable)
        .set({
          is_visible: !existing.is_visible,
          updated_at: new Date().toISOString(),
        } as Partial<CalendarRow>)
        .where(eq(calendarTable.id, id))
        .returning()
    );
  }

  async getDefault(): Promise<CalendarRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select()
        .from(calendarTable)
        .where(and(eq(calendarTable.is_default, true), isNull(calendarTable.deleted_at)))
        .limit(1)
    );
    return rows[0];
  }
}
