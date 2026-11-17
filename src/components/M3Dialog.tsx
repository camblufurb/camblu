import React, { useEffect, useId, useRef } from 'react';
import { Icon } from './Icon';

interface M3DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}

export function M3Dialog({ open, onClose, title, wide = false, children }: M3DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={`m3-dialog ${wide ? 'm3-dialog--wide' : ''}`}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className="m3-dialog-inner">
        <header className="m3-dialog-header">
          <h2 id={titleId}>
            {title}
          </h2>
          <button
            type="button"
            className="m3-icon-btn"
            aria-label="Fechar janela"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="m3-dialog-body">{children}</div>
      </div>
    </dialog>
  );
}
