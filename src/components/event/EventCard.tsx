import { getHostReact, getHostUI } from '@coongro/plugin-sdk';
import type { EventCardProps } from '../../types/components.js';
import { formatEventTime } from '../../utils/date.js';
import { formatStatus, STATUS_BADGE_CLASSES } from '../../utils/labels.js';
import { PinIcon } from '../internal/icons.js';

const React = getHostReact();
const UI = getHostUI();

function hexTint(color: string): string | undefined {
  // Agrega transparencia (12%) a colores hex para fondo del chip
  if (color.startsWith('#') && color.length === 7) return `${color}20`;
  return undefined;
}

export function EventCard({
  event,
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

  const colorStyle =
    showCalendarColor && event.color
      ? { borderLeft: `3px solid ${event.color}`, backgroundColor: hexTint(event.color) }
      : {};

  return React.createElement(
    'div',
    {
      className: `flex items-start gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${className}`,
      style: colorStyle,
      onClick: onClick ? () => onClick(event) : undefined,
    },
    React.createElement(
      'div',
      { className: 'flex-1 min-w-0' },
      React.createElement(
        'div',
        { className: 'font-medium truncate' },
        event.title
      ),
      showTime &&
        !event.all_day &&
        React.createElement(
          'div',
          { className: 'text-cg-text-muted' },
          `${formatEventTime(event.start_at)} - ${formatEventTime(event.end_at)}`
        ),
      showLocation && event.location &&
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
        { variant: 'outline', className: `text-[10px] shrink-0 ${STATUS_BADGE_CLASSES[event.status] ?? ''}` },
        formatStatus(event.status)
      ),
    badge
  );
}
