import { getHostReact } from '@coongro/plugin-sdk';
import type { CalendarViewMode } from '../types/components.js';
import {
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  toDateString,
  getMonthName,
} from '../utils/date.js';

const React = getHostReact();
const { useState, useCallback, useMemo } = React;

export interface UseDateNavigationResult {
  currentDate: Date;
  view: CalendarViewMode;
  setView: (view: CalendarViewMode) => void;
  goToToday: () => void;
  goNext: () => void;
  goPrev: () => void;
  goToDate: (date: Date) => void;
  rangeStart: string;
  rangeEnd: string;
  title: string;
}

export function useDateNavigation(
  initialView: CalendarViewMode = 'week'
): UseDateNavigationResult {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarViewMode>(initialView);

  const goToToday = useCallback(() => setCurrentDate(new Date()), []);
  const goToDate = useCallback((date: Date) => setCurrentDate(date), []);

  const goNext = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      switch (view) {
        case 'day':
          d.setDate(d.getDate() + 1);
          break;
        case 'week':
          d.setDate(d.getDate() + 7);
          break;
        case 'month':
        case 'agenda':
          d.setMonth(d.getMonth() + 1);
          break;
      }
      return d;
    });
  }, [view]);

  const goPrev = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      switch (view) {
        case 'day':
          d.setDate(d.getDate() - 1);
          break;
        case 'week':
          d.setDate(d.getDate() - 7);
          break;
        case 'month':
        case 'agenda':
          d.setMonth(d.getMonth() - 1);
          break;
      }
      return d;
    });
  }, [view]);

  const { rangeStart, rangeEnd } = useMemo(() => {
    switch (view) {
      case 'day': {
        const dateStr = toDateString(currentDate);
        return {
          rangeStart: new Date(`${dateStr}T00:00:00`).toISOString(),
          rangeEnd: new Date(`${dateStr}T23:59:59.999`).toISOString(),
        };
      }
      case 'week': {
        const ws = getWeekStart(currentDate);
        const we = getWeekEnd(currentDate);
        return {
          rangeStart: ws.toISOString(),
          rangeEnd: we.toISOString(),
        };
      }
      case 'month':
      case 'agenda':
      default: {
        const ms = getMonthStart(currentDate.getFullYear(), currentDate.getMonth());
        const me = getMonthEnd(currentDate.getFullYear(), currentDate.getMonth());
        return {
          rangeStart: ms.toISOString(),
          rangeEnd: me.toISOString(),
        };
      }
    }
  }, [currentDate, view]);

  const title = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = getMonthName(currentDate.getMonth());
    switch (view) {
      case 'day':
        return `${currentDate.getDate()} ${m} ${y}`;
      case 'week': {
        const ws = getWeekStart(currentDate);
        const we = getWeekEnd(currentDate);
        if (ws.getMonth() === we.getMonth()) {
          return `${ws.getDate()} - ${we.getDate()} ${m} ${y}`;
        }
        return `${ws.getDate()} ${getMonthName(ws.getMonth())} - ${we.getDate()} ${getMonthName(we.getMonth())} ${y}`;
      }
      case 'month':
      case 'agenda':
      default:
        return `${m} ${y}`;
    }
  }, [currentDate, view]);

  return {
    currentDate,
    view,
    setView,
    goToToday,
    goNext,
    goPrev,
    goToDate,
    rangeStart,
    rangeEnd,
    title,
  };
}
