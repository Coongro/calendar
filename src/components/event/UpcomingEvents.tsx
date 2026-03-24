import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useUpcomingEvents } from '../../hooks/useUpcomingEvents.js';
import type { UpcomingEventsProps } from '../../types/components.js';
import { formatEventDate, formatEventTime } from '../../utils/date.js';
import { formatStatus } from '../../utils/labels.js';

const React = getHostReact();
const UI = getHostUI();

export function UpcomingEvents({
  limit = 5,
  calendarIds,
  onEventClick,
  emptyMessage = 'No hay próximos eventos',
  className = '',
}: UpcomingEventsProps) {
  const { data, loading } = useUpcomingEvents({ limit, calendarIds });

  if (loading) {
    return React.createElement(
      'div',
      { className: `flex flex-col gap-2 ${className}` },
      Array.from({ length: 3 }).map((_, i) =>
        React.createElement(UI.Skeleton, { key: i, className: 'h-14 rounded-lg' })
      )
    );
  }

  if (data.length === 0) {
    return React.createElement(
      'div',
      { className: `text-sm text-cg-text-muted text-center py-4 ${className}` },
      emptyMessage
    );
  }

  return React.createElement(
    'div',
    { className: `flex flex-col gap-1 ${className}` },
    data.map((evt) =>
      React.createElement(
        'div',
        {
          key: evt.id,
          className:
            'flex items-center gap-3 p-2 rounded-md hover:bg-cg-bg-hover transition-colors cursor-pointer',
          onClick: onEventClick ? () => onEventClick(evt) : undefined,
        },
        // Color dot
        React.createElement('span', {
          className: 'w-2.5 h-2.5 rounded-full shrink-0',
          style: { backgroundColor: evt.color || '#3B82F6' },
        }),
        // Info
        React.createElement(
          'div',
          { className: 'flex-1 min-w-0' },
          React.createElement('div', { className: 'text-sm font-medium truncate' }, evt.title),
          React.createElement(
            'div',
            { className: 'text-xs text-cg-text-muted' },
            evt.all_day
              ? formatEventDate(evt.start_at)
              : `${formatEventDate(evt.start_at)} · ${formatEventTime(evt.start_at)}`
          )
        ),
        // Status badge
        React.createElement(
          UI.Badge,
          { variant: 'outline', className: 'text-[10px] shrink-0' },
          formatStatus(evt.status)
        )
      )
    )
  );
}
