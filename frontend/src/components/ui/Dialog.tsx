import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  footer?: ReactNode;
  children: ReactNode;
  bodyId?: string;
}

export function Dialog({ open, onClose, title, wide, footer, children, bodyId }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal-box${wide ? ' wide' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-head no-print">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="modal-body print-area" id={bodyId}>
          {children}
        </div>
        {footer ? <div className="modal-foot no-print">{footer}</div> : null}
      </div>
    </div>
  );
}
