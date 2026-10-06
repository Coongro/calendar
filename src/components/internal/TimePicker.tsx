import { Input, Popover, PopoverContent, PopoverTrigger } from '@coongro/ui-components';
import { useState } from 'react';

import { useCalendarSettings } from '../../hooks/useCalendarSettings.js';
import type { TimePickerProps } from '../../types/components.js';

import { TimeSlotList } from './TimeSlotList.js';

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Input
          value={value}
          readOnly={true}
          placeholder="HH:MM"
          className={`cursor-pointer ${className}`}
          onClick={() => setOpen(true)}
          data-cg-control="date"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <TimeSlotList
          value={value}
          onChange={onChange}
          step={step}
          minTime={minTime}
          maxTime={maxTime}
          minuteStep={minuteStep}
          use24Hour={use24Hour}
        />
      </PopoverContent>
    </Popover>
  );
}
