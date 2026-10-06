import { useFormat } from '@coongro/plugin-sdk';
import { Input, Popover, PopoverContent, PopoverTrigger } from '@coongro/ui-components';
import { useState } from 'react';

import type { DatePickerProps } from '../../types/components.js';

import { CalendarGrid } from './CalendarGrid.js';

export function DatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  minDate,
  maxDate,
  className = '',
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const f = useFormat();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Input
          value={value ? f.date(value) : ''}
          readOnly={true}
          placeholder={placeholder}
          className={`cursor-pointer ${className}`}
          onClick={() => setOpen(true)}
          data-cg-control="date"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <CalendarGrid
          selectedDate={value}
          onDateSelect={onChange}
          onDayClick={() => setOpen(false)}
          showMonthPicker={true}
          showYearPicker={true}
          showTodayButton={false}
          minDate={minDate}
          maxDate={maxDate}
          daySize="md"
        />
      </PopoverContent>
    </Popover>
  );
}
