import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useEvents } from '../../hooks/useEvents.js';
import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { TOKENS, TRUNCATE, statusBadgeStyle } from '../../styles/tokens.js';
import type { EventListProps } from '../../types/components.js';
import type { CalendarEvent } from '../../types/event.js';
import type { SortDirection } from '../../types/filters.js';
import { formatEventDateTime } from '../../utils/date.js';
import { formatStatus } from '../../utils/labels.js';
import { CalendarIcon, PinIcon } from '../internal/icons.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback, useMemo } = React;

const SORTABLE_KEYS = new Set(['title', 'start_at', 'status']);

// Helpers de renderizado reutilizados en columnas desktop y cards movil
function renderColorDot(color: string | undefined | null) {
  if (!color) return null;
  return React.createElement('span', {
    style: {
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      flexShrink: 0,
      backgroundColor: color,
    },
  });
}

function renderStatusBadge(
  status: string,
  statusConfig?: Record<string, { label: string; color: string }>
) {
  const label = statusConfig?.[status]?.label ?? formatStatus(status);
  return React.createElement('span', { style: statusBadgeStyle(status) }, label);
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
}: EventListProps) {
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
        render: (evt: CalendarEvent) =>
          React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' } },
            renderColorDot(evt.color),
            React.createElement(
              'div',
              {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.125rem',
                  minWidth: 0,
                },
              },
              React.createElement('span', { style: { ...TRUNCATE } }, evt.title),
              evt.location &&
                React.createElement(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.75rem',
                      color: TOKENS.ink4,
                      fontWeight: 'normal',
                    },
                  },
                  React.createElement(PinIcon, null),
                  React.createElement('span', { style: { ...TRUNCATE } }, evt.location)
                )
            )
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
  }, [customColumns, extraColumns, statusConfig]);

  const dtActions = useMemo(() => {
    if (extraActions.length === 0) return undefined;
    return extraActions.map((a) => ({
      label: a.label,
      onClick: a.onClick,
      variant: a.variant as 'ghost' | 'destructive' | undefined,
    }));
  }, [extraActions]);

  const mobileRender = useCallback(
    (evt: CalendarEvent) =>
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem' } },
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' } },
          renderColorDot(evt.color),
          React.createElement(
            'span',
            {
              style: {
                fontWeight: 500,
                fontSize: '0.875rem',
                ...TRUNCATE,
              },
            },
            evt.title
          )
        ),
        React.createElement(
          'div',
          { style: { fontSize: '0.75rem', color: TOKENS.ink4 } },
          formatEventDateTime(evt.start_at, tz)
        ),
        evt.location &&
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                color: TOKENS.ink4,
              },
            },
            React.createElement(PinIcon, null),
            React.createElement('span', { style: { ...TRUNCATE } }, evt.location)
          ),
        React.createElement(
          'div',
          { style: { marginTop: '0.25rem' } },
          renderStatusBadge(evt.status, statusConfig)
        )
      ),
    [statusConfig]
  );

  return React.createElement(UI.DataTable, {
    data,
    rowKey: (evt: CalendarEvent) => evt.id,
    loading,
    error: error ?? undefined,
    onRetry: refetch,
    columns: dtColumns,
    searchPlaceholder: 'Buscar eventos...',
    searchValue,
    onSearchChange: handleSearch,
    sortKey: sortKey || null,
    sortDirection: sortDir as 'asc' | 'desc' | null,
    onSortChange: handleSort,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
    },
    onPageChange: goToPage,
    actions: dtActions,
    onRowClick,
    emptyState: {
      title: emptyStateAction ? 'No hay eventos aun' : emptyMessage,
      description: emptyStateAction
        ? 'Crea tu primer evento para empezar a organizar tu agenda.'
        : undefined,
      icon: emptyStateAction ? React.createElement(CalendarIcon, null) : undefined,
      action: emptyStateAction,
      filteredTitle: emptyMessage,
      filteredDescription: 'Prueba con otros terminos o ajusta los filtros.',
    },
    mobileRender,
    className,
  });
}
