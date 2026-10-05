// Tokens del design system (DS v2.3) que usan los componentes del plugin: colores cg-*
// (variables CSS que el host define en runtime, así el modo oscuro sale gratis) y los de
// movimiento (duración, curva y animaciones de entrada). Copia acotada del preset del Core
// (packages/tailwind-config): este repo se clona solo y ese paquete no se publica.
// No se pisan radios, sombras ni fuentes para no cambiar las clases que ya existen.
// Mantener en sync con el preset si cambian los tokens.
const VISIBLE = { opacity: '1', transform: 'translate(0, 0)' };

const cgColors = Object.fromEntries(
  [
    'gold-deep',
    'gold',
    'gold-soft',
    'bg',
    'bg-main',
    'bg-secondary',
    'bg-tertiary',
    'bg-hover',
    'bg-active',
    'surface',
    'border',
    'border-light',
    'border-subtle',
    'border-md',
    'border-focus',
    'text',
    'text-secondary',
    'text-tertiary',
    'text-muted',
    'text-subtle',
    'text-inverse',
    'accent',
    'accent-hover',
    'accent-bg',
    'accent-text',
    'brand-text',
    'success',
    'success-bg',
    'success-border',
    'warning',
    'warning-bg',
    'warning-border',
    'warning-text',
    'danger',
    'danger-bg',
    'danger-border',
    'info',
    'info-bg',
    'info-border',
  ].map((name) => [name, `var(--cg-${name})`])
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { cg: cgColors },
      transitionDuration: {
        'cg-instant': 'var(--cg-dur-instant)',
        'cg-fast': 'var(--cg-dur-fast)',
        'cg-base': 'var(--cg-dur-base)',
        'cg-slow': 'var(--cg-dur-slow)',
      },
      transitionTimingFunction: {
        'cg-standard': 'var(--cg-ease-standard)',
        'cg-enter': 'var(--cg-ease-enter)',
        'cg-exit': 'var(--cg-ease-exit)',
        'cg-spring': 'var(--cg-ease-spring)',
      },
      keyframes: {
        'cg-rise': {
          from: { opacity: '0', transform: 'translate(0, 6px)' },
          to: VISIBLE,
        },
        // Cambio de mes: el mes nuevo entra desde el lado hacia el que se avanza.
        'cg-month-next': {
          from: { opacity: '0', transform: 'translate(8px, 0)' },
          to: VISIBLE,
        },
        'cg-month-prev': {
          from: { opacity: '0', transform: 'translate(-8px, 0)' },
          to: VISIBLE,
        },
      },
      animation: {
        // Usarlas siempre con `motion-safe:`. Relleno `backwards` (no `both`): al terminar
        // no queda un transform puesto, que cambiaría el contexto de los `position: sticky`
        // y `fixed` de adentro (encabezados de la agenda, hoja inferior en celular).
        'cg-rise': 'cg-rise var(--cg-dur-base) var(--cg-ease-enter) backwards',
        'cg-month-next': 'cg-month-next var(--cg-dur-base) var(--cg-ease-standard) backwards',
        'cg-month-prev': 'cg-month-prev var(--cg-dur-base) var(--cg-ease-standard) backwards',
      },
    },
  },
  plugins: [],
};
