import type { MiniCalendarProps } from '../../types/components.js';
import { CalendarGrid } from '../internal/CalendarGrid.js';

export function MiniCalendar({ selectedDate, onDateSelect, eventDots = {} }: MiniCalendarProps) {
  return (
    <div style={{ width: '224px' }}>
      <CalendarGrid
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        eventDots={eventDots}
        showMonthPicker={true}
        showYearPicker={true}
        showTodayButton={true}
        daySize="sm"
      />
    </div>
  );
}
