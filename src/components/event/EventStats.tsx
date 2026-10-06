import { EmptyState, Skeleton } from '@coongro/ui-components';
import type { ReactElement } from 'react';

import { useEventStats } from '../../hooks/useEventStats.js';
import { TOKENS } from '../../styles/tokens.js';
import type { EventStatsProps } from '../../types/components.js';
import { formatStatus } from '../../utils/labels.js';

// Colores para barras proporcionales y acento de card — usan CSS vars para dark mode
const STATUS_COLORS_HEX: Record<string, string> = {
  scheduled: 'var(--cg-accent)',
  confirmed: 'var(--cg-green)',
  completed: 'var(--cg-text-muted)',
  cancelled: 'var(--cg-danger)',
  no_show: 'var(--cg-warning-text)',
  tentative: 'var(--cg-teal-dk)',
};

// Colores inline por estado — adaptan a dark mode
const STATUS_CARD_STYLES: Record<string, { text: string; bg: string }> = {
  scheduled: { text: 'var(--cg-accent)', bg: 'var(--cg-accent-bg)' },
  confirmed: { text: 'var(--cg-green)', bg: 'var(--cg-green-bg)' },
  completed: { text: TOKENS.ink4, bg: TOKENS.bg },
  cancelled: { text: 'var(--cg-danger)', bg: 'var(--cg-danger-bg)' },
  no_show: { text: 'var(--cg-warning-text)', bg: 'var(--cg-warning-bg)' },
  tentative: { text: TOKENS.tealDk, bg: TOKENS.tealLt },
};

export function EventStats({ from, to, className = '' }: EventStatsProps): ReactElement | null {
  const { byStatus, loading } = useEventStats({ from, to });

  if (loading) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div style={{ display: 'flex', gap: '1rem' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const total = byStatus.reduce((sum, s) => sum + s.count, 0);
  const activeStats = byStatus.filter((s) => s.count > 0);

  if (total === 0) {
    return <EmptyState title="Sin eventos en este período" className={className} />;
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* — Grid de cards — */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
        }}
      >
        {/* Card Total (primaria) */}
        <div
          style={{
            borderRadius: '0.5rem',
            border: `1px solid ${TOKENS.border}`,
            backgroundColor: TOKENS.bg,
            padding: '1rem',
          }}
        >
          <div
            style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              color: TOKENS.tealDk,
              lineHeight: 1,
            }}
          >
            {total}
          </div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: TOKENS.ink4,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.05em',
              marginTop: '0.375rem',
            }}
          >
            Total
          </div>
        </div>
        {/* Cards por estado */}
        {activeStats.map((stat) => {
          const styles = STATUS_CARD_STYLES[stat.key] ?? { text: TOKENS.ink, bg: '' };
          const color = STATUS_COLORS_HEX[stat.key] ?? 'var(--cg-text-muted)';
          const pct = Math.round((stat.count / total) * 100);

          return (
            <div
              key={stat.key}
              style={{
                borderRadius: '0.5rem',
                border: `1px solid ${TOKENS.border}`,
                backgroundColor: styles.bg || undefined,
                padding: '1rem',
              }}
            >
              {/* Dot de color + label (header) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.375rem',
                }}
              >
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: TOKENS.ink,
                    lineHeight: 1,
                  }}
                >
                  {stat.count}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: styles.text,
                  }}
                >
                  {`${pct}%`}
                </div>
              </div>
              {/* Label con dot */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  marginTop: '0.375rem',
                }}
              >
                <span
                  style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    borderRadius: '9999px',
                    flexShrink: 0,
                    backgroundColor: color,
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: styles.text,
                  }}
                >
                  {formatStatus(stat.key)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {/* — Barra de proporcion apilada — */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div
          style={{
            display: 'flex',
            height: '0.5rem',
            borderRadius: '9999px',
            overflow: 'hidden',
            gap: '1px',
            backgroundColor: `color-mix(in srgb, ${TOKENS.border} 19%, transparent)`,
          }}
        >
          {activeStats.map((stat) => (
            <div
              key={stat.key}
              style={{
                height: '100%',
                transition: 'all 500ms',
                width: `${(stat.count / total) * 100}%`,
                backgroundColor: STATUS_COLORS_HEX[stat.key] ?? 'var(--cg-text-muted)',
              }}
            />
          ))}
        </div>
        {/* Leyenda */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            columnGap: '1rem',
            rowGap: '0.25rem',
          }}
        >
          {activeStats.map((stat) => (
            <div
              key={stat.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <div
                style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '9999px',
                  flexShrink: 0,
                  backgroundColor: STATUS_COLORS_HEX[stat.key] ?? 'var(--cg-text-muted)',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: TOKENS.ink4 }}>
                {`${formatStatus(stat.key)} · ${stat.count}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
