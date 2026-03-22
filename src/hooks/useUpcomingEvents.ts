import { getHostReact, actions } from '@coongro/plugin-sdk';
import type { CalendarEvent } from '../types/event.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export interface UseUpcomingEventsResult {
  data: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUpcomingEvents(
  options: { limit?: number; calendarIds?: string[] } = {}
): UseUpcomingEventsResult {
  const { limit = 5, calendarIds } = options;
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
    setLoading(true);
    setError(null);
    try {
      const result = await actions.execute<CalendarEvent[]>('calendar.events.listUpcoming', {
        limit,
        calendarIds,
      });
      if (!mountedRef.current) return;
      setData(result);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar próximos eventos');
      setData([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [limit, calendarIds]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
