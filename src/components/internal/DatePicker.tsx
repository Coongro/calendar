/**
 * DatePicker — Input con popover de calendario.
 * Delega la grilla y navegación al CalendarGrid interno.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import type { DatePickerProps } from '../../types/components.js';

import { CalendarGrid } from './CalendarGrid.js';

const React = getHostReact();
const UI = getHostUI();
const { useState } = React;

export function DatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  minDate,
  maxDate,
  className = '',
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return React.createElement(
    UI.Popover,
    { open, onOpenChange: setOpen },
    React.createElement(
      UI.PopoverTrigger,
      { asChild: true },
      React.createElement(UI.Input, {
        value: value ? new Date(`${value}T00:00:00`).toLocaleDateString('es') : '',
        readOnly: true,
        placeholder,
        className: `cursor-pointer ${className}`,
        onClick: () => setOpen(true),
        'data-cg-control': 'date',
      })
    ),
    React.createElement(
      UI.PopoverContent,
      { className: 'w-auto p-3' },
      React.createElement(CalendarGrid, {
        selectedDate: value,
        onDateSelect: onChange,
        onDayClick: () => setOpen(false),
        showMonthPicker: true,
        showYearPicker: true,
        showTodayButton: false,
        minDate,
        maxDate,
        daySize: 'md',
      })
    )
  );
}
