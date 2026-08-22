import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useAdjustStock } from '../hooks/useRetailInventory';

interface AdjustStockModalProps {
  variantId: number | null;
  currentQty?: number;
  label?: string;
  onClose: () => void;
}

export function AdjustStockModal({ variantId, currentQty, label, onClose }: AdjustStockModalProps) {
  const [newQty, setNewQty] = useState('0');
  const [note, setNote] = useState('');
  const adjust = useAdjustStock();

  useEffect(() => {
    if (variantId !== null) setNewQty(String(currentQty ?? 0));
  }, [variantId, currentQty]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (variantId === null) return;
    const n = Number(newQty);
    if (n < 0 || !note.trim()) return;

    adjust.mutate(
      { variantId, newQty: n, note: note.trim() },
      {
        onSuccess: () => {
          toast.success('Stock adjusted.');
          setNote('');
          onClose();
        },
        onError: () => toast.error('Failed to adjust stock.'),
      }
    );
  }

  return (
    <Dialog
      open={variantId !== null}
      onClose={onClose}
      title={`Adjust Stock${label ? ` — ${label}` : ''}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
          <Button variant="outline" sm onClick={onClose}>Cancel</Button>
          <Button sm onClick={handleSubmit} disabled={adjust.isPending || !note.trim()}>
            {adjust.isPending ? 'Saving…' : 'Save Adjustment'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="adjustQty">Actual counted quantity</label>
          <input id="adjustQty" type="number" min={0} value={newQty} onChange={(e) => setNewQty(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="adjustNote">Reason (required)</label>
          <input id="adjustNote" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Physical count reconciliation" />
        </div>
      </form>
    </Dialog>
  );
}
