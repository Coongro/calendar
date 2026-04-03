import { getHostReact, getHostUI, useViewContributions } from '@coongro/plugin-sdk';

import { useCalendarSettings } from '../../hooks/useCalendarSettings.js';
import { useDateNavigation } from '../../hooks/useDateNavigation.js';
import { useEvents } from '../../hooks/useEvents.js';
import { useIsMobile } from '../../hooks/useIsMobile.js';
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
import { WeekGrid } from './WeekGrid.js';

const React = getHostReact();
const UI = getHostUI();

const VIEW_LABELS: Record<CalendarViewMode, string> = {
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
};

export function CalendarView({
  enabledViews = ['month', 'week', 'day', 'agenda'],
  defaultView,
  renderEvent,
  renderToolbar,
  showCalendarSidebar = false,
  extraToolbarActions,
  onEventClick,
  onSlotClick,
  className = '',
}: CalendarViewProps) {
  const { settings } = useCalendarSettings();
  const isMobile = useIsMobile();
  const nav = useDateNavigation(defaultView ?? settings.defaultView);

  const { data: events, loading } = useEvents({
    from: nav.rangeStart,
    to: nav.rangeEnd,
    autoFetch: true,
    pageSize: 500,
  });

  const { sections: toolbarSections } = useViewContributions('calendar.view.toolbar');
  const { sections: sidebarSections } = useViewContributions('calendar.view.sidebar');

  // En mobile, week se convierte en day automáticamente
  const effectiveView = isMobile && nav.view === 'week' ? 'day' : nav.view;

  // Toolbar
  function renderMobileToolbar() {
    return React.createElement(
      'div',
      { className: 'flex flex-col gap-3 mb-4' },
      // Nav row
      React.createElement(
        'div',
        { className: 'flex items-center justify-between' },
        React.createElement(UI.Button, { variant: 'ghost', size: 'sm', onClick: nav.goPrev }, '‹'),
        React.createElement('h2', { className: 'text-base font-semibold' }, nav.title),
        React.createElement(UI.Button, { variant: 'ghost', size: 'sm', onClick: nav.goNext }, '›')
      ),
      // View switcher row
      React.createElement(
        'div',
        { className: 'flex bg-cg-bg-secondary rounded-md p-0.5' },
        enabledViews
          .filter((v) => v !== 'week')
          .map((v) =>
            React.createElement(
              'button',
              {
                key: v,
                type: 'button',
                className: `flex-1 py-2 text-xs font-medium rounded transition-colors ${
                  effectiveView === v
                    ? 'bg-cg-bg text-cg-text border border-cg-border'
                    : 'text-cg-text-muted'
                }`,
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
      { className: 'flex items-center justify-between gap-3 mb-4' },

      // Navegación
      React.createElement(
        'div',
        { className: 'flex items-center gap-2' },
        React.createElement(
          UI.Button,
          { variant: 'outline', size: 'sm', onClick: nav.goPrev },
          '‹'
        ),
        React.createElement(
          UI.Button,
          { variant: 'outline', size: 'sm', onClick: nav.goToToday },
          'Hoy'
        ),
        React.createElement(
          UI.Button,
          { variant: 'outline', size: 'sm', onClick: nav.goNext },
          '›'
        ),
        React.createElement('h2', { className: 'text-lg font-semibold ml-2' }, nav.title)
      ),

      // View switcher + extras
      React.createElement(
        'div',
        { className: 'flex items-center gap-2' },

        // Contributions en toolbar
        ...toolbarSections.map((s, i) =>
          React.createElement(React.Fragment, { key: `toolbar-${String(i)}` }, s.render() as any)
        ),

        extraToolbarActions,

        // View switcher
        React.createElement(
          'div',
          { className: 'flex border border-cg-border rounded-md' },
          enabledViews.map((v) =>
            React.createElement(
              UI.Button,
              {
                key: v,
                variant: nav.view === v ? 'default' : 'ghost',
                size: 'sm',
                className: 'rounded-none first:rounded-l-md last:rounded-r-md',
                onClick: () => nav.setView(v),
              },
              VIEW_LABELS[v]
            )
          )
        )
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
      case 'week':
        return React.createElement(WeekGrid, {
          startDate: nav.rangeStart,
          events,
          startHour: settings.startHour,
          endHour: settings.endHour,
          slotDuration: settings.slotDuration,
          renderEvent,
          onEventClick,
          onSlotClick: onSlotClick
            ? (date, hour) =>
                onSlotClick(`${date}T${String(Math.floor(hour)).padStart(2, '0')}:00:00.000Z`)
            : undefined,
          showWeekends: settings.showWeekends,
        });
      case 'day':
        return React.createElement(DayColumn, {
          date: nav.rangeStart,
          events,
          startHour: settings.startHour,
          endHour: settings.endHour,
          slotDuration: settings.slotDuration,
          renderEvent,
          onEventClick,
          onSlotClick: onSlotClick
            ? (hour) => {
                const dateStr = nav.rangeStart.substring(0, 10);
                onSlotClick(`${dateStr}T${String(Math.floor(hour)).padStart(2, '0')}:00:00.000Z`);
              }
            : undefined,
        });
      case 'agenda':
        return React.createElement(AgendaList, {
          events,
          onEventClick,
        });
      default:
        return null;
    }
  };

  return React.createElement(
    'div',
    { className: `flex flex-col h-full ${className}` },
    toolbar,
    React.createElement(
      'div',
      { className: 'flex gap-4 flex-1 overflow-hidden' },

      // Sidebar opcional (oculto en mobile)
      showCalendarSidebar &&
        !isMobile &&
        React.createElement(
          'div',
          { className: 'w-60 shrink-0 flex flex-col gap-4 overflow-y-auto' },
          React.createElement(MiniCalendar, {
            selectedDate: toDateString(nav.currentDate),
            onDateSelect: (date) => nav.goToDate(new Date(`${date}T00:00:00`)),
          }),
          ...sidebarSections.map((s, i) =>
            React.createElement(React.Fragment, { key: `sidebar-${String(i)}` }, s.render() as any)
          )
        ),

      // Vista principal
      React.createElement(
        'div',
        { className: 'flex-1 min-w-0 overflow-y-auto' },
        renderActiveView()
      )
    )
  );
}
