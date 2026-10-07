import { useIsMobile } from '@coongro/plugin-sdk';
import { EmptyState } from '@coongro/ui-components';
import { CalendarIcon, MapPinIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { TOKENS, statusBadgeStyle } from '../../styles/tokens.js';
import type { AgendaListProps } from '../../types/components.js';
import { formatEventTime, getDayName, getMonthName } from '../../utils/date.js';
import { formatStatus } from '../../utils/labels.js';
import { dateFromKey, dayKeyOf, groupByDay } from '../../utils/zoned-day.js';

// Cada evento abre su detalle: botón real (Tab, Enter y Espacio) con hover, presionado y foco.
// El fondo y el borde van por clase para que el hover pueda pisarlos.
const EVENT_ROW_BASE =
  'border border-solid border-cg-border bg-cg-bg-secondary transition-colors duration-cg-fast ease-cg-standard';
const EVENT_ROW_BUTTON = `${EVENT_ROW_BASE} w-full text-left cursor-pointer hover:bg-cg-bg-hover hover:border-cg-border-md active:bg-cg-bg-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cg-gold-deep`;

export function AgendaList({
  events,
  renderEvent,
  onEventClick,
  emptyMessage = 'Sin eventos en este período',
  className = '',
}: AgendaListProps): ReactElement | null {
  const isMobile = useIsMobile('sm');
  const tz = useTenantTimezone();
  // Los días son los del negocio: un evento a las 22:15 en Bogotá va en ese día aunque el
  // navegador esté en una zona donde ya es el siguiente.
  const grouped = useMemo(() => groupByDay(events, tz), [events, tz]);

  if (grouped.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        icon={
          <CalendarIcon size={32} strokeWidth={1.5} style={{ color: 'var(--cg-text-muted)' }} />
        }
        className={className}
      />
    );
  }

  const todayKey = dayKeyOf(new Date(), tz);
  // Con acción, cada fila es un <button> (adentro no hay otros controles)
  const row = onEventClick
    ? { tag: 'button' as const, type: 'button' as const, className: EVENT_ROW_BUTTON }
    : { tag: 'div' as const, type: undefined, className: EVENT_ROW_BASE };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '24px',
        padding: '16px',
      }}
    >
      {grouped.map(([dateStr, dayEvents]) => {
        // Portador local de la fecha civil del grupo: de él solo se leen día, mes y año.
        const date = dateFromKey(dateStr);
        const isToday = dateStr === todayKey;
        const dayName = getDayName(date).substring(0, 3).toUpperCase();
        const dayNum = date.getDate();
        const monthYear = `${getMonthName(date.getMonth())} ${date.getFullYear()}`;

        return (
          <div key={dateStr} className="motion-safe:animate-cg-rise">
            {/* — Date header — fijo arriba mientras se scrollean los eventos del día. Con fondo */}
            {/* de superficie para tapar lo que pasa por debajo; el espacio inferior es padding */}
            {/* (no margen) para que también lo tape. Mismo alto que antes. */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingBottom: '12px',
                position: 'sticky',
                top: 0,
                zIndex: 1,
                background: TOKENS.surface,
              }}
            >
              {/* Bloque día: abreviación + número (circle si es hoy) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  width: '40px',
                  flexShrink: 0,
                  color: isToday ? TOKENS.gold : TOKENS.ink4,
                }}
              >
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    lineHeight: 1,
                    marginBottom: '2px',
                  }}
                >
                  {dayName}
                </span>
                <span
                  style={
                    isToday
                      ? {
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          background: TOKENS.gold,
                          color: 'var(--cg-brand-text)',
                          fontSize: '16px',
                          fontWeight: 700,
                          lineHeight: 1,
                        }
                      : {
                          fontSize: '20px',
                          fontWeight: 700,
                          lineHeight: 1,
                        }
                  }
                >
                  {dayNum}
                </span>
              </div>
              {/* Mes/año + pill "Hoy" */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
                  gap: '2px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: TOKENS.ink4,
                    lineHeight: 1,
                  }}
                >
                  {monthYear}
                </span>
                {isToday && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: TOKENS.gold,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.1em',
                      lineHeight: 1,
                    }}
                  >
                    Hoy
                  </span>
                )}
              </div>
              {/* Separador horizontal */}
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background: isToday
                    ? `color-mix(in srgb, ${TOKENS.gold} 40%, transparent)`
                    : TOKENS.border,
                }}
              />
              {/* Conteo de eventos */}
              <span
                style={{
                  fontSize: '10px',
                  color: TOKENS.ink4,
                  flexShrink: 0,
                }}
              >
                {`${dayEvents.length} evento${dayEvents.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            {/* — Filas de eventos — */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column' as const,
                gap: '6px',
                paddingLeft: isMobile ? 0 : '48px',
                marginTop: isMobile ? '8px' : 0,
              }}
            >
              {dayEvents.map((evt) =>
                renderEvent ? (
                  <div key={evt.id} style={{ cursor: 'pointer' }}>
                    {renderEvent(evt, { variant: 'list', height: 48 })}
                  </div>
                ) : (
                  <row.tag
                    key={evt.id}
                    type={row.type}
                    className={row.className}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                    }}
                    onClick={onEventClick ? () => onEventClick(evt) : undefined}
                  >
                    {/* Dot de color del evento */}
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        flexShrink: 0,
                        backgroundColor: evt.color ?? 'var(--cg-accent)',
                      }}
                    />
                    {/* Horario (columna lateral en desktop, oculto en mobile) */}
                    {!isMobile && (
                      <span
                        style={{
                          display: 'block',
                          width: '96px',
                          flexShrink: 0,
                          fontSize: '12px',
                          color: TOKENS.ink4,
                          fontWeight: 500,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {evt.all_day
                          ? 'Todo el día'
                          : `${formatEventTime(evt.start_at, tz)} - ${formatEventTime(evt.end_at, tz)}`}
                      </span>
                    )}
                    {/* Título + hora (mobile) / ubicación */}
                    <span
                      style={{
                        display: 'block',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {evt.title}
                      </span>
                      {isMobile && (
                        <span
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            color: TOKENS.ink4,
                            marginTop: '2px',
                          }}
                        >
                          {evt.all_day
                            ? 'Todo el día'
                            : [
                                formatEventTime(evt.start_at, tz),
                                ' — ',
                                formatEventTime(evt.end_at, tz),
                                evt.location ? ' · ' + evt.location : '',
                              ].join('')}
                        </span>
                      )}
                      {!isMobile && evt.location && (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            color: TOKENS.ink4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap' as const,
                            marginTop: '2px',
                          }}
                        >
                          <MapPinIcon size={10} strokeWidth={2} style={{ flexShrink: 0 }} />
                          {evt.location}
                        </span>
                      )}
                    </span>
                    {/* Badge de estado */}
                    <span style={statusBadgeStyle(evt.status)}>{formatStatus(evt.status)}</span>
                  </row.tag>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
