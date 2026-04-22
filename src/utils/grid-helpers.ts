/**
 * Helpers compartidos para las grillas de calendario.
 * Centraliza logica de now-line, posicionamiento de eventos y agrupacion por dia.
 */
import { getHostReact } from '@coongro/plugin-sdk';

import { TOKENS } from '../styles/tokens.js';
import type { CalendarEvent } from '../types/event.js';

import { diffMinutes, toDateString } from './date.js';
import { NOW_LINE_Z } from './grid-constants.js';

// ── Now position ──

export interface NowPosition {
  nowHour: number;
  nowTimeStr: string;
  gridStartMin: number;
  gridEndMin: number;
  nowInRange: boolean;
  nowTop: number;
}

/** Calcula la posicion vertical de la linea "ahora" en una grilla horaria. */
export function computeNowPosition(
  startHour: number,
  endHour: number,
  slotDuration: number,
  slotHeight: number
): NowPosition {
  const now = new Date();
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const nowMinutes = nowHour * 60 + nowMinute;
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
  slotHeight: number
): EventPosition | null {
  const evtStart = new Date(evt.start_at);
  const evtStartMin = evtStart.getHours() * 60 + evtStart.getMinutes();
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

/** Agrupa eventos por fecha (yyyy-mm-dd). */
export function groupEventsByDay(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {};
  for (const evt of events) {
    const key = toDateString(new Date(evt.start_at));
    if (!map[key]) map[key] = [];
    map[key].push(evt);
  }
  return map;
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderNowLine(nowTop: number): any {
  const React = getHostReact();
  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute',
        left: '0',
        right: '0',
        top: `${nowTop}px`,
        display: 'flex',
        alignItems: 'center',
        zIndex: String(NOW_LINE_Z),
        pointerEvents: 'none',
      },
    },
    // Flecha triangular gold
    React.createElement('div', {
      style: {
        width: '0',
        height: '0',
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderLeft: `8px solid ${TOKENS.gold}`,
        marginLeft: '-2px',
        flexShrink: '0',
      },
    }),
    // Linea gold
    React.createElement('div', {
      style: {
        flex: '1',
        height: '2px',
        background: TOKENS.gold,
      },
    })
  );
}
