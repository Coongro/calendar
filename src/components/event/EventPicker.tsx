import {
  Chip,
  Combobox,
  ComboboxChipTrigger,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  useComboboxContext,
} from '@coongro/ui-components';
import { useCallback, useEffect, useRef } from 'react';

import { useEvent } from '../../hooks/useEvent.js';
import { useEvents } from '../../hooks/useEvents.js';
import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import type { EventPickerProps } from '../../types/components.js';
import type { CalendarEvent } from '../../types/event.js';
import { formatEventDateTime } from '../../utils/date.js';

function EventSearchContent({
  filters,
  onResults,
}: {
  filters: EventPickerProps['filters'];
  onResults: (events: CalendarEvent[]) => void;
}) {
  const tz = useTenantTimezone();
  const { debouncedSearch, setLoading } = useComboboxContext();
  const { data, loading, search: doSearch } = useEvents({ ...filters, pageSize: 10 });

  useEffect(() => {
    doSearch(debouncedSearch);
  }, [debouncedSearch, doSearch]);

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  useEffect(() => {
    onResults(data);
  }, [data, onResults]);

  return (
    <ComboboxContent>
      {data.length === 0 ? (
        <ComboboxEmpty>Sin resultados</ComboboxEmpty>
      ) : (
        data.map((evt) => (
          <ComboboxItem
            key={evt.id}
            value={evt.id}
            subtitle={formatEventDateTime(evt.start_at, tz)}
          >
            {evt.title}
          </ComboboxItem>
        ))
      )}
    </ComboboxContent>
  );
}

export function EventPicker({
  filters = {},
  value,
  onChange,
  placeholder = 'Buscar evento...',
  disabled = false,
  className = '',
}: EventPickerProps) {
  const { event: selectedEvent } = useEvent(value);
  const resultsRef = useRef<CalendarEvent[]>([]);

  const handleResults = useCallback((events: CalendarEvent[]) => {
    resultsRef.current = events;
  }, []);

  const handleSelect = useCallback(
    (eventId: string) => {
      const evt = resultsRef.current.find((e) => e.id === eventId);
      if (evt) onChange?.(evt);
    },
    [onChange]
  );

  if (value && selectedEvent) {
    return (
      <div
        className={className}
        /* Mismo patron que el trigger del Combobox: expone el control a lectores */
        /* de pantalla (y al copiloto IA) aunque ya haya un evento elegido. El Chip */
        /* solo no anuncia que esto es un selector de evento. */
        role="combobox"
        aria-expanded={false}
        aria-label={`Evento: ${selectedEvent.title}`}
      >
        <Chip onRemove={!disabled ? () => onChange?.(null) : undefined} size="md">
          {selectedEvent.title}
        </Chip>
      </div>
    );
  }

  return (
    <Combobox value="" onValueChange={handleSelect} debounceMs={200}>
      <ComboboxChipTrigger placeholder={placeholder} />
      <EventSearchContent filters={filters} onResults={handleResults} />
    </Combobox>
  );
}
