import { getHostReact, getHostUI } from '@coongro/plugin-sdk';
import type { ReactElement } from 'react';

import type { CalendarBadgeProps } from '../../types/components.js';

const React = getHostReact();
const UI = getHostUI();

export function CalendarBadge({
  count,
  label = 'eventos',
  color,
  className = '',
}: CalendarBadgeProps): ReactElement | null {
  return React.createElement(
    UI.Badge,
    {
      variant: 'outline',
      className,
      style: color ? { borderColor: color, color } : undefined,
    },
    `${count} ${label}`
  );
}
