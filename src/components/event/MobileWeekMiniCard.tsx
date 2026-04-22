import { getHostReact } from '@coongro/plugin-sdk';

import { TOKENS } from '../../styles/tokens.js';
import type { CalendarEvent } from '../../types/event.js';

const React = getHostReact();

export interface MobileWeekMiniCardProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}

/**
 * Bloque ultra-compacto para eventos en la vista Week en mobile.
 * Columnas de ~45–55px no tienen espacio para una EventCard completa —
 * mostramos un bloque coloreado con el titulo a 7px truncado.
 *
 * Referencia visual: design/week-grid-mobile.html
 */
export function MobileWeekMiniCard({ event, onClick }: MobileWeekMiniCardProps) {
  const isCancelled = event.status === 'cancelled';
  return React.createElement(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        borderRadius: '3px',
        background: `color-mix(in srgb, ${event.color ?? TOKENS.gold} 20%, transparent)`,
        padding: '2px 3px',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        opacity: isCancelled ? '0.4' : '1',
      },
      onClick: onClick ? () => onClick(event) : undefined,
    },
    React.createElement(
      'span',
      {
        style: {
          fontSize: '7px',
          fontWeight: '600',
          color: TOKENS.ink2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
          lineHeight: '1.2',
          textDecoration: isCancelled ? 'line-through' : 'none',
        },
      },
      event.title
    )
  );
}
