import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import type { EventCardProps } from '../../types/components.js';
import { formatEventDate, formatEventTime } from '../../utils/date.js';
import { formatStatus, STATUS_BADGE_CLASSES } from '../../utils/labels.js';
import { PinIcon } from '../internal/icons.js';

const React = getHostReact();
const UI = getHostUI();

export function EventCard({
  event,
  showDate = false,
  showTime = true,
  showStatus = false,
  showLocation = false,
  showCalendarColor = true,
  badge,
  subtitle,
  render,
  onClick,
  className = '',
}: EventCardProps) {
  if (render) {
    return render(event) as ReturnType<typeof React.createElement>;
  }

  return React.createElement(
    'div',
    {
      className: `flex items-start gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${className}`,
      onClick: onClick ? () => onClick(event) : undefined,
    },
    // Dot de color del calendario
    showCalendarColor &&
      event.color &&
      React.createElement('span', {
        className: 'w-2 h-2 rounded-full shrink-0 mt-0.5',
        style: { backgroundColor: event.color },
      }),
    React.createElement(
      'div',
      { className: 'flex-1 min-w-0' },
      React.createElement('div', { className: 'font-medium truncate' }, event.title),
      showDate &&
        React.createElement(
          'div',
          { className: 'text-cg-text-muted' },
          formatEventDate(event.start_at)
        ),
      showTime &&
        !event.all_day &&
        React.createElement(
          'div',
          { className: 'text-cg-text-muted' },
          `${formatEventTime(event.start_at)} - ${formatEventTime(event.end_at)}`
        ),
      showLocation &&
        event.location &&
        React.createElement(
          'div',
          { className: 'flex items-center gap-1 text-cg-text-muted mt-0.5' },
          React.createElement(PinIcon, null),
          React.createElement('span', { className: 'truncate' }, event.location)
        ),
      subtitle
    ),
    showStatus &&
      React.createElement(
        UI.Badge,
        {
          variant: 'outline',
          className: `text-[10px] shrink-0 ${STATUS_BADGE_CLASSES[event.status] ?? ''}`,
        },
        formatStatus(event.status)
      ),
    badge
  );
}
