/**
 * TimeSlotList — Selector de hora con dos niveles:
 *   Nivel 1: grilla 3-col de slots rápidos + botón "Hora exacta..."
 *   Nivel 2: columnas scrolleables hora (0-23) + minuto (configurable step)
 * Reutilizado por TimePicker (standalone) y DateTimePicker (inline).
 */
import { getHostReact } from '@coongro/plugin-sdk';

import { generateTimeSlots } from '../../utils/date.js';

const React = getHostReact();
const { useState, useMemo, useEffect, useRef, useCallback } = React;

export interface TimeSlotListProps {
  value?: string;
  onChange?: (time: string) => void;
  /** Intervalo de la grilla rápida en minutos (default: 30) */
  step?: number;
  /** Hora mínima visible (default: '00:00') */
  minTime?: string;
  /** Hora máxima visible (default: '23:59') */
  maxTime?: string;
  /** Intervalo de minutos en las columnas (default: 5) */
  minuteStep?: number;
  /** Formato 24h vs 12h AM/PM (default: true) */
  use24Hour?: boolean;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function getHourRange(minTime: string, maxTime: string): number[] {
  const min = parseInt(minTime.split(':')[0], 10);
  const max = parseInt(maxTime.split(':')[0], 10);
  const hours: number[] = [];
  for (let h = min; h <= max; h++) hours.push(h);
  return hours;
}

function getMinuteRange(minuteStep: number): number[] {
  const mins: number[] = [];
  for (let m = 0; m < 60; m += minuteStep) mins.push(m);
  return mins;
}

function ampm(hour: number): string {
  return hour < 12 ? 'AM' : 'PM';
}

function hour12(hour: number): number {
  return hour % 12 || 12;
}

function formatHour(hour: number, use24Hour: boolean): string {
  if (use24Hour) return pad2(hour);
  return `${hour12(hour)} ${ampm(hour)}`;
}

function formatSlot(slot: string, use24Hour: boolean): string {
  if (use24Hour) return slot;
  const [h, m] = slot.split(':').map(Number);
  return `${hour12(h)}:${pad2(m)} ${ampm(h)}`;
}

// Layout en línea (cross-plugin compatible). Colores, bordes y estados van por clase con
// los tokens cg-*: el estilo en línea no tiene hover, foco ni transición.
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cg-gold-deep focus-visible:ring-offset-1 focus-visible:ring-offset-cg-surface';
const PRESS_TRANSITION =
  'cursor-pointer transition-[background-color,border-color,color,transform] duration-cg-fast ease-cg-standard active:scale-[0.97] active:duration-cg-instant';

const CLASSES = {
  slot: `${PRESS_TRANSITION} ${FOCUS_RING} border border-solid border-cg-border bg-cg-surface text-cg-text-secondary font-medium hover:border-cg-border-md hover:bg-cg-bg-hover`,
  slotActive: `${PRESS_TRANSITION} ${FOCUS_RING} border border-solid border-cg-accent bg-cg-accent-bg text-cg-accent font-bold`,
  customBtn: `${PRESS_TRANSITION} ${FOCUS_RING} border border-dashed border-cg-border-md bg-cg-bg text-cg-text-muted hover:bg-cg-bg-hover hover:text-cg-text`,
  // Celdas de las columnas: sin escala (son filas de una lista), foco hacia adentro
  cell: 'cursor-pointer transition-colors duration-cg-fast ease-cg-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cg-gold-deep bg-transparent text-cg-text-secondary font-medium hover:bg-cg-bg-hover',
  cellActive:
    'cursor-pointer transition-colors duration-cg-fast ease-cg-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cg-gold-deep bg-cg-accent-bg text-cg-accent font-bold',
  backBtn: `${PRESS_TRANSITION} ${FOCUS_RING} border-0 bg-transparent text-cg-text-muted hover:bg-cg-bg-hover hover:text-cg-text`,
};

const slotBase = {
  padding: '10px 4px',
  fontSize: '13px',
  textAlign: 'center',
  borderRadius: '7px',
  fontFamily: 'inherit',
} as Record<string, string>;

const cellBase = {
  padding: '8px 4px',
  textAlign: 'center',
  fontSize: '14px',
  minHeight: '38px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderBottomStyle: 'solid',
  borderBottomWidth: '1px',
  borderBottomColor: 'var(--cg-border)',
  width: '100%',
  fontFamily: 'inherit',
} as Record<string, string>;

const STYLES = {
  slotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
    maxHeight: '240px',
    overflowY: 'auto',
  } as Record<string, string>,
  slot: slotBase,
  customBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '10px',
    marginTop: '8px',
    fontSize: '12px',
    fontWeight: '500',
    borderRadius: '7px',
    fontFamily: 'inherit',
  } as Record<string, string>,
  label: {
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--cg-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  } as Record<string, string>,
  colScroll: {
    border: '1px solid var(--cg-border)',
    borderRadius: '7px',
    background: 'var(--cg-bg)',
    height: '200px',
    minHeight: '200px',
    flexShrink: '0',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    WebkitOverflowScrolling: 'touch',
  } as Record<string, string>,
  cell: cellBase,
};

