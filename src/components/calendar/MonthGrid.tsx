import { getHostReact } from '@coongro/plugin-sdk';

import { useIsMobile } from '../../hooks/useIsMobile.js';
import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { TOKENS } from '../../styles/tokens.js';
import type { MonthGridProps } from '../../types/components.js';
import { getMonthGridDays, getShortDayName, toDateString, toDateKey } from '../../utils/date.js';
import { groupEventsByDay } from '../../utils/grid-helpers.js';
import { EventCard } from '../event/EventCard.js';

const React = getHostReact();
const { useMemo } = React;

// Nombres de 1 letra para mobile
function getDayNumberStyle(
  isToday: boolean,
  isMobile: boolean,
  isCurrentMonth: boolean
): React.CSSProperties {
  const size = isMobile ? 32 : 24;
  const fontSize = isMobile ? '14px' : '12px';

  if (isToday) {
    return {
      width: `${size}px`,
      height: `${size}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      background: TOKENS.gold,
      color: 'var(--cg-brand-text)',
      fontWeight: 700,
      fontSize,
    };
  }

  return {
    fontSize: isMobile ? '14px' : '12px',
    color: isCurrentMonth ? TOKENS.ink : TOKENS.ink4,
  };
}

function getDayCellStyle(
  isCurrentMonth: boolean,
  isWeekend: boolean,
  isToday: boolean
): React.CSSProperties {
  const base: React.CSSProperties = {};
  if (isToday) {
    base.background = `color-mix(in srgb, ${TOKENS.gold} 5%, transparent)`; // ~5% opacity
  }
  if (!isCurrentMonth) {
    if (!isToday) base.background = `color-mix(in srgb, ${TOKENS.ink4} 3%, transparent)`; // muted
    return base;
  }
  if (isWeekend && !isToday) {
    base.background = `color-mix(in srgb, ${TOKENS.bg} 30%, transparent)`; // secondary/30
  }
  return base;
}

const SHORT_DAY_LETTERS: Record<number, string> = {
  0: 'D',
  1: 'L',
  2: 'M',
  3: 'X',
  4: 'J',
  5: 'V',
  6: 'S',
};

export function MonthGrid({
  year,
  month,
  events,
  renderEvent,
  onEventClick,
  onDayClick,
  showWeekends = true,
  className = '',
}: MonthGridProps) {
  const isMobile = useIsMobile();
  const tz = useTenantTimezone();
  const todayKey = toDateKey(new Date(), tz);
  const days = useMemo(() => getMonthGridDays(year, month), [year, month]);

  const eventsByDate = useMemo(() => groupEventsByDay(events), [events]);

  // Filtrar columnas según showWeekends
  const weekDayIndices = showWeekends ? [1, 2, 3, 4, 5, 6, 0] : [1, 2, 3, 4, 5];
  const colCount = showWeekends ? 7 : 5;

  const weekDayHeaders = weekDayIndices.map((d) => {
    if (isMobile) return SHORT_DAY_LETTERS[d];
    const ref = new Date(2024, 0, d === 0 ? 7 : d);
    return getShortDayName(ref);
  });

  // Filtrar días si no se muestran fines de semana
  const filteredDays = showWeekends
    ? days
    : days.filter((d) => d.getDay() !== 0 && d.getDay() !== 6);

  return React.createElement(
    'div',
    {
      className,
      style: {
        display: 'flex',
        flexDirection: 'column' as const,
      },
    },

    // Header
    React.createElement(
      'div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          borderBottom: `1px solid ${TOKENS.border}`,
        },
      },
      weekDayHeaders.map((name) =>
        React.createElement(
          'div',
          {
            key: name,
            style: {
              textAlign: 'center' as const,
              fontSize: '12px',
              color: TOKENS.ink4,
              padding: '8px 0',
              fontWeight: 500,
            },
          },
          name
        )
      )
    ),

    // Grid
    React.createElement(
      'div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          flex: 1,
        },
      },
      filteredDays.map((day, i) => {
        const dateStr = toDateString(day);
        const isCurrentMonth = day.getMonth() === month;
        const isToday = dateStr === todayKey;
        const dayEvents = eventsByDate[dateStr] ?? [];

        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

        return React.createElement(
          'div',
          {
            key: i,
            style: {
              minHeight: '64px',
              borderBottom: `1px solid ${TOKENS.border}`,
              borderRight: `1px solid ${TOKENS.border}`,
              padding: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
              ...getDayCellStyle(isCurrentMonth, isWeekend, isToday),
            },
            onClick: onDayClick ? () => onDayClick(dateStr) : undefined,
          },

          // Número del día + hint hover
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMobile ? 'center' : 'space-between',
                marginBottom: isMobile ? 0 : '4px',
              },
            },
            React.createElement(
              'div',
              { style: getDayNumberStyle(isToday, isMobile, isCurrentMonth) },
              day.getDate()
            )
            // Nota: el "+ Nuevo" hover se omite porque requiere group-hover CSS
            // que no se puede replicar con inline styles puro
          ),

          // Eventos: dots en mobile, cards en desktop
          isMobile
            ? dayEvents.length > 0 &&
                React.createElement(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '2px',
                      marginTop: '4px',
                    },
                  },
                  dayEvents.slice(0, 3).map((evt) =>
                    React.createElement('span', {
                      key: evt.id,
                      style: {
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: evt.color ?? 'var(--cg-accent)',
                      },
                    })
                  )
                )
            : React.createElement(
                'div',
                {
                  style: {
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: '2px',
                  },
                },
                dayEvents.slice(0, 3).map((evt) =>
                  renderEvent
                    ? React.createElement(React.Fragment, { key: evt.id }, renderEvent(evt))
                    : React.createElement(EventCard, {
                        key: evt.id,
                        event: evt,
                        variant: 'mini',
                        showTime: false,
                        onClick: onEventClick,
                      })
                ),
                dayEvents.length > 3 &&
                  React.createElement(
                    'div',
                    {
                      style: {
                        fontSize: '10px',
                        color: TOKENS.ink4,
                        paddingLeft: '4px',
                      },
                    },
                    `+${dayEvents.length - 3} más`
                  )
              )
        );
      })
    )
  );
}
