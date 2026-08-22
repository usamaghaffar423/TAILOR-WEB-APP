import { Toaster } from 'sonner';

export function Toast() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--surface)',
          color: 'var(--text)',
          border: '1px solid var(--border-strong)',
          borderLeft: '3px solid var(--red)',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 600,
        },
      }}
    />
  );
}
