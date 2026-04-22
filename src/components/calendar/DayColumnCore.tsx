/**
 * DayColumnCore — El "interior" de una columna de dia en la grilla.
 *
 * Centraliza la logica compartida por Day, Week y ThreeDay views:
 *   - Filas horarias con onClick (slot vacio)
 *   - Linea "ahora" (cuando aplica)
 *   - Layout de eventos solapados (sweep-line + column packing) con chip "+N"
 *
 * El consumidor (DayColumn / WeekGrid / ThreeDayGrid) arma la grilla completa
 * (time gutter, day headers, border-right entre columnas, etc.) y monta UN
 * <DayColumnCore> por cada dia. Asi el algoritmo de solapamiento vive en un
 * unico lugar y las 3 vistas se benefician sin duplicacion.
 */
import { getHostReact } from '@coongro/plugin-sdk';
import type { ReactNode } from 'react';

import { TOKENS } from '../../styles/tokens.js';
import type { EventRenderContext } from '../../types/components.js';
import type { CalendarEvent } from '../../types/event.js';
import { toDateString } from '../../utils/date.js';
import { layoutOverlappingEvents, getColumnBox } from '../../utils/event-layout.js';
import { EVENT_Z } from '../../utils/grid-constants.js';
import {
  computeEventPosition,
  computeVerticalPosition,
  renderNowLine,
} from '../../utils/grid-helpers.js';
import { EventCard } from '../event/EventCard.js';
import { EventOverflowChip } from '../event/EventOverflowChip.js';

const React = getHostReact();
const { useMemo } = React;

const COMPACT_HEIGHT_PX = 46;
const DEFAULT_MAX_COLUMNS = 4;
const COLUMN_GAP_PX = 2;

export interface DayColumnCoreProps {
  /** Fecha del dia (YYYY-MM-DD). */
  date: string;
  events: CalendarEvent[];
  timeSlots: string[];
  slotDuration: number;
  slotHeight: number;
  gridStartMin: number;
  gridEndMin: number;
  isToday: boolean;
  nowInRange: boolean;
  nowTop: number;

  /** Maximo de columnas visibles en un cluster antes de emitir "+N". Default: 4. */
  maxColumns?: number;
  /** Variante de EventCard cuando no se pasa renderEvent. Default: 'standard'. */
  defaultVariant?: 'standard' | 'week';
  /** Padding lateral (px) entre el borde de la columna y los eventos. Default: 4. */
  sidePadding?: number;
  /**
   * Border-bottom de cada slot. Si es string, aplica a todos. Si es funcion,
   * recibe el indice del slot y cuantos slots hay por hora (para distinguir
   * borde de hora vs borde de media hora). Default: 1px solido del token --cg-border.
   */
  slotBorder?: string | ((slotIndex: number, slotsPerHour: number) => string);

  renderEvent?: (event: CalendarEvent, context: EventRenderContext) => ReactNode;
  onEventClick?: (event: CalendarEvent) => void;
  /** Click en un slot vacio. hour en decimal (9.5 = 09:30). */
  onSlotClick?: (date: string, hour: number) => void;
  onClusterOverflowClick?: (events: CalendarEvent[]) => void;
}

