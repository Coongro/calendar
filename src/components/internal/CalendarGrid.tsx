import { Button } from '@coongro/ui-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';

import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { TOKENS } from '../../styles/tokens.js';
import { getMonthGridDays, getMonthName, toDateString, toDateKey } from '../../utils/date.js';
import { getDayGridKeyTarget } from '../../utils/day-grid-keys.js';

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

// Estados por clase (DS v2.3): el estilo en línea no tiene hover ni foco.
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cg-gold-deep focus-visible:ring-offset-1 focus-visible:ring-offset-cg-surface';
const COLOR_TRANSITION = 'transition-colors duration-cg-fast ease-cg-standard';

/** Clases de un día: el fondo de la selección cruza de un día a otro con transición de color. */
function dayButtonClass(
  isSelected: boolean,
  isToday: boolean,
  isCurrentMonth: boolean,
  disabled: boolean
): string {
  let color = '';
  if (!isCurrentMonth) color = 'text-cg-text-muted';
  else if (isSelected) color = 'text-cg-brand-text';
  else if (isToday) color = 'text-cg-accent';
  let opacity = '';
  if (disabled) opacity = 'opacity-20 cursor-not-allowed';
  else if (!isCurrentMonth) opacity = 'opacity-40';
  return [
    'relative mx-auto rounded-full border-0',
    COLOR_TRANSITION,
    FOCUS_RING,
    disabled ? '' : 'cursor-pointer',
    isSelected
      ? 'bg-cg-accent hover:bg-cg-accent-hover'
      : 'bg-transparent hover:bg-cg-bg-hover active:bg-cg-bg-active',
    // Hoy: anillo fino dorado (si no está elegido)
    isToday && !isSelected ? 'shadow-[inset_0_0_0_1px_var(--cg-accent)]' : '',
    isSelected || isToday ? 'font-bold' : '',
    color,
    opacity,
  ]
    .filter(Boolean)
    .join(' ');
}

/** Entrada del mes nuevo desde el lado hacia el que se avanzó (solo con movimiento permitido). */
function monthSlideClass(direction: 0 | 1 | -1): string | undefined {
  if (direction === 1) return 'motion-safe:animate-cg-month-next';
  if (direction === -1) return 'motion-safe:animate-cg-month-prev';
  return undefined;
}

