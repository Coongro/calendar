import { addDays, getDayRange } from '@coongro/datetime';
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

import { useTenantTimezone } from './useTenantTimezone.js';

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
  rangeStart: Date;
  rangeEnd: Date;
  title: string;
}

export function useDateNavigation(
  initialView: CalendarViewMode = 'week',
  initialDate?: Date
): UseDateNavigationResult {
  const tz = useTenantTimezone();
  // Solo se usa en el primer render (lazy initializer); cambios posteriores de
  // initialDate no re-posicionan el calendario — para eso está goToDate.
  const [currentDate, setCurrentDate] = useState(() => initialDate ?? new Date());
  const [view, setView] = useState<CalendarViewMode>(initialView);

  const goToToday = useCallback(() => setCurrentDate(new Date()), []);
  const goToDate = useCallback((date: Date) => setCurrentDate(date), []);

  const navigate = useCallback(
    (direction: 1 | -1) => {
      setCurrentDate((prev) => {
        const d = new Date(prev);
        switch (view) {
          case 'day':
            d.setDate(d.getDate() + direction);
            break;
          case 'three-day':
            d.setDate(d.getDate() + 3 * direction);
            break;
          case 'week':
            d.setDate(d.getDate() + 7 * direction);
            break;
          case 'month':
          case 'agenda':
            d.setMonth(d.getMonth() + direction);
            break;
        }
        return d;
      });
    },
    [view]
  );

  const goNext = useCallback(() => navigate(1), [navigate]);
  const goPrev = useCallback(() => navigate(-1), [navigate]);

  const { rangeStart, rangeEnd } = useMemo(() => {
    switch (view) {
      case 'day': {
        const dk = toDateString(currentDate);
        const r = getDayRange(dk, tz);
        return { rangeStart: r.startUTC, rangeEnd: r.endUTC };
      }
      case 'three-day': {
        const dkStart = toDateString(currentDate);
        const dkEnd = addDays(dkStart, 2);
        return {
          rangeStart: getDayRange(dkStart, tz).startUTC,
          rangeEnd: getDayRange(dkEnd, tz).endUTC,
        };
      }
      case 'week': {
        const dkStart = toDateString(getWeekStart(currentDate));
        const dkEnd = toDateString(getWeekEnd(currentDate));
        return {
          rangeStart: getDayRange(dkStart, tz).startUTC,
          rangeEnd: getDayRange(dkEnd, tz).endUTC,
        };
      }
      case 'month':
      case 'agenda':
      default: {
        const dkStart = toDateString(
          getMonthStart(currentDate.getFullYear(), currentDate.getMonth())
        );
        const dkEnd = toDateString(getMonthEnd(currentDate.getFullYear(), currentDate.getMonth()));
        return {
          rangeStart: getDayRange(dkStart, tz).startUTC,
          rangeEnd: getDayRange(dkEnd, tz).endUTC,
        };
      }
    }
  }, [currentDate, view, tz]);

  const title = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = getMonthName(currentDate.getMonth());
    switch (view) {
      case 'day':
        return `${currentDate.getDate()} ${m} ${y}`;
      case 'three-day': {
        const tdEnd = new Date(currentDate);
        tdEnd.setDate(tdEnd.getDate() + 2);
        if (currentDate.getMonth() === tdEnd.getMonth()) {
          return `${currentDate.getDate()} – ${tdEnd.getDate()} ${m} ${y}`;
        }
        return `${currentDate.getDate()} ${getMonthName(currentDate.getMonth())} – ${tdEnd.getDate()} ${getMonthName(tdEnd.getMonth())} ${y}`;
      }
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
