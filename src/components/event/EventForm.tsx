import { getHostReact, getHostUI, useViewContributions } from '@coongro/plugin-sdk';
import type { EventFormProps } from '../../types/components.js';
import type { EventCreateData } from '../../types/event.js';
import { useEvent } from '../../hooks/useEvent.js';
import { useEventMutations } from '../../hooks/useEventMutations.js';
import { useCalendarSettings } from '../../hooks/useCalendarSettings.js';
import { useCalendars } from '../../hooks/useCalendars.js';
import { useEventTypes } from '../../hooks/useEventTypes.js';
import { STATUS_LABELS, toSelectOptions } from '../../utils/labels.js';
import { addMinutes, toDateString } from '../../utils/date.js';
import { DatePicker } from '../internal/DatePicker.js';
import { TimePicker } from '../internal/TimePicker.js';
import { ColorPicker } from '../internal/ColorPicker.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useEffect, useCallback } = React;

function isFieldHidden(field: string, hiddenFields?: string[]): boolean {
  return hiddenFields?.includes(field) ?? false;
}

export function EventForm({
  eventId,
  defaults = {},
  hiddenFields = [],
  hiddenSections = [],
  calendarOptions,
  eventTypeOptions,
  renderBeforeFields,
  renderAfterFields,
  renderEntitySection,
  renderFooter,
  onSuccess,
  onCancel,
  className = '',
}: EventFormProps) {
  const isEdit = !!eventId;
  const { event, loading: loadingEvent } = useEvent(eventId);
  const { settings } = useCalendarSettings();
  const { create, update, creating, updating } = useEventMutations();
  const { data: calendars } = useCalendars();
  const { data: eventTypes } = useEventTypes();

  const calOpts = calendarOptions ?? calendars;
  const typeOpts = eventTypeOptions ?? eventTypes;

  // Contribuciones de otros plugins
  const { sections: beforeSections } = useViewContributions('calendar.event-form.before-fields');
  const { sections: afterSections } = useViewContributions('calendar.event-form.after-fields');
  const { sections: entitySections } = useViewContributions('calendar.event-form.entity-section');
  const { sections: actionSections } = useViewContributions('calendar.event-form.actions');

  const isSaving = creating || updating;

  const now = new Date();
  const defaultStart = now.toISOString();
  const defaultEnd = addMinutes(defaultStart, settings.defaultDuration);

  const [formData, setFormData] = useState<Record<string, unknown>>({
    title: '',
    start_at: defaultStart,
    end_at: defaultEnd,
    all_day: false,
    status: settings.defaultStatus,
    ...defaults,
  });

  useEffect(() => {
    if (isEdit && event) {
      setFormData({
        title: event.title,
        description: event.description ?? '',
        start_at: event.start_at,
        end_at: event.end_at,
        all_day: event.all_day,
        status: event.status,
        color: event.color ?? '',
        location: event.location ?? '',
        calendar_id: event.calendar_id ?? '',
        event_type_id: event.event_type_id ?? '',
        entity_id: event.entity_id ?? '',
        entity_type: event.entity_type ?? '',
        notes: event.notes ?? '',
        tags: event.tags,
        metadata: event.metadata,
      });
    }
  }, [isEdit, event]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: { preventDefault: () => void }) => {
      e.preventDefault();
      const data = formData as unknown as EventCreateData;
      const result = isEdit ? await update(eventId!, data) : await create(data);
      if (result) onSuccess?.(result);
    },
    [formData, isEdit, eventId, create, update, onSuccess]
  );

  if (isEdit && loadingEvent) {
    return React.createElement(
      'div',
      { className: 'flex flex-col gap-4 p-4' },
      Array.from({ length: 6 }).map((_, i) =>
        React.createElement(UI.Skeleton, { key: i, className: 'h-10 rounded-lg' })
      )
    );
  }

  // Extraer fecha y hora del ISO string usando tiempo local (no UTC)
  const startDate = formData.start_at ? toDateString(new Date(formData.start_at as string)) : '';
  const startTime = (formData.start_at as string)
    ? new Date(formData.start_at as string).toLocaleTimeString('es', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '';
  const endTime = (formData.end_at as string)
    ? new Date(formData.end_at as string).toLocaleTimeString('es', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '';

  return React.createElement(
    'form',
    { onSubmit: handleSubmit, className: `flex flex-col gap-5 ${className}` },

    // Contribuciones before
    ...(beforeSections.length > 0
      ? beforeSections.map((s, i) =>
          React.createElement(React.Fragment, { key: `before-${String(i)}` }, s.render() as any)
        )
      : renderBeforeFields
        ? [renderBeforeFields()]
        : []),

    // Título
    React.createElement(
      'div',
      { className: 'flex flex-col gap-1.5' },
      React.createElement(UI.Label, null, 'Título *'),
      React.createElement(UI.Input, {
        value: (formData.title as string) ?? '',
        onChange: (e: { target: { value: string } }) => handleChange('title', e.target.value),
        placeholder: 'Título del evento',
        required: true,
      })
    ),

    // Fecha y hora
    React.createElement(
      'div',
      { className: 'grid grid-cols-3 gap-3' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1.5' },
        React.createElement(UI.Label, null, 'Fecha *'),
        React.createElement(DatePicker, {
          value: startDate,
          onChange: (date: string) => {
            const st = new Date(`${date}T${startTime || '09:00'}:00`).toISOString();
            handleChange('start_at', st);
            handleChange('end_at', addMinutes(st, settings.defaultDuration));
          },
        })
      ),
      !(formData.all_day as boolean) &&
        React.createElement(
          'div',
          { className: 'flex flex-col gap-1.5' },
          React.createElement(UI.Label, null, 'Inicio'),
          React.createElement(TimePicker, {
            value: startTime,
            step: settings.slotDuration,
            minTime: `${String(settings.startHour).padStart(2, '0')}:00`,
            maxTime: `${String(settings.endHour).padStart(2, '0')}:00`,
            onChange: (time: string) => {
              const st = new Date(`${startDate}T${time}:00`).toISOString();
              handleChange('start_at', st);
              handleChange('end_at', addMinutes(st, settings.defaultDuration));
            },
          })
        ),
      !(formData.all_day as boolean) &&
        React.createElement(
          'div',
          { className: 'flex flex-col gap-1.5' },
          React.createElement(UI.Label, null, 'Fin'),
          React.createElement(TimePicker, {
            value: endTime,
            step: settings.slotDuration,
            onChange: (time: string) => {
              handleChange('end_at', new Date(`${startDate}T${time}:00`).toISOString());
            },
          })
        )
    ),

    // Todo el día
    React.createElement(
      'div',
      { className: 'flex items-center gap-2' },
      React.createElement(UI.Switch, {
        checked: (formData.all_day as boolean) ?? false,
        onCheckedChange: (checked: boolean) => handleChange('all_day', checked),
      }),
      React.createElement(UI.Label, null, 'Todo el día')
    ),

    // Calendario + Tipo
    React.createElement(
      'div',
      { className: 'grid grid-cols-2 gap-3' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1.5' },
        React.createElement(UI.Label, null, 'Calendario'),
        React.createElement(
          UI.Select,
          {
            value: (formData.calendar_id as string) ?? '',
            onValueChange: (v: string) => handleChange('calendar_id', v),
            placeholder: calOpts.length === 0 ? 'Sin calendarios' : 'Seleccionar',
          },
          ...calOpts.map((cal) =>
            React.createElement(UI.SelectItem, { key: cal.id, value: cal.id }, cal.name)
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1.5' },
        React.createElement(
          UI.Label,
          null,
          `Tipo${settings.requireType ? ' *' : ''}`
        ),
        React.createElement(
          UI.Select,
          {
            value: (formData.event_type_id as string) ?? '',
            onValueChange: (v: string) => handleChange('event_type_id', v),
            placeholder: typeOpts.length === 0 ? 'Sin tipos' : 'Seleccionar',
          },
          ...typeOpts.map((t) =>
            React.createElement(UI.SelectItem, { key: t.id, value: t.id }, t.name)
          )
        )
      )
    ),

    // Status
    React.createElement(
      'div',
      { className: 'flex flex-col gap-1.5' },
      React.createElement(UI.Label, null, 'Estado'),
      React.createElement(
        UI.Select,
        {
          value: (formData.status as string) ?? 'scheduled',
          onValueChange: (v: string) => handleChange('status', v),
        },
        toSelectOptions(STATUS_LABELS).map((opt) =>
          React.createElement(UI.SelectItem, { key: opt.value, value: opt.value }, opt.label)
        )
      )
    ),

    // Entity section (contribution slot)
    ...(entitySections.length > 0
      ? entitySections.map((s, i) =>
          React.createElement(React.Fragment, { key: `entity-${String(i)}` }, s.render() as any)
        )
      : renderEntitySection
        ? [renderEntitySection()]
        : []),

    // Descripción
    !isFieldHidden('description', hiddenFields) &&
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1.5' },
        React.createElement(
          UI.Label,
          null,
          `Descripción${settings.requireDescription ? ' *' : ''}`
        ),
        React.createElement(UI.Textarea, {
          value: (formData.description as string) ?? '',
          onChange: (e: { target: { value: string } }) =>
            handleChange('description', e.target.value),
          placeholder: 'Descripción del evento',
          rows: 3,
        })
      ),

    // Ubicación
    !isFieldHidden('location', hiddenFields) &&
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1.5' },
        React.createElement(UI.Label, null, 'Ubicación'),
        React.createElement(UI.Input, {
          value: (formData.location as string) ?? '',
          onChange: (e: { target: { value: string } }) => handleChange('location', e.target.value),
          placeholder: 'Ubicación',
        })
      ),

    // Notas
    !isFieldHidden('notes', hiddenFields) &&
      settings.showNotes &&
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1.5' },
        React.createElement(UI.Label, null, 'Notas'),
        React.createElement(UI.Textarea, {
          value: (formData.notes as string) ?? '',
          onChange: (e: { target: { value: string } }) => handleChange('notes', e.target.value),
          placeholder: 'Notas internas',
          rows: 2,
        })
      ),

    // Color
    !isFieldHidden('color', hiddenFields) &&
      settings.showColorPicker &&
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1.5' },
        React.createElement(UI.Label, null, 'Color'),
        React.createElement(ColorPicker, {
          value: (formData.color as string) ?? '',
          onChange: (color: string) => handleChange('color', color),
        })
      ),

    // Contribuciones after
    ...(afterSections.length > 0
      ? afterSections.map((s, i) =>
          React.createElement(React.Fragment, { key: `after-${String(i)}` }, s.render() as any)
        )
      : renderAfterFields
        ? [renderAfterFields()]
        : []),

    // Botones
    renderFooter
      ? renderFooter()
      : React.createElement(
          'div',
          { className: 'flex gap-3 pt-2' },
          React.createElement(
            UI.Button,
            { type: 'submit', disabled: isSaving, className: 'flex-1' },
            isSaving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear evento'
          ),
          onCancel &&
            React.createElement(
              UI.Button,
              { type: 'button', variant: 'outline', onClick: onCancel },
              'Cancelar'
            ),
          // Action contributions
          ...actionSections.map((s, i) =>
            React.createElement(React.Fragment, { key: `action-${String(i)}` }, s.render() as any)
          )
        )
  );
}
