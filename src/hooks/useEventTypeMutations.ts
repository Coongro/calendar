import { getHostReact, actions, usePlugin } from '@coongro/plugin-sdk';

import type { EventType, EventTypeCreateData, EventTypeUpdateData } from '../types/event-type.js';

const React = getHostReact();
const { useState, useCallback } = React;

export interface UseEventTypeMutationsResult {
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  create: (data: EventTypeCreateData) => Promise<EventType | null>;
  update: (id: string, data: EventTypeUpdateData) => Promise<EventType | null>;
  softDelete: (id: string) => Promise<boolean>;
  restore: (id: string) => Promise<boolean>;
}

export function useEventTypeMutations(): UseEventTypeMutationsResult {
  const { toast } = usePlugin();
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const create = useCallback(
    async (data: EventTypeCreateData): Promise<EventType | null> => {
      setCreating(true);
      try {
        const result = await actions.execute<EventType[]>('calendar.types.create', { data });
        toast.success('Tipo de evento creado', data.name);
        return result[0] ?? null;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo crear');
        return null;
      } finally {
        setCreating(false);
      }
    },
    [toast]
  );

  const update = useCallback(
    async (id: string, data: EventTypeUpdateData): Promise<EventType | null> => {
      setUpdating(true);
      try {
        const result = await actions.execute<EventType[]>('calendar.types.update', { id, data });
        toast.success('Tipo actualizado', '');
        return result[0] ?? null;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo actualizar');
        return null;
      } finally {
        setUpdating(false);
      }
    },
    [toast]
  );

  const softDelete = useCallback(
    async (id: string): Promise<boolean> => {
      setDeleting(true);
      try {
        await actions.execute('calendar.types.softDelete', { id });
        toast.success('Tipo archivado', '');
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
        await actions.execute('calendar.types.restore', { id });
        toast.success('Tipo restaurado', '');
        return true;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo restaurar');
        return false;
      }
    },
    [toast]
  );

  return { creating, updating, deleting, create, update, softDelete, restore };
}
