import {
  formatLocalTime,
  localToUTC,
  nowUTC,
  toDateKey,
  type UTCTimestamp,
} from '@coongro/datetime';
import { useViewContributions, useIsMobile } from '@coongro/plugin-sdk';
import {
  Button,
  FormSection,
  Input,
  Label,
  Select,
  SelectItem,
  Skeleton,
  Switch,
  Textarea,
} from '@coongro/ui-components';
import { Fragment, useCallback, useEffect, useState } from 'react';

import { useCalendars } from '../../hooks/useCalendars.js';
import { useCalendarSettings } from '../../hooks/useCalendarSettings.js';
import { useEvent } from '../../hooks/useEvent.js';
import { useEventMutations } from '../../hooks/useEventMutations.js';
import { useEventTypes } from '../../hooks/useEventTypes.js';
import { useTenantTimezone } from '../../hooks/useTenantTimezone.js';
import { TOKENS } from '../../styles/tokens.js';
import type { EventFormProps } from '../../types/components.js';
import type { EventCreateData } from '../../types/event.js';
import { addMinutes } from '../../utils/date.js';
import { STATUS_LABELS, toSelectOptions } from '../../utils/labels.js';
import { ColorPicker } from '../internal/ColorPicker.js';
import { DatePicker } from '../internal/DatePicker.js';
import { TimePicker } from '../internal/TimePicker.js';

function isFieldHidden(field: string, hiddenFields?: string[]): boolean {
  return hiddenFields?.includes(field) ?? false;
}

// Estilos reutilizables para campos de formulario
const FIELD_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem',
} as const;

