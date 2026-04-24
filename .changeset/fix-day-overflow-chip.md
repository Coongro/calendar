---
"@coongro/calendar": minor
---

Fix: el chip "+N" para eventos solapados no se renderizaba en la vista Day.
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
