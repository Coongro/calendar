import { getHostReact } from '@coongro/plugin-sdk';

const React = getHostReact();

export function PinIcon({ size = 10 }: { size?: number }) {
  return React.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      style: { flexShrink: 0 },
    },
    React.createElement('path', { d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' }),
    React.createElement('circle', { cx: '12', cy: '10', r: '3' })
  );
}

export function CalendarIcon({ size = 32 }: { size?: number }) {
  return React.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      style: { color: 'var(--cg-text-muted)' },
    },
    React.createElement('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2' }),
    React.createElement('line', { x1: '16', y1: '2', x2: '16', y2: '6' }),
    React.createElement('line', { x1: '8', y1: '2', x2: '8', y2: '6' }),
    React.createElement('line', { x1: '3', y1: '10', x2: '21', y2: '10' })
  );
}
