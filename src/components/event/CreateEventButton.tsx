import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import type { CreateEventButtonProps } from '../../types/components.js';

import { EventForm } from './EventForm.js';

const React = getHostReact();
const UI = getHostUI();
const { useState } = React;

export function CreateEventButton({
  defaults,
  label = 'Nuevo evento',
  onSuccess,
  className = '',
}: CreateEventButtonProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(UI.Button, { onClick: () => setOpen(true), className }, label),
    React.createElement(UI.FormDialogSubmit, {
      open,
      onOpenChange: setOpen,
      title: 'Crear evento',
      submitLabel: 'Crear evento',
      onCancel: () => setOpen(false),
      disabled: saving,
      children: ({ formRef }: { formRef: React.RefObject<HTMLFormElement> }) =>
        React.createElement(EventForm, {
          defaults,
          formRef,
          hideActions: true,
          onSavingChange: setSaving,
          onSuccess: (event) => {
            setOpen(false);
            onSuccess?.(event);
          },
        }),
    })
  );
}