// Estilo del mensaje de error inline bajo un campo requerido
const ERROR_TEXT_STYLE = {
  fontSize: '12px',
  color: TOKENS.red,
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
  const isMobile = useIsMobile('sm');
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

  // Errores de validacion por campo (key del campo → mensaje)
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    // Limpia el error del campo apenas el usuario lo edita
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: { preventDefault: () => void }) => {
      e.preventDefault();

      // Valida los campos marcados como obligatorios via settings.
      // Hasta ahora requireDescription/requireType solo pintaban el asterisco
      // en el label pero dejaban guardar igual; aca se bloquea el submit.
      const validationErrors: Record<string, string> = {};
      if (
        settings.requireDescription &&
        !isFieldHidden('description', hiddenFields) &&
        !(formData.description as string | undefined)?.trim()
      ) {
        validationErrors.description = 'La descripción es obligatoria';
      }
      if (settings.requireType && !(formData.event_type_id as string | undefined)?.trim()) {
        validationErrors.event_type_id = 'El tipo es obligatorio';
      }
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
      setErrors({});

      const data = formData as unknown as EventCreateData;
      const result = isEdit ? await update(eventId, data) : await create(data);
      if (result) onSuccess?.(result);
    },
    [
      formData,
      isEdit,
      eventId,
      create,
      update,
      onSuccess,
      settings.requireDescription,
      settings.requireType,
      hiddenFields,
    ]
  );

  if (isEdit && loadingEvent) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1rem',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  const startAt = formData.start_at as UTCTimestamp | undefined;
  const endAt = formData.end_at as UTCTimestamp | undefined;
  const startDate = startAt ? toDateKey(startAt, tz) : '';
  const startTime = startAt ? formatLocalTime(startAt, tz) : '';
  const endTime = endAt ? formatLocalTime(endAt, tz) : '';

  // ── Contenido de cada FormSection (campos originales, sin Card propio) ──

  const detallesContent = [
    <div key="title" style={FIELD_STYLE}>
      <Label>Título *</Label>
      <Input
        value={(formData.title as string) ?? ''}
        onChange={(e: { target: { value: string } }) => handleChange('title', e.target.value)}
        placeholder="Título del evento"
        required={true}
      />
    </div>,
    !isFieldHidden('description', hiddenFields) && (
      <div key="description" style={FIELD_STYLE}>
        <Label>{`Descripción${settings.requireDescription ? ' *' : ''}`}</Label>
        <Textarea
          value={(formData.description as string) ?? ''}
          onChange={(e: { target: { value: string } }) =>
            handleChange('description', e.target.value)
          }
          placeholder="Descripción del evento"
          rows={3}
        />
        {errors.description && <span style={ERROR_TEXT_STYLE}>{errors.description}</span>}
      </div>
    ),
  ].filter(Boolean);

  const fechaContent = [
    <div
      key="datetime-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '0.75rem',
      }}
    >
      <div style={FIELD_STYLE}>
        <Label>Fecha *</Label>
        <DatePicker
          value={startDate}
          onChange={(date: string) => {
            const st = localToUTC(date, startTime || '09:00', tz);
            handleChange('start_at', st);
            handleChange('end_at', addMinutes(st, settings.defaultDuration));
          }}
        />
      </div>
      {!(formData.all_day as boolean) && (
        <div style={FIELD_STYLE}>
          <Label>Inicio</Label>
          <TimePicker
            value={startTime}
            step={settings.slotDuration}
            minuteStep={settings.minuteStep}
            use24Hour={settings.use24Hour}
            onChange={(time: string) => {
              const st = localToUTC(startDate, time, tz);
              handleChange('start_at', st);
              handleChange('end_at', addMinutes(st, settings.defaultDuration));
            }}
          />
        </div>
      )}
      {!(formData.all_day as boolean) && (
        <div style={FIELD_STYLE}>
          <Label>Fin</Label>
          <TimePicker
            value={endTime}
            step={settings.slotDuration}
            minuteStep={settings.minuteStep}
            use24Hour={settings.use24Hour}
            onChange={(time: string) => {
              handleChange('end_at', localToUTC(startDate, time, tz));
            }}
          />
        </div>
      )}
    </div>,
    <div key="all-day" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Switch
        checked={(formData.all_day as boolean) ?? false}
        onCheckedChange={(checked: boolean) => handleChange('all_day', checked)}
      />
      <Label>Todo el día</Label>
    </div>,
  ];

  const categorizacionContent = [
    <div
      key="cal-type-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '0.75rem',
      }}
    >
      <div style={FIELD_STYLE}>
        <Label>Calendario</Label>
        <Select
          value={(formData.calendar_id as string) ?? ''}
          onValueChange={(v: string) => handleChange('calendar_id', v)}
          placeholder={calOpts.length === 0 ? 'Sin calendarios' : 'Seleccionar'}
        >
          {calOpts.map((cal) => (
            <SelectItem key={cal.id} value={cal.id}>
              {cal.name}
            </SelectItem>
          ))}
        </Select>
      </div>
      <div style={FIELD_STYLE}>
        <Label>{`Tipo${settings.requireType ? ' *' : ''}`}</Label>
        <Select
          value={(formData.event_type_id as string) ?? ''}
          onValueChange={(v: string) => handleChange('event_type_id', v)}
          placeholder={typeOpts.length === 0 ? 'Sin tipos' : 'Seleccionar'}
        >
          {typeOpts.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </Select>
        {errors.event_type_id && <span style={ERROR_TEXT_STYLE}>{errors.event_type_id}</span>}
      </div>
    </div>,
    <div key="status" style={FIELD_STYLE}>
      <Label>Estado</Label>
      <Select
        value={(formData.status as string) ?? 'scheduled'}
        onValueChange={(v: string) => handleChange('status', v)}
      >
        {toSelectOptions(STATUS_LABELS).map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </Select>
    </div>,
  ];

  const adicionalContent = [
    !isFieldHidden('location', hiddenFields) && (
      <div key="location" style={FIELD_STYLE}>
        <Label>Ubicación</Label>
        <Input
          value={(formData.location as string) ?? ''}
          onChange={(e: { target: { value: string } }) => handleChange('location', e.target.value)}
          placeholder="Ubicación"
        />
      </div>
    ),
    !isFieldHidden('notes', hiddenFields) && settings.showNotes && (
      <div key="notes" style={FIELD_STYLE}>
        <Label>Notas</Label>
        <Textarea
          value={(formData.notes as string) ?? ''}
          onChange={(e: { target: { value: string } }) => handleChange('notes', e.target.value)}
          placeholder="Notas internas"
          rows={2}
        />
      </div>
    ),
    !isFieldHidden('color', hiddenFields) && settings.showColorPicker && (
      <div key="color" style={FIELD_STYLE}>
        <Label>Color</Label>
        <ColorPicker
          value={(formData.color as string) ?? ''}
          onChange={(color: string) => handleChange('color', color)}
        />
      </div>
    ),
  ].filter(Boolean);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => void handleSubmit(e)}
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      {/* Contribuciones before */}
      {beforeSections.length > 0
        ? beforeSections.map((s, i) => (
            <Fragment key={`before-${String(i)}`}>{s.render()}</Fragment>
          ))
        : renderBeforeFields
          ? renderBeforeFields()
          : null}
      {/* Detalles */}
      <FormSection icon="FileText" title="Detalles">
        {detallesContent}
      </FormSection>
      {/* Fecha y hora */}
      <FormSection icon="Clock" title="Fecha y hora">
        {fechaContent}
      </FormSection>
      {/* Categorización */}
      <FormSection icon="Tag" title="Categorización">
        {categorizacionContent}
      </FormSection>
      {/* Entity section (contribution slot) */}
      {entitySections.length > 0
        ? entitySections.map((s, i) => (
            <Fragment key={`entity-${String(i)}`}>{s.render()}</Fragment>
          ))
        : renderEntitySection
          ? renderEntitySection()
          : null}
      {/* Información adicional (solo si hay al menos un campo visible) */}
      {adicionalContent.length > 0 && (
        <FormSection icon="Settings" title="Información adicional">
          {adicionalContent}
        </FormSection>
      )}
      {/* Contribuciones after */}
      {afterSections.length > 0
        ? afterSections.map((s, i) => <Fragment key={`after-${String(i)}`}>{s.render()}</Fragment>)
        : renderAfterFields
          ? renderAfterFields()
          : null}
      {/* Botones (renderFooter override prioriza, sino default si !hideActions) */}
      {renderFooter
        ? renderFooter()
        : !hideActions && (
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '0.75rem',
                paddingTop: '0.5rem',
              }}
            >
              <Button type="submit" disabled={isSaving} className="flex-1">
                {isSaving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear evento'}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              {actionSections.map((s, i) => (
                <Fragment key={`action-${String(i)}`}>{s.render()}</Fragment>
              ))}
            </div>
          )}
    </form>
  );
}
