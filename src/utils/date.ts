/**
 * Helpers de fecha/hora para el calendario
 */

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const SHORT_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function formatEventDate(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatEventTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatEventDateTime(isoString: string): string {
  return `${formatEventDate(isoString)} ${formatEventTime(isoString)}`;
}

export function getDayName(date: Date): string {
  return DAYS[date.getDay()];
}

export function getShortDayName(date: Date): string {
  return SHORT_DAYS[date.getDay()];
}

export function getMonthName(month: number): string {
  return MONTHS[month];
}

/** Retorna el primer día de la semana (lunes) para una fecha dada */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Retorna el último día de la semana (domingo) para una fecha dada */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** Retorna array de fechas para una semana */
export function getWeekDays(date: Date): Date[] {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Retorna el primer día del mes */
export function getMonthStart(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/** Retorna el último día del mes */
export function getMonthEnd(year: number, month: number): Date {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

/** Retorna los días del mes incluyendo padding de semanas adyacentes */
export function getMonthGridDays(year: number, month: number): Date[] {
  const firstDay = getMonthStart(year, month);
  const lastDay = getMonthEnd(year, month);

  // Retroceder al lunes de la primera semana
  const start = getWeekStart(firstDay);

  // Avanzar al domingo de la última semana
  const endDay = lastDay.getDay();
  const end = new Date(lastDay);
  if (endDay !== 0) {
    end.setDate(end.getDate() + (7 - endDay));
  }

  const days: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

/** Genera slots horarios para un día */
export function generateTimeSlots(startHour: number, endHour: number, step: number): string[] {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += step) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

/** Formato ISO date-only (YYYY-MM-DD) */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Compara dos fechas ignorando hora */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Diferencia en minutos entre dos ISO strings */
export function diffMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

/** Sumar minutos a un ISO string */
export function addMinutes(isoString: string, minutes: number): string {
  const d = new Date(isoString);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}
