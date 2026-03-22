import { getHostReact, actions } from '@coongro/plugin-sdk';
import type { CalendarEvent } from '../types/event.js';
import type { EventFilters, SortDirection } from '../types/filters.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export interface UseEventsOptions extends EventFilters {
  pageSize?: number;
  autoFetch?: boolean;
}

export interface UseEventsResult {
  data: CalendarEvent[];
  loading: boolean;
  error: string | null;
  filters: EventFilters;
  setFilters: (filters: EventFilters) => void;
  search: (query: string) => void;
  setSort: (orderBy: string, orderDir: SortDirection) => void;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  refetch: () => Promise<void>;
}

export function useEvents(options: UseEventsOptions = {}): UseEventsResult {
  const { pageSize: initialPageSize = 20, autoFetch = true, ...initialFilters } = options;

  const [data, setData] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<EventFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);
  const mountedRef = useRef(true);
  const isFirstRenderRef = useRef(true);

  // Sincroniza cambios externos de from/to (ej: navegación de fecha en CalendarView)
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    setFiltersState((prev) => ({ ...prev, from: initialFilters.from, to: initialFilters.to }));
    setPage(1);
  }, [initialFilters.from, initialFilters.to]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await actions.execute<CalendarEvent[]>('calendar.events.search', {
        ...filters,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      if (!mountedRef.current) return;
      setData(result);
      if (result.length < pageSize) {
        setTotal((page - 1) * pageSize + result.length);
      } else {
        setTotal(Math.max(total, page * pageSize + 1));
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar eventos');
      setData([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    if (autoFetch) {
      void fetch();
    }
  }, [fetch, autoFetch]);

  return {
    data,
    loading,
    error,
    filters,
    setFilters: (f) => {
      setFiltersState(f);
      setPage(1);
    },
    search: (query: string) => {
      setFiltersState((prev) => ({ ...prev, query }));
      setPage(1);
    },
    setSort: (orderBy: string, orderDir: SortDirection) => {
      setFiltersState((prev) => ({ ...prev, orderBy, orderDir }));
      setPage(1);
    },
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    nextPage: () => setPage((p) => p + 1),
    prevPage: () => setPage((p) => Math.max(1, p - 1)),
    goToPage: (p: number) => setPage(Math.max(1, p)),
    refetch: fetch,
  };
}
