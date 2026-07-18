---
'@coongro/calendar': patch
---

fix(settings): ícono de la página "Calendario → General" (COONG-248)

La página de configuración de Calendario apuntaba a `assets/icons/calendar.svg`, un archivo inexistente en el plugin, por lo que aparecía sin ícono. Se reemplaza por el ícono Lucide `CalendarDays` (mismo glifo que la Agenda del kit), sin asset binario que bundlear.
