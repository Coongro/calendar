import { actions } from '@coongro/plugin-sdk';
import type { Page } from '@coongro/plugin-sdk/actions';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { CalendarEvent } from '../types/event.js';

export interface UseEventsByEntityResult {
  /** La primera página (50, del más próximo al más lejano). */
  data: CalendarEvent[];
  /** Cuántos eventos tiene la entidad en total. */
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEventsByEntity(
  entityId?: string | null,
  entityType?: string
): UseEventsByEntityResult {
  const [data, setData] = useState<CalendarEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetch = useCallback(async () => {
    if (!entityId || !entityType) {
      setData([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await actions.execute<Page<CalendarEvent>>('calendar.events.listByEntity', {
        entityId,
        entityType,
      });
      if (!mountedRef.current) return;
      setData(result.items);
      setTotal(result.total);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar eventos');
      setData([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}
