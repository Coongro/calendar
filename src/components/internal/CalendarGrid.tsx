/**
 * CalendarGrid — Componente interno reutilizable para grilla de calendario.
 * Usado por MiniCalendar y DatePicker. Incluye navegación por mes/año y botón "Hoy".
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { getMonthGridDays, getMonthName, toDateString, isSameDay } from '../../utils/date.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useMemo, useEffect } = React;

const SHORT_MONTHS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type ViewLevel = 'days' | 'months' | 'years';

export interface CalendarGridProps {
  /** Fecha seleccionada (YYYY-MM-DD) */
  selectedDate?: string;
  /** Callback al seleccionar un día */
  onDateSelect?: (date: string) => void;
  /** Dots de eventos por fecha */
  eventDots?: Record<string, number>;
  /** Permitir seleccionar mes desde grilla */
  showMonthPicker?: boolean;
  /** Permitir seleccionar año desde grilla */
  showYearPicker?: boolean;
  /** Mostrar botón "Hoy" */
  showTodayButton?: boolean;
  /** Fecha mínima navegable */
  minDate?: string;
  /** Fecha máxima navegable */
  maxDate?: string;
  /** Callback al cambiar de mes/año (para cargar dots dinámicamente) */
  onMonthChange?: (year: number, month: number) => void;
  /** Callback al seleccionar un día (para DatePicker, cierra el popover) */
  onDayClick?: (date: string) => void;
  /** Tamaño de los botones de día */
  daySize?: 'sm' | 'md';
  className?: string;
}

