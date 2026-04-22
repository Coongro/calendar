import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { TOKENS } from '../../styles/tokens.js';
import type { CalendarEvent } from '../../types/event.js';

import { EventCard } from './EventCard.js';

const React = getHostReact();
const { useState } = React;
const UI = getHostUI();

export interface EventOverflowChipProps {
  /** Eventos ocultos por overflow de cluster; se listan en el popover al abrir. */
  events: CalendarEvent[];
  /**
   * Callback cuando el usuario selecciona un evento de la lista del popover.
   * El popover se cierra automaticamente antes de invocar.
   */
  onEventClick?: (event: CalendarEvent) => void;
  /**
   * Callback adicional que dispara cuando se hace click en el chip mismo
   * (antes de abrir el popover). Uso: analytics, o override total del UX
   * si un consumer quiere manejar su propio panel custom.
   * Si onClickOverride === true, suprime el popover default.
   */
  onChipClick?: (events: CalendarEvent[]) => void;
  onClickOverride?: boolean;
  /** Estilos de posicionamiento aplicados al chip por el consumidor. */
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Chip "+N" auto-contenido que representa eventos ocultos en un cluster de
 * solapamiento. Al click, abre un popover con la lista completa de eventos
 * del cluster. Cada item en la lista es un EventCard variante 'list' que
 * delega al onEventClick externo.
 *
 * Reutilizable en Day/Week/ThreeDay (cluster overflow temporal) y podra
 * usarse en Month view para el "+N mas" del dia.
 */
export function EventOverflowChip({
  events,
  onEventClick,
  onChipClick,
  onClickOverride = false,
  style,
  className = '',
}: EventOverflowChipProps) {
  const [open, setOpen] = useState(false);
  const count = events.length;
  if (count === 0) return null;

  const handleChipClick = () => {
    onChipClick?.(events);
    if (!onClickOverride) setOpen(true);
  };

  const handleItemClick = (evt: CalendarEvent) => {
    setOpen(false);
    onEventClick?.(evt);
  };

  return React.createElement(
    UI.Popover,
    { open, onOpenChange: setOpen },
    React.createElement(
      UI.PopoverTrigger,
      { asChild: true },
      React.createElement(
        'button',
        {
          type: 'button',
          className,
          'aria-label': `${count} ${count === 1 ? 'evento más' : 'eventos más'} en este horario`,
          onClick: handleChipClick,
          style: {
            background: TOKENS.surface,
            border: `1px solid ${TOKENS.borderMd}`,
            borderRadius: TOKENS.rSm,
            padding: '3px 7px',
            fontSize: '10px',
            fontWeight: 600,
            color: TOKENS.ink2,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: 'inherit',
            ...style,
          },
        },
        ...renderDots(events),
        `+${count}`
      )
    ),
    React.createElement(
      UI.PopoverContent,
      { className: 'w-80 p-0', align: 'center', side: 'bottom' },
      React.createElement(ClusterOverflowList, { events, onEventClick: handleItemClick })
    )
  );
}

/**
 * Lista de eventos mostrada dentro del popover del cluster overflow.
 * Cada item es un EventCard variante 'list' para reutilizar estilo del
 * widget/agenda.
 */
interface ClusterOverflowListProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

function ClusterOverflowList({ events, onEventClick }: ClusterOverflowListProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
  );

  return React.createElement(
    'div',
    { style: { display: 'flex', flexDirection: 'column' as const } },

    // Header
    React.createElement(
      'div',
      {
        style: {
          padding: '10px 14px',
          borderBottom: `1px solid ${TOKENS.border}`,
          fontFamily: TOKENS.fontSerif,
          fontWeight: 700,
          fontSize: '13px',
          color: TOKENS.ink,
          background: TOKENS.bg,
        },
      },
      `${sorted.length} turnos en este horario`
    ),

    // Lista
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '6px',
          padding: '10px',
          maxHeight: '320px',
          overflowY: 'auto' as const,
        },
      },
      ...sorted.map((evt) =>
        React.createElement(EventCard, {
          key: evt.id,
          event: evt,
          variant: 'list',
          showTime: true,
          showStatus: true,
          showLocation: true,
          onClick: onEventClick,
        })
      )
    )
  );
}

function renderDots(events: CalendarEvent[]): React.ReactNode[] {
  const seen = new Set<string>();
  const uniqueColors: string[] = [];
  for (const e of events) {
    const c = e.color ?? TOKENS.ink4;
    if (!seen.has(c)) {
      seen.add(c);
      uniqueColors.push(c);
      if (uniqueColors.length >= 3) break;
    }
  }
  return uniqueColors.map((c, i) =>
    React.createElement('span', {
      key: `dot-${i}`,
      style: {
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        background: c,
        flexShrink: 0,
      },
    })
  );
}
