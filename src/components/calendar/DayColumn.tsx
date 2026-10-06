import { useIsMobile } from '@coongro/plugin-sdk';
import { useMemo } from 'react';

import { TOKENS } from '../../styles/tokens.js';
import type { DayColumnProps } from '../../types/components.js';
import { generateTimeSlots, toDateString } from '../../utils/date.js';
import {
  SLOT_HEIGHT_DESKTOP,
  SLOT_HEIGHT_MOBILE,
  GUTTER_WIDTH_DESKTOP,
  GUTTER_WIDTH_MOBILE,
} from '../../utils/grid-constants.js';
import { computeNowPosition } from '../../utils/grid-helpers.js';

import { DayColumnCore } from './DayColumnCore.js';

const MAX_COLUMNS_DESKTOP = 4;
const MAX_COLUMNS_MOBILE = 3;

export function DayColumn({
  date,
  events,
  startHour = 8,
  endHour = 20,
  slotDuration = 30,
  slotHeight: slotHeightProp,
  maxColumns: maxColumnsProp,
  renderEvent,
  onEventClick,
  onSlotClick,
  onClusterOverflowClick,
  className = '',
}: DayColumnProps) {
  const isMobile = useIsMobile('sm');
  const slotHeight = slotHeightProp ?? (isMobile ? SLOT_HEIGHT_MOBILE : SLOT_HEIGHT_DESKTOP);
  const gutterWidth = isMobile ? GUTTER_WIDTH_MOBILE : GUTTER_WIDTH_DESKTOP;
  const maxColumns = maxColumnsProp ?? (isMobile ? MAX_COLUMNS_MOBILE : MAX_COLUMNS_DESKTOP);

  const timeSlots = useMemo(
    () => generateTimeSlots(startHour, endHour, slotDuration),
    [startHour, endHour, slotDuration]
  );

  const slotsPerHour = Math.round(60 / slotDuration);

  const isToday = toDateString(new Date()) === (date ?? '').substring(0, 10);
  const { gridStartMin, gridEndMin, nowInRange, nowTop } = computeNowPosition(
    startHour,
    endHour,
    slotDuration,
    slotHeight
  );

  // Adapter: propaga el hour sin la fecha (firma historica de DayColumnProps).
  const handleSlotClick = onSlotClick
    ? (_date: string, hour: number) => onSlotClick(hour)
    : undefined;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
      }}
    >
      {/* Time gutter */}
      <div
        style={{
          width: `${gutterWidth}px`,
          flexShrink: 0,
        }}
      >
        {timeSlots.map((slot, i) => (
          <div
            key={slot}
            style={{
              fontSize: isMobile ? '10px' : '11px',
              paddingRight: isMobile ? '6px' : '8px',
              color: TOKENS.ink3,
              textAlign: 'right' as const,
              height: `${slotHeight}px`,
              lineHeight: `${slotHeight}px`,
            }}
          >
            {i % slotsPerHour === 0 ? slot : ''}
          </div>
        ))}
      </div>
      {/* Columna de eventos */}
      <div
        style={{
          flex: 1,
          position: 'relative' as const,
          minWidth: 0,
        }}
      >
        <DayColumnCore
          date={date}
          events={events}
          timeSlots={timeSlots}
          slotDuration={slotDuration}
          slotHeight={slotHeight}
          gridStartMin={gridStartMin}
          gridEndMin={gridEndMin}
          isToday={isToday}
          nowInRange={nowInRange}
          nowTop={nowTop}
          maxColumns={maxColumns}
          defaultVariant="standard"
          sidePadding={4}
          /* Mantener la variacion de opacidad historica: hora (40%) vs media hora (20%). */
          slotBorder={(idx: number, sph: number) =>
            idx % sph === 0
              ? `1px solid color-mix(in srgb, ${TOKENS.border} 40%, transparent)`
              : `1px solid color-mix(in srgb, ${TOKENS.border} 20%, transparent)`
          }
          renderEvent={renderEvent}
          onEventClick={onEventClick}
          onSlotClick={handleSlotClick}
          onClusterOverflowClick={onClusterOverflowClick}
        />
      </div>
    </div>
  );
}
