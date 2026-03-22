import { useSettings } from '@coongro/plugin-sdk';
import { CALENDAR_SETTINGS } from '../utils/settings.js';
import type { CalendarViewMode } from '../types/components.js';

export interface CalendarSettings {
  defaultView: CalendarViewMode;
  slotDuration: number;
  startHour: number;
  endHour: number;
  defaultDuration: number;
  defaultStatus: string;
  showWeekends: boolean;
  showCancelled: boolean;
  showDescription: boolean;
  showNotes: boolean;
  showTags: boolean;
  showColorPicker: boolean;
  confirmOnDrag: boolean;
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
    showCancelled: get(S.SHOW_CANCELLED),
    showDescription: get(S.SHOW_DESCRIPTION),
    showNotes: get(S.SHOW_NOTES),
    showTags: get(S.SHOW_TAGS),
    showColorPicker: get(S.SHOW_COLOR_PICKER),
    confirmOnDrag: get(S.CONFIRM_ON_DRAG),
    requireDescription: get(S.REQUIRE_DESCRIPTION),
    requireType: get(S.REQUIRE_TYPE),
  };
}

export function useCalendarSettings() {
  const { values, loading } = useSettings('calendar.');
  return { settings: parseSettings(values), loading };
}
