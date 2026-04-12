import { getHostReact } from '@coongro/plugin-sdk';

import { useIsMobile } from '../../hooks/useIsMobile.js';
import { TOKENS } from '../../styles/tokens.js';
import type { WeekGridProps } from '../../types/components.js';
import {
  getWeekDays,
  getShortDayName,
  generateTimeSlots,
  toDateString,
  isSameDay,
} from '../../utils/date.js';
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

export function WeekGrid({
  startDate,
  events,
  startHour = 8,
  endHour = 20,
  slotDuration = 60,
  renderEvent,
  onEventClick,
  onSlotClick,
  showWeekends = true,
}: WeekGridProps) {
  const isMobile = useIsMobile();
  const slotHeight = isMobile ? SLOT_HEIGHT_MOBILE : SLOT_HEIGHT_DESKTOP;
  const gutterWidth = isMobile ? GUTTER_WIDTH_MOBILE : GUTTER_WIDTH_DESKTOP;

  const weekDays = useMemo(() => {
    const d = new Date(startDate);
    const all = getWeekDays(d);
    return showWeekends ? all : all.filter((day) => day.getDay() !== 0 && day.getDay() !== 6);
  }, [startDate, showWeekends]);

  const timeSlots = useMemo(
    () => generateTimeSlots(startHour, endHour, slotDuration),
    [startHour, endHour, slotDuration]
  );

  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);

  const slotsPerHour = Math.round(60 / slotDuration);
  const now = new Date();

  const { nowHour, nowTimeStr, gridStartMin, gridEndMin, nowInRange, nowTop } = computeNowPosition(
    startHour,
    endHour,
    slotDuration,
    slotHeight
  );

  // Formato de hora para el gutter
  const formatGutterTime = (slot: string, idx: number) => {
    if (idx % slotsPerHour !== 0) return '';
    if (isMobile) return slot.split(':')[0]; // "08"
    return slot; // "08:00"
  };

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

    // ── Day headers ──
    React.createElement(
      'div',
      { style: { display: 'flex', flexShrink: 0, borderBottom: `1px solid ${TOKENS.border}` } },

      // Gutter header vacío
      React.createElement('div', {
        style: {
          width: `${gutterWidth}px`,
          flexShrink: 0,
          borderRight: `1px solid ${TOKENS.border}`,
        },
      }),

      // Headers de días
      ...weekDays.map((day) => {
        const isToday = isSameDay(day, now);
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const dayName = isMobile ? getShortDayName(day).charAt(0) : getShortDayName(day);

        const numProps = dayNumberStyles(isToday, isWeekend);
        const todayFontSize = isMobile ? '17px' : '22px';
        const normalFontSize = isMobile ? '15px' : '20px';

        const headerStyle: Record<string, string> = {
          flex: '1',
          padding: isMobile ? '8px 0 6px' : '12px 0 10px',
          textAlign: 'center',
          borderRight: `1px solid ${TOKENS.border}`,
          minWidth: '0',
          background: dayBackground(isToday, isWeekend),
        };

        const nameStyle: Record<string, string> = {
          fontSize: isMobile ? '9px' : '10px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: dayNameColor(isToday, isWeekend),
          marginBottom: isMobile ? '2px' : '4px',
        };

        const numStyle: Record<string, string> = {
          fontFamily: TOKENS.fontSerif,
          fontSize: isToday ? todayFontSize : normalFontSize,
          fontWeight: numProps.fontWeight,
          color: numProps.color,
          lineHeight: '1',
        };

        return React.createElement(
          'div',
          { key: toDateString(day), style: headerStyle },
          React.createElement('div', { style: nameStyle }, dayName),
          React.createElement('div', { style: numStyle }, day.getDate())
        );
      })
    ),

    // ── Grid body (scrollable) ──
    React.createElement(
      'div',
      { style: { flex: '1', overflowY: 'auto', overflowX: 'hidden' } as any },

      // Wrapper interno con altura fija = total de slots (el scroll es del padre)
      React.createElement(
        'div',
        { style: { display: 'flex', height: `${timeSlots.length * slotHeight}px` } },

        // Time gutter
        React.createElement(
          'div',
          {
            style: {
              width: `${gutterWidth}px`,
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
                  padding: isMobile ? '0 4px' : '0 10px',
                  fontSize: isMobile ? '10px' : '11px',
                  fontWeight: isNowHour ? '700' : '500',
                  color: isNowHour ? TOKENS.red : TOKENS.ink3,
                  transform: i === 0 ? 'none' : 'translateY(-7px)',
                },
              },
              isNowHour ? nowTimeStr : formatGutterTime(slot, i)
            );
          })
        ),

        // Day columns
        React.createElement(
          'div',
          { style: { display: 'flex', flex: '1' } },
          ...weekDays.map((day) => {
            const dateStr = toDateString(day);
            const isToday = isSameDay(day, now);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const dayEvents = eventsByDay[dateStr] ?? [];

            const colBg = dayColumnBackground(isToday, isWeekend);
            const colStyle: Record<string, string> = {
              flex: '1',
              position: 'relative',
              borderRight: `1px solid ${TOKENS.border}`,
              minWidth: '0',
              ...(colBg ? { background: colBg } : {}),
            };

            return React.createElement(
              'div',
              { key: dateStr, style: colStyle },

              // Slots de fondo
              ...timeSlots.map((slot, _slotIdx) =>
                React.createElement('div', {
                  key: `slot-${slot}`,
                  style: {
                    height: `${slotHeight}px`,
                    borderBottom: `1px solid color-mix(in srgb, var(--cg-border) 40%, transparent)`,
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

              // Now line (gold triangle marker)
              isToday && nowInRange && renderNowLine(nowTop),

              // Eventos posicionados
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
                    renderEvent && !isMobile
                      ? renderEvent(evt, {
                          variant: 'week',
                          height: Math.max(slotHeight / 2, height),
                        })
                      : isMobile
                        ? // Mobile: bloque coloreado con texto 7px truncado (variante F)
                          React.createElement(
                            'div',
                            {
                              style: {
                                width: '100%',
                                height: '100%',
                                borderRadius: '3px',
                                background: `color-mix(in srgb, ${evt.color ?? TOKENS.gold} 20%, transparent)`,
                                padding: '2px 3px',
                                overflow: 'hidden',
                                cursor: onEventClick ? 'pointer' : 'default',
                                opacity: evt.status === 'cancelled' ? '0.4' : '1',
                              },
                              onClick: onEventClick ? () => onEventClick(evt) : undefined,
                            },
                            React.createElement(
                              'span',
                              {
                                style: {
                                  fontSize: '7px',
                                  fontWeight: '600',
                                  color: TOKENS.ink2,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block',
                                  lineHeight: '1.2',
                                  textDecoration:
                                    evt.status === 'cancelled' ? 'line-through' : 'none',
                                },
                              },
                              evt.title
                            )
                          )
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
