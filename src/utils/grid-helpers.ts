/**
 * Helpers compartidos para las grillas de calendario.
 * Centraliza logica de now-line, posicionamiento de eventos y agrupacion por dia.
 */
import { getHostReact } from '@coongro/plugin-sdk';

import type { CalendarEvent } from '../types/event.js';

import { diffMinutes, toDateString } from './date.js';
import { NOW_LINE_Z } from './grid-constants.js';

// ── Now position ──

export interface NowPosition {
  nowMinutes: number;
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
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const gridStartMin = startHour * 60;
  const gridEndMin = endHour * 60;
  const nowInRange = nowMinutes >= gridStartMin && nowMinutes < gridEndMin;
  const nowTop = nowInRange ? ((nowMinutes - gridStartMin) / slotDuration) * slotHeight : -1;
  return { nowMinutes, gridStartMin, gridEndMin, nowInRange, nowTop };
}

// ── Event positioning ──

export interface EventPosition {
  topOffset: number;
  height: number;
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

  const topOffset = ((evtStartMin - gridStartMin) / slotDuration) * slotHeight;
  const duration = diffMinutes(evt.start_at, evt.end_at);
  const height = (duration / slotDuration) * slotHeight;
  return { topOffset, height };
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

// ── NowLine component ──

const TOKENS_GOLD = 'var(--cg-accent)';

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
        borderLeft: `8px solid ${TOKENS_GOLD}`,
        marginLeft: '-2px',
        flexShrink: '0',
      },
    }),
    // Linea gold
    React.createElement('div', {
      style: {
        flex: '1',
        height: '2px',
        background: TOKENS_GOLD,
      },
    })
  );
}
