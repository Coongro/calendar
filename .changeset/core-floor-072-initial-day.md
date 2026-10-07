---
'@coongro/calendar': patch
---

Pide Core 0.72.0 o posterior (`engines.coongro` y `@coongro/plugin-sdk`). Además, el calendario abre en el «hoy» del negocio aunque los ajustes lleguen después del primer render: antes, sin `initialDate`, arrancaba en el día del navegador.
