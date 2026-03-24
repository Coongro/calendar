import { getHostReact, actions, usePlugin } from '@coongro/plugin-sdk';

import type { CalendarGroup, CalendarCreateData, CalendarUpdateData } from '../types/calendar.js';

const React = getHostReact();
const { useState, useCallback } = React;

export interface UseCalendarMutationsResult {
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  create: (data: CalendarCreateData) => Promise<CalendarGroup | null>;
  update: (id: string, data: CalendarUpdateData) => Promise<CalendarGroup | null>;
  softDelete: (id: string) => Promise<boolean>;
  restore: (id: string) => Promise<boolean>;
  toggleVisibility: (id: string) => Promise<CalendarGroup | null>;
}

export function useCalendarMutations(): UseCalendarMutationsResult {
  const { toast } = usePlugin();
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const create = useCallback(
    async (data: CalendarCreateData): Promise<CalendarGroup | null> => {
      setCreating(true);
      try {
        const result = await actions.execute<CalendarGroup[]>('calendar.calendars.create', {
          data,
        });
        toast.success('Calendario creado', data.name);
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
    async (id: string, data: CalendarUpdateData): Promise<CalendarGroup | null> => {
      setUpdating(true);
      try {
        const result = await actions.execute<CalendarGroup[]>('calendar.calendars.update', {
          id,
          data,
        });
        toast.success('Calendario actualizado', '');
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
        await actions.execute('calendar.calendars.softDelete', { id });
        toast.success('Calendario archivado', '');
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
        await actions.execute('calendar.calendars.restore', { id });
        toast.success('Calendario restaurado', '');
        return true;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo restaurar');
        return false;
      }
    },
    [toast]
  );

  const toggleVisibility = useCallback(
    async (id: string): Promise<CalendarGroup | null> => {
      try {
        const result = await actions.execute<CalendarGroup[]>(
          'calendar.calendars.toggleVisibility',
          { id }
        );
        return result[0] ?? null;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo cambiar visibilidad');
        return null;
      }
    },
    [toast]
  );

  return { creating, updating, deleting, create, update, softDelete, restore, toggleVisibility };
}
