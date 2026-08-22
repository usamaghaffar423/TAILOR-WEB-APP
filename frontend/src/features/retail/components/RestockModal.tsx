import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useRestock } from '../hooks/useRetailInventory';

interface RestockModalProps {
  variantId: number | null;
  label?: string;
  onClose: () => void;
}

export function RestockModal({ variantId, label, onClose }: RestockModalProps) {
  const [qty, setQty] = useState('1');
  const [note, setNote] = useState('');
  const restock = useRestock();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (variantId === null) return;
    const n = Number(qty);
    if (!n || n < 1) return;

    restock.mutate(
      { variantId, qty: n, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Stock restocked.');
          setQty('1');
          setNote('');
          onClose();
        },
        onError: () => toast.error('Failed to restock.'),
      }
    );
  }

  return (
    <Dialog
      open={variantId !== null}
      onClose={onClose}
      title={`Restock${label ? ` — ${label}` : ''}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
          <Button variant="outline" sm onClick={onClose}>Cancel</Button>
          <Button sm onClick={handleSubmit} disabled={restock.isPending}>
            {restock.isPending ? 'Saving…' : 'Add Stock'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="restockQty">Quantity to add</label>
          <input id="restockQty" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="restockNote">Note (optional)</label>
          <input id="restockNote" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. New stock from supplier" />
        </div>
      </form>
    </Dialog>
  );
}
