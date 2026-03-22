import { getHostReact, actions } from '@coongro/plugin-sdk';
import type { CalendarEvent } from '../types/event.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export interface UseEventsByEntityResult {
  data: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEventsByEntity(
  entityId?: string | null,
  entityType?: string
): UseEventsByEntityResult {
  const [data, setData] = useState<CalendarEvent[]>([]);
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
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await actions.execute<CalendarEvent[]>('calendar.events.listByEntity', {
        entityId,
        entityType,
      });
      if (!mountedRef.current) return;
      setData(result);
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

  return { data, loading, error, refetch: fetch };
}
