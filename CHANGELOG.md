# @coongro/calendar

## 0.9.0

### Minor Changes

- 203a492: fix(detail): EventDetail now shows compact Card with Creado/Actualizado timestamps (es-AR); buttons use size sm + Pencil/Trash2 icons; event schema updated_at uses .$onUpdate() for proper timestamp refresh (COONG-112)
- 203a492: refactor(ui): adopt FormSection + FormDialogSubmit from `@coongro/ui-components` 0.28.0 (COONG-112)

  - `EventForm` ahora agrupa sus campos en 4 `UI.FormSection` (Detalles, Fecha y hora, Categorización, Información adicional) en lugar del flujo plano sin agrupación. Visualmente consistente con el resto del kit.
  - `CreateEventButton` migra a `UI.FormDialogSubmit`: footer sticky con botones Cancelar/Crear evento.
  - `EventFormProps` extendida con `formRef`, `hideActions`, `onSavingChange`. Compatible hacia atrás (todas opcionales).
  - Mantiene los puntos de extensión existentes: `renderBeforeFields`, `renderAfterFields`, `renderEntitySection`, `renderFooter`, contribuciones.

## 0.8.0

### Minor Changes

- 0687779: fix(detail): EventDetail now shows compact Card with Creado/Actualizado timestamps (es-AR); buttons use size sm + Pencil/Trash2 icons; event schema updated_at uses .$onUpdate() for proper timestamp refresh (COONG-112)
- 0687779: refactor(ui): adopt FormSection + FormDialogSubmit from `@coongro/ui-components` 0.28.0 (COONG-112)
  - `EventForm` ahora agrupa sus campos en 4 `UI.FormSection` (Detalles, Fecha y hora, Categorización, Información adicional) en lugar del flujo plano sin agrupación. Visualmente consistente con el resto del kit.
  - `CreateEventButton` migra a `UI.FormDialogSubmit`: footer sticky con botones Cancelar/Crear evento.
  - `EventFormProps` extendida con `formRef`, `hideActions`, `onSavingChange`. Compatible hacia atrás (todas opcionales).
  - Mantiene los puntos de extensión existentes: `renderBeforeFields`, `renderAfterFields`, `renderEntitySection`, `renderFooter`, contribuciones.

## 0.7.0

### Minor Changes

- 0e64897: Fix: el chip "+N" para eventos solapados no se renderizaba en la vista Day.
  `CalendarView` pasaba un ISO timestamp completo (`nav.rangeStart.toISOString()`)
  como prop `date`, pero `DayColumnCore.overflowPosition` lo comparaba contra un
  string `YYYY-MM-DD`, asi que la igualdad nunca matcheaba y el slot del chip se
  descartaba. Se corrige pasando `toDateString(nav.rangeStart)` desde `CalendarView`
  y, defensivamente, normalizando el `date` entrante a sus primeros 10 chars antes
  de comparar dentro de `overflowPosition`. Week y ThreeDay no estaban afectadas
  porque ya pasaban un date string corto.

  Feat: en mobile, el chip ahora abre un bottom sheet (anclado al fondo, con
  handle bar, header con titulo + fecha y lista scrolleable hasta 75vh) en lugar
  del popover de desktop. Se agrega el componente `MobileBottomSheet` que reusa
  el Root de Radix Dialog (via `UI.Dialog`) para focus trap y manejo de ESC, pero
  renderiza el panel y backdrop en un Portal propio con inline styles segun
  `design/event-overlap-exploration.html` ("Bottom sheet — lista del cluster").

## 0.6.0

### Minor Changes

- b11534f: Support overlapping events in Day / Week / ThreeDay views (fixes COONG-92).
  - Events sharing a time slot now render side-by-side in proportional columns instead of stacking on top of each other. Clusters of concurrent events that exceed the view's column budget collapse the excess into a "+N" chip that opens a popover listing the full set.
  - Public API additions (all optional, backward compatible): `DayColumnProps`, `WeekGridProps` and `ThreeDayGridProps` gain `maxColumns?` (clamp before the overflow chip) and `onClusterOverflowClick?` (consumer override; when omitted, the chip opens its own popover).
  - New building blocks exported: `DayColumnCore` (shared per-day renderer consumed by the three grid views), `EventOverflowChip`, `MobileWeekMiniCard`, `layoutOverlappingEvents` (pure sweep-line + column packing algorithm).
  - Bug fixes in `EventRepository`: normalize `start_at` / `end_at` from ISO strings in `update()` (previously only `create()` coerced, causing `value.toISOString is not a function` when editing events); remove the reject-on-overlap check in `create()` since overlapping events are now a supported use case.

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
