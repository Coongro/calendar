/**
 * Componentes del host con los props que el plugin usa de verdad.
 *
 * Desde que el plugin-sdk tipa `getHostUI()` con los tipos de ui-components, algunos
 * usos válidos en runtime no compilan: `Popover` declara `children` como prop obligatoria
 * (acá van como hijos de `createElement`), `PopoverTrigger` no declara `asChild` (se
 * mantiene porque hay Cores que lo respetan) y `Combobox` no declara `disabled` ni `className`.
 * Solo cambia el tipo: el componente es el mismo.
 */
import { getHostUI } from '@coongro/plugin-sdk';
import type { ComponentType, ReactNode } from 'react';

const UI = getHostUI();

export const HostPopover = UI.Popover as unknown as ComponentType<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}>;

export const HostPopoverTrigger = UI.PopoverTrigger as unknown as ComponentType<{
  asChild?: boolean;
  children?: ReactNode;
}>;

// Props explícitas (no `ComponentProps<typeof UI.Combobox>`): así los .d.ts no dependen
// de poder nombrar los tipos de ui-components desde el plugin.
export const HostCombobox = UI.Combobox as unknown as ComponentType<{
  value?: string;
  onValueChange?: (value: string) => void;
  debounceMs?: number;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}>;
