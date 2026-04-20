import { getHostReact, getHostUI, useViewContributions } from '@coongro/plugin-sdk';

import { useEvent } from '../../hooks/useEvent.js';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { TOKENS, statusBadgeStyle } from '../../styles/tokens.js';
import type { EventDetailProps } from '../../types/components.js';
import { formatEventDateTime } from '../../utils/date.js';
import { formatStatus } from '../../utils/labels.js';
import { PinIcon, CalendarIcon } from '../internal/icons.js';

const React = getHostReact();
const UI = getHostUI();

export function EventDetail({
  eventId,
  renderEntityInfo,
  renderSections,
  renderActions,
  onEdit,
  onDelete,
  className = '',
}: EventDetailProps) {
  const isMobile = useIsMobile();
  const tz = useTenantTimezone();
  const { event, loading, error } = useEvent(eventId);

  const { sections: entityInfoSections } = useViewContributions(
    'calendar.event-detail.entity-info'
  );
  const { sections: extraSections } = useViewContributions('calendar.event-detail.sections');
  const { sections: actionSlots } = useViewContributions('calendar.event-detail.actions');

  if (loading) {
    return React.createElement(
      'div',
      {
        className,
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1rem',
        },
      },
      Array.from({ length: 5 }).map((_, i) =>
        React.createElement(UI.Skeleton, { key: i, className: 'h-6 rounded' })
      )
    );
  }

  if (error || !event) {
    return React.createElement(UI.EmptyState, {
      title: error ?? 'Evento no encontrado',
      icon: React.createElement(CalendarIcon, null),
    });
  }

  const detail = (label: string, value: string | null | undefined) =>
    value
      ? React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '0.125rem',
            },
          },
          React.createElement(
            'span',
            {
              style: {
                fontSize: '0.75rem',
                color: TOKENS.ink4,
              },
            },
            label
          ),
          React.createElement(
            'span',
            {
              style: { fontSize: '0.875rem' },
            },
            value
          )
        )
      : null;

  return React.createElement(
    'div',
    {
      className,
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      },
    },

    // Header
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'flex-start',
          justifyContent: 'space-between',
          gap: isMobile ? '0.75rem' : undefined,
        },
      },
      React.createElement(
        'div',
        null,
        React.createElement(
          'h2',
          {
            style: {
              fontSize: '1.125rem',
              fontWeight: 600,
            },
          },
          event.title
        ),
        React.createElement(
          'span',
          {
            style: { ...statusBadgeStyle(event.status), marginTop: '6px' },
          },
          formatStatus(event.status)
        )
      ),
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            gap: '0.5rem',
          },
        },
        onEdit &&
          React.createElement(
            UI.Button,
            { variant: 'outline', size: 'sm', onClick: () => onEdit(event) },
            'Editar'
          ),
        onDelete &&
          React.createElement(
            UI.Button,
            { variant: 'destructive', size: 'sm', onClick: () => onDelete(event) },
            'Eliminar'
          ),
        ...actionSlots.map((s, i) =>
          React.createElement(React.Fragment, { key: `action-${String(i)}` }, s.render() as any)
        ),
        renderActions?.()
      )
    ),

    // Detalles
    React.createElement(
      'div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '0.75rem',
        },
      },
      detail('Inicio', formatEventDateTime(event.start_at, tz)),
      detail('Fin', formatEventDateTime(event.end_at, tz)),
      event.all_day && detail('Tipo', 'Todo el día'),
      event.location
        ? React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '0.125rem',
              },
            },
            React.createElement(
              'span',
              {
                style: {
                  fontSize: '0.75rem',
                  color: TOKENS.ink4,
                },
              },
              'Ubicación'
            ),
            React.createElement(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.875rem',
                },
              },
              React.createElement(PinIcon, { size: 12 }),
              React.createElement('span', null, event.location)
            )
          )
        : null
    ),

    detail('Descripción', event.description),
    detail('Notas', event.notes),

    // Entity info (contribution slot)
    ...(entityInfoSections.length > 0
      ? entityInfoSections.map((s, i) =>
          React.createElement(React.Fragment, { key: `entity-${String(i)}` }, s.render() as any)
        )
      : renderEntityInfo
        ? [renderEntityInfo()]
        : []),

    // Extra sections
    ...(extraSections.length > 0
      ? extraSections.map((s, i) =>
          React.createElement(React.Fragment, { key: `section-${String(i)}` }, s.render() as any)
        )
      : renderSections
        ? [renderSections()]
        : [])
  );
}
