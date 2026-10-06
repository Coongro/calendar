import { Badge } from '@coongro/ui-components';
import type { ReactElement } from 'react';

import type { CalendarBadgeProps } from '../../types/components.js';

export function CalendarBadge({
  count,
  label = 'eventos',
  color,
  className = '',
}: CalendarBadgeProps): ReactElement | null {
  return (
    <Badge
      variant="outline"
      className={className}
      style={color ? { borderColor: color, color } : undefined}
    >
      {`${count} ${label}`}
    </Badge>
  );
}
