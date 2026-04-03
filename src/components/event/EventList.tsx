import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useEvents } from '../../hooks/useEvents.js';
import type { EventListProps } from '../../types/components.js';
import type { CalendarEvent } from '../../types/event.js';
import type { SortDirection } from '../../types/filters.js';
import { formatEventDateTime } from '../../utils/date.js';
import { formatStatus, STATUS_BADGE_CLASSES } from '../../utils/labels.js';
import { CalendarIcon, PinIcon } from '../internal/icons.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback, useMemo } = React;

const SORTABLE_KEYS = new Set(['title', 'start_at', 'status']);

// Helpers de renderizado reutilizados en columnas desktop y cards móvil
function renderColorDot(color: string | undefined | null) {
  if (!color) return null;
  return React.createElement('span', {
    className: 'w-2.5 h-2.5 rounded-full shrink-0',
    style: { backgroundColor: color },
  });
}

function renderStatusBadge(
  status: string,
  statusConfig?: Record<string, { label: string; color: string }>
) {
  const label = statusConfig?.[status]?.label ?? formatStatus(status);
  return React.createElement(
    UI.Badge,
    { variant: 'outline', className: STATUS_BADGE_CLASSES[status] ?? '' },
    label
  );
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
            { className: 'flex items-center gap-2' },
            renderColorDot(evt.color),
            React.createElement(
              'div',
              { className: 'flex flex-col gap-0.5 min-w-0' },
              React.createElement('span', { className: 'truncate' }, evt.title),
              evt.location &&
                React.createElement(
                  'div',
                  {
                    className: 'flex items-center gap-1 text-xs text-cg-text-muted font-normal',
                  },
                  React.createElement(PinIcon, null),
                  React.createElement('span', { className: 'truncate' }, evt.location)
                )
            )
          ),
      },
      {
        key: 'start_at',
        header: 'Fecha',
        sortable: true,
        render: (evt: CalendarEvent) => formatEventDateTime(evt.start_at),
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
        { className: 'flex flex-col gap-1' },
        React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          renderColorDot(evt.color),
          React.createElement('span', { className: 'font-medium text-sm truncate' }, evt.title)
        ),
        React.createElement(
          'div',
          { className: 'text-xs', style: { color: 'var(--cg-text-muted)' } },
          formatEventDateTime(evt.start_at)
        ),
        evt.location &&
          React.createElement(
            'div',
            {
              className: 'flex items-center gap-1 text-xs',
              style: { color: 'var(--cg-text-muted)' },
            },
            React.createElement(PinIcon, null),
            React.createElement('span', { className: 'truncate' }, evt.location)
          ),
        React.createElement(
          'div',
          { className: 'mt-1' },
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
