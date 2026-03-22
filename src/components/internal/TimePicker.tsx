import { getHostReact, getHostUI } from '@coongro/plugin-sdk';
import type { TimePickerProps } from '../../types/components.js';
import { generateTimeSlots } from '../../utils/date.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useMemo } = React;

export function TimePicker({
  value = '',
  onChange,
  step = 30,
  minTime,
  maxTime,
  className = '',
}: TimePickerProps) {
  const [open, setOpen] = useState(false);

  const slots = useMemo(() => {
    const startHour = minTime ? parseInt(minTime.split(':')[0], 10) : 0;
    const endHour = maxTime ? parseInt(maxTime.split(':')[0], 10) + 1 : 24;
    return generateTimeSlots(startHour, endHour, step);
  }, [step, minTime, maxTime]);

  return React.createElement(
    UI.Popover,
    { open, onOpenChange: setOpen },
    React.createElement(
      UI.PopoverTrigger,
      { asChild: true },
      React.createElement(UI.Input, {
        value,
        readOnly: true,
        placeholder: 'HH:MM',
        className: `cursor-pointer ${className}`,
        onClick: () => setOpen(true),
      })
    ),
    React.createElement(
      UI.PopoverContent,
      { className: 'w-40 p-0' },
      React.createElement(
        UI.ScrollArea,
        { className: 'h-48' },
        React.createElement(
          'div',
          { className: 'flex flex-col' },
          slots.map((slot) =>
            React.createElement(
              'button',
              {
                key: slot,
                type: 'button',
                className: `px-3 py-1.5 text-sm text-left hover:bg-cg-bg-hover transition-colors ${
                  value === slot ? 'bg-cg-bg-active font-medium' : ''
                }`,
                onClick: () => {
                  onChange?.(slot);
                  setOpen(false);
                },
              },
              slot
            )
          )
        )
      )
    )
  );
}
