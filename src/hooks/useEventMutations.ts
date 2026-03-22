import { getHostReact, actions, usePlugin } from '@coongro/plugin-sdk';
import type { CalendarEvent, EventCreateData, EventUpdateData } from '../types/event.js';

const React = getHostReact();
const { useState, useCallback } = React;

export interface UseEventMutationsResult {
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  create: (data: EventCreateData) => Promise<CalendarEvent | null>;
  update: (id: string, data: EventUpdateData) => Promise<CalendarEvent | null>;
  remove: (id: string) => Promise<boolean>;
  softDelete: (id: string) => Promise<boolean>;
  restore: (id: string) => Promise<boolean>;
  move: (id: string, startAt: string, endAt: string) => Promise<CalendarEvent | null>;
}

export function useEventMutations(): UseEventMutationsResult {
  const { toast } = usePlugin();
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const create = useCallback(
    async (data: EventCreateData): Promise<CalendarEvent | null> => {
      setCreating(true);
      try {
        const result = await actions.execute<CalendarEvent[]>('calendar.events.create', { data });
        toast.success('Evento creado', data.title);
        return result[0] ?? null;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo crear el evento');
        return null;
      } finally {
        setCreating(false);
      }
    },
    [toast]
  );

  const update = useCallback(
    async (id: string, data: EventUpdateData): Promise<CalendarEvent | null> => {
      setUpdating(true);
      try {
        const result = await actions.execute<CalendarEvent[]>('calendar.events.update', {
          id,
          data,
        });
        toast.success('Evento actualizado', '');
        return result[0] ?? null;
      } catch (err) {
        toast.error(
          'Error',
          err instanceof Error ? err.message : 'No se pudo actualizar el evento'
        );
        return null;
      } finally {
        setUpdating(false);
      }
    },
    [toast]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setDeleting(true);
      try {
        await actions.execute('calendar.events.delete', { id });
        toast.success('Evento eliminado', '');
        return true;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo eliminar');
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [toast]
  );

  const softDelete = useCallback(
    async (id: string): Promise<boolean> => {
      setDeleting(true);
      try {
        await actions.execute('calendar.events.softDelete', { id });
        toast.success('Evento archivado', '');
        return true;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo archivar');
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [toast]
  );

  const restore = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await actions.execute('calendar.events.restore', { id });
        toast.success('Evento restaurado', '');
        return true;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo restaurar');
        return false;
      }
    },
    [toast]
  );

  const move = useCallback(
    async (id: string, startAt: string, endAt: string): Promise<CalendarEvent | null> => {
      setUpdating(true);
      try {
        const result = await actions.execute<CalendarEvent[]>('calendar.events.moveEvent', {
          id,
          startAt,
          endAt,
        });
        toast.success('Evento movido', '');
        return result[0] ?? null;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo mover el evento');
        return null;
      } finally {
        setUpdating(false);
      }
    },
    [toast]
  );

  return { creating, updating, deleting, create, update, remove, softDelete, restore, move };
}
