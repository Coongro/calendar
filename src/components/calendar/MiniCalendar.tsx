/**
 * MiniCalendar — Calendario compacto para sidebar.
 * Delega la grilla y navegación al CalendarGrid interno.
 */
import { getHostReact } from '@coongro/plugin-sdk';

import type { MiniCalendarProps } from '../../types/components.js';
import { CalendarGrid } from '../internal/CalendarGrid.js';

const React = getHostReact();

export function MiniCalendar({
  selectedDate,
  onDateSelect,
  eventDots = {},
  className = '',
}: MiniCalendarProps) {
  return React.createElement(CalendarGrid, {
    selectedDate,
    onDateSelect,
    eventDots,
    showMonthPicker: true,
    showYearPicker: true,
    showTodayButton: true,
    daySize: 'sm',
    className: `w-56 ${className}`,
  });
}
