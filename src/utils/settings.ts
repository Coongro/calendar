/**
 * Constantes de settings del calendario.
 * El plugin consumidor declara estas keys en su propio manifest
 * para que aparezcan en la UI de settings.
 */
export const CALENDAR_SETTINGS = {
  // Vista
  DEFAULT_VIEW: { key: 'calendar.defaults.view', default: 'week' },
  SLOT_DURATION: { key: 'calendar.defaults.slotDuration', default: 30 },
  START_HOUR: { key: 'calendar.defaults.startHour', default: 0 },
  END_HOUR: { key: 'calendar.defaults.endHour', default: 24 },
  DEFAULT_DURATION: { key: 'calendar.defaults.duration', default: 30 },
  DEFAULT_STATUS: { key: 'calendar.defaults.status', default: 'scheduled' },

  // Comportamiento
  SHOW_WEEKENDS: { key: 'calendar.behavior.showWeekends', default: true },
  SHOW_NOTES: { key: 'calendar.behavior.showNotes', default: true },
  SHOW_COLOR_PICKER: { key: 'calendar.behavior.showColorPicker', default: true },

  // Selector de hora
  MINUTE_STEP: { key: 'calendar.timePicker.minuteStep', default: 5 },
  USE_24_HOUR: { key: 'calendar.timePicker.use24Hour', default: true },

  // Requeridos
  REQUIRE_DESCRIPTION: { key: 'calendar.required.description', default: false },
  REQUIRE_TYPE: { key: 'calendar.required.type', default: false },
} as const;
