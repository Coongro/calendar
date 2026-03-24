import { getHostReact } from '@coongro/plugin-sdk';

import type { WeekGridProps } from '../../types/components.js';
import type { CalendarEvent } from '../../types/event.js';
import {
  getWeekDays,
  getShortDayName,
  generateTimeSlots,
  toDateString,
  isSameDay,
  diffMinutes,
} from '../../utils/date.js';
import { EventCard } from '../event/EventCard.js';

const React = getHostReact();
const { useMemo } = React;

const SLOT_HEIGHT = 48; // px por slot

export function WeekGrid({
  startDate,
  events,
  startHour = 8,
  endHour = 20,
  slotDuration = 30,
  renderEvent,
  onEventClick,
  onSlotClick,
  showWeekends = true,
  className = '',
}: WeekGridProps) {
  const weekDays = useMemo(() => {
    const d = new Date(startDate);
    const all = getWeekDays(d);
    return showWeekends ? all : all.filter((day) => day.getDay() !== 0 && day.getDay() !== 6);
  }, [startDate, showWeekends]);

  const timeSlots = useMemo(
    () => generateTimeSlots(startHour, endHour, slotDuration),
    [startHour, endHour, slotDuration]
  );

  // Agrupar eventos por día
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const evt of events) {
      const key = toDateString(new Date(evt.start_at));
      if (!map[key]) map[key] = [];
      map[key].push(evt);
    }
    return map;
  }, [events]);

  const slotsPerHour = 60 / slotDuration;

  return React.createElement(
    'div',
    { className: `flex ${className}` },

    // Columna de horas
    React.createElement(
      'div',
      { className: 'w-14 shrink-0 border-r border-cg-border' },
      // Header vacío (sticky)
      React.createElement('div', {
        className: 'h-10 border-b border-cg-border sticky top-0 z-20 bg-cg-bg',
      }),
      // Horas
      timeSlots.map((slot, i) =>
        React.createElement(
          'div',
          {
            key: slot,
            className:
              'text-[10px] text-cg-text-muted text-right pr-2 border-b border-cg-border/30',
            style: { height: `${SLOT_HEIGHT}px` },
          },
          i % slotsPerHour === 0 ? slot : ''
        )
      )
    ),

    // Columnas de días
    ...weekDays.map((day) => {
      const dateStr = toDateString(day);
      const isToday = isSameDay(day, new Date());
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const dayEvents = eventsByDay[dateStr] ?? [];

      return React.createElement(
        'div',
        {
          key: dateStr,
          className: `flex-1 min-w-0 border-r border-cg-border last:border-r-0 ${isWeekend ? 'bg-cg-bg-secondary/30' : ''}`,
        },

        // Header del día (sticky)
        React.createElement(
          'div',
          {
            className: `h-10 flex flex-col items-center justify-center border-b border-cg-border text-xs sticky top-0 z-10 ${
              isToday ? 'bg-cg-accent/10' : isWeekend ? 'bg-cg-bg-secondary/50' : 'bg-cg-bg'
            }`,
          },
          React.createElement('span', { className: 'text-cg-text-muted' }, getShortDayName(day)),
          React.createElement(
            'span',
            {
              className: isToday
                ? 'w-6 h-6 flex items-center justify-center rounded-full bg-cg-accent text-white font-bold text-[11px]'
                : 'font-medium',
            },
            day.getDate()
          )
        ),

        // Grilla de slots
        React.createElement(
          'div',
          { className: 'relative' },

          // Slots de fondo
          ...timeSlots.map((slot, slotIdx) =>
            React.createElement(
              'div',
              {
                key: `slot-${slot}`,
                className: `relative border-b ${slotIdx % slotsPerHour === 0 ? 'border-cg-border/30' : 'border-cg-border/10'} hover:bg-cg-accent/5 cursor-pointer group transition-colors`,
                style: { height: `${SLOT_HEIGHT}px` },
                onClick: onSlotClick
                  ? () => {
                      const [h, m] = slot.split(':').map(Number);
                      onSlotClick(dateStr, h + m / 60);
                    }
                  : undefined,
              },
              // Línea de acento en el top del slot
              React.createElement('div', {
                className:
                  'absolute top-0 inset-x-0 h-0.5 bg-cg-accent opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none rounded-full',
              }),
              // Chip de horario
              React.createElement(
                'span',
                {
                  className:
                    'absolute top-1 left-1 text-[10px] font-semibold text-cg-accent bg-cg-accent/10 border border-cg-accent/20 rounded px-1 py-0.5 leading-none opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none',
                },
                slot
              )
            )
          ),

          // Eventos posicionados
          ...dayEvents
            .map((evt) => {
              const evtStart = new Date(evt.start_at);
              const evtStartMin = evtStart.getHours() * 60 + evtStart.getMinutes();
              const gridStartMin = startHour * 60;
              const gridEndMin = endHour * 60;

              if (evtStartMin < gridStartMin || evtStartMin >= gridEndMin) return null;

              const topOffset = ((evtStartMin - gridStartMin) / slotDuration) * SLOT_HEIGHT;
              const duration = diffMinutes(evt.start_at, evt.end_at);
              const height = (duration / slotDuration) * SLOT_HEIGHT;

              return React.createElement(
                'div',
                {
                  key: evt.id,
                  className: 'absolute left-0.5 right-0.5 z-10',
                  style: {
                    top: `${Math.max(0, topOffset)}px`,
                    height: `${Math.max(SLOT_HEIGHT / 2, height)}px`,
                  },
                },
                renderEvent
                  ? renderEvent(evt)
                  : React.createElement(EventCard, {
                      event: evt,
                      showTime: true,
                      onClick: onEventClick,
                      className: 'h-full rounded-sm overflow-hidden',
                    })
              );
            })
            .filter(Boolean)
        )
      );
    })
  );
}
