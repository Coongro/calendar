import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useIsMobile } from '../../hooks/useIsMobile.js';
import { TOKENS, statusBadgeStyle } from '../../styles/tokens.js';
import type { AgendaListProps } from '../../types/components.js';
import type { CalendarEvent } from '../../types/event.js';
import {
  formatEventTime,
  toDateString,
  getDayName,
  getMonthName,
  isSameDay,
} from '../../utils/date.js';
import { formatStatus } from '../../utils/labels.js';
import { PinIcon, CalendarIcon } from '../internal/icons.js';

const React = getHostReact();
const UI = getHostUI();
const { useMemo } = React;

export function AgendaList({
  events,
  renderEvent,
  onEventClick,
  emptyMessage = 'Sin eventos en este período',
  className = '',
}: AgendaListProps) {
  const isMobile = useIsMobile();
  const grouped = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    );
    for (const evt of sortedEvents) {
      const key = toDateString(new Date(evt.start_at));
      if (!map[key]) map[key] = [];
      map[key].push(evt);
    }
    return Object.entries(map);
  }, [events]);

  if (grouped.length === 0) {
    return React.createElement(UI.EmptyState, {
      title: emptyMessage,
      icon: React.createElement(CalendarIcon, null),
      className,
    });
  }

  const today = new Date();

  return React.createElement(
    'div',
    {
      className,
      style: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '24px',
        padding: '16px',
      },
    },
    grouped.map(([dateStr, dayEvents]) => {
      const date = new Date(`${dateStr}T00:00:00`);
      const isToday = isSameDay(date, today);
      const dayName = getDayName(date).substring(0, 3).toUpperCase();
      const dayNum = date.getDate();
      const monthYear = `${getMonthName(date.getMonth())} ${date.getFullYear()}`;

      return React.createElement(
        'div',
        { key: dateStr },

        // — Date header —
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
            },
          },

          // Bloque día: abreviación + número (circle si es hoy)
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                width: '40px',
                flexShrink: 0,
                color: isToday ? TOKENS.gold : TOKENS.ink4,
              },
            },
            React.createElement(
              'span',
              {
                style: {
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  lineHeight: 1,
                  marginBottom: '2px',
                },
              },
              dayName
            ),
            React.createElement(
              'span',
              {
                style: isToday
                  ? {
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: TOKENS.gold,
                      color: 'var(--cg-brand-text)',
                      fontSize: '16px',
                      fontWeight: 700,
                      lineHeight: 1,
                    }
                  : {
                      fontSize: '20px',
                      fontWeight: 700,
                      lineHeight: 1,
                    },
              },
              dayNum
            )
          ),

          // Mes/año + pill "Hoy"
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column' as const,
                gap: '2px',
              },
            },
            React.createElement(
              'span',
              {
                style: {
                  fontSize: '12px',
                  color: TOKENS.ink4,
                  lineHeight: 1,
                },
              },
              monthYear
            ),
            isToday &&
              React.createElement(
                'span',
                {
                  style: {
                    fontSize: '9px',
                    fontWeight: 700,
                    color: TOKENS.gold,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.1em',
                    lineHeight: 1,
                  },
                },
                'Hoy'
              )
          ),

          // Separador horizontal
          React.createElement('div', {
            style: {
              flex: 1,
              height: '1px',
              background: isToday ? `${TOKENS.gold}66` : TOKENS.border,
            },
          }),

          // Conteo de eventos
          React.createElement(
            'span',
            {
              style: {
                fontSize: '10px',
                color: TOKENS.ink4,
                flexShrink: 0,
              },
            },
            `${dayEvents.length} evento${dayEvents.length !== 1 ? 's' : ''}`
          )
        ),

        // — Filas de eventos —
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column' as const,
              gap: '6px',
              paddingLeft: isMobile ? 0 : '48px',
              marginTop: isMobile ? '8px' : 0,
            },
          },
          dayEvents.map((evt) =>
            renderEvent
              ? React.createElement(
                  'div',
                  { key: evt.id, style: { cursor: 'pointer' } },
                  renderEvent(evt, { variant: 'list', height: 48 })
                )
              : React.createElement(
                  'div',
                  {
                    key: evt.id,
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${TOKENS.border}`,
                      background: TOKENS.bg,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    },
                    onClick: onEventClick ? () => onEventClick(evt) : undefined,
                  },

                  // Dot de color del evento
                  React.createElement('span', {
                    style: {
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      backgroundColor: evt.color ?? 'var(--cg-accent)',
                    },
                  }),

                  // Horario (columna lateral en desktop, oculto en mobile)
                  !isMobile &&
                    React.createElement(
                      'div',
                      {
                        style: {
                          width: '96px',
                          flexShrink: 0,
                          fontSize: '12px',
                          color: TOKENS.ink4,
                          fontWeight: 500,
                          fontVariantNumeric: 'tabular-nums',
                        },
                      },
                      evt.all_day
                        ? 'Todo el día'
                        : `${formatEventTime(evt.start_at)} - ${formatEventTime(evt.end_at)}`
                    ),

                  // Título + hora (mobile) / ubicación
                  React.createElement(
                    'div',
                    {
                      style: {
                        flex: 1,
                        minWidth: 0,
                      },
                    },
                    React.createElement(
                      'div',
                      {
                        style: {
                          fontSize: '14px',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap' as const,
                        },
                      },
                      evt.title
                    ),
                    isMobile &&
                      React.createElement(
                        'div',
                        {
                          style: {
                            fontSize: '12px',
                            color: TOKENS.ink4,
                            marginTop: '2px',
                          },
                        },
                        evt.all_day
                          ? 'Todo el día'
                          : [
                              formatEventTime(evt.start_at),
                              ' — ',
                              formatEventTime(evt.end_at),
                              evt.location ? ' · ' + evt.location : '',
                            ].join('')
                      ),
                    !isMobile &&
                      evt.location &&
                      React.createElement(
                        'div',
                        {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            color: TOKENS.ink4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap' as const,
                            marginTop: '2px',
                          },
                        },
                        React.createElement(PinIcon, null),
                        evt.location
                      )
                  ),

                  // Badge de estado
                  React.createElement(
                    'span',
                    { style: statusBadgeStyle(evt.status) },
                    formatStatus(evt.status)
                  )
                )
          )
        )
      );
    })
  );
}
