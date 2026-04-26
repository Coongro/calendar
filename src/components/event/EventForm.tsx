import {
  formatLocalTime,
  localToUTC,
  nowUTC,
  toDateKey,
  type UTCTimestamp,
} from '@coongro/datetime';
import { getHostReact, getHostUI, useViewContributions } from '@coongro/plugin-sdk';

import { useCalendars } from '../../hooks/useCalendars.js';
import { useCalendarSettings } from '../../hooks/useCalendarSettings.js';
import { useEvent } from '../../hooks/useEvent.js';
import { useEventMutations } from '../../hooks/useEventMutations.js';
import { useEventTypes } from '../../hooks/useEventTypes.js';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import type { EventFormProps } from '../../types/components.js';
import type { EventCreateData } from '../../types/event.js';
import { addMinutes } from '../../utils/date.js';
import { STATUS_LABELS, toSelectOptions } from '../../utils/labels.js';
import { ColorPicker } from '../internal/ColorPicker.js';
import { DatePicker } from '../internal/DatePicker.js';
import { TimePicker } from '../internal/TimePicker.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useEffect, useCallback } = React;

function isFieldHidden(field: string, hiddenFields?: string[]): boolean {
  return hiddenFields?.includes(field) ?? false;
}

// Estilos reutilizables para campos de formulario
const FIELD_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem',
} as const;

