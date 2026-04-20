/**
 * Helpers de fecha/hora para el calendario.
 * Wrappers sobre `@coongro/datetime` que aceptan tanto branded como string crudo
 * (cast confiado en este boundary). `tz` siempre requerido.
 */

import {
  addMinutes as addMinutesCore,
  asUTCTimestamp,
  diffMinutes as diffMinutesCore,
  formatLocalDate,
  formatLocalDateTime,
  formatLocalTime,
  isSameDay as isSameDayCore,
  toDateKey,
  type DateKey,
  type UTCTimestamp,
} from '@coongro/datetime';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const SHORT_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

type DateLike = string | Date | UTCTimestamp;

function asTs(value: DateLike): UTCTimestamp | Date {
  if (typeof value === 'string') return asUTCTimestamp(value);
  return value;
}

export function formatEventDate(value: DateLike, tz: string): string {
  return formatLocalDate(asTs(value), tz);
}

export function formatEventTime(value: DateLike, tz: string): string {
  return formatLocalTime(asTs(value), tz);
}

export function formatEventDateTime(value: DateLike, tz: string): string {
  return formatLocalDateTime(asTs(value), tz);
}

export function getDayName(date: Date): string {
  return DAYS[date.getDay()];
}

export function getShortDayName(date: Date): string {
  return SHORT_DAYS[date.getDay()];
}

export function getMonthName(month: number): string {
  return MONTHS[month];
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getWeekDays(date: Date): Date[] {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function getMonthStart(year: number, month: number): Date {
  return new Date(year, month, 1);
}

export function getMonthEnd(year: number, month: number): Date {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

export function getMonthGridDays(year: number, month: number): Date[] {
  const firstDay = getMonthStart(year, month);
  const lastDay = getMonthEnd(year, month);
  const start = getWeekStart(firstDay);
  const endDay = lastDay.getDay();
  const end = new Date(lastDay);
  if (endDay !== 0) {
    end.setDate(end.getDate() + (7 - endDay));
  }
  const days: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function generateTimeSlots(startHour: number, endHour: number, step: number): string[] {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += step) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

/** Formato `YYYY-MM-DD` brandeado como `DateKey`. */
export function toDateString(date: Date): DateKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as DateKey;
}

/** Compara día en el timezone del tenant. */
export function isSameDay(a: DateLike, b: DateLike, tz: string): boolean {
  return isSameDayCore(asTs(a), asTs(b), tz);
}

export function diffMinutes(start: DateLike, end: DateLike): number {
  return diffMinutesCore(asTs(start), asTs(end));
}

export function addMinutes(value: DateLike, minutes: number): UTCTimestamp {
  return addMinutesCore(asTs(value), minutes);
}

export { toDateKey };
