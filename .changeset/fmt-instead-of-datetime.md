---
'@coongro/calendar': minor
---

Las fechas y horas del calendario se formatean con `fmt` del SDK (el mismo formato es-AR de `useFormat()`) en vez de `formatLocalDate/Time/DateTime` de `@coongro/datetime`. Cambia el texto visible de las fechas: `6/10/2026` pasa a `06/10/2026`, y fecha y hora juntas pasan a `06/10/2026 14:30` (24 h, sin coma; antes dependía del ICU del navegador, y podía salir `6/10/2026, 2:30 p. m.`). La hora sola (`14:30`) no cambia. Una fecha inválida muestra `—` en vez de `Invalid DateTime`. `formatEventDate/Time/DateTime` mantienen su firma.
