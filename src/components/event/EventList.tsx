import { DataTable } from '@coongro/ui-components';
import { CalendarIcon, MapPinIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { useEvents } from '../../hooks/useEvents.js';
import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { TOKENS, TRUNCATE, statusBadgeStyle } from '../../styles/tokens.js';
import type { EventListProps } from '../../types/components.js';
import type { CalendarEvent } from '../../types/event.js';
import type { SortDirection } from '../../types/filters.js';
import { formatEventDateTime } from '../../utils/date.js';
import { formatStatus } from '../../utils/labels.js';

const SORTABLE_KEYS = new Set(['title', 'start_at', 'status']);

// Helpers de renderizado reutilizados en columnas desktop y cards movil
function renderColorDot(color: string | undefined | null) {
  if (!color) return null;
  return (
    <span
      style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        flexShrink: 0,
        backgroundColor: color,
      }}
    />
  );
}

function renderStatusBadge(
  status: string,
  statusConfig?: Record<string, { label: string; color: string }>
) {
  const label = statusConfig?.[status]?.label ?? formatStatus(status);
  return <span style={statusBadgeStyle(status)}>{label}</span>;
}

export function EventList({
  filters: initialFilters,
  columns: customColumns,
  extraColumns = [],
  extraActions = [],
  statusConfig,
  onRowClick,
  pageSize = 20,
  emptyMessage = 'No se encontraron eventos',
  emptyStateAction,
  className = '',
}: EventListProps): ReactElement | null {
  const tz = useTenantTimezone();
  const { data, loading, error, setFilters, setSort, pagination, goToPage, refetch } = useEvents({
    ...initialFilters,
    pageSize,
  });

  const [searchValue, setSearchValue] = useState('');
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      setFilters({
        ...initialFilters,
        query: value || undefined,
      });
    },
    [setFilters, initialFilters]
  );

  const handleSort = useCallback(
    (key: string, direction: 'asc' | 'desc' | null) => {
      if (!SORTABLE_KEYS.has(key)) return;
      setSortKey(direction ? key : '');
      setSortDir((direction ?? 'asc') as SortDirection);
      setSort(key, direction ?? 'asc');
    },
    [setSort]
  );

  const dtColumns = useMemo(() => {
    const base = customColumns ?? [
      {
        key: 'title',
        header: 'Titulo',
        sortable: true,
        render: (evt: CalendarEvent) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {renderColorDot(evt.color)}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.125rem',
                minWidth: 0,
              }}
            >
              <span style={{ ...TRUNCATE }}>{evt.title}</span>
              {evt.location && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    color: TOKENS.ink4,
                    fontWeight: 'normal',
                  }}
                >
                  <MapPinIcon size={10} strokeWidth={2} style={{ flexShrink: 0 }} />
                  <span style={{ ...TRUNCATE }}>{evt.location}</span>
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'start_at',
        header: 'Fecha',
        sortable: true,
        render: (evt: CalendarEvent) => formatEventDateTime(evt.start_at, tz),
      },
      {
        key: 'status',
        header: 'Estado',
        sortable: true,
        render: (evt: CalendarEvent) => renderStatusBadge(evt.status, statusConfig),
      },
    ];
    return [...base, ...extraColumns];
  }, [customColumns, extraColumns, statusConfig, tz]);

  const dtActions = useMemo(() => {
    if (extraActions.length === 0) return undefined;
    return extraActions.map((a) => ({
      label: a.label,
      onClick: a.onClick,
      variant: a.variant as 'ghost' | 'destructive' | undefined,
    }));
  }, [extraActions]);

  const mobileRender = useCallback(
    (evt: CalendarEvent) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {renderColorDot(evt.color)}
          <span
            style={{
              fontWeight: 500,
              fontSize: '0.875rem',
              ...TRUNCATE,
            }}
          >
            {evt.title}
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: TOKENS.ink4 }}>
          {formatEventDateTime(evt.start_at, tz)}
        </div>
        {evt.location && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              color: TOKENS.ink4,
            }}
          >
            <MapPinIcon size={10} strokeWidth={2} style={{ flexShrink: 0 }} />
            <span style={{ ...TRUNCATE }}>{evt.location}</span>
          </div>
        )}
        <div style={{ marginTop: '0.25rem' }}>{renderStatusBadge(evt.status, statusConfig)}</div>
      </div>
    ),
    [statusConfig]
  );

  return (
    <DataTable
      data={data}
      rowKey={(evt: CalendarEvent) => evt.id}
      loading={loading}
      error={error ?? undefined}
      onRetry={() => void refetch()}
      columns={dtColumns}
      searchPlaceholder="Buscar eventos..."
      searchValue={searchValue}
      onSearchChange={handleSearch}
      sortKey={sortKey || null}
      sortDirection={sortDir as 'asc' | 'desc' | null}
      onSortChange={handleSort}
      pagination={{
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
      }}
      onPageChange={goToPage}
      actions={dtActions}
      onRowClick={onRowClick}
      emptyState={{
        title: emptyStateAction ? 'No hay eventos aun' : emptyMessage,
        description: emptyStateAction
          ? 'Crea tu primer evento para empezar a organizar tu agenda.'
          : undefined,
        icon: emptyStateAction ? (
          <CalendarIcon size={32} strokeWidth={1.5} style={{ color: 'var(--cg-text-muted)' }} />
        ) : undefined,
        action: emptyStateAction,
        filteredTitle: emptyMessage,
        filteredDescription: 'Prueba con otros terminos o ajusta los filtros.',
      }}
      mobileRender={mobileRender}
      className={className}
    />
  );
}
