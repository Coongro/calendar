import { useFormat } from '@coongro/plugin-sdk';
import { Button, Input, Popover, PopoverContent, PopoverTrigger } from '@coongro/ui-components';
import { useCallback, useState } from 'react';

import { useCalendarSettings } from '../../hooks/useCalendarSettings.js';
import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import type { DateTimePickerProps } from '../../types/components.js';
import { getMonthName } from '../../utils/date.js';
import { dayKeyOf, timeOfDay } from '../../utils/zoned-day.js';

import { CalendarGrid } from './CalendarGrid.js';
import { TimeSlotList } from './TimeSlotList.js';

// Estados por clase (DS v2.3): hover, presionado y foco con los tokens de movimiento.
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cg-gold-deep focus-visible:ring-offset-1 focus-visible:ring-offset-cg-surface';
const TIME_BAR_CLASS =
  'bg-transparent transition-colors duration-cg-fast ease-cg-standard hover:bg-cg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cg-gold-deep';
const NOW_BUTTON_CLASS = `bg-transparent text-cg-accent transition-[background-color,transform] duration-cg-fast ease-cg-standard hover:bg-cg-bg-hover active:scale-[0.97] active:duration-cg-instant ${FOCUS_RING}`;
const CONFIRM_BUTTON_CLASS = `bg-cg-accent transition-[background-color,transform] duration-cg-fast ease-cg-standard hover:bg-cg-accent-hover active:scale-[0.97] active:duration-cg-instant ${FOCUS_RING}`;

type PopoverView = 'calendar' | 'time';

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha y hora',
  minDate,
  maxDate,
  step = 30,
  minTime = '00:00',
  maxTime = '23:59',
  minuteStep: minuteStepProp,
  use24Hour: use24HourProp,
  className = '',
}: DateTimePickerProps) {
  const { settings } = useCalendarSettings();
  const tz = useTenantTimezone();
  const minuteStep = minuteStepProp ?? settings.minuteStep;
  const use24Hour = use24HourProp ?? settings.use24Hour;
  const [open, setOpen] = useState(false);
  const f = useFormat();
  const [view, setView] = useState<PopoverView>('calendar');

  // Extraer fecha y hora del string local (YYYY-MM-DDTHH:MM)
  const dateStr = value ? value.substring(0, 10) : '';
  const timeStr = value && value.length >= 16 ? value.substring(11, 16) : '';
  const dateObj = dateStr ? new Date(`${dateStr}T00:00:00`) : null;

  // Formatear display para el input
  const displayValue = dateStr ? `${f.date(dateStr)} — ${timeStr || '—'}` : '';

  // Construir datetime string local (sin conversión a UTC)
  const buildDatetime = useCallback(
    (date: string, time: string) => {
      if (!date) return;
      const t = time || '09:00';
      // Formato local: YYYY-MM-DDTHH:MM — sin convertir a UTC
      onChange?.(`${date}T${t}`);
    },
    [onChange]
  );

  const handleDateSelect = useCallback(
    (date: string) => {
      buildDatetime(date, timeStr || '09:00');
    },
    [buildDatetime, timeStr]
  );

  const handleTimeSelect = useCallback(
    (time: string) => {
      buildDatetime(dateStr || dayKeyOf(new Date(), tz), time);
    },
    [buildDatetime, dateStr, tz]
  );

  const handleNow = useCallback(() => {
    // Fecha y hora de pared del negocio: el valor se interpreta en esa zona.
    const now = new Date();
    onChange?.(`${dayKeyOf(now, tz)}T${timeOfDay(now, tz)}`);
    setView('calendar');
  }, [onChange, tz]);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    setView('calendar');
  }, []);

  // Label de fecha para el header de time slots
  const selectedDateLabel = dateObj
    ? `${dateObj.getDate()} ${getMonthName(dateObj.getMonth()).substring(0, 3)} ${dateObj.getFullYear()}`
    : '';

  return (
    <Popover
      open={open}
      onOpenChange={(o: boolean) => {
        setOpen(o);
        if (!o) setView('calendar');
      }}
    >
      <PopoverTrigger>
        <Input
          value={displayValue}
          readOnly={true}
          placeholder={placeholder}
          className={`cursor-pointer ${className}`}
          onClick={() => setOpen(true)}
          data-cg-control="date"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 overflow-y-auto" style={{ maxHeight: '80vh' }}>
        {/* ── Vista: Calendario ── */}
        {view === 'calendar' && (
          <>
            {/* CalendarGrid */}
            <div style={{ padding: '12px' }}>
              <CalendarGrid
                selectedDate={dateStr}
                onDateSelect={handleDateSelect}
                showMonthPicker={true}
                showYearPicker={true}
                showTodayButton={false}
                minDate={minDate}
                maxDate={maxDate}
                daySize="md"
              />
            </div>
            {/* Divider */}
            <div style={{ height: '1px', background: 'var(--cg-border)' }} />
            {/* Time bar (clickeable) */}
            <button
              type="button"
              aria-label="Elegir hora"
              className={TIME_BAR_CLASS}
              style={{
                // Resets para que el <button> mantenga la apariencia del <div> original
                border: 'none',
                font: 'inherit',
                color: 'inherit',
                textAlign: 'left',
                width: '100%',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
              }}
              onClick={() => setView('time')}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--cg-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  flexShrink: '0',
                }}
              >
                Hora
              </span>
              <span style={{ fontSize: '14px', fontWeight: '500', flex: '1' }}>
                {timeStr || '—'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--cg-text-muted)' }}>▾</span>
            </button>
          </>
        )}
        {/* ── Vista: Selector de hora ── */}
        {view === 'time' && (
          <>
            {/* Header */}
            <div
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid var(--cg-border)',
              }}
            >
              <Button type="button" variant="ghost" size="sm" onClick={() => setView('calendar')}>
                ‹
              </Button>
              <span
                style={{
                  fontFamily: "'Noto Serif JP', serif",
                  fontSize: '14px',
                  fontWeight: '700',
                }}
              >
                Hora
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--cg-text-muted)',
                  fontWeight: '500',
                  marginLeft: 'auto',
                }}
              >
                {selectedDateLabel}
              </span>
            </div>
            {/* TimeSlotList con grilla rápida + columnas hora/minuto */}
            <TimeSlotList
              value={timeStr}
              onChange={handleTimeSelect}
              step={step}
              minTime={minTime}
              maxTime={maxTime}
              minuteStep={minuteStep}
              use24Hour={use24Hour}
            />
          </>
        )}
        {/* ── Footer (siempre visible) ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderTop: '1px solid var(--cg-border)',
            background: 'var(--cg-bg)',
          }}
        >
          <button
            type="button"
            className={NOW_BUTTON_CLASS}
            style={{
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '7px',
            }}
            onClick={handleNow}
          >
            Ahora
          </button>
          <button
            type="button"
            className={CONFIRM_BUTTON_CLASS}
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 16px',
              borderRadius: '7px',
              minHeight: '32px',
            }}
            onClick={handleConfirm}
          >
            Confirmar
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
