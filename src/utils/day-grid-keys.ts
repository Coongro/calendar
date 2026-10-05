/**
 * Navegación con teclado de una grilla de días (patrón «grilla» de ARIA con tabIndex móvil):
 * la grilla es una sola parada de Tab y las flechas mueven el foco entre días.
 *
 * - ← / →: día anterior / siguiente
 * - ↑ / ↓: misma columna, semana anterior / siguiente
 * - Inicio / Fin: primer / último día de la semana (la semana empieza el lunes)
 * - RePág / AvPág: mismo día del mes anterior / siguiente (recortado al último día del mes)
 *
 * Devuelve la fecha destino, o null si la tecla no es de navegación.
 */
export function getDayGridKeyTarget(key: string, current: Date, skipWeekends = false): Date | null {
  const d = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const weekdayFromMonday = (d.getDay() + 6) % 7;

  switch (key) {
    case 'ArrowLeft':
      return stepDays(d, -1, skipWeekends);
    case 'ArrowRight':
      return stepDays(d, 1, skipWeekends);
    case 'ArrowUp':
      return addDays(d, -7);
    case 'ArrowDown':
      return addDays(d, 7);
    case 'Home':
      return addDays(d, -weekdayFromMonday);
    case 'End':
      return addDays(d, -weekdayFromMonday + (skipWeekends ? 4 : 6));
    case 'PageUp':
      return sameDayOtherMonth(d, -1, skipWeekends);
    case 'PageDown':
      return sameDayOtherMonth(d, 1, skipWeekends);
    default:
      return null;
  }
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/** Un día hacia adelante o atrás, salteando sábado y domingo si no están a la vista. */
function stepDays(d: Date, direction: 1 | -1, skipWeekends: boolean): Date {
  let next = addDays(d, direction);
  while (skipWeekends && isWeekend(next)) next = addDays(next, direction);
  return next;
}

/** Mismo día del mes anterior o siguiente, recortado al último día de ese mes. */
function sameDayOtherMonth(d: Date, delta: 1 | -1, skipWeekends: boolean): Date {
  const lastDay = new Date(d.getFullYear(), d.getMonth() + delta + 1, 0).getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + delta, Math.min(d.getDate(), lastDay));
  if (!skipWeekends) return target;
  // Sin fines de semana a la vista: sábado → viernes, domingo → lunes
  if (target.getDay() === 6) return addDays(target, -1);
  if (target.getDay() === 0) return addDays(target, 1);
  return target;
}

function isWeekend(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6;
}

/** True si la tecla activa el día enfocado (lo mismo que el clic). */
export function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ';
}
