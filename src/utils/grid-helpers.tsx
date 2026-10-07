import type { ReactElement } from 'react';

import { TOKENS } from '../styles/tokens.js';
import type { CalendarEvent } from '../types/event.js';

import { diffMinutes } from './date.js';
import { NOW_LINE_Z } from './grid-constants.js';
import { groupByDay, minutesOfDay } from './zoned-day.js';

// ── Now position ──

export interface NowPosition {
  nowHour: number;
  nowTimeStr: string;
  gridStartMin: number;
  gridEndMin: number;
  nowInRange: boolean;
  nowTop: number;
}

/** Calcula la posicion vertical de la linea "ahora" en una grilla horaria (hora del negocio). */
export function computeNowPosition(
  startHour: number,
  endHour: number,
  slotDuration: number,
  slotHeight: number,
  tz: string
): NowPosition {
  const nowMinutes = minutesOfDay(new Date(), tz);
  const nowHour = Math.floor(nowMinutes / 60);
  const nowMinute = nowMinutes % 60;
  const gridStartMin = startHour * 60;
  const gridEndMin = endHour * 60;
  const nowInRange = nowMinutes >= gridStartMin && nowMinutes < gridEndMin;
  const nowTop = nowInRange ? ((nowMinutes - gridStartMin) / slotDuration) * slotHeight : -1;
  const nowTimeStr = `${String(nowHour).padStart(2, '0')}:${String(nowMinute).padStart(2, '0')}`;
  return { nowHour, nowTimeStr, gridStartMin, gridEndMin, nowInRange, nowTop };
}

// ── Event positioning ──

export interface EventPosition {
  topOffset: number;
  height: number;
}

/**
 * Calcula top y height a partir de un rango de minutos-del-dia.
 * Si el rango cae totalmente fuera de la grilla visible retorna null.
 * Recorta el rango al rango visible cuando se solapa parcialmente, asi
 * un elemento cuyo end cae mas alla de endHour sigue visible hasta el borde.
 */
export function computeVerticalPosition(
  startMin: number,
  endMin: number,
  gridStartMin: number,
  gridEndMin: number,
  slotDuration: number,
  slotHeight: number
): EventPosition | null {
  if (startMin >= gridEndMin || endMin <= gridStartMin) return null;
  const clampedStart = Math.max(startMin, gridStartMin);
  const clampedEnd = Math.min(endMin, gridEndMin);
  const topOffset = ((clampedStart - gridStartMin) / slotDuration) * slotHeight;
  const height = ((clampedEnd - clampedStart) / slotDuration) * slotHeight;
  return { topOffset, height };
}

/**
 * Calcula top y height de un evento dentro de la grilla.
 * Retorna null si el evento esta fuera del rango visible.
 */
export function computeEventPosition(
  evt: CalendarEvent,
  gridStartMin: number,
  gridEndMin: number,
  slotDuration: number,
  slotHeight: number,
  tz: string
): EventPosition | null {
  const evtStartMin = minutesOfDay(evt.start_at, tz);
  if (evtStartMin < gridStartMin || evtStartMin >= gridEndMin) return null;
  const duration = diffMinutes(evt.start_at, evt.end_at);
  return computeVerticalPosition(
    evtStartMin,
    evtStartMin + duration,
    gridStartMin,
    gridEndMin,
    slotDuration,
    slotHeight
  );
}

// ── Events by day ──

/** Agrupa eventos por el día (yyyy-mm-dd) en que empiezan en la zona del negocio. */
export function groupEventsByDay(
  events: CalendarEvent[],
  tz: string
): Record<string, CalendarEvent[]> {
  return Object.fromEntries(groupByDay(events, tz));
}

// ── Day header style helpers ──

/** Resuelve el color de fondo de un header o columna de dia. */
export function dayBackground(isToday: boolean, isWeekend: boolean): string {
  if (isToday) return TOKENS.goldLt;
  if (isWeekend) return TOKENS.bg;
  return TOKENS.surface;
}

/** Resuelve el color de fondo de una columna de dia en la grilla (sutil). */
export function dayColumnBackground(isToday: boolean, isWeekend: boolean): string | undefined {
  if (isToday) return 'color-mix(in srgb, var(--cg-accent) 3%, transparent)';
  if (isWeekend) return TOKENS.bg;
  return undefined;
}

/** Resuelve el color de texto del nombre del dia. */
export function dayNameColor(isToday: boolean, isWeekend: boolean): string {
  if (isToday) return TOKENS.goldHover;
  if (isWeekend) return TOKENS.ink4;
  return TOKENS.ink3;
}

/** Resuelve el color y peso del numero del dia. */
export function dayNumberStyles(
  isToday: boolean,
  isWeekend: boolean
): { color: string; fontWeight: string } {
  if (isToday) return { color: TOKENS.ink, fontWeight: '900' };
  if (isWeekend) return { color: TOKENS.ink4, fontWeight: '400' };
  return { color: TOKENS.ink3, fontWeight: '700' };
}

// ── NowLine component ──

/** Renderiza la linea gold de "ahora" (triangulo + linea horizontal). */
export function renderNowLine(nowTop: number): ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        left: '0',
        right: '0',
        top: `${nowTop}px`,
        display: 'flex',
        alignItems: 'center',
        zIndex: String(NOW_LINE_Z),
        pointerEvents: 'none',
      }}
    >
      {/* Flecha triangular gold */}
      <div
        style={{
          width: '0',
          height: '0',
          borderTop: '5px solid transparent',
          borderBottom: '5px solid transparent',
          borderLeft: `8px solid ${TOKENS.gold}`,
          marginLeft: '-2px',
          flexShrink: '0',
        }}
      />
      {/* Linea gold */}
      <div
        style={{
          flex: '1',
          height: '2px',
          background: TOKENS.gold,
        }}
      />
    </div>
  );
}
