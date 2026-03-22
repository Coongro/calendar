import { getHostReact, getHostUI } from '@coongro/plugin-sdk';
import type { EventListProps } from '../../types/components.js';
import { useEvents } from '../../hooks/useEvents.js';
import { formatEventDateTime } from '../../utils/date.js';
import { formatStatus, STATUS_LABELS, STATUS_BADGE_CLASSES } from '../../utils/labels.js';
import { PinIcon, CalendarIcon } from '../internal/icons.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback } = React;

export function EventList({
  filters: initialFilters,
  extraActions = [],
  statusConfig,
  onRowClick,
  pageSize = 20,
  emptyMessage = 'No se encontraron eventos',
  emptyStateAction,
  className = '',
}: EventListProps) {
  const {
    data,
    loading,
    error,
    setFilters,
    setSort,
    pagination,
    nextPage,
    prevPage,
    goToPage,
  } = useEvents({ ...initialFilters, pageSize });

  const [searchValue, setSearchValue] = useState('');

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

  const getStatusLabel = (status: string) =>
    statusConfig?.[status]?.label ?? formatStatus(status);

  return React.createElement(
    'div',
    { className: `flex flex-col gap-4 ${className}` },

    // FilterBar
    React.createElement(UI.FilterBar, {
      searchValue,
      onSearchChange: handleSearch,
      searchPlaceholder: 'Buscar eventos...',
    }),

    // Error
    error &&
      React.createElement(
        'div',
        { className: 'text-sm text-cg-danger p-2 rounded bg-cg-danger-bg' },
        error
      ),

    // Table
    React.createElement(
      UI.Table,
      null,
      React.createElement(
        UI.TableHeader,
        null,
        React.createElement(
          UI.TableRow,
          null,
          React.createElement(UI.TableHead, null, 'Título'),
          React.createElement(UI.TableHead, null, 'Fecha'),
          React.createElement(UI.TableHead, null, 'Estado'),
          extraActions.length > 0 &&
            React.createElement(UI.TableHead, { className: 'w-10' })
        )
      ),
      React.createElement(
        UI.TableBody,
        null,
        loading
          ? Array.from({ length: 5 }).map((_, i) =>
              React.createElement(
                UI.TableRow,
                { key: `skeleton-${i}` },
                React.createElement(UI.TableCell, null, React.createElement(UI.Skeleton, { className: 'h-4 w-32' })),
                React.createElement(UI.TableCell, null, React.createElement(UI.Skeleton, { className: 'h-4 w-24' })),
                React.createElement(UI.TableCell, null, React.createElement(UI.Skeleton, { className: 'h-4 w-16' }))
              )
            )
          : data.length === 0
            ? React.createElement(
                UI.TableRow,
                null,
                React.createElement(
                  UI.TableCell,
                  { colSpan: 4 },
                  React.createElement(UI.EmptyState, {
                    title: emptyMessage,
                    icon: React.createElement(CalendarIcon, null),
                    action: emptyStateAction,
                  })
                )
              )
            : data.map((evt) =>
                React.createElement(
                  UI.TableRow,
                  {
                    key: evt.id,
                    className: onRowClick ? 'cursor-pointer' : '',
                    onClick: onRowClick ? () => onRowClick(evt) : undefined,
                  },
                  React.createElement(
                    UI.TableCell,
                    { className: 'font-medium' },
                    React.createElement(
                      'div',
                      { className: 'flex items-center gap-2' },
                      evt.color &&
                        React.createElement('span', {
                          className: 'w-2.5 h-2.5 rounded-full shrink-0',
                          style: { backgroundColor: evt.color },
                        }),
                      React.createElement(
                        'div',
                        { className: 'flex flex-col gap-0.5 min-w-0' },
                        React.createElement('span', { className: 'truncate' }, evt.title),
                        evt.location &&
                          React.createElement(
                            'div',
                            { className: 'flex items-center gap-1 text-xs text-cg-text-muted font-normal' },
                            React.createElement(PinIcon, null),
                            React.createElement('span', { className: 'truncate' }, evt.location)
                          )
                      )
                    )
                  ),
                  React.createElement(UI.TableCell, null, formatEventDateTime(evt.start_at)),
                  React.createElement(
                    UI.TableCell,
                    null,
                    React.createElement(
                      UI.Badge,
                      { variant: 'outline', className: STATUS_BADGE_CLASSES[evt.status] ?? '' },
                      getStatusLabel(evt.status)
                    )
                  ),
                  extraActions.length > 0 &&
                    React.createElement(
                      UI.TableCell,
                      null,
                      extraActions.map((action) =>
                        React.createElement(
                          UI.Button,
                          {
                            key: action.key,
                            variant: action.variant ?? 'ghost',
                            size: 'sm',
                            onClick: (e: { stopPropagation: () => void }) => {
                              e.stopPropagation();
                              action.onClick(evt);
                            },
                          },
                          action.icon ?? action.label
                        )
                      )
                    )
                )
              )
      )
    ),

    // Paginación
    pagination.totalPages > 1 &&
      React.createElement(
        'div',
        { className: 'flex justify-center' },
        React.createElement(UI.Pagination, {
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          onPageChange: goToPage,
        })
      )
  );
}
