import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ordersApi } from '@/api/orders';
import { karigarsApi } from '@/api/karigars';
import { toDateInputValue } from '@/lib/format';
import type { Order, OrderStatus } from '@/types';

interface EditOrderModalProps {
  order: Order;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditOrderModal({ order, open, onClose, onSaved }: EditOrderModalProps) {
  const [karigarId, setKarigarId] = useState(order.karigar_id);
  const [deadline, setDeadline] = useState(toDateInputValue(order.deadline));
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [total, setTotal] = useState(String(order.total_amount));

  const { data: karigarsRes } = useQuery({ queryKey: ['karigars'], queryFn: () => karigarsApi.index() });

  const mutation = useMutation({
    mutationFn: async () => {
      await ordersApi.update(order.id, {
        karigar_id: karigarId,
        deadline,
        total_amount: parseFloat(total),
      });
      if (status !== order.status) {
        await ordersApi.updateStatus(order.id, status);
      }
    },
    onSuccess: () => {
      toast.success('Order updated');
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSave() {
    const totalNum = parseFloat(total);
    if (!totalNum || totalNum <= 0) {
      toast.error('Enter a valid total order amount');
      return;
    }
    if (!deadline) {
      toast.error('Please choose a deadline');
      return;
    }
    mutation.mutate();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Edit ${order.order_no}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>Save Changes</Button>
        </>
      }
    >
      <div className="field">
        <label>Karigar</label>
        <select value={karigarId} onChange={(e) => setKarigarId(Number(e.target.value))}>
          {karigarsRes?.data.map((k) => (
            <option key={k.id} value={k.id}>{k.name} — {k.speciality || ''}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Deadline</label>
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>
      <div className="field">
        <label>Order Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
          <option value="progress">In Progress</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>
      <div className="field">
        <label>Total Order Amount (Rs)</label>
        <input type="number" min={0} value={total} onChange={(e) => setTotal(e.target.value)} />
      </div>
      <div className="hint">Measurements, style and photos stay locked to what the karigar was given — start a new order if the design itself needs to change.</div>
    </Dialog>
  );
}
