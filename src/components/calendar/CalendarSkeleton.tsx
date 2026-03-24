import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

const React = getHostReact();
const UI = getHostUI();

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const TIME_LABELS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];
const SLOT_H = 48;

// Eventos ficticios distribuidos en la semana para el skeleton de WeekGrid
const WEEK_GHOST_EVENTS = [
  { col: 0, top: SLOT_H * 1.5, h: SLOT_H * 1 },
  { col: 1, top: SLOT_H * 3, h: SLOT_H * 2 },
  { col: 2, top: SLOT_H * 0.5, h: SLOT_H * 1.5 },
  { col: 4, top: SLOT_H * 2, h: SLOT_H * 1 },
  { col: 5, top: SLOT_H * 4, h: SLOT_H * 0.5 },
  { col: 6, top: SLOT_H * 1, h: SLOT_H * 2 },
];

export function MonthGridSkeleton() {
  return React.createElement(
    'div',
    { className: 'flex flex-col animate-pulse' },

    // Header días semana
    React.createElement(
      'div',
      { className: 'grid grid-cols-7 border-b border-cg-border' },
      WEEK_DAYS.map((d) =>
        React.createElement(
          'div',
          { key: d, className: 'text-center text-xs text-cg-text-muted py-2 font-medium' },
          d
        )
      )
    ),

    // Grid de celdas: 5 semanas × 7 días
    React.createElement(
      'div',
      { className: 'grid grid-cols-7 flex-1' },
      Array.from({ length: 35 }, (_, i) =>
        React.createElement(
          'div',
          { key: i, className: 'min-h-16 border-b border-r border-cg-border p-1.5' },
          // Número del día
          React.createElement(UI.Skeleton, { className: 'w-5 h-4 mb-2 rounded' }),
          // 0–2 líneas de eventos según celda
          i % 7 !== 5 && i % 7 !== 6 && i % 4 !== 0
            ? React.createElement(UI.Skeleton, { className: 'h-4 w-full rounded mb-1' })
            : null,
          i % 5 === 0 ? React.createElement(UI.Skeleton, { className: 'h-4 w-3/4 rounded' }) : null
        )
      )
    )
  );
}

export function WeekGridSkeleton() {
  return React.createElement(
    'div',
    { className: 'flex animate-pulse' },

    // Columna de horas
    React.createElement(
      'div',
      { className: 'w-14 shrink-0 border-r border-cg-border' },
      React.createElement('div', { className: 'h-10 border-b border-cg-border' }),
      TIME_LABELS.map((t) =>
        React.createElement(
          'div',
          {
            key: t,
            className:
              'text-[10px] text-cg-text-muted text-right pr-2 border-b border-cg-border/30',
            style: { height: `${SLOT_H}px` },
          },
          t
        )
      )
    ),

    // Columnas de días
    ...WEEK_DAYS.map((d, colIdx) =>
      React.createElement(
        'div',
        { key: d, className: 'flex-1 min-w-0 border-r border-cg-border last:border-r-0' },

        // Header del día
        React.createElement(
          'div',
          {
            className:
              'h-10 flex flex-col items-center justify-center border-b border-cg-border gap-0.5',
          },
          React.createElement(UI.Skeleton, { className: 'w-6 h-2.5 rounded' }),
          React.createElement(UI.Skeleton, { className: 'w-5 h-4 rounded' })
        ),

        // Área de slots con evento fantasma
        React.createElement(
          'div',
          { className: 'relative', style: { height: `${SLOT_H * TIME_LABELS.length}px` } },
          // Líneas de hora
          TIME_LABELS.map((t) =>
            React.createElement('div', {
              key: t,
              className: 'border-b border-cg-border/20',
              style: { height: `${SLOT_H}px` },
            })
          ),
          // Evento fantasma si corresponde
          ...WEEK_GHOST_EVENTS.filter((e) => e.col === colIdx).map((e, i) =>
            React.createElement(UI.Skeleton, {
              key: i,
              className: 'absolute left-0.5 right-0.5 rounded-sm',
              style: { top: `${e.top}px`, height: `${e.h}px` },
            })
          )
        )
      )
    )
  );
}

