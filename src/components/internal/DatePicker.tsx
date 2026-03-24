import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import type { DatePickerProps } from '../../types/components.js';
import {
  getMonthGridDays,
  getShortDayName,
  getMonthName,
  toDateString,
  isSameDay,
} from '../../utils/date.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useMemo } = React;

export function DatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  minDate,
  maxDate,
  className = '',
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() =>
    value ? new Date(`${value}T00:00:00`).getFullYear() : new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(() =>
    value ? new Date(`${value}T00:00:00`).getMonth() : new Date().getMonth()
  );

  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;

  const days = useMemo(() => getMonthGridDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const isDisabled = (date: Date): boolean =>
    (!!minDate && date < new Date(minDate)) || (!!maxDate && date > new Date(maxDate));

  const handleSelect = (date: Date) => {
    if (isDisabled(date)) return;
    onChange?.(toDateString(date));
    setOpen(false);
  };

  // Días de la semana (Lun-Dom)
  const weekDayHeaders = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const ref = new Date(2024, 0, d === 0 ? 7 : d);
    return getShortDayName(ref);
  });

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
      })
    ),
    React.createElement(
      UI.PopoverContent,
      { className: 'w-auto p-3' },

      // Navegación mes
      React.createElement(
        'div',
        { className: 'flex items-center justify-between mb-2' },
        React.createElement(
          UI.Button,
          { type: 'button', variant: 'ghost', size: 'sm', onClick: goPrevMonth },
          '‹'
        ),
        React.createElement(
          'span',
          { className: 'text-sm font-medium' },
          `${getMonthName(viewMonth)} ${viewYear}`
        ),
        React.createElement(
          UI.Button,
          { type: 'button', variant: 'ghost', size: 'sm', onClick: goNextMonth },
          '›'
        )
      ),

      // Headers
      React.createElement(
        'div',
        { className: 'grid grid-cols-7 mb-1' },
        weekDayHeaders.map((name) =>
          React.createElement(
            'div',
            { key: name, className: 'text-center text-xs text-cg-text-muted py-1' },
            name
          )
        )
      ),

      // Días
      React.createElement(
        'div',
        { className: 'grid grid-cols-7' },
        days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === viewMonth;
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const disabled = isDisabled(day);

          return React.createElement(
            'button',
            {
              key: i,
              type: 'button',
              disabled,
              className: `w-8 h-8 text-sm rounded-full transition-colors ${
                isSelected ? 'bg-cg-accent text-white' : isToday ? 'bg-cg-bg-hover font-bold' : ''
              } ${!isCurrentMonth ? 'text-cg-text-muted opacity-40' : ''} ${
                disabled ? 'opacity-20 cursor-not-allowed' : 'hover:bg-cg-bg-hover cursor-pointer'
              }`,
              onClick: () => handleSelect(day),
            },
            day.getDate()
          );
        })
      )
    )
  );
}
