import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ordersApi } from '@/api/orders';
import { paymentsApi } from '@/api/payments';
import { formatCurrency } from '@/lib/format';
import type { PaymentMethod } from '@/types';

interface AddPaymentModalProps {
  /** Pre-set order (from an order row / order card). Omit to show an order search picker instead. */
  orderId?: number;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddPaymentModal({ orderId: presetOrderId, open, onClose, onSaved }: AddPaymentModalProps) {
  const [pickedOrderId, setPickedOrderId] = useState<number | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');

  const orderId = presetOrderId ?? pickedOrderId;

  const { data: orderRes } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => ordersApi.show(orderId as number),
    enabled: open && orderId !== null,
  });
  const { data: searchRes } = useQuery({
    queryKey: ['orders', { q: orderSearch }],
    queryFn: () => ordersApi.index({ q: orderSearch }),
    enabled: open && presetOrderId === undefined && orderSearch.trim().length > 0,
  });

  const order = orderRes?.data;
  const paid = order?.payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? Number(order?.paid_amount ?? 0);
  const pending = order ? Math.max(0, Number(order.total_amount) - paid) : 0;

  const mutation = useMutation({
    mutationFn: (amountNum: number) =>
      paymentsApi.store({
        order_id: orderId as number,
        amount: amountNum,
        method,
        date: new Date().toISOString().slice(0, 10),
        note: note.trim() || (amountNum >= pending ? 'Final Payment' : 'Partial Payment'),
      }),
    onSuccess: () => {
      toast.success('Payment recorded');
      setAmount('');
      setNote('');
      setPickedOrderId(null);
      setOrderSearch('');
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSave() {
    if (orderId === null) {
      toast.error('Please select an order');
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    mutation.mutate(amountNum);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add Payment"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>Save Payment</Button>
        </>
      }
    >
      {presetOrderId === undefined && (
        <div className="field" style={{ position: 'relative' }}>
          <label>Order</label>
          <input
            type="text"
            placeholder="Search order # or customer..."
            value={orderSearch}
            onChange={(e) => {
              setOrderSearch(e.target.value);
              setPickedOrderId(null);
            }}
          />
          {orderSearch.trim() && pickedOrderId === null && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, marginTop: 4, zIndex: 5, maxHeight: 220, overflowY: 'auto' }}>
              {(searchRes?.data.length ?? 0) === 0 ? (
                <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-faint)' }}>No orders found</div>
              ) : (
                searchRes!.data.map((o) => (
                  <div
                    key={o.id}
                    style={{ padding: '10px 12px', fontSize: 12.5, cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    onClick={() => {
                      setPickedOrderId(o.id);
                      setOrderSearch(`${o.order_no} — ${o.customer_name}`);
                    }}
                  >
                    <b>{o.order_no}</b> — {o.customer_name}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {order && (
        <div className="oc-block">
          <div className="oc-kv"><span>Order</span><b className="mono">{order.order_no}</b></div>
          <div className="oc-kv"><span>Customer</span><b>{order.customer?.name || '—'}</b></div>
          <div className="oc-kv"><span>Total</span><b className="mono">{formatCurrency(order.total_amount)}</b></div>
          <div className="oc-kv"><span>Already Paid</span><b className="mono">{formatCurrency(paid)}</b></div>
          <div className="oc-kv"><span>Balance Due</span><b className={`mono ${pending > 0 ? 'balance-pending' : 'balance-paid'}`}>{pending > 0 ? formatCurrency(pending) : 'Paid'}</b></div>
        </div>
      )}
      <div className="field">
        <label>Amount (Rs)</label>
        <input type="number" min={0} placeholder={pending ? String(pending) : ''} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="field">
        <label>Method</label>
        <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
          <option value="cash">Cash</option>
          <option value="easypaisa">Easypaisa</option>
          <option value="jazzcash">JazzCash</option>
          <option value="bank">Bank</option>
        </select>
      </div>
      <div className="field">
        <label>Note (optional)</label>
        <input type="text" placeholder="e.g. Remaining balance on delivery" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Dialog>
  );
}
