---
'@coongro/calendar': minor
---

feat(calendar): accesibilidad para navegación del copiloto + campos obligatorios en el evento

- **a11y + data attributes para el copiloto de IA**: el calendario expone atributos y roles de accesibilidad (`src/utils/a11y.ts`) para que el copiloto pueda leer y navegar la vista (días, slots, eventos) de forma determinística.
- **Form de evento**: se exigen descripción y tipo (validación en `EventForm`), evitando eventos sin datos mínimos.