/** Clases de un mes o año en los selectores: el elegido en dorado suave. */
function pickerButtonClass(isActive: boolean): string {
  const state = isActive
    ? 'border-cg-accent bg-cg-accent-bg text-cg-accent font-bold'
    : 'border-cg-border bg-transparent font-medium hover:bg-cg-bg-hover';
  return `cursor-pointer ${COLOR_TRANSITION} ${FOCUS_RING} ${state}`;
}

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
  const tz = useTenantTimezone();
  const selectedKey = selectedDate ?? null;
  const todayKey = toDateKey(new Date(), tz);
  const selected = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null;
  const [viewYear, setViewYear] = useState(
    () => selected?.getFullYear() ?? new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(() => selected?.getMonth() ?? new Date().getMonth());
  const [viewLevel, setViewLevel] = useState<ViewLevel>('days');
  const [yearRangeStart, setYearRangeStart] = useState(() => Math.floor(viewYear / 12) * 12);

  const days = useMemo(() => getMonthGridDays(viewYear, viewMonth), [viewYear, viewMonth]);

  // ── Teclado: tabIndex móvil (una sola parada de Tab para los días) ──
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // Día a enfocar cuando el mes pedido ya está a la vista (navegación con teclado entre meses)
  const pendingFocusRef = useRef<string | null>(null);
  // Sentido del último cambio de mes: el mes nuevo entra desde ese lado
  const [slideDirection, setSlideDirection] = useState<0 | 1 | -1>(0);

  // Notificar cambio de mes
  useEffect(() => {
    onMonthChange?.(viewYear, viewMonth);
  }, [viewYear, viewMonth, onMonthChange]);

  const isDateDisabled = (date: Date): boolean =>
    (!!minDate && date < new Date(`${minDate}T00:00:00`)) ||
    (!!maxDate && date > new Date(`${maxDate}T23:59:59`));

  // ── Navegación ──
  const goNextMonth = () => {
    setSlideDirection(1);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };
  const goPrevMonth = () => {
    setSlideDirection(-1);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const goToToday = () => {
    setSlideDirection(0);
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
    setSlideDirection(0);
    setViewMonth(month);
    setViewLevel('days');
  };

  const handleYearSelect = (year: number) => {
    setSlideDirection(0);
    setViewYear(year);
    setViewLevel('months');
  };

  const handleDaySelect = (day: Date) => {
    if (isDateDisabled(day)) return;
    const dateStr = toDateString(day);
    onDateSelect?.(dateStr);
    onDayClick?.(dateStr);
  };

  const dayKeys: string[] = days.map((d) => toDateString(d));
  const inMonthKeys = days
    .filter((d) => d.getMonth() === viewMonth)
    .map((d): string => toDateString(d));
  // El día con tabIndex 0: el último enfocado, el elegido, hoy o el 1.º del mes (el primero a la vista)
  const tabStopKey =
    [activeKey, selectedKey, todayKey].find((k) => k && inMonthKeys.includes(k)) ?? inMonthKeys[0];

  const focusDay = (key: string) => {
    setActiveKey(key);
    dayRefs.current.get(key)?.focus();
  };

  // Tras pasar de mes con el teclado, enfocar el día pedido cuando ya está renderizado
  const dayKeysSignature = dayKeys.join(',');
  useEffect(() => {
    const key = pendingFocusRef.current;
    if (!key || !dayKeys.includes(key)) return;
    pendingFocusRef.current = null;
    focusDay(key);
  }, [dayKeysSignature]);

  const handleDayKeyDown = (e: KeyboardEvent<HTMLButtonElement>, day: Date) => {
    // Enter y Espacio los resuelve el <button> (clic nativo)
    const target = getDayGridKeyTarget(e.key, day);
    if (!target) return;
    e.preventDefault();
    if (isDateDisabled(target)) return;
    const key = toDateString(target);
    const isPageKey = e.key === 'PageUp' || e.key === 'PageDown';
    if (!isPageKey && dayKeys.includes(key)) {
      focusDay(key);
      return;
    }
    // Otro mes: se cambia la vista y el foco llega cuando el mes nuevo se renderiza
    pendingFocusRef.current = key;
    setActiveKey(key);
    setSlideDirection(target > day ? 1 : -1);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Mes anterior"
          onClick={handlePrev}
        >
          ‹
        </Button>
        <button
          type="button"
          aria-label="Cambiar mes y año"
          disabled={!canClickTitle}
          onClick={canClickTitle ? handleTitleClick : undefined}
          className={`rounded-sm ${COLOR_TRANSITION} ${FOCUS_RING}`}
          style={{
            // Reset de estilos nativos de <button> para preservar la apariencia del <span> original
            border: 'none',
            background: 'transparent',
            padding: 0,
            font: 'inherit',
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
          }}
        >
          {renderTitle()}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Mes siguiente"
          onClick={handleNext}
        >
          ›
        </Button>
      </div>
      {/* ── Day grid ── */}
      {viewLevel === 'days' && (
        <>
          {/* Day headers */}
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}
          >
            {DAY_LETTERS.map((name) => (
              <div
                key={name}
                style={{
                  textAlign: 'center',
                  fontSize: '10px',
                  color: TOKENS.ink4,
                  padding: '2px 0',
                }}
              >
                {name}
              </div>
            ))}
          </div>
          {/* Days: el mes nuevo entra 8 px desde el lado hacia el que se avanzó; el */}
          {/* contenedor recorta el desplazamiento para que no aparezca scroll horizontal. */}
          <div style={{ overflowX: 'clip' } as CSSProperties}>
            <div
              key={`${viewYear}-${viewMonth}`}
              role="group"
              aria-label={`${getMonthName(viewMonth)} ${viewYear}`}
              className={monthSlideClass(slideDirection)}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
            >
              {days.map((day, i) => {
                const dateStr = toDateString(day);
                const isCurrentMonth = day.getMonth() === viewMonth;
                const isSelected = selectedKey !== null && dateStr === selectedKey;
                const isToday = dateStr === todayKey;
                const disabled = isDateDisabled(day);
                const dotCount = eventDots[dateStr] ?? 0;

                // Etiqueta legible para lectores de pantalla / copilotos: "15 de junio de 2026"
                const ariaLabel = `${day.getDate()} de ${getMonthName(day.getMonth()).toLowerCase()} de ${day.getFullYear()}`;

                return (
                  <button
                    key={i}
                    ref={(el: HTMLButtonElement | null) => {
                      if (el) dayRefs.current.set(dateStr, el);
                      else dayRefs.current.delete(dateStr);
                    }}
                    type="button"
                    disabled={disabled}
                    tabIndex={dateStr === tabStopKey ? 0 : -1}
                    data-date={dateStr}
                    aria-label={ariaLabel}
                    /* aria-selected no es válido en un <button>: el día elegido se anuncia como presionado */
                    aria-pressed={isSelected}
                    aria-current={isToday ? 'date' : undefined}
                    aria-disabled={disabled}
                    className={dayButtonClass(isSelected, isToday, isCurrentMonth, disabled)}
                    style={{
                      width: daySizePx,
                      height: daySizePx,
                      fontSize: dayFontSize,
                    }}
                    onClick={() => {
                      setActiveKey(dateStr);
                      handleDaySelect(day);
                    }}
                    onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => handleDayKeyDown(e, day)}
                  >
                    {day.getDate()}
                    {dotCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '2px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '4px',
                          height: '4px',
                          borderRadius: '9999px',
                          background: TOKENS.gold,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      {/* ── Month picker ── */}
      {viewLevel === 'months' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            padding: '4px 0',
          }}
        >
          {SHORT_MONTHS.map((name, idx) => {
            const isActive = idx === viewMonth;
            return (
              <button
                key={idx}
                type="button"
                data-month={idx}
                aria-pressed={isActive}
                className={pickerButtonClass(isActive)}
                style={{
                  padding: '10px 0',
                  fontSize: '12px',
                  borderRadius: TOKENS.rSm,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
                onClick={() => handleMonthSelect(idx)}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}
      {/* ── Year picker ── */}
      {viewLevel === 'years' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            padding: '4px 0',
          }}
        >
          {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((year) => {
            const isActive = year === viewYear;
            return (
              <button
                key={year}
                type="button"
                data-year={year}
                aria-pressed={isActive}
                className={pickerButtonClass(isActive)}
                style={{
                  padding: '10px 0',
                  fontSize: '12px',
                  borderRadius: TOKENS.rSm,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
                onClick={() => handleYearSelect(year)}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}
      {/* ── Botón Hoy ── */}
      {showTodayButton && (
        <button
          type="button"
          className={`cursor-pointer bg-transparent text-cg-accent hover:bg-cg-bg-hover active:bg-cg-bg-active ${COLOR_TRANSITION} ${FOCUS_RING}`}
          style={{
            width: '100%',
            fontSize: '12px',
            fontWeight: '700',
            marginTop: '8px',
            padding: '8px 0',
            borderRadius: '0 0 7px 7px',
            border: 'none',
            borderTop: `1px solid ${TOKENS.border}`,
          }}
          onClick={goToToday}
        >
          Hoy
        </button>
      )}
    </div>
  );
}
