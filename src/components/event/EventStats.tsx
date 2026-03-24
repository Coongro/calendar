import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useEventStats } from '../../hooks/useEventStats.js';
import type { EventStatsProps } from '../../types/components.js';
import { formatStatus } from '../../utils/labels.js';

const React = getHostReact();
const UI = getHostUI();

// Colores hex para usar en inline styles (barra proporcional + acento de card)
const STATUS_COLORS_HEX: Record<string, string> = {
  scheduled: '#0ea5e9',
  confirmed: '#22c55e',
  completed: '#94a3b8',
  cancelled: '#ef4444',
  no_show: '#f59e0b',
  tentative: '#10b981',
};

// Clases de texto y fondo por estado (para Tailwind estático)
const STATUS_CARD_CLASSES: Record<string, { text: string; bg: string }> = {
  scheduled: { text: 'text-cg-info', bg: 'bg-cg-info-bg' },
  confirmed: { text: 'text-cg-success', bg: 'bg-cg-success-bg' },
  completed: { text: 'text-cg-text-muted', bg: 'bg-cg-bg-secondary' },
  cancelled: { text: 'text-cg-danger', bg: 'bg-cg-danger-bg' },
  no_show: { text: 'text-cg-warning-text', bg: 'bg-cg-warning-bg' },
  tentative: { text: 'text-cg-accent', bg: 'bg-cg-accent/10' },
};

export function EventStats({ from, to, className = '' }: EventStatsProps) {
  const { byStatus, loading } = useEventStats({ from, to });

  if (loading) {
    return React.createElement(
      'div',
      { className: `flex flex-col gap-4 ${className}` },
      React.createElement(
        'div',
        { className: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' },
        Array.from({ length: 4 }).map((_, i) =>
          React.createElement(UI.Skeleton, { key: i, className: 'h-[72px] rounded-lg' })
        )
      ),
      React.createElement(UI.Skeleton, { className: 'h-2.5 w-full rounded-full' }),
      React.createElement(
        'div',
        { className: 'flex gap-4' },
        Array.from({ length: 3 }).map((_, i) =>
          React.createElement(UI.Skeleton, { key: i, className: 'h-3 w-20 rounded' })
        )
      )
    );
  }

  const total = byStatus.reduce((sum, s) => sum + s.count, 0);
  const activeStats = byStatus.filter((s) => s.count > 0);

  if (total === 0) {
    return React.createElement(UI.EmptyState, {
      title: 'Sin eventos en este período',
      className,
    });
  }

  return React.createElement(
    'div',
    { className: `flex flex-col gap-4 ${className}` },

    // — Grid de cards —
    React.createElement(
      'div',
      { className: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' },

      // Card Total (primaria)
      React.createElement(
        'div',
        { className: 'relative rounded-lg border border-cg-border bg-cg-bg p-4 overflow-hidden' },
        React.createElement('div', {
          className: 'absolute left-0 top-0 bottom-0 w-[3px] bg-cg-accent',
        }),
        React.createElement(
          'div',
          { className: 'text-3xl font-bold text-cg-accent leading-none' },
          total
        ),
        React.createElement(
          'div',
          {
            className:
              'text-[11px] font-semibold text-cg-text-muted uppercase tracking-wide mt-1.5',
          },
          'Total'
        )
      ),

      // Cards por estado
      ...activeStats.map((stat) => {
        const styles = STATUS_CARD_CLASSES[stat.key] ?? { text: 'text-cg-text', bg: '' };
        const color = STATUS_COLORS_HEX[stat.key] ?? '#94a3b8';
        const pct = Math.round((stat.count / total) * 100);

        return React.createElement(
          'div',
          {
            key: stat.key,
            className: `relative rounded-lg border border-cg-border ${styles.bg} p-4 overflow-hidden`,
          },
          // Franja de color izquierda
          React.createElement('div', {
            className: 'absolute left-0 top-0 bottom-0 w-[3px]',
            style: { backgroundColor: color },
          }),
          // Número + porcentaje
          React.createElement(
            'div',
            { className: 'flex items-baseline gap-1.5' },
            React.createElement(
              'div',
              { className: 'text-2xl font-bold text-cg-text leading-none' },
              stat.count
            ),
            React.createElement(
              'div',
              { className: `text-xs font-semibold ${styles.text}` },
              `${pct}%`
            )
          ),
          // Label
          React.createElement(
            'div',
            { className: `text-[11px] font-medium ${styles.text} mt-1.5` },
            formatStatus(stat.key)
          )
        );
      })
    ),

    // — Barra de proporción apilada —
    React.createElement(
      'div',
      { className: 'flex flex-col gap-2' },

      React.createElement(
        'div',
        { className: 'flex h-2 rounded-full overflow-hidden gap-px bg-cg-border/30' },
        ...activeStats.map((stat) =>
          React.createElement('div', {
            key: stat.key,
            className: 'h-full transition-all duration-500',
            style: {
              width: `${(stat.count / total) * 100}%`,
              backgroundColor: STATUS_COLORS_HEX[stat.key] ?? '#94a3b8',
            },
          })
        )
      ),

      // Leyenda
      React.createElement(
        'div',
        { className: 'flex flex-wrap gap-x-4 gap-y-1' },
        ...activeStats.map((stat) =>
          React.createElement(
            'div',
            { key: stat.key, className: 'flex items-center gap-1.5' },
            React.createElement('div', {
              className: 'w-2 h-2 rounded-full shrink-0',
              style: { backgroundColor: STATUS_COLORS_HEX[stat.key] ?? '#94a3b8' },
            }),
            React.createElement(
              'span',
              { className: 'text-xs text-cg-text-muted' },
              `${formatStatus(stat.key)} · ${stat.count}`
            )
          )
        )
      )
    )
  );
}