export function DayColumnCore({
  date,
  events,
  timeSlots,
  slotDuration,
  slotHeight,
  gridStartMin,
  gridEndMin,
  isToday,
  nowInRange,
  nowTop,
  maxColumns = DEFAULT_MAX_COLUMNS,
  defaultVariant = 'standard',
  sidePadding = 4,
  slotBorder,
  renderEvent,
  onEventClick,
  onSlotClick,
  onClusterOverflowClick,
}: DayColumnCoreProps) {
  const layout = useMemo(
    () => layoutOverlappingEvents(events, { maxColumns }),
    [events, maxColumns]
  );

  const slotsPerHour = Math.round(60 / slotDuration);
  const resolveSlotBorder = (i: number): string => {
    if (typeof slotBorder === 'function') return slotBorder(i, slotsPerHour);
    return slotBorder ?? `1px solid ${TOKENS.border}`;
  };

  return React.createElement(
    React.Fragment,
    null,

    // Filas horarias (fondo + onClick de slot vacio)
    ...timeSlots.map((slot, i) =>
      React.createElement('div', {
        key: `slot-${slot}`,
        style: {
          height: `${slotHeight}px`,
          borderBottom: resolveSlotBorder(i),
          cursor: onSlotClick ? 'pointer' : 'default',
        },
        onClick: onSlotClick
          ? () => {
              const [h, m] = slot.split(':').map(Number);
              onSlotClick(date, h + m / 60);
            }
          : undefined,
      })
    ),

    // Linea "ahora"
    isToday && nowInRange && renderNowLine(nowTop),

    // Eventos
    ...layout.slots
      .map((slot) => {
        const pos = computeEventPosition(
          slot.event,
          gridStartMin,
          gridEndMin,
          slotDuration,
          slotHeight
        );
        if (!pos) return null;

        const renderedHeight = Math.max(slotHeight / 2, pos.height);
        const isNarrow = slot.columnCount > 1;
        const isLowCompact = renderedHeight < COMPACT_HEIGHT_PX;
        // En clusters de 3+ cols forzamos compact para que entre el titulo
        const effectiveCompact = isLowCompact || slot.columnCount >= 3;
        const variant: EventRenderContext['variant'] = effectiveCompact
          ? 'compact'
          : defaultVariant;

        const columnStyle = computeColumnStyle(slot.columnIndex, slot.columnCount, sidePadding);

        return React.createElement(
          'div',
          {
            key: slot.event.id,
            style: {
              position: 'absolute' as const,
              zIndex: String(EVENT_Z),
              top: `${Math.max(0, pos.topOffset)}px`,
              height: `${renderedHeight}px`,
              ...columnStyle,
            },
          },
          renderEvent
            ? renderEvent(slot.event, { variant, height: renderedHeight })
            : React.createElement(EventCard, {
                event: slot.event,
                variant,
                showTime: true,
                showStatus: !effectiveCompact && !isNarrow,
                showLocation: !effectiveCompact && !isNarrow,
                onClick: onEventClick,
              })
        );
      })
      .filter(Boolean),

    // Overflow chips ("+N")
    ...layout.overflows.map((ov) => {
      const pos = overflowPosition(
        ov.startMs,
        ov.endMs,
        date,
        gridStartMin,
        gridEndMin,
        slotDuration,
        slotHeight
      );
      if (!pos) return null;

      const columnStyle = computeColumnStyle(ov.columnIndex, ov.columnCount, sidePadding);

      return React.createElement(
        'div',
        {
          key: `ov-${ov.clusterId}`,
          style: {
            position: 'absolute' as const,
            zIndex: String(EVENT_Z + 1),
            top: `${Math.max(0, pos.topOffset)}px`,
            height: `${Math.max(slotHeight / 2, pos.height)}px`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '4px 2px',
            ...columnStyle,
          },
        },
        React.createElement(EventOverflowChip, {
          events: ov.events,
          onEventClick,
          onOverride: onClusterOverflowClick,
        })
      );
    })
  );
}

/** Posicion horizontal (left/width) dentro de la columna del dia. */
function computeColumnStyle(
  columnIndex: number,
  columnCount: number,
  sidePadding: number
): { left: string; width: string } {
  const box = getColumnBox(columnIndex, columnCount);
  const isFirst = columnIndex === 0;
  const isLast = columnIndex === columnCount - 1;
  const leftPad = isFirst ? sidePadding : COLUMN_GAP_PX / 2;
  const rightPad = isLast ? sidePadding : COLUMN_GAP_PX / 2;
  return {
    left: `calc(${box.leftPct}% + ${leftPad}px)`,
    width: `calc(${box.widthPct}% - ${leftPad + rightPad}px)`,
  };
}

function overflowPosition(
  startMs: number,
  endMs: number,
  date: string,
  gridStartMin: number,
  gridEndMin: number,
  slotDuration: number,
  slotHeight: number
): { topOffset: number; height: number } | null {
  const start = new Date(startMs);
  if (toDateString(start) !== date) return null;
  const end = new Date(endMs);
  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = end.getHours() * 60 + end.getMinutes();
  return computeVerticalPosition(
    startMin,
    endMin,
    gridStartMin,
    gridEndMin,
    slotDuration,
    slotHeight
  );
}
