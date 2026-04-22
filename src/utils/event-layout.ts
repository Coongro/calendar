/**
 * Layout de eventos solapados en una grilla temporal.
 *
 * Implementa el algoritmo canonico sweep-line + column packing greedy,
 * usado por Google Calendar, FullCalendar y toast-ui:
 *
 *   1. Agrupar eventos en clusters de solapamiento transitivo.
 *   2. Dentro de cada cluster, asignar cada evento a la columna mas
 *      a la izquierda cuyo ultimo evento haya terminado antes del actual.
 *   3. Si el cluster excede maxColumns, la ultima columna se convierte en
 *      un slot de overflow ("+N" chip).
 *
 * Funcion pura — no depende de React, dimensiones en px, ni hooks. Trabaja
 * solo con los timestamps start_at/end_at. Esto la hace facilmente testeable
 * y reutilizable por todas las vistas (Day, Week, ThreeDay).
 */
import type { CalendarEvent } from '../types/event.js';

export interface EventLayoutOptions {
  /**
   * Numero maximo de columnas visibles dentro de un cluster. Cuando el
   * packing natural excede este valor, las columnas excedentes se agrupan
   * en un unico overflow slot ("+N" chip) ocupando la ultima columna.
   *
   * Umbral minimo: 2 (una columna visible + potencial overflow).
   */
  maxColumns: number;
}

export interface EventSlot {
  event: CalendarEvent;
  /** Indice 0-based de columna dentro del cluster. */
  columnIndex: number;
  /** Total de columnas del cluster tras aplicar el clamp. */
  columnCount: number;
  /** Identificador del cluster (compartido entre eventos simultaneos). */
  clusterId: number;
}

export interface OverflowSlot {
  /** Eventos ocultos agrupados bajo el chip "+N". */
  events: CalendarEvent[];
  /** Columna donde se renderiza el chip (siempre la ultima del cluster). */
  columnIndex: number;
  columnCount: number;
  clusterId: number;
  /** Rango temporal que cubre el chip (earliest start / latest end de los ocultos). */
  startMs: number;
  endMs: number;
}

export interface LayoutResult {
  slots: EventSlot[];
  overflows: OverflowSlot[];
}

export interface ColumnBox {
  /** Posicion horizontal en porcentaje (0..100) dentro del contenedor. */
  leftPct: number;
  /** Ancho en porcentaje (0..100) dentro del contenedor. */
  widthPct: number;
}

/**
 * Asigna a cada evento una columna dentro de su cluster de solapamiento.
 *
 * Los eventos se agrupan por solapamiento TRANSITIVO — si A solapa con B
 * y B solapa con C, A y C van al mismo cluster aunque no se solapen entre si.
 * Esto reproduce el comportamiento estandar de calendarios web.
 *
 * Semantica de borde: end-exclusivo. Un evento 10:00–11:00 NO solapa con
 * 11:00–12:00 (comparten el instante exacto pero no se encabalgan).
 *
 * @throws Error si maxColumns < 2.
 */
export function layoutOverlappingEvents(
  events: CalendarEvent[],
  options: EventLayoutOptions
): LayoutResult {
  const { maxColumns } = options;
  if (maxColumns < 2) {
    throw new Error('layoutOverlappingEvents: maxColumns debe ser >= 2');
  }

  if (events.length === 0) return { slots: [], overflows: [] };

  // Ordenar por start ASC, luego end DESC (los mas largos primero en empates).
  const sorted = [...events].sort((a, b) => {
    const startDiff = toMs(a.start_at) - toMs(b.start_at);
    if (startDiff !== 0) return startDiff;
    return toMs(b.end_at) - toMs(a.end_at);
  });

  const slots: EventSlot[] = [];
  const overflows: OverflowSlot[] = [];
  let clusterIdCounter = 0;
  let clusterBuffer: CalendarEvent[] = [];
  let clusterEndMs = -Infinity;

  const flush = () => {
    if (clusterBuffer.length === 0) return;
    const cId = clusterIdCounter++;
    const { visible, hidden } = assignColumns(clusterBuffer, maxColumns);
    for (const s of visible) {
      slots.push({ ...s, clusterId: cId });
    }
    if (hidden.length > 0) {
      let startMs = Infinity;
      let endMs = -Infinity;
      for (const e of hidden) {
        const s = toMs(e.start_at);
        const eE = toMs(e.end_at);
        if (s < startMs) startMs = s;
        if (eE > endMs) endMs = eE;
      }
      overflows.push({
        events: hidden,
        columnIndex: maxColumns - 1,
        columnCount: maxColumns,
        clusterId: cId,
        startMs,
        endMs,
      });
    }
    clusterBuffer = [];
    clusterEndMs = -Infinity;
  };

  for (const evt of sorted) {
    const evtStart = toMs(evt.start_at);
    const evtEnd = toMs(evt.end_at);
    if (evtStart >= clusterEndMs) {
      flush();
    }
    clusterBuffer.push(evt);
    if (evtEnd > clusterEndMs) clusterEndMs = evtEnd;
  }
  flush();

  return { slots, overflows };
}

/**
 * Calcula left% y width% para posicionar un evento dentro de la columna
 * padre. El componente consumidor aplica gaps via padding/calc.
 */
export function getColumnBox(columnIndex: number, columnCount: number): ColumnBox {
  if (columnCount <= 0) return { leftPct: 0, widthPct: 100 };
  const widthPct = 100 / columnCount;
  return {
    leftPct: columnIndex * widthPct,
    widthPct,
  };
}

// ── Internals ────────────────────────────────────────────────

interface AssignedSlot {
  event: CalendarEvent;
  columnIndex: number;
  columnCount: number;
}

interface AssignResult {
  visible: AssignedSlot[];
  hidden: CalendarEvent[];
}

/**
 * Column packing greedy dentro de un cluster. Cada evento va a la columna
 * mas a la izquierda que este libre (su ultimo evento termino <= start actual).
 * Si se excede maxColumns, los eventos que caerian en columnas >= maxColumns-1
 * se emiten como hidden para formar el overflow.
 */
function assignColumns(cluster: CalendarEvent[], maxColumns: number): AssignResult {
  const columnEnds: number[] = [];
  const assigned: { event: CalendarEvent; col: number }[] = [];

  for (const evt of cluster) {
    const evtStart = toMs(evt.start_at);
    const evtEnd = toMs(evt.end_at);
    let col = columnEnds.findIndex((endMs) => endMs <= evtStart);
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(evtEnd);
    } else {
      columnEnds[col] = evtEnd;
    }
    assigned.push({ event: evt, col });
  }

  const actualCols = columnEnds.length;

  if (actualCols <= maxColumns) {
    return {
      visible: assigned.map((a) => ({
        event: a.event,
        columnIndex: a.col,
        columnCount: actualCols,
      })),
      hidden: [],
    };
  }

  // Clamp: columnas 0..(maxColumns - 2) visibles, resto al overflow.
  const visibleColLimit = maxColumns - 1;
  const visible: AssignedSlot[] = [];
  const hidden: CalendarEvent[] = [];
  for (const a of assigned) {
    if (a.col < visibleColLimit) {
      visible.push({
        event: a.event,
        columnIndex: a.col,
        columnCount: maxColumns,
      });
    } else {
      hidden.push(a.event);
    }
  }
  return { visible, hidden };
}

function toMs(ts: string): number {
  return new Date(ts).getTime();
}
