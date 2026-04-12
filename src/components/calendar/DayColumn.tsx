import { getHostReact } from '@coongro/plugin-sdk';

import { useIsMobile } from '../../hooks/useIsMobile.js';
import { TOKENS } from '../../styles/tokens.js';
import type { DayColumnProps } from '../../types/components.js';
import { generateTimeSlots, toDateString } from '../../utils/date.js';
import {
  SLOT_HEIGHT_DESKTOP,
  SLOT_HEIGHT_MOBILE,
  GUTTER_WIDTH_DESKTOP,
  GUTTER_WIDTH_MOBILE,
  EVENT_Z,
} from '../../utils/grid-constants.js';
import {
  computeNowPosition,
  computeEventPosition,
  renderNowLine,
} from '../../utils/grid-helpers.js';
import { EventCard } from '../event/EventCard.js';

const React = getHostReact();
const { useMemo } = React;

/** Umbral en px: eventos mas bajos que esto usan variante compact */
const COMPACT_HEIGHT_PX = 46;

export function DayColumn({
  date,
  events,
  startHour = 8,
  endHour = 20,
  slotDuration = 30,
  slotHeight: slotHeightProp,
  renderEvent,
  onEventClick,
  onSlotClick,
  className = '',
}: DayColumnProps) {
  const isMobile = useIsMobile();
  const slotHeight = slotHeightProp ?? (isMobile ? SLOT_HEIGHT_MOBILE : SLOT_HEIGHT_DESKTOP);
  const gutterWidth = isMobile ? GUTTER_WIDTH_MOBILE : GUTTER_WIDTH_DESKTOP;
  const timeSlots = useMemo(
    () => generateTimeSlots(startHour, endHour, slotDuration),
    [startHour, endHour, slotDuration]
  );

  const slotsPerHour = Math.round(60 / slotDuration);

  // Now line
  const isToday = toDateString(new Date()) === (date ?? '').substring(0, 10);
  const { gridStartMin, gridEndMin, nowInRange, nowTop } = computeNowPosition(
    startHour,
    endHour,
    slotDuration,
    slotHeight
  );

  return React.createElement(
    'div',
    {
      className,
      style: {
        display: 'flex',
      },
    },

    // Columna de horas
    React.createElement(
      'div',
      {
        style: {
          width: `${gutterWidth}px`,
          flexShrink: 0,
        },
      },
      timeSlots.map((slot, i) =>
        React.createElement(
          'div',
          {
            key: slot,
            style: {
              fontSize: isMobile ? '10px' : '11px',
              paddingRight: isMobile ? '6px' : '8px',
              color: TOKENS.ink3,
              textAlign: 'right' as const,
              height: `${slotHeight}px`,
              lineHeight: `${slotHeight}px`,
            },
          },
          i % slotsPerHour === 0 ? slot : ''
        )
      )
    ),

    // Columna de eventos
    React.createElement(
      'div',
      {
        style: {
          flex: 1,
          position: 'relative' as const,
          minWidth: 0,
        },
      },

      // Slots (filas horarias)
      ...timeSlots.map((slot, i) =>
        React.createElement('div', {
          key: `slot-${slot}`,
          style: {
            borderBottom: `1px solid ${i % slotsPerHour === 0 ? TOKENS.border + '66' : TOKENS.border + '33'}`,
            height: `${slotHeight}px`,
            cursor: onSlotClick ? 'pointer' : undefined,
          },
          onClick: onSlotClick
            ? () => {
                const [h, m] = slot.split(':').map(Number);
                onSlotClick(h + m / 60);
              }
            : undefined,
        })
      ),

      // Now line (gold triangle marker)
      isToday && nowInRange && renderNowLine(nowTop),

      // Eventos posicionados
      ...events
        .map((evt) => {
          const pos = computeEventPosition(evt, gridStartMin, gridEndMin, slotDuration, slotHeight);
          if (!pos) return null;

          const { topOffset, height } = pos;
          const renderedHeight = Math.max(slotHeight / 2, height);
          const isCompact = renderedHeight < COMPACT_HEIGHT_PX;

          return React.createElement(
            'div',
            {
              key: evt.id,
              style: {
                position: 'absolute' as const,
                left: '4px',
                right: '4px',
                zIndex: String(EVENT_Z),
                top: `${Math.max(0, topOffset)}px`,
                height: `${Math.max(slotHeight / 2, height)}px`,
              },
            },
            renderEvent
              ? renderEvent(evt, {
                  variant: isCompact ? 'compact' : 'standard',
                  height: renderedHeight,
                })
              : React.createElement(EventCard, {
                  event: evt,
                  variant: isCompact ? 'compact' : 'standard',
                  showTime: true,
                  showStatus: !isCompact,
                  showLocation: !isCompact,
                  onClick: onEventClick,
                })
          );
        })
        .filter(Boolean)
    )
  );
}
