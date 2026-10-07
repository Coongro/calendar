# @coongro/calendar

## 0.14.0

### Minor Changes

- Forma canónica de las acciones, sin `legacy` (requiere Core ≥ 0.70):
  - `calendar.events.list`, `calendar.events.search`, `calendar.events.listByEntity` y `calendar.events.listByCalendar`: de array a página (`pageInput` → `{ items, total }`, 50 por defecto), con `search` y `orderBy` (`start_at`, `end_at`, `title`, `status`, `created_at`). `search` ahora filtra también por `tags`.
  - `calendar.events.listByEntity` exige `entityId` y `entityType`, y `calendar.events.listByCalendar` un `calendarId` válido.
  - `create`, `update`, `softDelete`, `restore` (de calendarios, tipos y eventos), `calendar.calendars.toggleVisibility` y `calendar.events.moveEvent`: devuelven el registro (o `null`), nunca `[registro]`.
  - `calendar.events.listByDateRange` aplica `calendarIds`; `listByDateRange`, `moveEvent` y `countByDate` rechazan claves desconocidas.
  - `useEventsByEntity` devuelve también `total`.

- Las fechas y horas del calendario se formatean con `fmt` del SDK (el mismo formato es-AR de `useFormat()`) en vez de `formatLocalDate/Time/DateTime` de `@coongro/datetime`. Cambia el texto visible de las fechas: `6/10/2026` pasa a `06/10/2026`, y fecha y hora juntas pasan a `06/10/2026 14:30` (24 h, sin coma; antes dependía del ICU del navegador, y podía salir `6/10/2026, 2:30 p. m.`). La hora sola (`14:30`) no cambia. Una fecha inválida muestra `—` en vez de `Invalid DateTime`. `formatEventDate/Time/DateTime` mantienen su firma.

### Patch Changes

- El calendario agrupa y ubica los eventos por día y hora en la zona del negocio (`core.timezone`), no en la del navegador. Con el negocio en Bogotá y el navegador en Buenos Aires, un evento a las 22:15 del jueves 15 aparecía en la agenda bajo el viernes 16; ahora queda en el 15. Lo mismo en las grillas de día, tres días, semana y mes (columna del día, posición por hora, línea de «ahora»), en «Hoy» de la navegación y del mini calendario, en «Ahora» del selector de fecha y hora, y en el encabezado del «+N». También se corrige que, en navegadores al oeste de UTC, un clic en un día del mes abría el día anterior y la semana podía arrancar en la anterior.
- Pide Core 0.72.0 o posterior (`engines.coongro` y `@coongro/plugin-sdk`). Además, el calendario abre en el «hoy» del negocio aunque los ajustes lleguen después del primer render: antes, sin `initialDate`, arrancaba en el día del navegador.
- Pide Core 0.72.0 o posterior (`engines.coongro` y `@coongro/plugin-sdk`): las listas sin argumentos y la forma canónica de las acciones (Core #853/#858) son de esa versión.

## 0.13.0

### Minor Changes

- El front del calendario pasa a JSX con imports normales (`react`, `@coongro/ui-components`, `lucide-react`) en lugar de `React.createElement` + `getHostReact()`/`getHostUI()`. Las fechas de `DatePicker`, `DateTimePicker` y `EventDetail` se muestran con `useFormat()` del SDK: formato `06/10/2026` y, en `EventDetail`, en la zona del negocio en vez de la del navegador. `useTenantTimezone()` sin zona guardada usa la del Core por defecto en vez de la del navegador. Requiere Core 0.69.0.

## 0.12.1

### Patch Changes

- El manifest declara con qué acción se borra cada entidad (`deleteAction`), y las vistas regeneradas solo llaman a acciones que existen. No cambia ninguna vista.

## 0.12.0

### Minor Changes

- Las acciones de calendarios, tipos de evento y eventos se declaran con `@coongro/plugin-sdk/actions`. El Core valida lo que llega a cada una y en `create`/`update` solo se escriben las columnas de datos: `created_at`, `updated_at` y `deleted_at` ya no se pueden escribir desde afuera (antes `update` aceptaba cualquier columna). Las fechas siguen llegando como texto.

  `create`, `update`, `softDelete`, `restore`, `toggleVisibility` y `moveEvent` devuelven el registro a quien pide la forma nueva y `[registro]` a los demás; los listados siguen siendo arrays. `countByCalendar` declara que su clave puede ser `null` (eventos sin calendario).

  Requiere Core 0.61.0 o posterior.

## 0.11.0

### Minor Changes

- Calendario con estados y movimiento (DS v2.3): navegación con teclado, foco visible, animaciones con `motion-safe`, y las columnas del mes mantienen el mismo ancho aunque un evento tenga un título largo. Tipos de retorno anotados para declaraciones portables y adaptados al host tipado de plugin-sdk.

## 0.10.0

### Minor Changes

- feat(calendar): accesibilidad para navegación del copiloto + campos obligatorios en el evento
  - **a11y + data attributes para el copiloto de IA**: el calendario expone atributos y roles de accesibilidad (`src/utils/a11y.ts`) para que el copiloto pueda leer y navegar la vista (días, slots, eventos) de forma determinística.
  - **Form de evento**: se exigen descripción y tipo (validación en `EventForm`), evitando eventos sin datos mínimos.

### Patch Changes

- fix(settings): ícono de la página "Calendario → General" (COONG-248)

  La página de configuración de Calendario apuntaba a `assets/icons/calendar.svg`, un archivo inexistente en el plugin, por lo que aparecía sin ícono. Se reemplaza por el ícono Lucide `CalendarDays` (mismo glifo que la Agenda del kit), sin asset binario que bundlear.

- El manifest declara qué métodos del repositorio son actions.

  Sin esa lista el runtime escanea la clase compilada y registra lo que encuentre,
  así que un método interno nuevo se volvía una action publicada sin que nadie lo
  decidiera. La lista positiva es ahora la autoridad: lo que no está declarado, no
  se expone.

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
