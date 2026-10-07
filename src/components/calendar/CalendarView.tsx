import { localToUTC } from '@coongro/datetime';
import { useViewContributions, useIsMobile } from '@coongro/plugin-sdk';
import { Button } from '@coongro/ui-components';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { useCalendarSettings } from '../../hooks/useCalendarSettings.js';
import { useDateNavigation } from '../../hooks/useDateNavigation.js';
import { useEvents } from '../../hooks/useEvents.js';
import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { TOKENS } from '../../styles/tokens.js';
import type { CalendarViewProps, CalendarViewMode } from '../../types/components.js';
import { toDateString } from '../../utils/date.js';
import { dateFromKey } from '../../utils/zoned-day.js';

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

// Estados de los controles del toolbar (DS v2.3): hover, presionado y foco por clase, con
// los tokens de movimiento. El layout sigue en línea; fondo y color van acá para que el
// hover pueda pisarlos.
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cg-gold-deep focus-visible:ring-offset-2 focus-visible:ring-offset-cg-surface';
const TOOLBAR_BUTTON = `transition-[background-color,color,transform] duration-cg-fast ease-cg-standard active:scale-[0.97] active:duration-cg-instant ${FOCUS_RING}`;
const TOOLBAR_IDLE = 'bg-transparent hover:bg-cg-bg-hover hover:text-cg-text';

/** Selector de vista en celular: la activa como tarjeta sobre el fondo gris. */
function mobileViewButtonClass(active: boolean): string {
  const state = active
    ? 'bg-cg-surface text-cg-text'
    : 'bg-transparent text-cg-text-muted hover:text-cg-text';
  return `${TOOLBAR_BUTTON} ${state}`;
}

