---
'@coongro/calendar': minor
---

refactor(ui): adopt FormSection + FormDialogSubmit from `@coongro/ui-components` 0.28.0 (COONG-112)

- `EventForm` ahora agrupa sus campos en 4 `UI.FormSection` (Detalles, Fecha y hora, Categorización, Información adicional) en lugar del flujo plano sin agrupación. Visualmente consistente con el resto del kit.
- `CreateEventButton` migra a `UI.FormDialogSubmit`: footer sticky con botones Cancelar/Crear evento.
- `EventFormProps` extendida con `formRef`, `hideActions`, `onSavingChange`. Compatible hacia atrás (todas opcionales).
- Mantiene los puntos de extensión existentes: `renderBeforeFields`, `renderAfterFields`, `renderEntitySection`, `renderFooter`, contribuciones.
