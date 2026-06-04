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

// Estilos inline (cross-plugin compatible)
const slotBase = {
  padding: '10px 4px',
  fontSize: '13px',
  textAlign: 'center',
  borderRadius: '7px',
  cursor: 'pointer',
  transition: 'all 0.15s',
  fontFamily: 'inherit',
} as Record<string, string>;

const cellBase = {
  padding: '8px 4px',
  textAlign: 'center',
  fontSize: '14px',
  cursor: 'pointer',
  minHeight: '38px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.1s',
  border: 'none',
  borderBottomStyle: 'solid',
  borderBottomWidth: '1px',
  borderBottomColor: 'var(--cg-border, #E8E7E2)',
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
  slot: {
    ...slotBase,
    fontWeight: '500',
    border: '1px solid var(--cg-border, #E8E7E2)',
    background: 'var(--cg-surface, #FFFFFF)',
    color: 'var(--cg-text-secondary, #3A3731)',
  } as Record<string, string>,
  slotActive: {
    ...slotBase,
    fontWeight: '700',
    border: '1px solid var(--cg-accent, #F5A800)',
    background: 'var(--cg-accent-bg, #FFFBF0)',
    color: 'var(--cg-accent, #F5A800)',
  } as Record<string, string>,
  customBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '10px',
    marginTop: '8px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--cg-text-muted, #6B6760)',
    background: 'var(--cg-bg, #F6F5F1)',
    border: '1px dashed var(--cg-border-md, #D4D3CC)',
    borderRadius: '7px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  } as Record<string, string>,
  label: {
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--cg-text-muted, #9B9893)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  } as Record<string, string>,
  colScroll: {
    border: '1px solid var(--cg-border, #E8E7E2)',
    borderRadius: '7px',
    background: 'var(--cg-bg, #F6F5F1)',
    height: '200px',
    minHeight: '200px',
    flexShrink: '0',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    WebkitOverflowScrolling: 'touch',
  } as Record<string, string>,
  cell: {
    ...cellBase,
    fontWeight: '500',
    color: 'var(--cg-text-secondary, #3A3731)',
    background: 'transparent',
  } as Record<string, string>,
  cellActive: {
    ...cellBase,
    fontWeight: '700',
    color: 'var(--cg-accent, #F5A800)',
    background: 'var(--cg-accent-bg, #FFFBF0)',
  } as Record<string, string>,
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
              style: currentValue === slot ? STYLES.slotActive : STYLES.slot,
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
          style: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'var(--cg-text-muted, #9B9893)',
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
        React.createElement('span', { style: { color: 'var(--cg-accent, #F5A800)' } }, ':'),
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
                style: selectedHour === hour ? STYLES.cellActive : STYLES.cell,
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
                style: selectedMinute === minute ? STYLES.cellActive : STYLES.cell,
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
