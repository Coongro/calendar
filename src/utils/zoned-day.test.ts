import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  civilDateOf,
  dateFromKey,
  dayKeyOf,
  dayOnZoneChange,
  groupByDay,
  minutesOfDay,
  timeOfDay,
  todayIn,
} from './zoned-day.js';

const BOGOTA = 'America/Bogota';
const BUENOS_AIRES = 'America/Argentina/Buenos_Aires';
const MADRID = 'Europe/Madrid';

const evt = (id: string, start_at: string) => ({ id, start_at });

/** Simula la zona del navegador: lo que leen `getDate()`, `getHours()` y compañía. */
function useBrowserZone(tz: string): void {
  const previous = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = tz;
  });
  afterAll(() => {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  });
}

describe('negocio en Bogotá, navegador en Buenos Aires', () => {
  useBrowserZone(BUENOS_AIRES);

  // 22:15 del jueves 15/10 en Bogotá (UTC-5) = 03:15Z del 16 = 00:15 del 16 en Buenos Aires.
  const lateInBogota = '2026-10-16T03:15:00.000Z';

  it('el navegador ve el evento el viernes 16 (el bug)', () => {
    expect(new Date(lateInBogota).getDate()).toBe(16);
  });

  it('el evento de las 22:15 queda en el jueves 15', () => {
    expect(dayKeyOf(lateInBogota, BOGOTA)).toBe('2026-10-15');
    const groups = groupByDay([evt('a', lateInBogota)], BOGOTA);
    expect(groups.map(([key]) => key)).toEqual(['2026-10-15']);
  });

  it('el encabezado del grupo dice jueves 15 de octubre', () => {
    const [[key]] = groupByDay([evt('a', lateInBogota)], BOGOTA);
    const header = dateFromKey(key);
    expect(header.getDay()).toBe(4);
    expect(header.getDate()).toBe(15);
    expect(header.getMonth()).toBe(9);
    expect(header.getFullYear()).toBe(2026);
  });

  it('la hora y la posición en la grilla son las de Bogotá', () => {
    expect(minutesOfDay(lateInBogota, BOGOTA)).toBe(22 * 60 + 15);
    expect(timeOfDay(lateInBogota, BOGOTA)).toBe('22:15');
  });

  it('«hoy» es el del negocio aunque en el navegador ya sea mañana', () => {
    const today = todayIn(BOGOTA, new Date(lateInBogota));
    expect(today.getDate()).toBe(15);
  });

  it('el inicio de la semana como instante cae en el lunes del negocio', () => {
    // Lunes 12/10 00:00 en Bogotá = 05:00Z.
    const weekStart = civilDateOf('2026-10-12T05:00:00.000Z', BOGOTA);
    expect(weekStart.getDate()).toBe(12);
    expect(weekStart.getDay()).toBe(1);
  });
});

describe('cruce de medianoche en la otra dirección: negocio al este del navegador', () => {
  useBrowserZone(BOGOTA);

  // 00:30 del viernes 16/10 en Buenos Aires = 03:30Z = 22:30 del jueves 15 en Bogotá.
  const earlyInBuenosAires = '2026-10-16T03:30:00.000Z';

  it('el navegador lo ve el jueves 15, el negocio el viernes 16', () => {
    expect(new Date(earlyInBuenosAires).getDate()).toBe(15);
    expect(dayKeyOf(earlyInBuenosAires, BUENOS_AIRES)).toBe('2026-10-16');
    expect(minutesOfDay(earlyInBuenosAires, BUENOS_AIRES)).toBe(30);
  });

  it('un negocio en Madrid también agrupa por su día', () => {
    // 00:30 del 16/10 en Madrid (UTC+2) = 22:30Z del 15.
    expect(dayKeyOf('2026-10-15T22:30:00.000Z', MADRID)).toBe('2026-10-16');
  });

  it('el inicio de la semana del negocio no retrocede a la semana anterior', () => {
    // Lunes 12/10 00:00 en Buenos Aires = 03:00Z = domingo 11 a las 22:00 en Bogotá.
    expect(new Date('2026-10-12T03:00:00.000Z').getDate()).toBe(11);
    const weekStart = civilDateOf('2026-10-12T03:00:00.000Z', BUENOS_AIRES);
    expect(weekStart.getDate()).toBe(12);
    expect(weekStart.getDay()).toBe(1);
  });

  it('una clave YYYY-MM-DD se toma tal cual (no como medianoche UTC)', () => {
    expect(new Date('2026-10-15').getDate()).toBe(14);
    expect(civilDateOf('2026-10-15', BUENOS_AIRES).getDate()).toBe(15);
    expect(dateFromKey('2026-10-15').getDate()).toBe(15);
  });
});

describe('navegador y negocio en la misma zona', () => {
  useBrowserZone(BUENOS_AIRES);

  it('no cambia nada respecto de la zona del navegador', () => {
    const iso = '2026-10-16T01:15:00.000Z'; // 22:15 del 15 en Buenos Aires
    const browser = new Date(iso);
    expect(dayKeyOf(iso, BUENOS_AIRES)).toBe('2026-10-15');
    expect(browser.getDate()).toBe(15);
    expect(minutesOfDay(iso, BUENOS_AIRES)).toBe(browser.getHours() * 60 + browser.getMinutes());
  });
});

describe('groupByDay', () => {
  it('ordena los días y los eventos de cada día', () => {
    const groups = groupByDay(
      [
        evt('c', '2026-10-16T15:00:00.000Z'),
        evt('b', '2026-10-15T20:00:00.000Z'),
        evt('a', '2026-10-15T12:00:00.000Z'),
      ],
      BOGOTA
    );
    expect(groups.map(([key, list]) => [key, list.map((e) => e.id)])).toEqual([
      ['2026-10-15', ['a', 'b']],
      ['2026-10-16', ['c']],
    ]);
  });

  it('sin eventos no hay grupos', () => {
    expect(groupByDay([], BOGOTA)).toEqual([]);
  });
});

describe('la zona del negocio llega después del primer render', () => {
  useBrowserZone(BUENOS_AIRES);

  // 6/10 23:30 en Buenos Aires = 7/10 11:30 en Tokio: el «hoy» del negocio ya es el 7.
  const now = new Date('2026-10-07T02:30:00.000Z');
  const TOKYO = 'Asia/Tokyo';

  it('sin día pedido ni navegación: pasa al «hoy» de la zona que llegó', () => {
    const first = todayIn(BUENOS_AIRES, now);
    expect(first.getDate()).toBe(6);
    const next = dayOnZoneChange(first, TOKYO, { pinned: false, now });
    expect(next.getDate()).toBe(7);
  });

  it('con un día pedido o después de navegar: se queda donde está', () => {
    const chosen = dateFromKey('2026-10-15');
    expect(dayOnZoneChange(chosen, TOKYO, { pinned: true, now })).toBe(chosen);
  });

  it('si el «hoy» no cambia, devuelve el mismo Date (no re-renderiza)', () => {
    const today = todayIn(TOKYO, now);
    expect(dayOnZoneChange(today, TOKYO, { pinned: false, now })).toBe(today);
  });
});
