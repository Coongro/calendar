import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useUpcomingEvents } from '../../hooks/useUpcomingEvents.js';
import { TOKENS, TRUNCATE, statusBadgeStyle } from '../../styles/tokens.js';
import type { UpcomingEventsProps } from '../../types/components.js';
import { formatEventDate, formatEventTime } from '../../utils/date.js';
import { formatStatus } from '../../utils/labels.js';

const React = getHostReact();
const UI = getHostUI();

function renderBadge(status: string) {
  return React.createElement('span', { style: statusBadgeStyle(status) }, formatStatus(status));
}

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
      { className, style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
      Array.from({ length: 3 }).map((_, i) =>
        React.createElement(UI.Skeleton, { key: i, className: 'h-14 rounded-lg' })
      )
    );
  }

  if (data.length === 0) {
    return React.createElement(
      'div',
      {
        className,
        style: {
          padding: '24px',
          textAlign: 'center',
          fontSize: '12px',
          color: TOKENS.ink4,
        },
      },
      emptyMessage
    );
  }

  return React.createElement(
    'div',
    {
      className,
      style: { display: 'flex', flexDirection: 'column', gap: '1px', padding: '4px 6px' },
    },
    data.map((evt) =>
      React.createElement(
        'div',
        {
          key: evt.id,
          style: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '8px 10px',
            borderRadius: TOKENS.rSm,
            cursor: onEventClick ? 'pointer' : undefined,
          },
          onClick: onEventClick ? () => onEventClick(evt) : undefined,
        },
        // Dot de color 8px (patron EventCard list)
        React.createElement('span', {
          style: {
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            flexShrink: 0,
            marginTop: '3px',
            background: evt.color || TOKENS.ink4,
          },
        }),
        // Info: titulo + meta
        React.createElement(
          'div',
          { style: { flex: 1, minWidth: 0 } },
          React.createElement(
            'div',
            {
              style: { fontSize: '13px', fontWeight: 500, ...TRUNCATE },
            },
            evt.title
          ),
          React.createElement(
            'div',
            {
              style: { fontSize: '11px', color: TOKENS.ink3, marginTop: '1px' },
            },
            evt.all_day
              ? formatEventDate(evt.start_at)
              : `${formatEventDate(evt.start_at)} · ${formatEventTime(evt.start_at)}`
          )
        ),
        // Status badge con dot (patron Coongro, no UI.Badge)
        renderBadge(evt.status)
      )
    )
  );
}
