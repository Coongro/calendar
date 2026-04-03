/**
 * DateTimePicker — Input con popover de calendario + selector de hora.
 * Reutiliza CalendarGrid (fecha) y TimeSlotList (hora) sin duplicar lógica.
 * Tap en hora reemplaza el calendario por la lista de slots (sin popovers anidados).
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useCalendarSettings } from '../../hooks/useCalendarSettings.js';
import type { DateTimePickerProps } from '../../types/components.js';
import { toDateString, getMonthName } from '../../utils/date.js';

import { CalendarGrid } from './CalendarGrid.js';
import { TimeSlotList } from './TimeSlotList.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback } = React;

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
  const minuteStep = minuteStepProp ?? settings.minuteStep;
  const use24Hour = use24HourProp ?? settings.use24Hour;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PopoverView>('calendar');

  // Extraer fecha y hora del string local (YYYY-MM-DDTHH:MM)
  const dateStr = value ? value.substring(0, 10) : '';
  const timeStr = value && value.length >= 16 ? value.substring(11, 16) : '';
  const dateObj = dateStr ? new Date(`${dateStr}T00:00:00`) : null;

  // Formatear display para el input
  const displayValue = dateObj ? `${dateObj.toLocaleDateString('es')} — ${timeStr || '—'}` : '';

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
      buildDatetime(dateStr || toDateString(new Date()), time);
    },
    [buildDatetime, dateStr]
  );

  const handleNow = useCallback(() => {
    const now = new Date();
    const date = toDateString(now);
    const time = now.toLocaleTimeString('es', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    onChange?.(`${date}T${time}`);
    setView('calendar');
  }, [onChange]);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    setView('calendar');
  }, []);

  // Label de fecha para el header de time slots
  const selectedDateLabel = dateObj
    ? `${dateObj.getDate()} ${getMonthName(dateObj.getMonth()).substring(0, 3)} ${dateObj.getFullYear()}`
    : '';

  return React.createElement(
    UI.Popover,
    {
      open,
      onOpenChange: (o: boolean) => {
        setOpen(o);
        if (!o) setView('calendar');
      },
    },
    React.createElement(
      UI.PopoverTrigger,
      { asChild: true },
      React.createElement(UI.Input, {
        value: displayValue,
        readOnly: true,
        placeholder,
        className: `cursor-pointer ${className}`,
        onClick: () => setOpen(true),
      })
    ),
    React.createElement(
      UI.PopoverContent,
      { className: 'w-auto p-0 overflow-y-auto', style: { maxHeight: '80vh' } },

      // ── Vista: Calendario ──
      view === 'calendar' &&
        React.createElement(
          React.Fragment,
          null,
          // CalendarGrid
          React.createElement(
            'div',
            { style: { padding: '12px' } },
            React.createElement(CalendarGrid, {
              selectedDate: dateStr,
              onDateSelect: handleDateSelect,
              showMonthPicker: true,
              showYearPicker: true,
              showTodayButton: false,
              minDate,
              maxDate,
              daySize: 'md',
            })
          ),
          // Divider
          React.createElement('div', {
            style: { height: '1px', background: 'var(--cg-border, #E8E7E2)' },
          }),
          // Time bar (clickeable)
          React.createElement(
            'div',
            {
              style: {
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
              },
              className: 'hover:bg-cg-bg-hover transition-colors',
              onClick: () => setView('time'),
            },
            React.createElement(
              'span',
              {
                style: {
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--cg-text-muted, #9B9893)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  flexShrink: '0',
                },
              },
              'Hora'
            ),
            React.createElement(
              'span',
              { style: { fontSize: '14px', fontWeight: '500', flex: '1' } },
              timeStr || '—'
            ),
            React.createElement(
              'span',
              { style: { fontSize: '12px', color: 'var(--cg-text-muted, #9B9893)' } },
              '▾'
            )
          )
        ),

      // ── Vista: Selector de hora ──
      view === 'time' &&
        React.createElement(
          React.Fragment,
          null,
          // Header
          React.createElement(
            'div',
            {
              style: {
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid var(--cg-border, #E8E7E2)',
              },
            },
            React.createElement(
              UI.Button,
              {
                type: 'button',
                variant: 'ghost',
                size: 'sm',
                onClick: () => setView('calendar'),
              },
              '‹'
            ),
            React.createElement(
              'span',
              {
                style: {
                  fontFamily: "'Noto Serif JP', serif",
                  fontSize: '14px',
                  fontWeight: '700',
                },
              },
              'Hora'
            ),
            React.createElement(
              'span',
              {
                style: {
                  fontSize: '11px',
                  color: 'var(--cg-text-muted, #9B9893)',
                  fontWeight: '500',
                  marginLeft: 'auto',
                },
              },
              selectedDateLabel
            )
          ),
          // TimeSlotList con grilla rápida + columnas hora/minuto
          React.createElement(TimeSlotList, {
            value: timeStr,
            onChange: handleTimeSelect,
            step,
            minTime,
            maxTime,
            minuteStep,
            use24Hour,
          })
        ),

      // ── Footer (siempre visible) ──
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderTop: '1px solid var(--cg-border, #E8E7E2)',
            background: 'var(--cg-bg, #F6F5F1)',
          },
        },
        React.createElement(
          'button',
          {
            type: 'button',
            style: {
              fontSize: '12px',
              fontWeight: '700',
              color: 'var(--cg-accent, #F5A800)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '7px',
            },
            onClick: handleNow,
          },
          'Ahora'
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            style: {
              fontSize: '12px',
              fontWeight: '700',
              color: 'white',
              background: 'var(--cg-accent, #F5A800)',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 16px',
              borderRadius: '7px',
              minHeight: '32px',
            },
            onClick: handleConfirm,
          },
          'Confirmar'
        )
      )
    )
  );
}