/** Selector de vista en escritorio: la activa invertida (fondo de texto). */
function desktopViewButtonClass(active: boolean): string {
  const state = active ? 'bg-cg-text text-cg-surface' : `${TOOLBAR_IDLE} text-cg-text-tertiary`;
  return `${TOOLBAR_BUTTON} ${state}`;
}

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
  initialDate,
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
  const isMobile = useIsMobile('sm');
  const tz = useTenantTimezone();
  const nav = useDateNavigation(defaultView ?? settings.defaultView, initialDate);

  const { data: internalEvents, loading: internalLoading } = useEvents({
    from: nav.rangeStart,
    to: nav.rangeEnd,
    autoFetch: !skipInternalEvents,
    pageSize: 500,
  });

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
  const prevRange = useRef<string>('');
  useEffect(() => {
    if (!onDateRangeChange) return;
    const rangeKey = `${nav.rangeStart.toISOString()}|${nav.rangeEnd.toISOString()}`;
    if (rangeKey !== prevRange.current) {
      prevRange.current = rangeKey;
      onDateRangeChange(nav.rangeStart.toISOString(), nav.rangeEnd.toISOString());
    }
  }, [nav.rangeStart, nav.rangeEnd, onDateRangeChange]);

  // Mes: al navegar con el teclado (RePág/AvPág o flechas en el borde) el día pedido recibe
  // el foco cuando la grilla del mes nuevo se monta. Se descarta cuando termina la carga.
  const [monthFocusDate, setMonthFocusDate] = useState<string | null>(null);
  const sawLoadingRef = useRef(false);
  useEffect(() => {
    if (loading) {
      sawLoadingRef.current = true;
    } else if (sawLoadingRef.current) {
      sawLoadingRef.current = false;
      setMonthFocusDate(null);
    }
  }, [loading]);

  // Sentido del último cambio de mes, para que el mes nuevo entre desde ese lado. Al cambiar
  // de vista se reinicia: entrar a la vista Mes no desliza.
  const monthIndex = nav.currentDate.getFullYear() * 12 + nav.currentDate.getMonth();
  const prevMonthIndexRef = useRef(monthIndex);
  const prevViewRef = useRef(nav.view);
  const monthDirectionRef = useRef<0 | 1 | -1>(0);
  if (nav.view !== prevViewRef.current) {
    monthDirectionRef.current = 0;
    prevViewRef.current = nav.view;
    prevMonthIndexRef.current = monthIndex;
  } else if (monthIndex !== prevMonthIndexRef.current) {
    monthDirectionRef.current = monthIndex > prevMonthIndexRef.current ? 1 : -1;
    prevMonthIndexRef.current = monthIndex;
  }

  const { sections: toolbarSections } = useViewContributions('calendar.view.toolbar');
  const { sections: sidebarSections } = useViewContributions('calendar.view.sidebar');

  // Mobile: las 4 vistas disponibles (day, three-day, week, month)
  // Desktop: week, day, month, agenda (sin three-day que es mobile-only)
  const effectiveView = nav.view;

  // Toolbar
  function renderMobileToolbar() {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {/* Title + extra actions row (solo si hay titulo o extraToolbarActions) */}
        {(title || extraToolbarActions) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {title ? (
              <h1
                style={{
                  fontFamily: TOKENS.fontSerif,
                  fontWeight: 900,
                  fontSize: '20px',
                  margin: 0,
                }}
              >
                {title}
              </h1>
            ) : (
              <div />
            )}
            {extraToolbarActions}
          </div>
        )}
        {/* Nav row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Button variant="ghost" size="sm" onClick={nav.goPrev}>
            ‹
          </Button>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              margin: 0,
            }}
          >
            {nav.title}
          </h2>
          <Button variant="ghost" size="sm" onClick={nav.goNext}>
            ›
          </Button>
        </div>
        {/* View switcher row */}
        <div
          style={{
            display: 'flex',
            background: TOKENS.bg,
            borderRadius: '6px',
            padding: '2px',
          }}
        >
          {/* Mobile: day, three-day, week, month (sin agenda) */}
          {(['day', 'three-day', 'week', 'month'] as CalendarViewMode[])
            .filter((v) => enabledViews.includes(v) || v === 'three-day')
            .map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={effectiveView === v}
                className={mobileViewButtonClass(effectiveView === v)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  fontSize: '12px',
                  fontWeight: 500,
                  borderRadius: '4px',
                  border: effectiveView === v ? `1px solid ${TOKENS.border}` : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => nav.setView(v)}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
        </div>
      </div>
    );
  }

  function renderDesktopToolbar() {
    return (
      <div
        style={{
          padding: '0 0 14px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        {/* Izquierda: titulo + nav + fecha + hoy */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {title && (
            <h1
              style={{
                fontFamily: TOKENS.fontSerif,
                fontWeight: 900,
                fontSize: '22px',
                margin: 0,
              }}
            >
              {title}
            </h1>
          )}
          {/* Grupo nav: ‹ fecha › Hoy — card surface */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 8px',
              background: TOKENS.surface,
              border: `1px solid ${TOKENS.border}`,
              borderRadius: TOKENS.rMd,
            }}
          >
            <button
              type="button"
              aria-label="Anterior"
              className={`${TOOLBAR_BUTTON} ${TOOLBAR_IDLE} text-cg-text-tertiary`}
              style={{
                width: '28px',
                height: '28px',
                border: `1px solid ${TOKENS.border}`,
                borderRadius: TOKENS.rSm,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={nav.goPrev}
            >
              ‹
            </button>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                minWidth: '160px',
                textAlign: 'center',
              }}
            >
              {nav.title}
            </span>
            <button
              type="button"
              aria-label="Siguiente"
              className={`${TOOLBAR_BUTTON} ${TOOLBAR_IDLE} text-cg-text-tertiary`}
              style={{
                width: '28px',
                height: '28px',
                border: `1px solid ${TOKENS.border}`,
                borderRadius: TOKENS.rSm,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={nav.goNext}
            >
              ›
            </button>
            {/* Separador visual */}
            <div
              style={{ width: '1px', height: '20px', background: TOKENS.border, margin: '0 2px' }}
            />
            {/* Boton Hoy */}
            <button
              type="button"
              className={`${TOOLBAR_BUTTON} ${TOOLBAR_IDLE} text-cg-text-secondary`}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 500,
                border: 'none',
                borderRadius: TOKENS.rSm,
                cursor: 'pointer',
                fontFamily: TOKENS.fontBody,
              }}
              onClick={nav.goToToday}
            >
              Hoy
            </button>
          </div>
        </div>
        {/* Derecha: view switcher + contributions + extras */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* Contributions en toolbar */}
          {toolbarSections.map((s, i) => (
            <Fragment key={`toolbar-${String(i)}`}>{s.render()}</Fragment>
          ))}
          {/* View switcher — card surface con botones inline */}
          <div
            style={{
              display: 'flex',
              padding: '4px',
              background: TOKENS.surface,
              border: `1px solid ${TOKENS.border}`,
              borderRadius: TOKENS.rMd,
              gap: '2px',
            }}
          >
            {enabledViews.map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={effectiveView === v}
                className={desktopViewButtonClass(effectiveView === v)}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: TOKENS.rSm,
                  cursor: 'pointer',
                  fontFamily: TOKENS.fontBody,
                }}
                onClick={() => nav.setView(v)}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
          {extraToolbarActions}
        </div>
      </div>
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
          return <MonthGridSkeleton />;
        case 'three-day':
        case 'week':
          return <WeekGridSkeleton />;
        case 'day':
          return <DayColumnSkeleton />;
        case 'agenda':
          return <AgendaListSkeleton />;
        default:
          return <MonthGridSkeleton />;
      }
    }

    switch (effectiveView) {
      case 'month':
        return (
          <MonthGrid
            year={nav.currentDate.getFullYear()}
            month={nav.currentDate.getMonth()}
            events={events}
            renderEvent={renderEvent}
            onEventClick={onEventClick}
            onDayClick={(date) => {
              // `date` es una clave YYYY-MM-DD: `new Date(date)` es medianoche UTC y al oeste
              // de Greenwich abría el día anterior.
              nav.goToDate(dateFromKey(date));
              nav.setView('day');
            }}
            showWeekends={settings.showWeekends}
            onNavigateToDate={(date) => {
              setMonthFocusDate(date);
              nav.goToDate(new Date(`${date}T00:00:00`));
            }}
            focusDate={monthFocusDate}
          />
        );
      case 'three-day':
        return (
          <ThreeDayGrid
            startDate={nav.rangeStart.toISOString()}
            events={events}
            startHour={settings.startHour}
            endHour={settings.endHour}
            slotDuration={settings.slotDuration}
            renderEvent={renderEvent}
            onEventClick={onEventClick}
            onSlotClick={
              onSlotClick
                ? (date, hour) =>
                    onSlotClick(
                      localToUTC(date, `${String(Math.floor(hour)).padStart(2, '0')}:00`, tz)
                    )
                : undefined
            }
          />
        );
      case 'week':
        return (
          <WeekGrid
            startDate={nav.rangeStart.toISOString()}
            events={events}
            startHour={settings.startHour}
            endHour={settings.endHour}
            slotDuration={settings.slotDuration}
            renderEvent={renderEvent}
            onEventClick={onEventClick}
            onSlotClick={
              onSlotClick
                ? (date, hour) =>
                    onSlotClick(
                      localToUTC(date, `${String(Math.floor(hour)).padStart(2, '0')}:00`, tz)
                    )
                : undefined
            }
            showWeekends={settings.showWeekends}
          />
        );
      case 'day':
        return (
          <DayColumn
            date={toDateString(nav.currentDate)}
            events={events}
            startHour={settings.startHour}
            endHour={settings.endHour}
            slotDuration={settings.slotDuration}
            slotHeight={daySlotHeight}
            renderEvent={renderEvent}
            onEventClick={onEventClick}
            onSlotClick={
              onSlotClick
                ? (hour) => {
                    // El día visible (fecha civil), no la fecha UTC del inicio del rango.
                    const dateStr = toDateString(nav.currentDate);
                    onSlotClick(
                      localToUTC(dateStr, `${String(Math.floor(hour)).padStart(2, '0')}:00`, tz)
                    );
                  }
                : undefined
            }
          />
        );
      case 'agenda':
        return <AgendaList events={events} renderEvent={renderEvent} onEventClick={onEventClick} />;
      default:
        return null;
    }
  };

  // Cambio de mes: el mes nuevo entra 8 px desde el lado hacia el que se avanzó (solo con
  // movimiento permitido). La key remonta el envoltorio solo cuando cambia el mes; el
  // contenedor de afuera recorta el desplazamiento para que no aparezca scroll horizontal.
  function renderMonthTransition(content: ReturnType<typeof renderActiveView>) {
    const direction = monthDirectionRef.current;
    let animation = '';
    if (direction === 1) animation = 'motion-safe:animate-cg-month-next';
    else if (direction === -1) animation = 'motion-safe:animate-cg-month-prev';
    return (
      <div style={{ overflowX: 'clip' } as CSSProperties}>
        <div key={`month-${monthIndex}`} className={animation}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%',
      }}
    >
      {toolbar}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Sidebar opcional (oculto en mobile) */}
        {showCalendarSidebar && !isMobile && (
          <div
            style={{
              width: '240px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column' as const,
              gap: '16px',
              overflowY: 'auto' as const,
            }}
          >
            <MiniCalendar
              selectedDate={toDateString(nav.currentDate)}
              onDateSelect={(date) => nav.goToDate(new Date(`${date}T00:00:00`))}
            />
            {sidebarSections.map((s, i) => (
              <Fragment key={`sidebar-${String(i)}`}>{s.render()}</Fragment>
            ))}
          </div>
        )}
        {/* Vista principal — card surface con r-xl */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: TOKENS.surface,
            border: `1px solid ${TOKENS.border}`,
            borderRadius: TOKENS.rXl,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column' as const,
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: 'auto' as const,
            }}
          >
            {effectiveView === 'month'
              ? renderMonthTransition(renderActiveView())
              : renderActiveView()}
          </div>
        </div>
      </div>
    </div>
  );
}
