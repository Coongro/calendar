import { useFormat, useIsMobile, useViewContributions } from '@coongro/plugin-sdk';
import { Button, Card, DynamicIcon, EmptyState, Skeleton } from '@coongro/ui-components';
import { CalendarIcon, MapPinIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Fragment } from 'react';

import { useEvent } from '../../hooks/useEvent.js';
import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { TOKENS, statusBadgeStyle } from '../../styles/tokens.js';
import type { EventDetailProps } from '../../types/components.js';
import { formatEventDateTime } from '../../utils/date.js';
import { formatStatus } from '../../utils/labels.js';

export function EventDetail({
  eventId,
  renderEntityInfo,
  renderSections,
  renderActions,
  onEdit,
  onDelete,
  className = '',
}: EventDetailProps): ReactElement | null {
  const isMobile = useIsMobile('sm');
  const tz = useTenantTimezone();
  const f = useFormat();
  const { event, loading, error } = useEvent(eventId);

  const { sections: entityInfoSections } = useViewContributions(
    'calendar.event-detail.entity-info'
  );
  const { sections: extraSections } = useViewContributions('calendar.event-detail.sections');
  const { sections: actionSlots } = useViewContributions('calendar.event-detail.actions');

  if (loading) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1rem',
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-6 rounded" />
        ))}
      </div>
    );
  }

  if (error || !event) {
    return (
      <EmptyState
        title={error ?? 'Evento no encontrado'}
        icon={
          <CalendarIcon size={32} strokeWidth={1.5} style={{ color: 'var(--cg-text-muted)' }} />
        }
      />
    );
  }

  const detail = (label: string, value: string | null | undefined) =>
    value ? (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.125rem',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            color: TOKENS.ink4,
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: '0.875rem' }}>{value}</span>
      </div>
    ) : null;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'flex-start',
          justifyContent: 'space-between',
          gap: isMobile ? '0.75rem' : undefined,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
            }}
          >
            {event.title}
          </h2>
          <span style={{ ...statusBadgeStyle(event.status), marginTop: '6px' }}>
            {formatStatus(event.status)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
          }}
        >
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
              <DynamicIcon icon="Pencil" size={14} />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={() => onDelete(event)}>
              <DynamicIcon icon="Trash2" size={14} />
              Eliminar
            </Button>
          )}
          {actionSlots.map((s, i) => (
            <Fragment key={`action-${String(i)}`}>{s.render()}</Fragment>
          ))}
          {renderActions?.()}
        </div>
      </div>
      {/* Detalles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '0.75rem',
        }}
      >
        {detail('Inicio', formatEventDateTime(event.start_at, tz))}
        {detail('Fin', formatEventDateTime(event.end_at, tz))}
        {event.all_day && detail('Tipo', 'Todo el día')}
        {event.location ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.125rem',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                color: TOKENS.ink4,
              }}
            >
              Ubicación
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.875rem',
              }}
            >
              <MapPinIcon size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
              <span>{event.location}</span>
            </div>
          </div>
        ) : null}
      </div>
      {detail('Descripción', event.description)}
      {detail('Notas', event.notes)}
      {/* Entity info (contribution slot) */}
      {entityInfoSections.length > 0
        ? entityInfoSections.map((s, i) => (
            <Fragment key={`entity-${String(i)}`}>{s.render()}</Fragment>
          ))
        : renderEntityInfo
          ? renderEntityInfo()
          : null}
      {/* Extra sections */}
      {extraSections.length > 0
        ? extraSections.map((s, i) => (
            <Fragment key={`section-${String(i)}`}>{s.render()}</Fragment>
          ))
        : renderSections
          ? renderSections()
          : null}
      {/* Metadata */}
      <Card className="p-4 w-fit">
        <div className="flex flex-col gap-1 text-xs text-cg-text-muted">
          <span>{`Creado: ${f.date(event.created_at)}`}</span>
          <span>{`Actualizado: ${f.date(event.updated_at)}`}</span>
        </div>
      </Card>
    </div>
  );
}
