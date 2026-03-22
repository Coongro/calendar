import { getHostReact } from '@coongro/plugin-sdk';
import type { MonthGridProps } from '../../types/components.js';
import type { CalendarEvent } from '../../types/event.js';
import { getMonthGridDays, getShortDayName, toDateString, isSameDay } from '../../utils/date.js';
import { EventCard } from '../event/EventCard.js';

const React = getHostReact();
const { useMemo } = React;

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
  const days = useMemo(() => getMonthGridDays(year, month), [year, month]);

  // Agrupar eventos por fecha
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const evt of events) {
      const key = toDateString(new Date(evt.start_at));
      if (!map[key]) map[key] = [];
      map[key].push(evt);
    }
    return map;
  }, [events]);

  // Filtrar columnas según showWeekends
  const weekDayIndices = showWeekends ? [1, 2, 3, 4, 5, 6, 0] : [1, 2, 3, 4, 5];
  const cols = showWeekends ? 7 : 5;

  const weekDayHeaders = weekDayIndices.map((d) => {
    const ref = new Date(2024, 0, d === 0 ? 7 : d);
    return getShortDayName(ref);
  });

  // Filtrar días si no se muestran fines de semana
  const filteredDays = showWeekends
    ? days
    : days.filter((d) => d.getDay() !== 0 && d.getDay() !== 6);

  return React.createElement(
    'div',
    { className: `flex flex-col ${className}` },

    // Header
    React.createElement(
      'div',
      { className: `grid grid-cols-${cols} border-b border-cg-border` },
      weekDayHeaders.map((name) =>
        React.createElement(
          'div',
          {
            key: name,
            className: 'text-center text-xs text-cg-text-muted py-2 font-medium',
          },
          name
        )
      )
    ),

    // Grid
    React.createElement(
      'div',
      { className: `grid grid-cols-${cols} flex-1` },
      filteredDays.map((day, i) => {
        const dateStr = toDateString(day);
        const isCurrentMonth = day.getMonth() === month;
        const isToday = isSameDay(day, new Date());
        const dayEvents = eventsByDate[dateStr] ?? [];

        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

        return React.createElement(
          'div',
          {
            key: i,
            className: `min-h-16 border-b border-r border-cg-border p-1 cursor-pointer group transition-colors ${
              !isCurrentMonth
                ? 'bg-cg-bg-muted/30'
                : isWeekend
                  ? 'bg-cg-bg-secondary/30 hover:bg-cg-accent/5'
                  : 'hover:bg-cg-accent/5'
            } ${isToday ? 'bg-cg-accent/5' : ''}`,
            onClick: onDayClick ? () => onDayClick(dateStr) : undefined,
          },

          // Número del día + hint hover
          React.createElement(
            'div',
            { className: 'flex items-center justify-between mb-1' },
            React.createElement(
              'div',
              {
                className: `text-xs ${
                  isToday
                    ? 'w-6 h-6 flex items-center justify-center rounded-full bg-cg-accent text-white font-bold'
                    : isCurrentMonth
                      ? 'text-cg-text'
                      : 'text-cg-text-muted'
                }`,
              },
              day.getDate()
            ),
            isCurrentMonth && React.createElement(
              'span',
              { className: 'inline-flex items-center gap-0.5 text-[10px] font-semibold text-cg-accent bg-cg-accent/10 border border-cg-accent/20 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity select-none leading-none whitespace-nowrap' },
              '+ Nuevo'
            )
          ),

          // Eventos del día (máximo 3)
          React.createElement(
            'div',
            { className: 'flex flex-col gap-0.5' },
            dayEvents.slice(0, 3).map((evt) =>
              renderEvent
                ? React.createElement(React.Fragment, { key: evt.id }, renderEvent(evt))
                : React.createElement(EventCard, {
                    key: evt.id,
                    event: evt,
                    showTime: false,
                    onClick: onEventClick,
                  })
            ),
            dayEvents.length > 3 &&
              React.createElement(
                'div',
                { className: 'text-[10px] text-cg-text-muted pl-1' },
                `+${dayEvents.length - 3} más`
              )
          )
        );
      })
    )
  );
}
