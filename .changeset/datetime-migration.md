---
"@coongro/calendar": minor
---

Migrate to strict `@coongro/datetime` API and Drizzle `mode: 'date'`.

- Entities (`CalendarEvent`, form data): use branded `UTCTimestamp` for timestamp fields.
- Repositories: schema columns switched to `mode: 'date'`, mappers apply `toUTCTimestamp()` so JSON payloads are ISO-Z.
- `useDateNavigation` returns `Date` ranges (direct use in Drizzle filters).
- `utils/date.ts` wrappers require `tz` (no more fallback to browser timezone); components call `useTenantTimezone()` and pass it through.
- New `useTenantTimezone()` hook reads `workspace.timezone` setting with browser fallback.
- Schema: all timestamps are `timestamp with time zone` (migration `0001_lean_white_tiger`).

Fixes timezone bug where events created at 22:30 ART rendered as next-day 01:30 UTC.
