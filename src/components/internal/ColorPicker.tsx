import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { TOKENS } from '../../styles/tokens.js';
import type { ColorPickerProps } from '../../types/components.js';

const React = getHostReact();
const UI = getHostUI();
const { useState } = React;

const DEFAULT_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
  '#14B8A6',
  '#A855F7',
  '#E11D48',
  '#0EA5E9',
  '#22C55E',
  '#FACC15',
];

export function ColorPicker({
  value,
  onChange,
  colors = DEFAULT_COLORS,
  className = '',
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  return React.createElement(
    UI.Popover,
    { open, onOpenChange: setOpen },
    React.createElement(
      UI.PopoverTrigger,
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
            backgroundColor: value || '#3B82F6',
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
            style: {
              width: '36px',
              height: '36px',
              borderRadius: '9999px',
              border: value === color ? `2px solid ${TOKENS.borderMd}` : '2px solid transparent',
              boxShadow: value === color ? `0 0 0 2px ${TOKENS.gold}` : 'none',
              backgroundColor: color,
              cursor: 'pointer',
              transition: 'transform 0.15s',
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
