import { getHostReact } from '@coongro/plugin-sdk';

/**
 * Hook local para detectar viewport mobile (< 640px).
 * Replicado del SDK porque el export no está disponible en el runtime del host.
 */
export function useIsMobile(breakpoint = 640): boolean {
  const React = getHostReact();

  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < breakpoint);

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);

  return isMobile;
}
