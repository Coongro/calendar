import { localToUTC } from '@coongro/datetime';
import { getHostReact, getHostUI, useViewContributions } from '@coongro/plugin-sdk';

import { useCalendarSettings } from '../../hooks/useCalendarSettings.js';
import { useDateNavigation } from '../../hooks/useDateNavigation.js';
import { useEvents } from '../../hooks/useEvents.js';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { TOKENS } from '../../styles/tokens.js';
import type { CalendarViewProps, CalendarViewMode } from '../../types/components.js';
import { toDateString } from '../../utils/date.js';

import { AgendaList } from './AgendaList.js';
import {
  MonthGridSkeleton,
  WeekGridSkeleton,
  DayColumnSkeleton,
  AgendaListSkeleton,
} from './CalendarSkeleton.js';
import { DayColumn } from './DayColumn.js';
import { MiniCalendar } from './MiniCalendar.js';
import { MonthGrid } from './MonthGrid.js';
import { ThreeDayGrid } from './ThreeDayGrid.js';
import { WeekGrid } from './WeekGrid.js';

const React = getHostReact();
const UI = getHostUI();

const VIEW_LABELS: Record<CalendarViewMode, string> = {
  month: 'Mes',
  week: 'Semana',
  'three-day': '3 días',
  day: 'Día',
  agenda: 'Agenda',
};

