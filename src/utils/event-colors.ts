/**
 * Paleta de colores de evento que ofrece el ColorPicker.
 *
 * Son DATOS, no colores de la interfaz: el hex elegido se guarda en el evento (`color`) y se
 * pinta igual en cualquier tema, para que un evento se reconozca siempre por su color. Por
 * eso son hex fijos y no tokens `--cg-*` (intencional: no se migran a tokens).
 */
export const EVENT_COLOR_PALETTE: string[] = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
  '#14B8A6',
  '#A855F7',
  '#E11D48',
  '#0EA5E9',
  '#22C55E',
  '#FACC15',
];

/** Color que muestra la muestra del botón cuando el evento todavía no tiene color. */
export const DEFAULT_EVENT_COLOR = EVENT_COLOR_PALETTE[0];