export function DayColumnSkeleton() {
  // Eventos fantasma para la columna única
  const ghostEvents = [
    { top: SLOT_H * 1, h: SLOT_H * 1.5 },
    { top: SLOT_H * 3.5, h: SLOT_H * 1 },
    { top: SLOT_H * 6, h: SLOT_H * 2 },
  ];

  return React.createElement(
    'div',
    { className: 'flex animate-pulse' },

    // Columna de horas
    React.createElement(
      'div',
      { className: 'w-16 shrink-0' },
      TIME_LABELS.map((t) =>
        React.createElement(
          'div',
          {
            key: t,
            className: 'text-xs text-cg-text-muted text-right pr-3 border-b border-cg-border/30',
            style: { height: `${SLOT_H}px`, lineHeight: `${SLOT_H}px` },
          },
          t
        )
      )
    ),

    // Columna de eventos
    React.createElement(
      'div',
      {
        className: 'flex-1 relative border-l border-cg-border',
        style: { height: `${SLOT_H * TIME_LABELS.length}px` },
      },
      // Líneas de hora
      TIME_LABELS.map((t) =>
        React.createElement('div', {
          key: t,
          className: 'border-b border-cg-border/20',
          style: { height: `${SLOT_H}px` },
        })
      ),
      // Eventos fantasma
      ...ghostEvents.map((e, i) =>
        React.createElement(UI.Skeleton, {
          key: i,
          className: 'absolute left-1 right-1 rounded-sm',
          style: { top: `${e.top}px`, height: `${e.h}px` },
        })
      )
    )
  );
}

export function AgendaListSkeleton() {
  // 3 grupos de fecha con 2–3 eventos cada uno
  const groups = [{ events: 3 }, { events: 2 }, { events: 3 }];

  return React.createElement(
    'div',
    { className: 'flex flex-col gap-6 animate-pulse' },
    groups.map((g, gi) =>
      React.createElement(
        'div',
        { key: gi },

        // Date header skeleton
        React.createElement(
          'div',
          { className: 'flex items-center gap-3 mb-3' },
          // Bloque día
          React.createElement(
            'div',
            { className: 'flex flex-col items-center gap-1 w-10 shrink-0' },
            React.createElement(UI.Skeleton, { className: 'h-2.5 w-6 rounded' }),
            React.createElement(UI.Skeleton, { className: 'h-7 w-7 rounded-full' })
          ),
          // Mes/año
          React.createElement(UI.Skeleton, { className: 'h-3 w-20 rounded' }),
          // Línea separadora
          React.createElement('div', { className: 'flex-1 h-px bg-cg-skeleton rounded' }),
          // Conteo
          React.createElement(UI.Skeleton, { className: 'h-3 w-14 rounded shrink-0' })
        ),

        // Filas de eventos skeleton
        React.createElement(
          'div',
          { className: 'flex flex-col gap-1.5 pl-12' },
          Array.from({ length: g.events }, (_, ei) =>
            React.createElement(
              'div',
              {
                key: ei,
                className: 'flex items-center gap-3 py-2.5 px-3 rounded-lg border border-cg-border',
                style: { borderLeftWidth: '3px', borderLeftColor: 'var(--cg-skeleton, #e5e7eb)' },
              },
              React.createElement(UI.Skeleton, { className: 'h-3 w-24 rounded shrink-0' }),
              React.createElement(
                'div',
                { className: 'flex-1 flex flex-col gap-1.5' },
                React.createElement(UI.Skeleton, {
                  className: `h-3.5 rounded ${ei % 2 === 0 ? 'w-2/3' : 'w-1/2'}`,
                }),
                ei % 3 === 0
                  ? React.createElement(UI.Skeleton, { className: 'h-2.5 w-1/3 rounded' })
                  : null
              ),
              React.createElement(UI.Skeleton, { className: 'h-5 w-16 rounded-full shrink-0' })
            )
          )
        )
      )
    )
  );
}
