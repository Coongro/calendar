import { detectBrowserTimezone, resolveTimezone } from '@coongro/datetime';
import { useSettings } from '@coongro/plugin-sdk';

/**
 * Devuelve la timezone IANA del tenant.
 * Lee `core.timezone`. Si no existe, cae al del browser. Siempre válida.
 */
export function useTenantTimezone(): string {
  const { values } = useSettings('core.');
  const stored = values['core.timezone'] as string | undefined;
  return resolveTimezone(stored ?? detectBrowserTimezone());
}
