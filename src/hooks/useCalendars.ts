import { getHostReact, actions } from '@coongro/plugin-sdk';
import type { CalendarGroup } from '../types/calendar.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export interface UseCalendarsResult {
  data: CalendarGroup[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCalendars(): UseCalendarsResult {
  const [data, setData] = useState<CalendarGroup[]>([]);
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
      const result = await actions.execute<CalendarGroup[]>('calendar.calendars.list');
      if (!mountedRef.current) return;
      setData(result);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar calendarios');
      setData([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