type ViewLevel = 'slots' | 'exact';

export function TimeSlotList({
  value = '',
  onChange,
  step = 30,
  minTime = '00:00',
  maxTime = '23:59',
  minuteStep = 5,
  use24Hour = true,
}: TimeSlotListProps) {
  const [viewLevel, setViewLevel] = useState<ViewLevel>('slots');

  const [h, m] = value ? value.split(':').map(Number) : [9, 0];
  const [selectedHour, setSelectedHour] = useState(h);
  const [selectedMinute, setSelectedMinute] = useState(m);

  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  // Radix react-remove-scroll bloquea wheel/touch events cuando el target directo
  // (un button) no es scrolleable. Forzamos scroll manual en el contenedor.
  const handleColWheel = useCallback((e: WheelEvent) => {
    const container = e.currentTarget as HTMLDivElement;
    container.scrollTop += e.deltaY;
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const touchStartY = useRef(0);
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const handleTouchMove = useCallback((e: TouchEvent) => {
    const container = e.currentTarget as HTMLDivElement;
    const deltaY = touchStartY.current - e.touches[0].clientY;
    container.scrollTop += deltaY;
    touchStartY.current = e.touches[0].clientY;
    e.stopPropagation();
  }, []);

  // Sync con value externo
  useEffect(() => {
    if (value) {
      const [vh, vm] = value.split(':').map(Number);
      setSelectedHour(vh);
      setSelectedMinute(vm);
    }
  }, [value]);

  const hours = useMemo(() => getHourRange(minTime, maxTime), [minTime, maxTime]);
  const minutes = useMemo(() => getMinuteRange(minuteStep), [minuteStep]);
  const quickSlots = useMemo(() => {
    const startHour = parseInt(minTime.split(':')[0], 10);
    const endHour = parseInt(maxTime.split(':')[0], 10) + 1;
    return generateTimeSlots(startHour, Math.min(endHour, 24), step);
  }, [step, minTime, maxTime]);

  const currentValue = `${pad2(selectedHour)}:${pad2(selectedMinute)}`;

  const handleSlotClick = useCallback(
    (slot: string) => {
      const [sh, sm] = slot.split(':').map(Number);
      setSelectedHour(sh);
      setSelectedMinute(sm);
      onChange?.(slot);
    },
    [onChange]
  );

  const handleHourClick = useCallback(
    (hour: number) => {
      setSelectedHour(hour);
      const newValue = `${pad2(hour)}:${pad2(selectedMinute)}`;
      onChange?.(newValue);
    },
    [selectedMinute, onChange]
  );

  const handleMinuteClick = useCallback(
    (minute: number) => {
      setSelectedMinute(minute);
      const newValue = `${pad2(selectedHour)}:${pad2(minute)}`;
      onChange?.(newValue);
    },
    [selectedHour, onChange]
  );

  // Scroll al item activo cuando se abre el nivel 2
  useEffect(() => {
    if (viewLevel === 'exact') {
      const scrollToActive = (ref: { current: HTMLDivElement | null }, index: number) => {
        if (ref.current) {
          const cellHeight = 38;
          ref.current.scrollTop = Math.max(0, index * cellHeight - cellHeight * 2);
        }
      };
      const hourIdx = hours.indexOf(selectedHour);
      const minuteIdx = minutes.indexOf(selectedMinute);
      setTimeout(() => {
        scrollToActive(hourScrollRef, hourIdx >= 0 ? hourIdx : 0);
        scrollToActive(minuteScrollRef, minuteIdx >= 0 ? minuteIdx : 0);
      }, 50);
    }
  }, [viewLevel, selectedHour, selectedMinute, hours, minutes]);

  // ── Nivel 1: Grilla de slots ──
  if (viewLevel === 'slots') {
    return React.createElement(
      'div',
      { style: { padding: '12px 16px' } },
      React.createElement(
        'div',
        { style: { ...STYLES.label, marginBottom: '8px' } },
        'Seleccionar hora'
      ),
      React.createElement(
        'div',
        {
          style: STYLES.slotGrid,
          onWheel: handleColWheel,
          onTouchStart: handleTouchStart,
          onTouchMove: handleTouchMove,
        },
        quickSlots.map((slot) =>
          React.createElement(
            'button',
            {
              key: slot,
              type: 'button',
              className: currentValue === slot ? CLASSES.slotActive : CLASSES.slot,
              style: STYLES.slot,
              'aria-pressed': currentValue === slot,
              onClick: () => handleSlotClick(slot),
              'data-time': slot,
              'aria-label': formatSlot(slot, use24Hour),
            },
            formatSlot(slot, use24Hour)
          )
        )
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          className: CLASSES.customBtn,
          style: STYLES.customBtn,
          onClick: () => setViewLevel('exact'),
        },
        'Hora exacta...'
      )
    );
  }

  // ── Nivel 2: Columnas hora + minuto ──
  return React.createElement(
    'div',
    { style: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' } },

    // Header con back
    React.createElement(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
      React.createElement(
        'button',
        {
          type: 'button',
          className: CLASSES.backBtn,
          style: {
            fontSize: '14px',
            padding: '4px 8px',
            borderRadius: '7px',
            fontFamily: 'inherit',
          },
          onClick: () => setViewLevel('slots'),
        },
        '‹ Volver'
      )
    ),

    // Display grande
    React.createElement(
      'div',
      { style: { textAlign: 'center', padding: '4px' } },
      React.createElement(
        'span',
        {
          style: {
            fontFamily: "'Noto Serif JP', serif",
            fontSize: '32px',
            fontWeight: '900',
            letterSpacing: '2px',
          },
        },
        use24Hour ? pad2(selectedHour) : formatHour(selectedHour, false),
        React.createElement('span', { style: { color: 'var(--cg-accent)' } }, ':'),
        pad2(selectedMinute)
      )
    ),

    // Columnas
    React.createElement(
      'div',
      { style: { display: 'flex', gap: '12px' } },

      // HORA
      React.createElement(
        'div',
        { style: { flex: '1', display: 'flex', flexDirection: 'column' } },
        React.createElement(
          'div',
          { style: { ...STYLES.label, textAlign: 'center', marginBottom: '6px' } },
          'Hora'
        ),
        React.createElement(
          'div',
          {
            ref: hourScrollRef,
            style: STYLES.colScroll,
            onWheel: handleColWheel,
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
          },
          hours.map((hour) =>
            React.createElement(
              'button',
              {
                key: hour,
                type: 'button',
                className: selectedHour === hour ? CLASSES.cellActive : CLASSES.cell,
                style: STYLES.cell,
                'aria-pressed': selectedHour === hour,
                onClick: () => handleHourClick(hour),
                'data-hour': pad2(hour),
                'aria-label': `Hora ${pad2(hour)}`,
              },
              use24Hour ? pad2(hour) : formatHour(hour, false)
            )
          )
        )
      ),

      // MINUTO
      React.createElement(
        'div',
        { style: { flex: '1', display: 'flex', flexDirection: 'column' } },
        React.createElement(
          'div',
          { style: { ...STYLES.label, textAlign: 'center', marginBottom: '6px' } },
          'Minuto'
        ),
        React.createElement(
          'div',
          {
            ref: minuteScrollRef,
            style: STYLES.colScroll,
            onWheel: handleColWheel,
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
          },
          minutes.map((minute) =>
            React.createElement(
              'button',
              {
                key: minute,
                type: 'button',
                className: selectedMinute === minute ? CLASSES.cellActive : CLASSES.cell,
                style: STYLES.cell,
                'aria-pressed': selectedMinute === minute,
                onClick: () => handleMinuteClick(minute),
                'data-minute': pad2(minute),
                'aria-label': `Minuto ${pad2(minute)}`,
              },
              pad2(minute)
            )
          )
        )
      )
    )
  );
}
