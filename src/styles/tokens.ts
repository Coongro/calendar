/**
 * Design system tokens para inline styles.
 * Usan CSS custom properties del core (--cg-*) que adaptan
 * automaticamente a dark mode. Los plugins se renderizan dentro
 * del DOM del core, asi que tienen acceso a estas variables.
 */
export const TOKENS = {
  // Accion primaria
  gold: 'var(--cg-accent)',
  goldLt: 'var(--cg-accent-bg)',
  goldHover: 'var(--cg-accent-hover)',

  // Exito / activo
  tealDk: 'var(--cg-teal-dk)',
  tealLt: 'var(--cg-teal-lt)',
  tealIcon: 'var(--cg-teal-icon)',

  // Texto
  ink: 'var(--cg-text)',
  ink2: 'var(--cg-text-secondary)',
  ink3: 'var(--cg-text-tertiary)',
  ink4: 'var(--cg-text-muted)',

  // Superficies
  bg: 'var(--cg-bg-secondary)',
  surface: 'var(--cg-surface)',
  border: 'var(--cg-border)',
  borderMd: 'var(--cg-border-md)',

  // Semanticos
  red: 'var(--cg-danger)',
  redLt: 'var(--cg-danger-bg)',
  green: 'var(--cg-green)',
  greenLt: 'var(--cg-green-bg)',

  // Radios
  rXl: '18px',
  rMd: '10px',
  rSm: '7px',

  // Tipografia
  fontSerif: 'var(--cg-font-serif)',
  fontBody: 'var(--cg-font-body)',
} as const;

/** Estilos de layout reutilizables */
export const FLEX = {
  row: { display: 'flex' } as const,
  col: { display: 'flex', flexDirection: 'column' } as const,
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center' } as const,
  between: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as const,
};

/** Truncar texto con ellipsis */
export const TRUNCATE = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

// ================================================================
// EventCard — estilos por variante y status badges
// Referencia: design/event-card-desktop.html
// ================================================================

/** Dimensiones por variante de EventCard */
export const EVENT_CARD_VARIANTS = {
  standard: {
    dotSize: '6px',
    timebarPad: '5px 10px',
    bodyPad: '6px 10px 8px',
    titleSize: '13px',
    timeSize: '10px',
    subSize: '10px',
  },
  week: {
    dotSize: '5px',
    timebarPad: '3px 8px',
    bodyPad: '3px 8px 5px',
    titleSize: '11px',
    timeSize: '9px',
    subSize: '9px',
  },
  compact: {
    dotSize: '6px',
    titleSize: '12px',
    timeSize: '10px',
  },
  mini: {
    dotSize: '5px',
    titleSize: '11px',
  },
  list: {
    dotSize: '8px',
    titleSize: '13px',
    subSize: '11px',
  },
} as const;

/** Colores semanticos para status badges (outline con borde, patron del diseno) */
export const STATUS_BADGE_STYLES: Record<
  string,
  {
    borderColor: string;
    color: string;
  }
> = {
  scheduled: { borderColor: TOKENS.gold, color: 'var(--cg-warning-text)' },
  confirmed: { borderColor: TOKENS.green, color: TOKENS.green },
  completed: { borderColor: TOKENS.tealDk, color: TOKENS.tealDk },
  cancelled: { borderColor: TOKENS.red, color: TOKENS.red },
  no_show: { borderColor: TOKENS.ink4, color: TOKENS.ink4 },
};

/** Estilo inline para un status badge (outline con borde) */
export function statusBadgeStyle(status: string): Record<string, string> {
  const s = STATUS_BADGE_STYLES[status] ?? { borderColor: TOKENS.ink4, color: TOKENS.ink4 };
  return {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '10px',
    fontWeight: '500',
    padding: '1px 7px',
    borderRadius: '10px',
    border: `1px solid ${s.borderColor}`,
    color: s.color,
    flexShrink: '0',
  };
}
