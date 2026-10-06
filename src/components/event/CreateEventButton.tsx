import { Button, FormDialogSubmit } from '@coongro/ui-components';
import { useState } from 'react';
import type { RefObject } from 'react';

import type { CreateEventButtonProps } from '../../types/components.js';

import { EventForm } from './EventForm.js';

export function CreateEventButton({
  defaults,
  label = 'Nuevo evento',
  onSuccess,
  className = '',
}: CreateEventButtonProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className={className}>
        {label}
      </Button>
      <FormDialogSubmit
        open={open}
        onOpenChange={setOpen}
        title="Crear evento"
        submitLabel="Crear evento"
        onCancel={() => setOpen(false)}
        disabled={saving}
        children={({ formRef }: { formRef: RefObject<HTMLFormElement> }) => (
          <EventForm
            defaults={defaults}
            formRef={formRef}
            hideActions={true}
            onSavingChange={setSaving}
            onSuccess={(event) => {
              setOpen(false);
              onSuccess?.(event);
            }}
          />
        )}
      />
    </>
  );
}
