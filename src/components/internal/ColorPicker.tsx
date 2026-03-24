import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

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
          className: 'inline-block w-4 h-4 rounded-full border',
          style: { backgroundColor: value || '#3B82F6' },
        }),
        'Color'
      )
    ),
    React.createElement(
      UI.PopoverContent,
      { className: 'w-auto p-3' },
      React.createElement(
        'div',
        { className: 'grid grid-cols-4 gap-2' },
        colors.map((color) =>
          React.createElement('button', {
            key: color,
            type: 'button',
            className: `w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
              value === color
                ? 'border-cg-border-strong ring-2 ring-cg-accent'
                : 'border-transparent'
            }`,
            style: { backgroundColor: color },
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
