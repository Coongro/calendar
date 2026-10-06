import { Skeleton } from '@coongro/ui-components';

import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { useUpcomingEvents } from '../../hooks/useUpcomingEvents.js';
import { TOKENS, TRUNCATE, statusBadgeStyle } from '../../styles/tokens.js';
import type { UpcomingEventsProps } from '../../types/components.js';
import { formatEventDate, formatEventTime } from '../../utils/date.js';
import { formatStatus } from '../../utils/labels.js';

// Cada evento entra con fade + 6 px (solo con movimiento permitido).
const ROW_ENTER = 'motion-safe:animate-cg-rise';
// Fila que abre el evento: botón real (Tab, Enter y Espacio), hover, presionado y foco.
const ROW_BUTTON = `${ROW_ENTER} w-full border-0 bg-transparent text-left cursor-pointer transition-colors duration-cg-fast ease-cg-standard hover:bg-cg-bg-hover active:bg-cg-bg-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cg-gold-deep`;

function renderBadge(status: string) {
  return <span style={statusBadgeStyle(status)}>{formatStatus(status)}</span>;
}

export function UpcomingEvents({
  limit = 5,
  calendarIds,
  onEventClick,
  emptyMessage = 'No hay próximos eventos',
  className = '',
}: UpcomingEventsProps) {
  const tz = useTenantTimezone();
  const { data, loading } = useUpcomingEvents({ limit, calendarIds });
  const RowTag = onEventClick ? 'button' : 'div';

  if (loading) {
    return (
      <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={className}
        style={{
          padding: '24px',
          textAlign: 'center',
          fontSize: '12px',
          color: TOKENS.ink4,
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: '1px', padding: '4px 6px' }}
    >
      {data.map((evt) => (
        <RowTag
          key={evt.id}
          type={onEventClick ? 'button' : undefined}
          className={onEventClick ? ROW_BUTTON : ROW_ENTER}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '8px 10px',
            borderRadius: TOKENS.rSm,
          }}
          onClick={onEventClick ? () => onEventClick(evt) : undefined}
        >
          {/* Dot de color 8px (patron EventCard list) */}
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              flexShrink: 0,
              marginTop: '3px',
              background: evt.color || TOKENS.ink4,
            }}
          />
          {/* Info: titulo + meta */}
          <span style={{ display: 'block', flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: '13px', fontWeight: 500, ...TRUNCATE }}>
              {evt.title}
            </span>
            <span
              style={{ display: 'block', fontSize: '11px', color: TOKENS.ink3, marginTop: '1px' }}
            >
              {evt.all_day
                ? formatEventDate(evt.start_at, tz)
                : `${formatEventDate(evt.start_at, tz)} · ${formatEventTime(evt.start_at, tz)}`}
            </span>
          </span>
          {/* Status badge con dot (patron Coongro, no UI.Badge) */}
          {renderBadge(evt.status)}
        </RowTag>
      ))}
    </div>
  );
}
