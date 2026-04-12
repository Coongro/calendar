/**
 * CalendarGrid — Componente interno reutilizable para grilla de calendario.
 * Usado por MiniCalendar y DatePicker. Incluye navegación por mes/año y botón "Hoy".
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { TOKENS } from '../../styles/tokens.js';
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

  const daySizePx = daySize === 'md' ? '36px' : '28px';
  const dayFontSize = daySize === 'md' ? '14px' : '11px';

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
    { style: { display: 'flex', flexDirection: 'column' } as any },

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
          onClick: canClickTitle ? handleTitleClick : undefined,
          style: {
            fontSize: '12px',
            fontWeight: viewLevel !== 'days' ? '700' : '500',
            color: viewLevel !== 'days' ? TOKENS.gold : undefined,
            cursor: canClickTitle ? 'pointer' : undefined,
            ...(canClickTitle
              ? {
                  textDecoration: 'underline',
                  textDecorationStyle: 'dotted',
                  textUnderlineOffset: '3px',
                  textDecorationColor: TOKENS.ink4,
                }
              : {}),
          } as any,
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
              {
                key: name,
                style: {
                  textAlign: 'center',
                  fontSize: '10px',
                  color: TOKENS.ink4,
                  padding: '2px 0',
                },
              },
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

            // Estilos condicionales segun estado del dia
            const stateStyle: Record<string, string> = {};
            if (isSelected) {
              stateStyle.background = TOKENS.gold;
              stateStyle.color = 'var(--cg-brand-text)';
              stateStyle.fontWeight = '700';
            } else if (isToday) {
              stateStyle.boxShadow = `inset 0 0 0 1px ${TOKENS.gold}`;
              stateStyle.color = TOKENS.gold;
              stateStyle.fontWeight = '700';
            }

            if (!isCurrentMonth) {
              stateStyle.color = TOKENS.ink4;
              stateStyle.opacity = '0.4';
            }

            return React.createElement(
              'button',
              {
                key: i,
                type: 'button',
                disabled,
                style: {
                  position: 'relative',
                  width: daySizePx,
                  height: daySizePx,
                  fontSize: dayFontSize,
                  borderRadius: '9999px',
                  transition: 'background 0.15s, color 0.15s',
                  margin: '0 auto',
                  border: 'none',
                  background: 'transparent',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? '0.2' : stateStyle.opacity || '1',
                  ...stateStyle,
                },
                onClick: () => handleDaySelect(day),
              },
              day.getDate(),
              dotCount > 0 &&
                React.createElement('span', {
                  style: {
                    position: 'absolute',
                    bottom: '2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '4px',
                    height: '4px',
                    borderRadius: '9999px',
                    background: TOKENS.gold,
                  },
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
        SHORT_MONTHS.map((name, idx) => {
          const isActive = idx === viewMonth;
          return React.createElement(
            'button',
            {
              key: idx,
              type: 'button',
              style: {
                padding: '10px 0',
                fontSize: '12px',
                fontWeight: isActive ? '700' : '500',
                borderRadius: TOKENS.rSm,
                border: `1px solid ${isActive ? TOKENS.gold : TOKENS.border}`,
                background: isActive ? TOKENS.goldLt : 'transparent',
                color: isActive ? TOKENS.gold : undefined,
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
              },
              onClick: () => handleMonthSelect(idx),
            },
            name
          );
        })
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
        Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((year) => {
          const isActive = year === viewYear;
          return React.createElement(
            'button',
            {
              key: year,
              type: 'button',
              style: {
                padding: '10px 0',
                fontSize: '12px',
                fontWeight: isActive ? '700' : '500',
                borderRadius: TOKENS.rSm,
                border: `1px solid ${isActive ? TOKENS.gold : TOKENS.border}`,
                background: isActive ? TOKENS.goldLt : 'transparent',
                color: isActive ? TOKENS.gold : undefined,
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
              },
              onClick: () => handleYearSelect(year),
            },
            year
          );
        })
      ),

    // ── Botón Hoy ──
    showTodayButton &&
      React.createElement(
        'button',
        {
          type: 'button',
          style: {
            width: '100%',
            fontSize: '12px',
            fontWeight: '700',
            color: TOKENS.gold,
            marginTop: '8px',
            padding: '8px 0',
            borderRadius: '0 0 7px 7px',
            background: 'transparent',
            border: 'none',
            borderTop: `1px solid ${TOKENS.border}`,
            cursor: 'pointer',
            transition: 'background 0.15s',
          },
          onClick: goToToday,
        },
        'Hoy'
      )
  );
}
