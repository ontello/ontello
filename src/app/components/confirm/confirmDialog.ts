import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfirmDialog } from './ConfirmDialogComponent';

type ConfirmDialogOptions = {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
};

export function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);

  const { title, message, confirmLabel, cancelLabel } = options;

  return new Promise((resolve) => {
    const cleanup = (result: boolean) => {
      root.unmount();
      container.remove();
      resolve(result);
    };

    root.render(
      React.createElement(ConfirmDialog, {
        title,
        message,
        confirmLabel,
        cancelLabel,
        onConfirm: () => cleanup(true),
        onCancel: () => cleanup(false),
      })
    );
  });
}
