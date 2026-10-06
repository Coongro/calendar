import { resolveTimezone } from '@coongro/datetime';
import { coreSettings, useSettings } from '@coongro/plugin-sdk';

/**
 * Devuelve la timezone IANA del negocio (`core.timezone`).
 * Sin valor guardado (o mientras carga) usa la zona por defecto del Core, la misma
 * que usa `useFormat()`: así las grillas y las fechas formateadas coinciden.
 */
export function useTenantTimezone(): string {
  const { settings } = useSettings(coreSettings);
  return resolveTimezone(settings.timezone);
}
