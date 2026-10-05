import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { TOKENS } from '../../styles/tokens.js';
import type { ColorPickerProps } from '../../types/components.js';
import { DEFAULT_EVENT_COLOR, EVENT_COLOR_PALETTE } from '../../utils/event-colors.js';

import { HostPopover, HostPopoverTrigger } from './host-ui.js';

const React = getHostReact();
const UI = getHostUI();
const { useState } = React;

// Muestra de color: crece un poco al pasar el mouse, se achica al presionar y muestra un
// contorno dorado con el foco de teclado. La elegida lleva borde y anillo (por clase).
const SWATCH_CLASS =
  'cursor-pointer border-2 border-solid transition-[transform,border-color] duration-cg-fast ease-cg-standard hover:scale-110 active:scale-95 active:duration-cg-instant motion-reduce:hover:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cg-gold-deep';
const SWATCH_SELECTED = 'border-cg-border-md shadow-[0_0_0_2px_var(--cg-accent)]';
const SWATCH_IDLE = 'border-transparent';

export function ColorPicker({
  value,
  onChange,
  colors = EVENT_COLOR_PALETTE,
  className = '',
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  return React.createElement(
    HostPopover,
    { open, onOpenChange: setOpen },
    React.createElement(
      HostPopoverTrigger,
      { asChild: true },
      React.createElement(
        UI.Button,
        { type: 'button', variant: 'outline', className: `gap-2 ${className}` },
        React.createElement('span', {
          style: {
            display: 'inline-block',
            width: '16px',
            height: '16px',
            borderRadius: '9999px',
            border: `1px solid ${TOKENS.border}`,
            backgroundColor: value || DEFAULT_EVENT_COLOR,
          },
        }),
        'Color'
      )
    ),
    React.createElement(
      UI.PopoverContent,
      { className: 'w-auto p-3' },
      React.createElement(
        'div',
        {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          },
        },
        colors.map((color) =>
          React.createElement('button', {
            key: color,
            type: 'button',
            // Expone cada swatch a lectores de pantalla / copiloto IA: cual color
            // es y si esta seleccionado, mas un hook estable (data-color) para
            // leer/operar el control sin depender del estilo inline.
            'aria-label': `Color ${color}`,
            'aria-pressed': value === color,
            'data-color': color,
            className: `${SWATCH_CLASS} ${value === color ? SWATCH_SELECTED : SWATCH_IDLE}`,
            style: {
              width: '36px',
              height: '36px',
              borderRadius: '9999px',
              // El color de la muestra es dato del evento (ver utils/event-colors.ts)
              backgroundColor: color,
            },
            onClick: () => {
              onChange?.(color);
              setOpen(false);
            },
          })
        )
      )
    )
  );
}
