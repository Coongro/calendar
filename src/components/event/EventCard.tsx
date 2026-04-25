import { getHostReact } from '@coongro/plugin-sdk';

import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { TOKENS, TRUNCATE, EVENT_CARD_VARIANTS, statusBadgeStyle } from '../../styles/tokens.js';
import type { EventCardProps } from '../../types/components.js';
import { formatEventDate, formatEventTime } from '../../utils/date.js';
import { formatStatus } from '../../utils/labels.js';
import { PinIcon } from '../internal/icons.js';

const React = getHostReact();

// ── Helpers ──

function renderStatusBadge(status: string) {
  return React.createElement('span', { style: statusBadgeStyle(status) }, formatStatus(status));
}

function dot(color: string | null, size: string, extraStyle?: Record<string, string>) {
  if (!color) return null;
  return React.createElement('span', {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
      ...extraStyle,
    },
  });
}

function cancelledStyle(isCancelled: boolean): Record<string, string> {
  return isCancelled ? { textDecoration: 'line-through', color: TOKENS.ink4 } : {};
}

// ── Componente ──

/**
 * EventCard — Tarjeta de evento con estructura bento (timebar + body).
 * Variantes: standard (day 60min+), compact (30min), week, mini (month), list (widget/agenda).
 * Referencia: design/event-card-desktop.html
 */
