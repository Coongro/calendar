---
'@coongro/calendar': patch
---

El calendario agrupa y ubica los eventos por día y hora en la zona del negocio (`core.timezone`), no en la del navegador. Con el negocio en Bogotá y el navegador en Buenos Aires, un evento a las 22:15 del jueves 15 aparecía en la agenda bajo el viernes 16; ahora queda en el 15. Lo mismo en las grillas de día, tres días, semana y mes (columna del día, posición por hora, línea de «ahora»), en «Hoy» de la navegación y del mini calendario, en «Ahora» del selector de fecha y hora, y en el encabezado del «+N». También se corrige que, en navegadores al oeste de UTC, un clic en un día del mes abría el día anterior y la semana podía arrancar en la anterior.
