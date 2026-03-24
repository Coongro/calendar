import { getHostReact, getHostUI, useViewContributions } from '@coongro/plugin-sdk';

import { useEvent } from '../../hooks/useEvent.js';
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
  const { event, loading, error } = useEvent(eventId);

  const { sections: entityInfoSections } = useViewContributions(
    'calendar.event-detail.entity-info'
  );
  const { sections: extraSections } = useViewContributions('calendar.event-detail.sections');
  const { sections: actionSlots } = useViewContributions('calendar.event-detail.actions');

  if (loading) {
    return React.createElement(
      'div',
      { className: 'flex flex-col gap-4 p-4' },
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
          { className: 'flex flex-col gap-0.5' },
          React.createElement('span', { className: 'text-xs text-cg-text-muted' }, label),
          React.createElement('span', { className: 'text-sm' }, value)
        )
      : null;

  return React.createElement(
    'div',
    { className: `flex flex-col gap-4 ${className}` },

    // Header
    React.createElement(
      'div',
      { className: 'flex items-start justify-between' },
      React.createElement(
        'div',
        null,
        React.createElement('h2', { className: 'text-lg font-semibold' }, event.title),
        React.createElement(
          UI.Badge,
          { variant: 'outline', className: 'mt-1' },
          formatStatus(event.status)
        )
      ),
      React.createElement(
        'div',
        { className: 'flex gap-2' },
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
      { className: 'grid grid-cols-2 gap-3' },
      detail('Inicio', formatEventDateTime(event.start_at)),
      detail('Fin', formatEventDateTime(event.end_at)),
      event.all_day && detail('Tipo', 'Todo el día'),
      event.location
        ? React.createElement(
            'div',
            { className: 'flex flex-col gap-0.5' },
            React.createElement('span', { className: 'text-xs text-cg-text-muted' }, 'Ubicación'),
            React.createElement(
              'div',
              { className: 'flex items-center gap-1 text-sm' },
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