export function EventCard({
  event,
  variant = 'standard',
  showDate = false,
  showTime = true,
  showStatus = false,
  showLocation = false,
  showCalendarColor = true,
  badge,
  subtitle,
  render,
  onClick,
  className = '',
}: EventCardProps) {
  const tz = useTenantTimezone();
  if (render) {
    return render(event) as ReturnType<typeof React.createElement>;
  }

  const color = showCalendarColor ? (event.color ?? TOKENS.ink4) : null;
  const isCancelled = event.status === 'cancelled';
  const v = variant;
  const clickProps = onClick ? { cursor: 'pointer' as const, onClick: () => onClick(event) } : {};

  // ── Mini: solo dot + titulo (month grid) ──
  if (v === 'mini') {
    const cfg = EVENT_CARD_VARIANTS.mini;
    return React.createElement(
      'div',
      {
        className,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '2px 6px',
          opacity: isCancelled ? 0.6 : 1,
          ...clickProps,
        },
        onClick: clickProps.onClick,
      },
      dot(color, cfg.dotSize),
      React.createElement(
        'span',
        {
          style: {
            fontSize: cfg.titleSize,
            fontWeight: 500,
            color: TOKENS.ink2,
            ...TRUNCATE,
            ...cancelledStyle(isCancelled),
          },
        },
        event.title
      )
    );
  }

  // ── List: flat row para widgets y agenda ──
  if (v === 'list') {
    const cfg = EVENT_CARD_VARIANTS.list;
    return React.createElement(
      'div',
      {
        className,
        style: {
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          padding: '8px 10px',
          borderRadius: TOKENS.rSm,
          opacity: isCancelled ? 0.6 : 1,
          ...clickProps,
        },
        onClick: clickProps.onClick,
      },
      dot(color, cfg.dotSize, { marginTop: '3px' }),
      React.createElement(
        'div',
        { style: { flex: 1, minWidth: 0 } },
        React.createElement(
          'div',
          {
            style: {
              fontSize: cfg.titleSize,
              fontWeight: 500,
              ...TRUNCATE,
              ...cancelledStyle(isCancelled),
            },
          },
          event.title
        ),
        showDate &&
          React.createElement(
            'div',
            { style: { fontSize: cfg.subSize, color: TOKENS.ink3, marginTop: '1px' } },
            formatEventDate(event.start_at, tz)
          ),
        showTime &&
          !event.all_day &&
          React.createElement(
            'div',
            { style: { fontSize: cfg.subSize, color: TOKENS.ink3, marginTop: '1px' } },
            `${formatEventTime(event.start_at, tz)} - ${formatEventTime(event.end_at, tz)}`
          ),
        showLocation &&
          event.location &&
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: cfg.subSize,
                color: TOKENS.ink3,
                marginTop: '2px',
              },
            },
            React.createElement(PinIcon, null),
            React.createElement('span', { style: TRUNCATE }, event.location)
          ),
        subtitle
      ),
      showStatus && renderStatusBadge(event.status),
      badge
    );
  }

  // ── Compact: una linea — dot + hora + titulo ──
  if (v === 'compact') {
    const cfg = EVENT_CARD_VARIANTS.compact;
    return React.createElement(
      'div',
      {
        className,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          background: TOKENS.surface,
          border: `1px solid ${TOKENS.border}`,
          borderRadius: TOKENS.rSm,
          overflow: 'hidden',
          opacity: isCancelled ? 0.6 : 1,
          ...clickProps,
        },
        onClick: clickProps.onClick,
      },
      dot(color, cfg.dotSize),
      showTime &&
        !event.all_day &&
        React.createElement(
          'span',
          {
            style: { fontSize: cfg.timeSize, fontWeight: 600, color: TOKENS.ink3 },
          },
          formatEventTime(event.start_at, tz)
        ),
      React.createElement(
        'span',
        {
          style: {
            fontSize: cfg.titleSize,
            fontWeight: 500,
            color: TOKENS.ink2,
            flex: 1,
            minWidth: 0,
            ...TRUNCATE,
            ...cancelledStyle(isCancelled),
          },
        },
        event.title
      ),
      showStatus && renderStatusBadge(event.status),
      badge
    );
  }

  // ── Standard / Week: estructura bento (timebar + body) ──
  const cfg = EVENT_CARD_VARIANTS[v === 'week' ? 'week' : 'standard'];

  return React.createElement(
    'div',
    {
      className,
      style: {
        borderRadius: TOKENS.rSm,
        border: `1px solid ${TOKENS.border}`,
        overflow: 'hidden',
        opacity: isCancelled ? 0.6 : 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...clickProps,
      },
      onClick: clickProps.onClick,
    },

    // Timebar: dot + hora + badge
    React.createElement(
      'div',
      {
        style: {
          padding: cfg.timebarPad,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderBottom: `1px solid ${TOKENS.border}`,
          background: TOKENS.bg,
          flexShrink: 0,
        },
      },
      dot(color, cfg.dotSize),
      showTime && !event.all_day
        ? React.createElement(
            'span',
            {
              style: {
                fontSize: cfg.timeSize,
                fontWeight: 700,
                color: TOKENS.ink3,
                letterSpacing: '0.3px',
                flex: 1,
              },
            },
            `${formatEventTime(event.start_at, tz)} – ${formatEventTime(event.end_at, tz)}`
          )
        : React.createElement('span', { style: { flex: 1 } }),
      showStatus && renderStatusBadge(event.status),
      badge
    ),

    // Body: titulo + subtitulo/ubicacion
    React.createElement(
      'div',
      { style: { padding: cfg.bodyPad, background: TOKENS.surface, flex: 1, minHeight: 0 } },
      React.createElement(
        'div',
        {
          style: {
            fontSize: cfg.titleSize,
            fontWeight: 500,
            color: TOKENS.ink2,
            ...TRUNCATE,
            ...cancelledStyle(isCancelled),
          },
        },
        event.title
      ),
      showLocation &&
        event.location &&
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: cfg.subSize,
              color: TOKENS.ink3,
              marginTop: '2px',
            },
          },
          React.createElement(PinIcon, null),
          React.createElement('span', { style: TRUNCATE }, event.location)
        ),
      showDate &&
        React.createElement(
          'div',
          {
            style: { fontSize: cfg.subSize, color: TOKENS.ink3, marginTop: '2px' },
          },
          formatEventDate(event.start_at, tz)
        ),
      subtitle
    )
  );
}
