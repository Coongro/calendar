/**
 * TimePicker — Input con popover de selector de hora.
 * Delega la UI al TimeSlotList interno.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useCalendarSettings } from '../../hooks/useCalendarSettings.js';
import type { TimePickerProps } from '../../types/components.js';

import { TimeSlotList } from './TimeSlotList.js';

const React = getHostReact();
const UI = getHostUI();
const { useState } = React;

export function TimePicker({
  value = '',
  onChange,
  step = 30,
  minTime = '00:00',
  maxTime = '23:59',
  minuteStep: minuteStepProp,
  use24Hour: use24HourProp,
  className = '',
}: TimePickerProps) {
  const { settings } = useCalendarSettings();
  const minuteStep = minuteStepProp ?? settings.minuteStep;
  const use24Hour = use24HourProp ?? settings.use24Hour;
  const [open, setOpen] = useState(false);

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
      { className: 'w-auto p-0' },
      React.createElement(TimeSlotList, {
        value,
        onChange: (time: string) => {
          onChange?.(time);
        },
        step,
        minTime,
        maxTime,
        minuteStep,
        use24Hour,
      })
    )
  );
}
