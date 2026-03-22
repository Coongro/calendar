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

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      UI.Button,
      { onClick: () => setOpen(true), className },
      label
    ),
    React.createElement(
      UI.FormDialog,
      {
        open,
        onOpenChange: setOpen,
        title: 'Crear evento',
      },
      React.createElement(EventForm, {
        defaults,
        onSuccess: (event) => {
          setOpen(false);
          onSuccess?.(event);
        },
        onCancel: () => setOpen(false),
      })
    )
  );
}
