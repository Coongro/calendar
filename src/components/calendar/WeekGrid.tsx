import { getHostReact } from '@coongro/plugin-sdk';

import { useIsMobile } from '../../hooks/useIsMobile.js';
import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { TOKENS } from '../../styles/tokens.js';
import type { WeekGridProps } from '../../types/components.js';
import type { CalendarEvent } from '../../types/event.js';
import {
  getWeekDays,
  getShortDayName,
  generateTimeSlots,
  toDateString,
  toDateKey,
} from '../../utils/date.js';
import {
  SLOT_HEIGHT_DESKTOP,
  SLOT_HEIGHT_MOBILE,
  GUTTER_WIDTH_DESKTOP,
  GUTTER_WIDTH_MOBILE,
} from '../../utils/grid-constants.js';
import {
  computeNowPosition,
  groupEventsByDay,
  dayBackground,
  dayColumnBackground,
  dayNameColor,
  dayNumberStyles,
} from '../../utils/grid-helpers.js';
import { MobileWeekMiniCard } from '../event/MobileWeekMiniCard.js';

import { DayColumnCore } from './DayColumnCore.js';

const React = getHostReact();
const { useMemo } = React;

export function WeekGrid({
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
  showWeekends = true,
}: WeekGridProps) {
  const isMobile = useIsMobile();
  const tz = useTenantTimezone();
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
  const todayKey = toDateKey(now, tz);

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
        const isToday = toDateString(day) === todayKey;
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
            const isToday = toDateString(day) === todayKey;
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const dayEvents = eventsByDay[dateStr] ?? [];
            const colBg = dayColumnBackground(isToday, isWeekend);

            // En mobile, el ancho de columna (~52px) no deja espacio para EventCards —
            // sustituimos por MobileWeekMiniCard (bloque coloreado con titulo a 7px).
            // En desktop respetamos el renderEvent si el consumidor lo paso.
            const effectiveRenderEvent = isMobile
              ? (evt: CalendarEvent) =>
                  React.createElement(MobileWeekMiniCard, { event: evt, onClick: onEventClick })
              : renderEvent;

            return React.createElement(
              'div',
              {
                key: dateStr,
                style: {
                  flex: '1',
                  position: 'relative',
                  borderRight: `1px solid ${TOKENS.border}`,
                  minWidth: '0',
                  ...(colBg ? { background: colBg } : {}),
                },
              },
              React.createElement(DayColumnCore, {
                date: dateStr,
                events: dayEvents,
                timeSlots,
                slotDuration,
                slotHeight,
                gridStartMin,
                gridEndMin,
                isToday,
                nowInRange,
                nowTop,
                maxColumns: maxColumns ?? (isMobile ? 2 : 3),
                defaultVariant: 'week',
                sidePadding: 3,
                slotBorder: `1px solid color-mix(in srgb, ${TOKENS.border} 40%, transparent)`,
                renderEvent: effectiveRenderEvent,
                onEventClick,
                onSlotClick,
                onClusterOverflowClick,
              })
            );
          })
        )
      ) // cierra wrapper interno con altura fija
    )
  );
}
