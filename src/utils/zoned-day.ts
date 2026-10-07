/**
 * Día y hora de un instante en la zona del negocio (`core.timezone`), no en la del navegador.
 *
 * Convención de las grillas: los `Date` de los días (columnas, celdas del mes) son
 * portadores de una fecha civil en la zona del navegador (medianoche local), y de ellos solo
 * se leen año, mes, día y día de semana. Un instante (`start_at`, «ahora», el inicio de un
 * rango) nunca se convierte a día con `getDate()`/`getHours()`: pasa por acá con la zona.
 */

import { toDateKey, utcToLocal, type DateKey } from '@coongro/datetime';

export type Instant = string | Date;

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

function asDate(value: Instant): Date {
  return typeof value === 'string' ? new Date(value) : value;
}

/** Día (`YYYY-MM-DD`) en que cae el instante en la zona `tz`. */
export function dayKeyOf(value: Instant, tz: string): DateKey {
  return toDateKey(asDate(value), tz);
}

/** Minutos desde la medianoche del instante en la zona `tz` (22:15 → 1335). */
export function minutesOfDay(value: Instant, tz: string): number {
  const local = utcToLocal(asDate(value), tz);
  return local.hour * 60 + local.minute;
}

/** Hora `HH:MM` (24 h) del instante en la zona `tz`. */
export function timeOfDay(value: Instant, tz: string): string {
  const minutes = minutesOfDay(value, tz);
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/** Portador local (medianoche del navegador) de la fecha civil `YYYY-MM-DD`. */
export function dateFromKey(key: string): Date {
  const [y, m, d] = key.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Portador local de una fecha que llega como clave (`YYYY-MM-DD`, se toma tal cual) o como
 * instante ISO (se toma el día en que cae en la zona `tz`). Nunca `new Date('YYYY-MM-DD')`:
 * eso es medianoche UTC y al oeste de Greenwich cae el día anterior.
 */
export function civilDateOf(value: string, tz: string): Date {
  return dateFromKey(DATE_KEY.test(value) ? value : dayKeyOf(value, tz));
}

/** Portador local de «hoy» en la zona `tz`. */
export function todayIn(tz: string, now: Date = new Date()): Date {
  return dateFromKey(dayKeyOf(now, tz));
}

/**
 * El día que muestra el calendario cuando cambia la zona del negocio (al cargar los
 * ajustes llega la de verdad y la primera era la de por defecto). Si se abrió en un
 * día pedido (`initialDate`) o el usuario ya navegó, se queda donde está; si no, va al
 * «hoy» de esa zona.
 */
export function dayOnZoneChange(
  current: Date,
  tz: string,
  { pinned, now = new Date() }: { pinned: boolean; now?: Date }
): Date {
  if (pinned) return current;
  const today = todayIn(tz, now);
  return today.getTime() === current.getTime() ? current : today;
}

/**
 * Agrupa los eventos por el día en que empiezan en la zona `tz`, en orden cronológico
 * (los días y los eventos de cada día).
 */
export function groupByDay<T extends { start_at: string }>(
  events: readonly T[],
  tz: string
): Array<[DateKey, T[]]> {
  const sorted = [...events].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
  );
  const map = new Map<DateKey, T[]>();
  for (const evt of sorted) {
    const key = dayKeyOf(evt.start_at, tz);
    const list = map.get(key);
    if (list) list.push(evt);
    else map.set(key, [evt]);
  }
  return [...map.entries()];
}
