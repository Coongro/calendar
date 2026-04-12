import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { TOKENS } from '../../styles/tokens.js';

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

// Animacion de pulse para skeletons
const PULSE_ANIMATION = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';

export function MonthGridSkeleton() {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        animation: PULSE_ANIMATION,
      },
    },

    // Header dias semana
    React.createElement(
      'div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: `1px solid ${TOKENS.border}`,
        },
      },
      WEEK_DAYS.map((d) =>
        React.createElement(
          'div',
          {
            key: d,
            style: {
              textAlign: 'center',
              fontSize: '0.75rem',
              color: TOKENS.ink4,
              padding: '0.5rem 0',
              fontWeight: 500,
            },
          },
          d
        )
      )
    ),

    // Grid de celdas: 5 semanas x 7 dias
    React.createElement(
      'div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          flex: 1,
        },
      },
      Array.from({ length: 35 }, (_, i) =>
        React.createElement(
          'div',
          {
            key: i,
            style: {
              minHeight: '4rem',
              borderBottom: `1px solid ${TOKENS.border}`,
              borderRight: `1px solid ${TOKENS.border}`,
              padding: '0.375rem',
            },
          },
          // Numero del dia
          React.createElement(UI.Skeleton, { className: 'w-5 h-4 mb-2 rounded' }),
          // 0-2 lineas de eventos segun celda
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
    {
      style: {
        display: 'flex',
        animation: PULSE_ANIMATION,
      },
    },

    // Columna de horas
    React.createElement(
      'div',
      {
        style: {
          width: '3.5rem',
          flexShrink: 0,
          borderRight: `1px solid ${TOKENS.border}`,
        },
      },
      React.createElement('div', {
        style: {
          height: '2.5rem',
          borderBottom: `1px solid ${TOKENS.border}`,
        },
      }),
      TIME_LABELS.map((t) =>
        React.createElement(
          'div',
          {
            key: t,
            style: {
              height: `${SLOT_H}px`,
              fontSize: '10px',
              color: TOKENS.ink4,
              textAlign: 'right',
              paddingRight: '0.5rem',
              borderBottom: `1px solid ${TOKENS.border}30`,
            },
          },
          t
        )
      )
    ),

    // Columnas de dias
    ...WEEK_DAYS.map((d, colIdx) =>
      React.createElement(
        'div',
        {
          key: d,
          style: {
            flex: 1,
            minWidth: 0,
            borderRight: colIdx < WEEK_DAYS.length - 1 ? `1px solid ${TOKENS.border}` : 'none',
          },
        },

        // Header del dia
        React.createElement(
          'div',
          {
            style: {
              height: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: `1px solid ${TOKENS.border}`,
              gap: '0.125rem',
            },
          },
          React.createElement(UI.Skeleton, { className: 'w-6 h-2.5 rounded' }),
          React.createElement(UI.Skeleton, { className: 'w-5 h-4 rounded' })
        ),

        // Area de slots con evento fantasma
        React.createElement(
          'div',
          {
            style: {
              position: 'relative',
              height: `${SLOT_H * TIME_LABELS.length}px`,
            },
          },
          // Lineas de hora
          TIME_LABELS.map((t) =>
            React.createElement('div', {
              key: t,
              style: {
                height: `${SLOT_H}px`,
                borderBottom: `1px solid ${TOKENS.border}20`,
              },
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
  // Eventos fantasma para la columna unica
  const ghostEvents = [
    { top: SLOT_H * 1, h: SLOT_H * 1.5 },
    { top: SLOT_H * 3.5, h: SLOT_H * 1 },
    { top: SLOT_H * 6, h: SLOT_H * 2 },
  ];

  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        animation: PULSE_ANIMATION,
      },
    },

    // Columna de horas
    React.createElement(
      'div',
      {
        style: {
          width: '4rem',
          flexShrink: 0,
        },
      },
      TIME_LABELS.map((t) =>
        React.createElement(
          'div',
          {
            key: t,
            style: {
              height: `${SLOT_H}px`,
              lineHeight: `${SLOT_H}px`,
              fontSize: '0.75rem',
              color: TOKENS.ink4,
              textAlign: 'right',
              paddingRight: '0.75rem',
              borderBottom: `1px solid ${TOKENS.border}30`,
            },
          },
          t
        )
      )
    ),

    // Columna de eventos
    React.createElement(
      'div',
      {
        style: {
          flex: 1,
          position: 'relative',
          borderLeft: `1px solid ${TOKENS.border}`,
          height: `${SLOT_H * TIME_LABELS.length}px`,
        },
      },
      // Lineas de hora
      TIME_LABELS.map((t) =>
        React.createElement('div', {
          key: t,
          style: {
            height: `${SLOT_H}px`,
            borderBottom: `1px solid ${TOKENS.border}20`,
          },
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
  // 3 grupos de fecha con 2-3 eventos cada uno
  const groups = [{ events: 3 }, { events: 2 }, { events: 3 }];

  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        animation: PULSE_ANIMATION,
      },
    },
    groups.map((g, gi) =>
      React.createElement(
        'div',
        { key: gi },

        // Date header skeleton
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            },
          },
          // Bloque dia
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                width: '2.5rem',
                flexShrink: 0,
              },
            },
            React.createElement(UI.Skeleton, { className: 'h-2.5 w-6 rounded' }),
            React.createElement(UI.Skeleton, { className: 'h-7 w-7 rounded-full' })
          ),
          // Mes/ano
          React.createElement(UI.Skeleton, { className: 'h-3 w-20 rounded' }),
          // Linea separadora
          React.createElement('div', {
            style: {
              flex: 1,
              height: '1px',
              backgroundColor: TOKENS.border,
              borderRadius: '9999px',
            },
          }),
          // Conteo
          React.createElement(UI.Skeleton, { className: 'h-3 w-14 rounded shrink-0' })
        ),

        // Filas de eventos skeleton
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
              paddingLeft: '3rem',
            },
          },
          Array.from({ length: g.events }, (_, ei) =>
            React.createElement(
              'div',
              {
                key: ei,
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${TOKENS.border}`,
                },
              },
              React.createElement(UI.Skeleton, { className: 'w-2.5 h-2.5 rounded-full shrink-0' }),
              React.createElement(UI.Skeleton, { className: 'h-3 w-24 rounded shrink-0' }),
              React.createElement(
                'div',
                {
                  style: {
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                  },
                },
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
