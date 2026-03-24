import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import type { AgendaListProps } from '../../types/components.js';
import type { CalendarEvent } from '../../types/event.js';
import {
  formatEventTime,
  toDateString,
  getDayName,
  getMonthName,
  isSameDay,
} from '../../utils/date.js';
import { formatStatus, STATUS_BADGE_CLASSES } from '../../utils/labels.js';
import { PinIcon, CalendarIcon } from '../internal/icons.js';

const React = getHostReact();
const UI = getHostUI();
const { useMemo } = React;

export function AgendaList({
  events,
  onEventClick,
  emptyMessage = 'Sin eventos en este período',
  className = '',
}: AgendaListProps) {
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
    { className: `flex flex-col gap-6 ${className}` },
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
          { className: 'flex items-center gap-3 mb-3' },

          // Bloque día: abreviación + número (circle si es hoy)
          React.createElement(
            'div',
            {
              className: `flex flex-col items-center w-10 shrink-0 ${isToday ? 'text-cg-accent' : 'text-cg-text-muted'}`,
            },
            React.createElement(
              'span',
              { className: 'text-[9px] font-bold tracking-widest leading-none mb-0.5' },
              dayName
            ),
            React.createElement(
              'span',
              {
                className: isToday
                  ? 'w-8 h-8 flex items-center justify-center rounded-full bg-cg-accent text-white text-base font-bold leading-none'
                  : 'text-xl font-bold leading-none',
              },
              dayNum
            )
          ),

          // Mes/año + pill "Hoy"
          React.createElement(
            'div',
            { className: 'flex flex-col gap-0.5' },
            React.createElement(
              'span',
              { className: 'text-xs text-cg-text-muted leading-none' },
              monthYear
            ),
            isToday &&
              React.createElement(
                'span',
                {
                  className:
                    'text-[9px] font-bold text-cg-accent uppercase tracking-widest leading-none',
                },
                'Hoy'
              )
          ),

          // Separador horizontal
          React.createElement('div', {
            className: `flex-1 h-px ${isToday ? 'bg-cg-accent/40' : 'bg-cg-border'}`,
          }),

          // Conteo de eventos
          React.createElement(
            'span',
            { className: 'text-[10px] text-cg-text-muted shrink-0' },
            `${dayEvents.length} evento${dayEvents.length !== 1 ? 's' : ''}`
          )
        ),

        // — Filas de eventos —
        React.createElement(
          'div',
          { className: 'flex flex-col gap-1.5 pl-12' },
          dayEvents.map((evt) =>
            React.createElement(
              'div',
              {
                key: evt.id,
                className:
                  'flex items-center gap-3 py-2.5 px-3 rounded-lg border border-cg-border bg-cg-bg hover:bg-cg-bg-hover transition-colors cursor-pointer',
                style: {
                  borderLeftColor: evt.color ?? '#3B82F6',
                  borderLeftWidth: '3px',
                },
                onClick: onEventClick ? () => onEventClick(evt) : undefined,
              },

              // Horario
              React.createElement(
                'div',
                { className: 'w-24 shrink-0 text-xs text-cg-text-muted font-medium tabular-nums' },
                evt.all_day
                  ? 'Todo el día'
                  : `${formatEventTime(evt.start_at)} - ${formatEventTime(evt.end_at)}`
              ),

              // Título + ubicación
              React.createElement(
                'div',
                { className: 'flex-1 min-w-0' },
                React.createElement(
                  'div',
                  { className: 'text-sm font-medium truncate' },
                  evt.title
                ),
                evt.location &&
                  React.createElement(
                    'div',
                    {
                      className:
                        'flex items-center gap-1 text-xs text-cg-text-muted truncate mt-0.5',
                    },
                    React.createElement(PinIcon, null),
                    evt.location
                  )
              ),

              // Badge de estado con color
              React.createElement(
                UI.Badge,
                {
                  variant: 'outline',
                  className: `shrink-0 text-[10px] ${STATUS_BADGE_CLASSES[evt.status] ?? ''}`,
                },
                formatStatus(evt.status)
              )
            )
          )
        )
      );
    })
  );
}
