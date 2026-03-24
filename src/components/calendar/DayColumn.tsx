import { getHostReact } from '@coongro/plugin-sdk';

import type { DayColumnProps } from '../../types/components.js';
import { generateTimeSlots, diffMinutes } from '../../utils/date.js';
import { EventCard } from '../event/EventCard.js';

const React = getHostReact();
const { useMemo } = React;

const SLOT_HEIGHT = 56;

export function DayColumn({
  date: _date,
  events,
  startHour = 8,
  endHour = 20,
  slotDuration = 30,
  renderEvent,
  onEventClick,
  onSlotClick,
  className = '',
}: DayColumnProps) {
  const timeSlots = useMemo(
    () => generateTimeSlots(startHour, endHour, slotDuration),
    [startHour, endHour, slotDuration]
  );

  const slotsPerHour = Math.round(60 / slotDuration);

  return React.createElement(
    'div',
    { className: `flex ${className}` },

    // Columna de horas
    React.createElement(
      'div',
      { className: 'w-16 shrink-0' },
      timeSlots.map((slot, i) =>
        React.createElement(
          'div',
          {
            key: slot,
            className: 'text-xs text-cg-text-muted text-right pr-3 border-b border-cg-border/30',
            style: { height: `${SLOT_HEIGHT}px`, lineHeight: `${SLOT_HEIGHT}px` },
          },
          i % slotsPerHour === 0 ? slot : ''
        )
      )
    ),

    // Columna de eventos
    React.createElement(
      'div',
      { className: 'flex-1 relative border-l border-cg-border' },

      // Slots
      ...timeSlots.map((slot, i) =>
        React.createElement(
          'div',
          {
            key: `slot-${slot}`,
            className: `relative border-b ${i % slotsPerHour === 0 ? 'border-cg-border/30' : 'border-cg-border/10'} hover:bg-cg-bg-hover/50 cursor-pointer group`,
            style: { height: `${SLOT_HEIGHT}px` },
            onClick: onSlotClick
              ? () => {
                  const [h, m] = slot.split(':').map(Number);
                  onSlotClick(h + m / 60);
                }
              : undefined,
          },
          React.createElement(
            'span',
            {
              className:
                'absolute inset-0 flex items-center justify-center text-sm font-semibold text-cg-accent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none',
            },
            '+ Nuevo evento'
          )
        )
      ),

      // Eventos posicionados
      ...events
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
              className: 'absolute left-1 right-1 z-10',
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
                  showStatus: true,
                  showLocation: true,
                  onClick: onEventClick,
                  className: 'h-full rounded-sm overflow-hidden',
                })
          );
        })
        .filter(Boolean)
    )
  );
}
