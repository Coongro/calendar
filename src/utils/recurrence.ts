/**
 * Parser/generador RRULE básico
 * Soporta: FREQ, INTERVAL, UNTIL, COUNT, BYDAY
 */

export interface RecurrenceRule {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  until?: string;
  count?: number;
  byDay?: string[];
}

const FREQ_LABELS: Record<string, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  YEARLY: 'Anual',
};

const DAY_LABELS: Record<string, string> = {
  MO: 'Lun',
  TU: 'Mar',
  WE: 'Mié',
  TH: 'Jue',
  FR: 'Vie',
  SA: 'Sáb',
  SU: 'Dom',
};

/** Convierte un RRULE string a objeto */
export function parseRRule(rrule: string): RecurrenceRule | null {
  if (!rrule || !rrule.startsWith('RRULE:')) return null;

  const parts = rrule.replace('RRULE:', '').split(';');
  const result: RecurrenceRule = { freq: 'WEEKLY' };

  for (const part of parts) {
    const [key, value] = part.split('=');
    switch (key) {
      case 'FREQ':
        result.freq = value as RecurrenceRule['freq'];
        break;
      case 'INTERVAL':
        result.interval = parseInt(value, 10);
        break;
      case 'UNTIL':
        result.until = value;
        break;
      case 'COUNT':
        result.count = parseInt(value, 10);
        break;
      case 'BYDAY':
        result.byDay = value.split(',');
        break;
    }
  }

  return result;
}

/** Convierte un objeto a RRULE string */
export function toRRule(rule: RecurrenceRule): string {
  const parts = [`FREQ=${rule.freq}`];
  if (rule.interval && rule.interval > 1) parts.push(`INTERVAL=${rule.interval}`);
  if (rule.until) parts.push(`UNTIL=${rule.until}`);
  if (rule.count) parts.push(`COUNT=${rule.count}`);
  if (rule.byDay && rule.byDay.length > 0) parts.push(`BYDAY=${rule.byDay.join(',')}`);
  return `RRULE:${parts.join(';')}`;
}

/** Descripción legible de la recurrencia */
export function formatRecurrence(rrule: string): string {
  const rule = parseRRule(rrule);
  if (!rule) return '';

  let label = FREQ_LABELS[rule.freq] ?? rule.freq;
  if (rule.interval && rule.interval > 1) {
    label = `Cada ${rule.interval} ${label.toLowerCase()}s`;
  }
  if (rule.byDay && rule.byDay.length > 0) {
    const days = rule.byDay.map((d) => DAY_LABELS[d] ?? d).join(', ');
    label += ` (${days})`;
  }
  return label;
}
