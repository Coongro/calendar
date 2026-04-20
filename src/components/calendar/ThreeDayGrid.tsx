/**
 * ThreeDayGrid — Vista de 3 dias para mobile.
 * Columnas de ~110px donde caben los event cards con timebar+body.
 * Referencia: design/week-3day-mobile.html
 */
import { getHostReact } from '@coongro/plugin-sdk';

import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { TOKENS } from '../../styles/tokens.js';
import type { WeekGridProps } from '../../types/components.js';
import { getShortDayName, generateTimeSlots, toDateString, toDateKey } from '../../utils/date.js';
import { SLOT_HEIGHT_3DAY, GUTTER_WIDTH_3DAY, EVENT_Z } from '../../utils/grid-constants.js';
import {
  computeNowPosition,
  computeEventPosition,
  groupEventsByDay,
  renderNowLine,
  dayBackground,
  dayColumnBackground,
  dayNameColor,
  dayNumberStyles,
} from '../../utils/grid-helpers.js';
import { EventCard } from '../event/EventCard.js';

const React = getHostReact();
const { useMemo } = React;

const GUTTER_W = GUTTER_WIDTH_3DAY;

export function ThreeDayGrid({
  startDate,
  events,
  startHour = 8,
  endHour = 20,
  slotDuration = 60,
  renderEvent,
  onEventClick,
  onSlotClick,
}: WeekGridProps) {
  const tz = useTenantTimezone();
  const slotHeight = SLOT_HEIGHT_3DAY;

  // 3 dias consecutivos desde startDate
  const days = useMemo(() => {
    const base = new Date(startDate);
    return [0, 1, 2].map((offset) => {
      const d = new Date(base);
      d.setDate(d.getDate() + offset);
      return d;
    });
  }, [startDate]);

  const timeSlots = useMemo(
    () => generateTimeSlots(startHour, endHour, slotDuration),
    [startHour, endHour, slotDuration]
  );

  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);

  const slotsPerHour = Math.round(60 / slotDuration);
  const now = new Date();
  const todayKey = toDateKey(now, tz);

  const { nowHour, nowTimeStr, gridStartMin, gridEndMin, nowInRange, nowTop } = computeNowPosition(
    startHour,
    endHour,
    slotDuration,
    slotHeight
  );

  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      } as any,
    },

    // ── Day headers (3 letras, Warm Glow) ──
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexShrink: 0,
          borderBottom: `1px solid ${TOKENS.border}`,
          background: TOKENS.surface,
        },
      },
      React.createElement('div', {
        style: { width: `${GUTTER_W}px`, flexShrink: 0, borderRight: `1px solid ${TOKENS.border}` },
      }),
      ...days.map((day, i) => {
        const isToday = toDateString(day) === todayKey;
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

        return React.createElement(
          'div',
          {
            key: toDateString(day),
            style: {
              flex: '1',
              padding: '10px 0 8px',
              textAlign: 'center',
              borderRight: i < 2 ? `1px solid ${TOKENS.border}` : 'none',
              background: dayBackground(isToday, isWeekend),
              minWidth: '0',
            },
          },
          React.createElement(
            'div',
            {
              style: {
                fontSize: '10px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: dayNameColor(isToday, isWeekend),
                marginBottom: '3px',
              },
            },
            getShortDayName(day)
          ),
          React.createElement(
            'div',
            {
              style: {
                fontFamily: TOKENS.fontSerif,
                fontSize: isToday ? '20px' : '19px',
                ...dayNumberStyles(isToday, isWeekend),
                lineHeight: '1',
              },
            },
            day.getDate()
          )
        );
      })
    ),

    // ── Grid body ──
    React.createElement(
      'div',
      {
        style: {
          flex: '1',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        } as any,
      },

      // Wrapper interno con altura fija para que borderRight se extienda completo
      React.createElement(
        'div',
        { style: { display: 'flex', height: `${timeSlots.length * slotHeight}px` } },

        // Time gutter
        React.createElement(
          'div',
          {
            style: {
              width: `${GUTTER_W}px`,
              flexShrink: 0,
              borderRight: `1px solid ${TOKENS.border}`,
            },
          },
          timeSlots.map((slot, i) => {
            const [h] = slot.split(':').map(Number);
            const isNowHour = h === nowHour && i % slotsPerHour === 0 && nowInRange;

            return React.createElement(
              'div',
              {
                key: slot,
                style: {
                  height: `${slotHeight}px`,
                  display: 'flex',
                  alignItems: i === 0 ? 'center' : 'flex-start',
                  justifyContent: 'flex-end',
                  padding: '0 5px',
                  fontSize: '10px',
                  fontWeight: isNowHour ? '700' : '500',
                  color: isNowHour ? TOKENS.red : TOKENS.ink3,
                  transform: i === 0 ? 'none' : 'translateY(-6px)',
                },
              },
              isNowHour ? nowTimeStr : i % slotsPerHour === 0 ? slot : ''
            );
          })
        ),

        // 3 day columns
        React.createElement(
          'div',
          { style: { display: 'flex', flex: '1' } },
          ...days.map((day, dayIdx) => {
            const dateStr = toDateString(day);
            const isToday = toDateString(day) === todayKey;
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const dayEvents = eventsByDay[dateStr] ?? [];
            const colBg = dayColumnBackground(isToday, isWeekend);

            return React.createElement(
              'div',
              {
                key: dateStr,
                style: {
                  flex: '1',
                  position: 'relative',
                  borderRight: dayIdx < 2 ? `1px solid ${TOKENS.border}` : 'none',
                  minWidth: '0',
                  ...(colBg ? { background: colBg } : {}),
                },
              },

              // Slots
              ...timeSlots.map((slot) =>
                React.createElement('div', {
                  key: `slot-${slot}`,
                  style: {
                    height: `${slotHeight}px`,
                    borderBottom: `1px solid ${TOKENS.border}`,
                    cursor: onSlotClick ? 'pointer' : 'default',
                  },
                  onClick: onSlotClick
                    ? () => {
                        const [h, m] = slot.split(':').map(Number);
                        onSlotClick(dateStr, h + m / 60);
                      }
                    : undefined,
                })
              ),

              // Now line
              isToday && nowInRange && renderNowLine(nowTop),

              // Eventos
              ...dayEvents
                .map((evt) => {
                  const pos = computeEventPosition(
                    evt,
                    gridStartMin,
                    gridEndMin,
                    slotDuration,
                    slotHeight
                  );
                  if (!pos) return null;

                  const { topOffset, height } = pos;

                  return React.createElement(
                    'div',
                    {
                      key: evt.id,
                      style: {
                        position: 'absolute',
                        left: '3px',
                        right: '3px',
                        top: `${Math.max(0, topOffset)}px`,
                        height: `${Math.max(slotHeight / 2, height)}px`,
                        zIndex: String(EVENT_Z),
                      },
                    },
                    renderEvent
                      ? renderEvent(evt, {
                          variant: 'week',
                          height: Math.max(slotHeight / 2, height),
                        })
                      : React.createElement(EventCard, {
                          event: evt,
                          variant: 'week',
                          showTime: true,
                          onClick: onEventClick,
                        })
                  );
                })
                .filter(Boolean)
            );
          })
        )
      ) // cierra wrapper interno con altura fija
    )
  );
}
