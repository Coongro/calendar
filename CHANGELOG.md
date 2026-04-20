# @coongro/calendar

## 0.5.0

### Minor Changes

- 35befd2: Migrate to strict `@coongro/datetime` API and Drizzle `mode: 'date'`.
  - Entities (`CalendarEvent`, form data): use branded `UTCTimestamp` for timestamp fields.
  - Repositories: schema columns switched to `mode: 'date'`, mappers apply `toUTCTimestamp()` so JSON payloads are ISO-Z.
  - `useDateNavigation` returns `Date` ranges (direct use in Drizzle filters).
  - `utils/date.ts` wrappers require `tz` (no more fallback to browser timezone); components call `useTenantTimezone()` and pass it through.
  - New `useTenantTimezone()` hook reads `workspace.timezone` setting with browser fallback.
  - Schema: all timestamps are `timestamp with time zone` (migration `0001_lean_white_tiger`).

  Fixes timezone bug where events created at 22:30 ART rendered as next-day 01:30 UTC.

## 0.4.0

### Minor Changes

- a185f30: Redesign all UI components with inline styles and design system tokens, add dark mode support, responsive mobile layouts, ThreeDayGrid component, and shared grid-helpers utilities

## 0.3.0

### Minor Changes

- 669a665: Adapt all calendar components to mobile, add DateTimePicker component, and read settings for minuteStep/use24Hour

### Patch Changes

- ed03f0a: Migrate EventList from manual UI.Table to DataTable with mobileRender card view

## 0.2.0

### Minor Changes

- 357e8f4: Export DatePicker, TimePicker, ColorPicker as public API components. Fix DatePicker cross-plugin CSS with inline styles.

## 0.1.1

### Patch Changes

- c7a295e: Fix lint and formatting errors blocking prepublishOnly script
