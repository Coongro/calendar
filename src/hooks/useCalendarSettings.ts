import { useSettings } from '@coongro/plugin-sdk';

import type { CalendarViewMode } from '../types/components.js';
import { CALENDAR_SETTINGS } from '../utils/settings.js';

export interface CalendarSettings {
  defaultView: CalendarViewMode;
  slotDuration: number;
  startHour: number;
  endHour: number;
  defaultDuration: number;
  defaultStatus: string;
  showWeekends: boolean;
  showNotes: boolean;
  showColorPicker: boolean;
  minuteStep: number;
  use24Hour: boolean;
  requireDescription: boolean;
  requireType: boolean;
}

const S = CALENDAR_SETTINGS;

function parseSettings(raw: Record<string, unknown>): CalendarSettings {
  const get = <T>(setting: { key: string; default: T }): T =>
    (raw[setting.key] as T) ?? setting.default;

  return {
    defaultView: get(S.DEFAULT_VIEW) as CalendarViewMode,
    slotDuration: get(S.SLOT_DURATION),
    startHour: get(S.START_HOUR),
    endHour: get(S.END_HOUR),
    defaultDuration: get(S.DEFAULT_DURATION),
    defaultStatus: get(S.DEFAULT_STATUS),
    showWeekends: get(S.SHOW_WEEKENDS),
    showNotes: get(S.SHOW_NOTES),
    showColorPicker: get(S.SHOW_COLOR_PICKER),
    minuteStep: Number(get(S.MINUTE_STEP)),
    use24Hour: get(S.USE_24_HOUR),
    requireDescription: get(S.REQUIRE_DESCRIPTION),
    requireType: get(S.REQUIRE_TYPE),
  };
}

export function useCalendarSettings() {
  const { values, loading } = useSettings('calendar.');
  return { settings: parseSettings(values), loading };
}
