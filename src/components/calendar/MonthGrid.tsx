import { useIsMobile } from '@coongro/plugin-sdk';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';

import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { TOKENS } from '../../styles/tokens.js';
import type { MonthGridProps } from '../../types/components.js';
import type { CalendarEvent } from '../../types/event.js';
import {
  getMonthGridDays,
  getMonthName,
  getShortDayName,
  toDateString,
  toDateKey,
} from '../../utils/date.js';
import { getDayGridKeyTarget, isActivationKey } from '../../utils/day-grid-keys.js';
import { groupEventsByDay } from '../../utils/grid-helpers.js';
import { EventCard } from '../event/EventCard.js';

// Nombres de 1 letra para mobile
function getDayNumberStyle(
  isToday: boolean,
  isMobile: boolean,
  isCurrentMonth: boolean
): CSSProperties {
  const size = isMobile ? 32 : 24;
  const fontSize = isMobile ? '14px' : '12px';

  if (isToday) {
    return {
      width: `${size}px`,
      height: `${size}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      background: TOKENS.gold,
      color: 'var(--cg-brand-text)',
      fontWeight: 700,
      fontSize,
    };
  }

  return {
    fontSize: isMobile ? '14px' : '12px',
    color: isCurrentMonth ? TOKENS.ink : TOKENS.ink4,
  };
}

// Fondo de la celda por clase (no en línea) para que el hover y el foco puedan pisarlo.
function getDayCellBgClass(isCurrentMonth: boolean, isWeekend: boolean, isToday: boolean): string {
  if (isToday) return 'bg-[color-mix(in_srgb,var(--cg-accent)_5%,transparent)]';
  if (!isCurrentMonth) return 'bg-[color-mix(in_srgb,var(--cg-text-muted)_3%,transparent)]';
  if (isWeekend) return 'bg-[color-mix(in_srgb,var(--cg-bg-secondary)_30%,transparent)]';
  return '';
}

// Celda de día: transición de color con tokens y anillo dorado con el foco de teclado.
const DAY_CELL_CLASS =
  'transition-colors duration-cg-fast ease-cg-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cg-gold-deep';
// Solo si el día se puede abrir: puntero, hover y presionado.
const DAY_CELL_ACTION_CLASS = 'cursor-pointer hover:bg-cg-bg-hover active:bg-cg-bg-active';

function dayLabel(day: Date, eventCount: number): string {
  const date = `${day.getDate()} de ${getMonthName(day.getMonth()).toLowerCase()} de ${day.getFullYear()}`;
  if (eventCount === 0) return date;
  return `${date}, ${eventCount} evento${eventCount === 1 ? '' : 's'}`;
}

const SHORT_DAY_LETTERS: Record<number, string> = {
  0: 'D',
  1: 'L',
  2: 'M',
  3: 'X',
  4: 'J',
  5: 'V',
  6: 'S',
};

// Contenido de la celda: número del día y eventos (puntos en celular, tarjetas en escritorio).
function renderDayContent(
  day: Date,
  isToday: boolean,
  isCurrentMonth: boolean,
  isMobile: boolean,
  dayEvents: CalendarEvent[],
  renderEvent: MonthGridProps['renderEvent'],
  onEventClick: MonthGridProps['onEventClick']
) {
  return (
    <>
      {/* Número del día */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'center' : 'space-between',
          marginBottom: isMobile ? 0 : '4px',
        }}
      >
        <div style={getDayNumberStyle(isToday, isMobile, isCurrentMonth)}>{day.getDate()}</div>
      </div>
      {/* Eventos: dots en mobile, cards en desktop */}
      {isMobile ? (
        dayEvents.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '2px',
              marginTop: '4px',
            }}
          >
            {dayEvents.slice(0, 3).map((evt) => (
              <span
                key={evt.id}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: evt.color ?? 'var(--cg-accent)',
                }}
              />
            ))}
          </div>
        )
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '2px',
          }}
        >
          {dayEvents
            .slice(0, 3)
            .map((evt) =>
              renderEvent ? (
                <Fragment key={evt.id}>{renderEvent(evt)}</Fragment>
              ) : (
                <EventCard
                  key={evt.id}
                  event={evt}
                  variant="mini"
                  showTime={false}
                  onClick={onEventClick}
                />
              )
            )}
          {dayEvents.length > 3 && (
            <div
              style={{
                fontSize: '10px',
                color: TOKENS.ink4,
                paddingLeft: '4px',
              }}
            >
              {`+${dayEvents.length - 3} más`}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function MonthGrid({
  year,
  month,
  events,
  renderEvent,
  onEventClick,
  onDayClick,
  showWeekends = true,
  className = '',
  onNavigateToDate,
  focusDate,
}: MonthGridProps) {
  const isMobile = useIsMobile('sm');
  const tz = useTenantTimezone();
  const todayKey = toDateKey(new Date(), tz);
  const days = useMemo(() => getMonthGridDays(year, month), [year, month]);

  const eventsByDate = useMemo(() => groupEventsByDay(events, tz), [events, tz]);

  // Filtrar columnas según showWeekends
  const weekDayIndices = showWeekends ? [1, 2, 3, 4, 5, 6, 0] : [1, 2, 3, 4, 5];
  const colCount = showWeekends ? 7 : 5;

  const weekDayHeaders = weekDayIndices.map((d) => {
    if (isMobile) return SHORT_DAY_LETTERS[d];
    const ref = new Date(2024, 0, d === 0 ? 7 : d);
    return getShortDayName(ref);
  });

  // Filtrar días si no se muestran fines de semana
  const filteredDays = showWeekends
    ? days
    : days.filter((d) => d.getDay() !== 0 && d.getDay() !== 6);
  const dayKeys: string[] = filteredDays.map((d) => toDateString(d));

  // ── Teclado: tabIndex móvil (una sola parada de Tab para toda la grilla) ──
  const gridRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef(new Map<string, HTMLDivElement>());
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // El día con tabIndex 0: el último enfocado si sigue a la vista; si no, hoy o el 1.º del mes.
  const inMonthKeys = filteredDays
    .filter((d) => d.getMonth() === month)
    .map((d): string => toDateString(d));
  let tabStopKey = inMonthKeys.includes(todayKey) ? todayKey : (inMonthKeys[0] ?? dayKeys[0]);
  if (activeKey && dayKeys.includes(activeKey)) tabStopKey = activeKey;

  const focusDay = (key: string) => {
    setActiveKey(key);
    cellRefs.current.get(key)?.focus();
  };

  // Tras navegar con el teclado a otro mes, el foco vuelve al día pedido. Solo si el foco
  // se perdió (la grilla se volvió a montar) o sigue adentro: nunca se lo roba a otro control.
  const dayKeysSignature = dayKeys.join(',');
  useEffect(() => {
    if (!focusDate || !dayKeys.includes(focusDate)) return;
    const active = document.activeElement;
    const focusLost = !active || active === document.body;
    if (focusLost || gridRef.current?.contains(active)) focusDay(focusDate);
  }, [focusDate, dayKeysSignature]);

  const handleDayKeyDown = (e: KeyboardEvent<HTMLDivElement>, day: Date, key: string) => {
    // Solo la celda: las teclas dentro de un evento son del evento.
    if (e.target !== e.currentTarget) return;
    if (isActivationKey(e.key)) {
      if (!onDayClick) return;
      e.preventDefault();
      setActiveKey(key);
      onDayClick(key);
      return;
    }
    const target = getDayGridKeyTarget(e.key, day, !showWeekends);
    if (!target) return;
    e.preventDefault();
    const targetKey = toDateString(target);
    const isPageKey = e.key === 'PageUp' || e.key === 'PageDown';
    if (!isPageKey && dayKeys.includes(targetKey)) focusDay(targetKey);
    else if (onNavigateToDate) onNavigateToDate(targetKey);
    else if (dayKeys.includes(targetKey)) focusDay(targetKey);
  };

  // Filas de la grilla ARIA: `display: contents` no altera la grilla CSS de 7 (o 5) columnas.
  const weeks: Date[][] = [];
  for (let i = 0; i < filteredDays.length; i += colCount) {
    weeks.push(filteredDays.slice(i, i + colCount));
  }

  const renderDayCell = (day: Date, i: number) => {
    const dateStr = toDateString(day);
    const isCurrentMonth = day.getMonth() === month;
    const isToday = dateStr === todayKey;
    const dayEvents = eventsByDate[dateStr] ?? [];

    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

    return (
      <div
        key={i}
        ref={(el: HTMLDivElement | null) => {
          if (el) cellRefs.current.set(dateStr, el);
          else cellRefs.current.delete(dateStr);
        }}
        role="gridcell"
        tabIndex={dateStr === tabStopKey ? 0 : -1}
        aria-label={dayLabel(day, dayEvents.length)}
        aria-current={isToday ? 'date' : undefined}
        data-date={dateStr}
        className={[
          DAY_CELL_CLASS,
          getDayCellBgClass(isCurrentMonth, isWeekend, isToday),
          onDayClick ? DAY_CELL_ACTION_CLASS : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          minHeight: '64px',
          borderBottom: `1px solid ${TOKENS.border}`,
          borderRight: `1px solid ${TOKENS.border}`,
          padding: '4px',
        }}
        onClick={
          onDayClick
            ? () => {
                setActiveKey(dateStr);
                onDayClick(dateStr);
              }
            : undefined
        }
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => handleDayKeyDown(e, day, dateStr)}
      >
        {renderDayContent(
          day,
          isToday,
          isCurrentMonth,
          isMobile,
          dayEvents,
          renderEvent,
          onEventClick
        )}
      </div>
    );
  };

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label={`${getMonthName(month)} ${year}`}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column' as const,
      }}
    >
      {/* Header */}
      <div
        role="row"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
          borderBottom: `1px solid ${TOKENS.border}`,
        }}
      >
        {weekDayHeaders.map((name) => (
          <div
            key={name}
            role="columnheader"
            style={{
              textAlign: 'center' as const,
              fontSize: '12px',
              color: TOKENS.ink4,
              padding: '8px 0',
              fontWeight: 500,
            }}
          >
            {name}
          </div>
        ))}
      </div>
      {/* Grid */}
      <div
        role="rowgroup"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
          flex: 1,
        }}
      >
        {weeks.map((week, w) => (
          <div key={w} role="row" style={{ display: 'contents' }}>
            {week.map((day, d) => renderDayCell(day, w * colCount + d))}
          </div>
        ))}
      </div>
    </div>
  );
}
