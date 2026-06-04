/**
 * Helpers de accesibilidad reutilizables para controles clickeables que no son
 * elementos nativos interactivos (ej: un `<div>` con `onClick`).
 *
 * Un `<div onClick>` no es alcanzable por teclado ni anunciado como control por
 * lectores de pantalla / agentes IA. `clickableProps` suma la semantica minima
 * (role=button + tabIndex + aria-label + manejo de Enter/Espacio) SIN tocar el
 * `onClick` existente, asi un control ya implementado se vuelve operable por
 * teclado y legible sin reescribir su logica.
 */
import type { KeyboardEvent } from 'react';

export interface ClickableProps {
  role: 'button';
  tabIndex: 0;
  'aria-label': string;
  onKeyDown: (event: KeyboardEvent) => void;
}

/**
 * Devuelve los atributos para hacer operable por teclado un elemento clickeable
 * no-nativo. Aplicar JUNTO al `onClick` existente (no lo reemplaza):
 * Enter/Espacio disparan `onActivate` evitando el scroll/submit por defecto.
 */
export function clickableProps(label: string, onActivate: () => void): ClickableProps {
  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onActivate();
      }
    },
  };
}
