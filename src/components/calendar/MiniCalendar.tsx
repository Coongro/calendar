import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import type { MiniCalendarProps } from '../../types/components.js';
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

export function MiniCalendar({
  selectedDate,
  onDateSelect,
  eventDots = {},
  className = '',
}: MiniCalendarProps) {
  const selected = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null;
  const [viewYear, setViewYear] = useState(
    () => selected?.getFullYear() ?? new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(() => selected?.getMonth() ?? new Date().getMonth());

  const days = useMemo(() => getMonthGridDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const weekDayHeaders = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const ref = new Date(2024, 0, d === 0 ? 7 : d);
    return getShortDayName(ref);
  });

  return React.createElement(
    'div',
    { className: `w-56 ${className}` },

    // Header
    React.createElement(
      'div',
      { className: 'flex items-center justify-between mb-2' },
      React.createElement(
        UI.Button,
        { type: 'button', variant: 'ghost', size: 'sm', onClick: goPrev },
        '‹'
      ),
      React.createElement(
        'span',
        { className: 'text-xs font-medium' },
        `${getMonthName(viewMonth)} ${viewYear}`
      ),
      React.createElement(
        UI.Button,
        { type: 'button', variant: 'ghost', size: 'sm', onClick: goNext },
        '›'
      )
    ),

    // Days of week
    React.createElement(
      'div',
      { className: 'grid grid-cols-7 mb-1' },
      weekDayHeaders.map((name) =>
        React.createElement(
          'div',
          { key: name, className: 'text-center text-[10px] text-cg-text-muted py-0.5' },
          name
        )
      )
    ),

    // Day grid
    React.createElement(
      'div',
      { className: 'grid grid-cols-7' },
      days.map((day, i) => {
        const dateStr = toDateString(day);
        const isCurrentMonth = day.getMonth() === viewMonth;
        const isSelected = selected && isSameDay(day, selected);
        const isToday = isSameDay(day, new Date());
        const dotCount = eventDots[dateStr] ?? 0;

        return React.createElement(
          'button',
          {
            key: i,
            type: 'button',
            className: `relative w-7 h-7 text-[11px] rounded-full transition-colors ${
              isSelected
                ? 'bg-cg-accent text-white font-bold'
                : isToday
                  ? 'ring-1 ring-cg-accent text-cg-accent font-bold hover:bg-cg-accent/10'
                  : 'hover:bg-cg-bg-hover'
            } ${!isCurrentMonth ? 'text-cg-text-muted opacity-40' : ''}`,
            onClick: () => onDateSelect?.(dateStr),
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
  );
}
