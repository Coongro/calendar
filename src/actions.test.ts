import {
  callAction,
  testContext,
  testDatabase,
  type TestDatabase,
} from '@coongro/plugin-sdk/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { calendarActions, eventActions } from './actions.js';

interface EventPage {
  items: Array<{ title: string; start_at: string }>;
  total: number;
}

let db: TestDatabase;
let calendarId: string;

beforeAll(async () => {
  db = await testDatabase({ migrations: new URL('../drizzle/', import.meta.url) });
  const ctx = testContext({ db });
  const calendar = await callAction<{ id: string }>(
    calendarActions.create,
    { data: { name: 'Agenda', color: '#336699' } },
    ctx
  );
  calendarId = calendar.id;
  const events = [
    { title: 'Visita', start_at: '2026-10-01T10:00:00Z', entity_id: 'c1' },
    { title: 'Llamada', start_at: '2026-10-02T10:00:00Z', entity_id: 'c1' },
    { title: 'Reunión', start_at: '2026-10-03T10:00:00Z', entity_id: 'c2' },
  ];
  for (const event of events) {
    await callAction(
      eventActions.create,
      {
        data: {
          ...event,
          end_at: event.start_at,
          calendar_id: calendarId,
          entity_type: 'contact',
        },
      },
      ctx
    );
  }
});
afterAll(() => db.close());

describe('lecturas que exigen el id', () => {
  it('listByEntity sin entidad responde VALIDATION', async () => {
    await expect(
      callAction(eventActions.listByEntity, {}, testContext({ db }))
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('listByCalendar sin calendario responde VALIDATION', async () => {
    await expect(
      callAction(eventActions.listByCalendar, {}, testContext({ db }))
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});

describe('forma canónica', () => {
  it('create devuelve el registro, no un array', async () => {
    const created = await callAction<{ id: string; title: string }>(
      calendarActions.create,
      { data: { name: 'Otra', color: '#000000' } },
      testContext({ db })
    );
    expect(Array.isArray(created)).toBe(false);
    expect(created.id).toBeTruthy();
  });

  it('list pagina del más próximo al más lejano', async () => {
    const page = await callAction<EventPage>(eventActions.list, { limit: 2 }, testContext({ db }));
    expect(page.total).toBe(3);
    expect(page.items.map((e) => e.title)).toEqual(['Visita', 'Llamada']);
  });

  it('search filtra, busca y cuenta', async () => {
    const ctx = testContext({ db });
    const byText = await callAction<EventPage>(eventActions.search, { query: 'llam' }, ctx);
    expect(byText.items.map((e) => e.title)).toEqual(['Llamada']);
    const byRange = await callAction<EventPage>(
      eventActions.search,
      { from: '2026-10-02T00:00:00Z', orderBy: 'start_at', orderDir: 'desc' },
      ctx
    );
    expect(byRange.total).toBe(2);
    expect(byRange.items.map((e) => e.title)).toEqual(['Reunión', 'Llamada']);
  });

  it('listByEntity y listByCalendar responden páginas', async () => {
    const ctx = testContext({ db });
    const byEntity = await callAction<EventPage>(
      eventActions.listByEntity,
      { entityId: 'c1', entityType: 'contact' },
      ctx
    );
    expect(byEntity.total).toBe(2);
    const byCalendar = await callAction<EventPage>(
      eventActions.listByCalendar,
      { calendarId, limit: 1 },
      ctx
    );
    expect(byCalendar).toMatchObject({ total: 3 });
    expect(byCalendar.items).toHaveLength(1);
  });
});
