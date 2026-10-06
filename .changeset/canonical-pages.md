---
'@coongro/calendar': minor
---

Forma canónica de las acciones, sin `legacy` (requiere Core ≥ 0.70):

- `calendar.events.list`, `calendar.events.search`, `calendar.events.listByEntity` y `calendar.events.listByCalendar`: de array a página (`pageInput` → `{ items, total }`, 50 por defecto), con `search` y `orderBy` (`start_at`, `end_at`, `title`, `status`, `created_at`). `search` ahora filtra también por `tags`.
- `calendar.events.listByEntity` exige `entityId` y `entityType`, y `calendar.events.listByCalendar` un `calendarId` válido.
- `create`, `update`, `softDelete`, `restore` (de calendarios, tipos y eventos), `calendar.calendars.toggleVisibility` y `calendar.events.moveEvent`: devuelven el registro (o `null`), nunca `[registro]`.
- `calendar.events.listByDateRange` aplica `calendarIds`; `listByDateRange`, `moveEvent` y `countByDate` rechazan claves desconocidas.
- `useEventsByEntity` devuelve también `total`.
