import { useMemo } from 'react';

import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { TOKENS } from '../../styles/tokens.js';
import type { WeekGridProps } from '../../types/components.js';
import { getShortDayName, generateTimeSlots, toDateString, toDateKey } from '../../utils/date.js';
import { SLOT_HEIGHT_3DAY, GUTTER_WIDTH_3DAY } from '../../utils/grid-constants.js';
import {
  computeNowPosition,
  groupEventsByDay,
  dayBackground,
  dayColumnBackground,
  dayNameColor,
  dayNumberStyles,
} from '../../utils/grid-helpers.js';
import { civilDateOf } from '../../utils/zoned-day.js';

import { DayColumnCore } from './DayColumnCore.js';

const GUTTER_W = GUTTER_WIDTH_3DAY;

export function ThreeDayGrid({
  startDate,
  events,
  startHour = 8,
  endHour = 20,
  slotDuration = 60,
  maxColumns,
  renderEvent,
  onEventClick,
  onSlotClick,
  onClusterOverflowClick,
}: WeekGridProps) {
  const tz = useTenantTimezone();
  const slotHeight = SLOT_HEIGHT_3DAY;

  // 3 dias consecutivos desde startDate
  const days = useMemo(() => {
    // startDate llega como clave o como instante: el día es el del negocio (ver WeekGrid).
    const base = civilDateOf(startDate, tz);
    return [0, 1, 2].map((offset) => {
      const d = new Date(base);
      d.setDate(d.getDate() + offset);
      return d;
    });
  }, [startDate, tz]);

  const timeSlots = useMemo(
    () => generateTimeSlots(startHour, endHour, slotDuration),
    [startHour, endHour, slotDuration]
  );

  const eventsByDay = useMemo(() => groupEventsByDay(events, tz), [events, tz]);

  const slotsPerHour = Math.round(60 / slotDuration);
  const now = new Date();
  const todayKey = toDateKey(now, tz);

  const { nowHour, nowTimeStr, gridStartMin, gridEndMin, nowInRange, nowTop } = computeNowPosition(
    startHour,
    endHour,
    slotDuration,
    slotHeight,
    tz
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* ── Day headers (3 letras, Warm Glow) ── */}
      <div
        style={{
          display: 'flex',
          flexShrink: 0,
          borderBottom: `1px solid ${TOKENS.border}`,
          background: TOKENS.surface,
        }}
      >
        <div
          style={{
            width: `${GUTTER_W}px`,
            flexShrink: 0,
            borderRight: `1px solid ${TOKENS.border}`,
          }}
        />
        {days.map((day, i) => {
          const isToday = toDateString(day) === todayKey;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={toDateString(day)}
              style={{
                flex: '1',
                padding: '10px 0 8px',
                textAlign: 'center',
                borderRight: i < 2 ? `1px solid ${TOKENS.border}` : 'none',
                background: dayBackground(isToday, isWeekend),
                minWidth: '0',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: dayNameColor(isToday, isWeekend),
                  marginBottom: '3px',
                }}
              >
                {getShortDayName(day)}
              </div>
              <div
                style={{
                  fontFamily: TOKENS.fontSerif,
                  fontSize: isToday ? '20px' : '19px',
                  ...dayNumberStyles(isToday, isWeekend),
                  lineHeight: '1',
                }}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      {/* ── Grid body ── */}
      <div
        style={{
          flex: '1',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Wrapper interno con altura fija para que borderRight se extienda completo */}
        <div style={{ display: 'flex', height: `${timeSlots.length * slotHeight}px` }}>
          {/* Time gutter */}
          <div
            style={{
              width: `${GUTTER_W}px`,
              flexShrink: 0,
              borderRight: `1px solid ${TOKENS.border}`,
            }}
          >
            {timeSlots.map((slot, i) => {
              const [h] = slot.split(':').map(Number);
              const isNowHour = h === nowHour && i % slotsPerHour === 0 && nowInRange;

              return (
                <div
                  key={slot}
                  style={{
                    height: `${slotHeight}px`,
                    display: 'flex',
                    alignItems: i === 0 ? 'center' : 'flex-start',
                    justifyContent: 'flex-end',
                    padding: '0 5px',
                    fontSize: '10px',
                    fontWeight: isNowHour ? '700' : '500',
                    color: isNowHour ? TOKENS.red : TOKENS.ink3,
                    transform: i === 0 ? 'none' : 'translateY(-6px)',
                  }}
                >
                  {isNowHour ? nowTimeStr : i % slotsPerHour === 0 ? slot : ''}
                </div>
              );
            })}
          </div>
          {/* 3 day columns */}
          <div style={{ display: 'flex', flex: '1' }}>
            {days.map((day, dayIdx) => {
              const dateStr = toDateString(day);
              const isToday = toDateString(day) === todayKey;
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const dayEvents = eventsByDay[dateStr] ?? [];
              const colBg = dayColumnBackground(isToday, isWeekend);

              return (
                <div
                  key={dateStr}
                  style={{
                    flex: '1',
                    position: 'relative',
                    borderRight: dayIdx < 2 ? `1px solid ${TOKENS.border}` : 'none',
                    minWidth: '0',
                    ...(colBg ? { background: colBg } : {}),
                  }}
                >
                  <DayColumnCore
                    date={dateStr}
                    events={dayEvents}
                    timeSlots={timeSlots}
                    slotDuration={slotDuration}
                    slotHeight={slotHeight}
                    gridStartMin={gridStartMin}
                    gridEndMin={gridEndMin}
                    isToday={isToday}
                    nowInRange={nowInRange}
                    nowTop={nowTop}
                    maxColumns={maxColumns ?? 3}
                    defaultVariant="week"
                    sidePadding={3}
                    renderEvent={renderEvent}
                    onEventClick={onEventClick}
                    onSlotClick={onSlotClick}
                    onClusterOverflowClick={onClusterOverflowClick}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
