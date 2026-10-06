---
'@coongro/calendar': minor
---

El front del calendario pasa a JSX con imports normales (`react`, `@coongro/ui-components`, `lucide-react`) en lugar de `React.createElement` + `getHostReact()`/`getHostUI()`. Las fechas de `DatePicker`, `DateTimePicker` y `EventDetail` se muestran con `useFormat()` del SDK: formato `06/10/2026` y, en `EventDetail`, en la zona del negocio en vez de la del navegador. `useTenantTimezone()` sin zona guardada usa la del Core por defecto en vez de la del navegador. Requiere Core 0.69.0.
