import { getHostReact, actions } from '@coongro/plugin-sdk';

import type { CalendarEvent } from '../types/event.js';

const React = getHostReact();
const { useState, useEffect, useRef } = React;

export interface UseEventResult {
  event: CalendarEvent | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEvent(eventId?: string | null): UseEventResult {
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetch = async () => {
    if (!eventId) {
      setEvent(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await actions.execute<CalendarEvent | undefined>('calendar.events.getById', {
        id: eventId,
      });
      if (!mountedRef.current) return;
      setEvent(result ?? null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar evento');
      setEvent(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    void fetch();
  }, [eventId]);

  return { event, loading, error, refetch: fetch };
}