export function EventForm({
  eventId,
  defaults = {},
  hiddenFields = [],
  hiddenSections: _hiddenSections = [],
  calendarOptions,
  eventTypeOptions,
  renderBeforeFields,
  renderAfterFields,
  renderEntitySection,
  renderFooter,
  onSuccess,
  onCancel,
  className = '',
  formRef,
  hideActions,
  onSavingChange,
}: EventFormProps) {
  const isMobile = useIsMobile();
  const tz = useTenantTimezone();
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

  useEffect(() => {
    onSavingChange?.(isSaving);
  }, [isSaving, onSavingChange]);

  const defaultStart = nowUTC();
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
      const result = isEdit ? await update(eventId, data) : await create(data);
      if (result) onSuccess?.(result);
    },
    [formData, isEdit, eventId, create, update, onSuccess]
  );

  if (isEdit && loadingEvent) {
    return React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1rem',
        },
      },
      Array.from({ length: 6 }).map((_, i) =>
        React.createElement(UI.Skeleton, { key: i, className: 'h-10 rounded-lg' })
      )
    );
  }

  const startAt = formData.start_at as UTCTimestamp | undefined;
  const endAt = formData.end_at as UTCTimestamp | undefined;
  const startDate = startAt ? toDateKey(startAt, tz) : '';
  const startTime = startAt ? formatLocalTime(startAt, tz) : '';
  const endTime = endAt ? formatLocalTime(endAt, tz) : '';

  // ── Contenido de cada FormSection (campos originales, sin Card propio) ──

  const detallesContent = [
    React.createElement(
      'div',
      { key: 'title', style: FIELD_STYLE },
      React.createElement(UI.Label, null, 'Título *'),
      React.createElement(UI.Input, {
        value: (formData.title as string) ?? '',
        onChange: (e: { target: { value: string } }) => handleChange('title', e.target.value),
        placeholder: 'Título del evento',
        required: true,
      })
    ),
    !isFieldHidden('description', hiddenFields) &&
      React.createElement(
        'div',
        { key: 'description', style: FIELD_STYLE },
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
  ].filter(Boolean);

  const fechaContent = [
    React.createElement(
      'div',
      {
        key: 'datetime-grid',
        style: {
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '0.75rem',
        },
      },
      React.createElement(
        'div',
        { style: FIELD_STYLE },
        React.createElement(UI.Label, null, 'Fecha *'),
        React.createElement(DatePicker, {
          value: startDate,
          onChange: (date: string) => {
            const st = localToUTC(date, startTime || '09:00', tz);
            handleChange('start_at', st);
            handleChange('end_at', addMinutes(st, settings.defaultDuration));
          },
        })
      ),
      !(formData.all_day as boolean) &&
        React.createElement(
          'div',
          { style: FIELD_STYLE },
          React.createElement(UI.Label, null, 'Inicio'),
          React.createElement(TimePicker, {
            value: startTime,
            step: settings.slotDuration,
            minuteStep: settings.minuteStep,
            use24Hour: settings.use24Hour,
            onChange: (time: string) => {
              const st = localToUTC(startDate, time, tz);
              handleChange('start_at', st);
              handleChange('end_at', addMinutes(st, settings.defaultDuration));
            },
          })
        ),
      !(formData.all_day as boolean) &&
        React.createElement(
          'div',
          { style: FIELD_STYLE },
          React.createElement(UI.Label, null, 'Fin'),
          React.createElement(TimePicker, {
            value: endTime,
            step: settings.slotDuration,
            minuteStep: settings.minuteStep,
            use24Hour: settings.use24Hour,
            onChange: (time: string) => {
              handleChange('end_at', localToUTC(startDate, time, tz));
            },
          })
        )
    ),
    React.createElement(
      'div',
      {
        key: 'all-day',
        style: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
      },
      React.createElement(UI.Switch, {
        checked: (formData.all_day as boolean) ?? false,
        onCheckedChange: (checked: boolean) => handleChange('all_day', checked),
      }),
      React.createElement(UI.Label, null, 'Todo el día')
    ),
  ];

  const categorizacionContent = [
    React.createElement(
      'div',
      {
        key: 'cal-type-grid',
        style: {
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '0.75rem',
        },
      },
      React.createElement(
        'div',
        { style: FIELD_STYLE },
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
        { style: FIELD_STYLE },
        React.createElement(UI.Label, null, `Tipo${settings.requireType ? ' *' : ''}`),
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
    React.createElement(
      'div',
      { key: 'status', style: FIELD_STYLE },
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
  ];

  const adicionalContent = [
    !isFieldHidden('location', hiddenFields) &&
      React.createElement(
        'div',
        { key: 'location', style: FIELD_STYLE },
        React.createElement(UI.Label, null, 'Ubicación'),
        React.createElement(UI.Input, {
          value: (formData.location as string) ?? '',
          onChange: (e: { target: { value: string } }) => handleChange('location', e.target.value),
          placeholder: 'Ubicación',
        })
      ),
    !isFieldHidden('notes', hiddenFields) &&
      settings.showNotes &&
      React.createElement(
        'div',
        { key: 'notes', style: FIELD_STYLE },
        React.createElement(UI.Label, null, 'Notas'),
        React.createElement(UI.Textarea, {
          value: (formData.notes as string) ?? '',
          onChange: (e: { target: { value: string } }) => handleChange('notes', e.target.value),
          placeholder: 'Notas internas',
          rows: 2,
        })
      ),
    !isFieldHidden('color', hiddenFields) &&
      settings.showColorPicker &&
      React.createElement(
        'div',
        { key: 'color', style: FIELD_STYLE },
        React.createElement(UI.Label, null, 'Color'),
        React.createElement(ColorPicker, {
          value: (formData.color as string) ?? '',
          onChange: (color: string) => handleChange('color', color),
        })
      ),
  ].filter(Boolean);

  return React.createElement(
    'form',
    {
      ref: formRef,
      onSubmit: handleSubmit,
      className,
      style: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    },

    // Contribuciones before
    ...(beforeSections.length > 0
      ? beforeSections.map((s, i) =>
          React.createElement(React.Fragment, { key: `before-${String(i)}` }, s.render() as any)
        )
      : renderBeforeFields
        ? [renderBeforeFields()]
        : []),

    // Detalles
    React.createElement(
      UI.FormSection,
      { icon: 'FileText', title: 'Detalles' },
      ...detallesContent
    ),

    // Fecha y hora
    React.createElement(UI.FormSection, { icon: 'Clock', title: 'Fecha y hora' }, ...fechaContent),

    // Categorización
    React.createElement(
      UI.FormSection,
      { icon: 'Tag', title: 'Categorización' },
      ...categorizacionContent
    ),

    // Entity section (contribution slot)
    ...(entitySections.length > 0
      ? entitySections.map((s, i) =>
          React.createElement(React.Fragment, { key: `entity-${String(i)}` }, s.render() as any)
        )
      : renderEntitySection
        ? [renderEntitySection()]
        : []),

    // Información adicional (solo si hay al menos un campo visible)
    adicionalContent.length > 0 &&
      React.createElement(
        UI.FormSection,
        { icon: 'Settings', title: 'Información adicional' },
        ...adicionalContent
      ),

    // Contribuciones after
    ...(afterSections.length > 0
      ? afterSections.map((s, i) =>
          React.createElement(React.Fragment, { key: `after-${String(i)}` }, s.render() as any)
        )
      : renderAfterFields
        ? [renderAfterFields()]
        : []),

    // Botones (renderFooter override prioriza, sino default si !hideActions)
    renderFooter
      ? renderFooter()
      : !hideActions &&
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '0.75rem',
                paddingTop: '0.5rem',
              },
            },
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
            ...actionSections.map((s, i) =>
              React.createElement(React.Fragment, { key: `action-${String(i)}` }, s.render() as any)
            )
          )
  );
}
