import { getHostReact, actions } from '@coongro/plugin-sdk';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export interface CountResult {
  key: string;
  count: number;
}

export interface UseEventStatsResult {
  byStatus: CountResult[];
  byDate: CountResult[];
  byCalendar: CountResult[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEventStats(options: { from?: string; to?: string } = {}): UseEventStatsResult {
  const { from, to } = options;
  const [byStatus, setByStatus] = useState<CountResult[]>([]);
  const [byDate, setByDate] = useState<CountResult[]>([]);
  const [byCalendar, setByCalendar] = useState<CountResult[]>([]);
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
      const [statusResult, dateResult, calResult] = await Promise.all([
        actions.execute<CountResult[]>('calendar.events.countByStatus', { from, to }),
        from && to
          ? actions.execute<CountResult[]>('calendar.events.countByDate', { from, to })
          : Promise.resolve([]),
        actions.execute<CountResult[]>('calendar.events.countByCalendar', { from, to }),
      ]);
      if (!mountedRef.current) return;
      setByStatus(statusResult);
      setByDate(dateResult);
      setByCalendar(calResult);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { byStatus, byDate, byCalendar, loading, error, refetch: fetch };
}
