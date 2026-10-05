---
'@coongro/calendar': minor
---

Las acciones de calendarios, tipos de evento y eventos se declaran con `@coongro/plugin-sdk/actions`. El Core valida lo que llega a cada una y en `create`/`update` solo se escriben las columnas de datos: `created_at`, `updated_at` y `deleted_at` ya no se pueden escribir desde afuera (antes `update` aceptaba cualquier columna). Las fechas siguen llegando como texto.

`create`, `update`, `softDelete`, `restore`, `toggleVisibility` y `moveEvent` devuelven el registro a quien pide la forma nueva y `[registro]` a los demás; los listados siguen siendo arrays. `countByCalendar` declara que su clave puede ser `null` (eventos sin calendario).

Requiere Core 0.61.0 o posterior.