export function CalendarView({
  enabledViews = ['month', 'week', 'day', 'agenda'],
  defaultView,
  title,
  events: externalEvents,
  skipInternalEvents = false,
  loading: externalLoading,
  onDateRangeChange,
  renderEvent,
  renderToolbar,
  showCalendarSidebar = false,
  extraToolbarActions,
  daySlotHeight,
  onEventClick,
  onSlotClick,
  className = '',
}: CalendarViewProps) {
  const { settings } = useCalendarSettings();
  const isMobile = useIsMobile();
  const tz = useTenantTimezone();
  const nav = useDateNavigation(defaultView ?? settings.defaultView);

  const { data: internalEvents, loading: internalLoading } = useEvents({
    from: nav.rangeStart,
    to: nav.rangeEnd,
    autoFetch: !skipInternalEvents,
    pageSize: 500,
  });

  const { useMemo } = React;
  const events = useMemo(() => {
    const internal = skipInternalEvents ? [] : internalEvents;
    const external = externalEvents ?? [];
    // Internos ya vienen filtrados por useEvents (from/to). Solo filtrar externos.
    if (external.length === 0) return internal;
    const start = nav.rangeStart.getTime();
    const end = nav.rangeEnd.getTime();
    const filteredExternal = external.filter((e) => {
      const t = new Date(e.start_at).getTime();
      return t >= start && t <= end;
    });
    return [...internal, ...filteredExternal];
  }, [skipInternalEvents, internalEvents, externalEvents, nav.rangeStart, nav.rangeEnd]);
  const loading = (skipInternalEvents ? false : internalLoading) || (externalLoading ?? false);

  // Notificar al parent cuando cambia el rango visible
  const { useEffect, useRef } = React;
  const prevRange = useRef<string>('');
  useEffect(() => {
    if (!onDateRangeChange) return;
    const rangeKey = `${nav.rangeStart.toISOString()}|${nav.rangeEnd.toISOString()}`;
    if (rangeKey !== prevRange.current) {
      prevRange.current = rangeKey;
      onDateRangeChange(nav.rangeStart.toISOString(), nav.rangeEnd.toISOString());
    }
  }, [nav.rangeStart, nav.rangeEnd, onDateRangeChange]);

  const { sections: toolbarSections } = useViewContributions('calendar.view.toolbar');
  const { sections: sidebarSections } = useViewContributions('calendar.view.sidebar');

  // Mobile: las 4 vistas disponibles (day, three-day, week, month)
  // Desktop: week, day, month, agenda (sin three-day que es mobile-only)
  const effectiveView = nav.view;

  // Toolbar
  function renderMobileToolbar() {
    return React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '12px',
          marginBottom: '16px',
        },
      },
      // Title + extra actions row (solo si hay titulo o extraToolbarActions)
      (title || extraToolbarActions) &&
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
          },
          title
            ? React.createElement(
                'h1',
                {
                  style: {
                    fontFamily: TOKENS.fontSerif,
                    fontWeight: 900,
                    fontSize: '20px',
                    margin: 0,
                  },
                },
                title
              )
            : React.createElement('div'),
          extraToolbarActions
        ),
      // Nav row
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        },
        React.createElement(UI.Button, { variant: 'ghost', size: 'sm', onClick: nav.goPrev }, '‹'),
        React.createElement(
          'h2',
          {
            style: {
              fontSize: '16px',
              fontWeight: 600,
              margin: 0,
            },
          },
          nav.title
        ),
        React.createElement(UI.Button, { variant: 'ghost', size: 'sm', onClick: nav.goNext }, '›')
      ),
      // View switcher row
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            background: TOKENS.bg,
            borderRadius: '6px',
            padding: '2px',
          },
        },
        // Mobile: day, three-day, week, month (sin agenda)
        (['day', 'three-day', 'week', 'month'] as CalendarViewMode[])
          .filter((v) => enabledViews.includes(v) || v === 'three-day')
          .map((v) =>
            React.createElement(
              'button',
              {
                key: v,
                type: 'button',
                style: {
                  flex: 1,
                  padding: '8px 0',
                  fontSize: '12px',
                  fontWeight: 500,
                  borderRadius: '4px',
                  transition: 'background-color 0.15s, color 0.15s',
                  border: effectiveView === v ? `1px solid ${TOKENS.border}` : 'none',
                  background: effectiveView === v ? TOKENS.surface : 'transparent',
                  color: effectiveView === v ? TOKENS.ink : TOKENS.ink4,
                  cursor: 'pointer',
                },
                onClick: () => nav.setView(v),
              },
              VIEW_LABELS[v]
            )
          )
      )
    );
  }

  function renderDesktopToolbar() {
    return React.createElement(
      'div',
      {
        style: {
          padding: '0 0 14px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        },
      },

      // Izquierda: titulo + nav + fecha + hoy
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          },
        },
        title &&
          React.createElement(
            'h1',
            {
              style: {
                fontFamily: TOKENS.fontSerif,
                fontWeight: 900,
                fontSize: '22px',
                margin: 0,
              },
            },
            title
          ),
        // Grupo nav: ‹ fecha › Hoy — card surface
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 8px',
              background: TOKENS.surface,
              border: `1px solid ${TOKENS.border}`,
              borderRadius: TOKENS.rMd,
            },
          },
          React.createElement(
            'button',
            {
              style: {
                width: '28px',
                height: '28px',
                border: `1px solid ${TOKENS.border}`,
                borderRadius: TOKENS.rSm,
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: TOKENS.ink3,
              },
              onClick: nav.goPrev,
            },
            '‹'
          ),
          React.createElement(
            'span',
            {
              style: {
                fontSize: '14px',
                fontWeight: 500,
                minWidth: '160px',
                textAlign: 'center',
              },
            },
            nav.title
          ),
          React.createElement(
            'button',
            {
              style: {
                width: '28px',
                height: '28px',
                border: `1px solid ${TOKENS.border}`,
                borderRadius: TOKENS.rSm,
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: TOKENS.ink3,
              },
              onClick: nav.goNext,
            },
            '›'
          ),
          // Separador visual
          React.createElement('div', {
            style: { width: '1px', height: '20px', background: TOKENS.border, margin: '0 2px' },
          }),
          // Boton Hoy
          React.createElement(
            'button',
            {
              style: {
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 500,
                border: 'none',
                borderRadius: TOKENS.rSm,
                background: 'transparent',
                cursor: 'pointer',
                color: TOKENS.ink2,
                fontFamily: TOKENS.fontBody,
              },
              onClick: nav.goToToday,
            },
            'Hoy'
          )
        )
      ),

      // Derecha: view switcher + contributions + extras
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          },
        },

        // Contributions en toolbar
        ...toolbarSections.map((s, i) =>
          React.createElement(React.Fragment, { key: `toolbar-${String(i)}` }, s.render() as any)
        ),

        // View switcher — card surface con botones inline
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              padding: '4px',
              background: TOKENS.surface,
              border: `1px solid ${TOKENS.border}`,
              borderRadius: TOKENS.rMd,
              gap: '2px',
            },
          },
          enabledViews.map((v) =>
            React.createElement(
              'button',
              {
                key: v,
                style: {
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: TOKENS.rSm,
                  background: effectiveView === v ? TOKENS.ink : 'transparent',
                  color: effectiveView === v ? TOKENS.surface : TOKENS.ink3,
                  cursor: 'pointer',
                  fontFamily: TOKENS.fontBody,
                },
                onClick: () => nav.setView(v),
              },
              VIEW_LABELS[v]
            )
          )
        ),

        extraToolbarActions
      )
    );
  }

  let toolbar;
  if (renderToolbar) {
    toolbar = renderToolbar();
  } else if (isMobile) {
    toolbar = renderMobileToolbar();
  } else {
    toolbar = renderDesktopToolbar();
  }

  // Vista activa
  const renderActiveView = () => {
    if (loading) {
      switch (effectiveView) {
        case 'month':
          return React.createElement(MonthGridSkeleton, null);
        case 'three-day':
        case 'week':
          return React.createElement(WeekGridSkeleton, null);
        case 'day':
          return React.createElement(DayColumnSkeleton, null);
        case 'agenda':
          return React.createElement(AgendaListSkeleton, null);
        default:
          return React.createElement(MonthGridSkeleton, null);
      }
    }

    switch (effectiveView) {
      case 'month':
        return React.createElement(MonthGrid, {
          year: nav.currentDate.getFullYear(),
          month: nav.currentDate.getMonth(),
          events,
          renderEvent,
          onEventClick,
          onDayClick: (date) => {
            nav.goToDate(new Date(date));
            nav.setView('day');
          },
          showWeekends: settings.showWeekends,
        });
      case 'three-day':
        return React.createElement(ThreeDayGrid, {
          startDate: nav.rangeStart.toISOString(),
          events,
          startHour: settings.startHour,
          endHour: settings.endHour,
          slotDuration: settings.slotDuration,
          renderEvent,
          onEventClick,
          onSlotClick: onSlotClick
            ? (date, hour) =>
                onSlotClick(localToUTC(date, `${String(Math.floor(hour)).padStart(2, '0')}:00`, tz))
            : undefined,
        });
      case 'week':
        return React.createElement(WeekGrid, {
          startDate: nav.rangeStart.toISOString(),
          events,
          startHour: settings.startHour,
          endHour: settings.endHour,
          slotDuration: settings.slotDuration,
          renderEvent,
          onEventClick,
          onSlotClick: onSlotClick
            ? (date, hour) =>
                onSlotClick(localToUTC(date, `${String(Math.floor(hour)).padStart(2, '0')}:00`, tz))
            : undefined,
          showWeekends: settings.showWeekends,
        });
      case 'day':
        return React.createElement(DayColumn, {
          date: nav.rangeStart.toISOString(),
          events,
          startHour: settings.startHour,
          endHour: settings.endHour,
          slotDuration: settings.slotDuration,
          slotHeight: daySlotHeight,
          renderEvent,
          onEventClick,
          onSlotClick: onSlotClick
            ? (hour) => {
                const dateStr = nav.rangeStart.toISOString().substring(0, 10);
                onSlotClick(
                  localToUTC(dateStr, `${String(Math.floor(hour)).padStart(2, '0')}:00`, tz)
                );
              }
            : undefined,
        });
      case 'agenda':
        return React.createElement(AgendaList, {
          events,
          renderEvent,
          onEventClick,
        });
      default:
        return null;
    }
  };

  return React.createElement(
    'div',
    {
      className,
      style: {
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%',
      },
    },
    toolbar,
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          gap: '16px',
          flex: 1,
          overflow: 'hidden',
        },
      },

      // Sidebar opcional (oculto en mobile)
      showCalendarSidebar &&
        !isMobile &&
        React.createElement(
          'div',
          {
            style: {
              width: '240px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column' as const,
              gap: '16px',
              overflowY: 'auto' as const,
            },
          },
          React.createElement(MiniCalendar, {
            selectedDate: toDateString(nav.currentDate),
            onDateSelect: (date) => nav.goToDate(new Date(`${date}T00:00:00`)),
          }),
          ...sidebarSections.map((s, i) =>
            React.createElement(React.Fragment, { key: `sidebar-${String(i)}` }, s.render() as any)
          )
        ),

      // Vista principal — card surface con r-xl
      React.createElement(
        'div',
        {
          style: {
            flex: 1,
            minWidth: 0,
            background: TOKENS.surface,
            border: `1px solid ${TOKENS.border}`,
            borderRadius: TOKENS.rXl,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column' as const,
          },
        },
        React.createElement(
          'div',
          {
            style: {
              flex: 1,
              overflowY: 'auto' as const,
            },
          },
          renderActiveView()
        )
      )
    )
  );
}