export function CalendarGrid({
  selectedDate,
  onDateSelect,
  eventDots = {},
  showMonthPicker = true,
  showYearPicker = true,
  showTodayButton = true,
  minDate,
  maxDate,
  onMonthChange,
  onDayClick,
  daySize = 'sm',
  className = '',
}: CalendarGridProps) {
  const selected = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null;
  const [viewYear, setViewYear] = useState(
    () => selected?.getFullYear() ?? new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(() => selected?.getMonth() ?? new Date().getMonth());
  const [viewLevel, setViewLevel] = useState<ViewLevel>('days');
  const [yearRangeStart, setYearRangeStart] = useState(() => Math.floor(viewYear / 12) * 12);

  const days = useMemo(() => getMonthGridDays(viewYear, viewMonth), [viewYear, viewMonth]);

  // Notificar cambio de mes
  useEffect(() => {
    onMonthChange?.(viewYear, viewMonth);
  }, [viewYear, viewMonth, onMonthChange]);

  const isDateDisabled = (date: Date): boolean =>
    (!!minDate && date < new Date(`${minDate}T00:00:00`)) ||
    (!!maxDate && date > new Date(`${maxDate}T23:59:59`));

  // ── Navegación ──
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };
  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const goToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setViewLevel('days');
    onDateSelect?.(toDateString(now));
  };

  const handleTitleClick = () => {
    if (viewLevel === 'days' && showMonthPicker) setViewLevel('months');
    else if (viewLevel === 'months' && showYearPicker) setViewLevel('years');
  };

  const handleMonthSelect = (month: number) => {
    setViewMonth(month);
    setViewLevel('days');
  };

  const handleYearSelect = (year: number) => {
    setViewYear(year);
    setViewLevel('months');
  };

  const handleDaySelect = (day: Date) => {
    if (isDateDisabled(day)) return;
    const dateStr = toDateString(day);
    onDateSelect?.(dateStr);
    onDayClick?.(dateStr);
  };

  const daySizeClass = daySize === 'md' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-[11px]';

  // ── Header title ──
  const renderTitle = () => {
    if (viewLevel === 'years') return `${yearRangeStart} — ${yearRangeStart + 11}`;
    if (viewLevel === 'months') return `${viewYear}`;
    return `${getMonthName(viewMonth)} ${viewYear}`;
  };

  const handlePrev = () => {
    if (viewLevel === 'years') setYearRangeStart((y) => y - 12);
    else if (viewLevel === 'months') setViewYear((y) => y - 1);
    else goPrevMonth();
  };

  const handleNext = () => {
    if (viewLevel === 'years') setYearRangeStart((y) => y + 12);
    else if (viewLevel === 'months') setViewYear((y) => y + 1);
    else goNextMonth();
  };

  const canClickTitle =
    (viewLevel === 'days' && showMonthPicker) || (viewLevel === 'months' && showYearPicker);

  return React.createElement(
    'div',
    { className, style: { display: 'flex', flexDirection: 'column' } as any },

    // ── Header ──
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        },
      },
      React.createElement(
        UI.Button,
        { type: 'button', variant: 'ghost', size: 'sm', onClick: handlePrev },
        '‹'
      ),
      React.createElement(
        'span',
        {
          className: `text-xs font-medium ${canClickTitle ? 'cursor-pointer hover:text-cg-accent' : ''} ${viewLevel !== 'days' ? 'font-bold text-cg-accent' : ''}`,
          onClick: canClickTitle ? handleTitleClick : undefined,
          style: canClickTitle
            ? ({
                textDecoration: 'underline',
                textDecorationStyle: 'dotted',
                textUnderlineOffset: '3px',
                textDecorationColor: 'var(--cg-text-muted, #9B9893)',
              } as any)
            : undefined,
        },
        renderTitle()
      ),
      React.createElement(
        UI.Button,
        { type: 'button', variant: 'ghost', size: 'sm', onClick: handleNext },
        '›'
      )
    ),

    // ── Day grid ──
    viewLevel === 'days' &&
      React.createElement(
        React.Fragment,
        null,
        // Day headers
        React.createElement(
          'div',
          {
            style: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' },
          },
          DAY_LETTERS.map((name) =>
            React.createElement(
              'div',
              { key: name, className: 'text-center text-[10px] text-cg-text-muted py-0.5' },
              name
            )
          )
        ),
        // Days
        React.createElement(
          'div',
          { style: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' } },
          days.map((day, i) => {
            const dateStr = toDateString(day);
            const isCurrentMonth = day.getMonth() === viewMonth;
            const isSelected = selected && isSameDay(day, selected);
            const isToday = isSameDay(day, new Date());
            const disabled = isDateDisabled(day);
            const dotCount = eventDots[dateStr] ?? 0;

            let stateClass = 'hover:bg-cg-bg-hover';
            if (isSelected) stateClass = 'bg-cg-accent text-white font-bold';
            else if (isToday)
              stateClass = 'ring-1 ring-cg-accent text-cg-accent font-bold hover:bg-cg-accent/10';

            const monthClass = !isCurrentMonth ? 'text-cg-text-muted opacity-40' : '';
            const cursorClass = disabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer';

            return React.createElement(
              'button',
              {
                key: i,
                type: 'button',
                disabled,
                className: `relative ${daySizeClass} rounded-full transition-colors mx-auto ${stateClass} ${monthClass} ${cursorClass}`,
                onClick: () => handleDaySelect(day),
              },
              day.getDate(),
              dotCount > 0 &&
                React.createElement('span', {
                  className:
                    'absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cg-accent',
                })
            );
          })
        )
      ),

    // ── Month picker ──
    viewLevel === 'months' &&
      React.createElement(
        'div',
        {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            padding: '4px 0',
          },
        },
        SHORT_MONTHS.map((name, idx) =>
          React.createElement(
            'button',
            {
              key: idx,
              type: 'button',
              className: `py-2.5 text-xs font-medium rounded-md border transition-colors ${
                idx === viewMonth
                  ? 'bg-cg-accent/10 border-cg-accent text-cg-accent font-bold'
                  : 'border-cg-border hover:bg-cg-bg-hover'
              }`,
              onClick: () => handleMonthSelect(idx),
            },
            name
          )
        )
      ),

    // ── Year picker ──
    viewLevel === 'years' &&
      React.createElement(
        'div',
        {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            padding: '4px 0',
          },
        },
        Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((year) =>
          React.createElement(
            'button',
            {
              key: year,
              type: 'button',
              className: `py-2.5 text-xs font-medium rounded-md border transition-colors ${
                year === viewYear
                  ? 'bg-cg-accent/10 border-cg-accent text-cg-accent font-bold'
                  : 'border-cg-border hover:bg-cg-bg-hover'
              }`,
              onClick: () => handleYearSelect(year),
            },
            year
          )
        )
      ),

    // ── Botón Hoy ──
    showTodayButton &&
      React.createElement(
        'button',
        {
          type: 'button',
          className:
            'w-full text-xs font-bold text-cg-accent mt-2 pt-2 border-t border-cg-border hover:bg-cg-accent/5 transition-colors py-2 rounded-b',
          onClick: goToToday,
        },
        'Hoy'
      )
  );
}
