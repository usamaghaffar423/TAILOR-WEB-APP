import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/api/orders';
import { karigarsApi } from '@/api/karigars';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrderRow } from '@/components/orders/OrderRow';
import { OrderCardModal } from '@/components/orders/OrderCardModal';
import { CustomerBillModal } from '@/components/orders/CustomerBillModal';
import { KarigarBillModal } from '@/components/orders/KarigarBillModal';
import { AddPaymentModal } from '@/components/payments/AddPaymentModal';
import type { OrderStatus } from '@/types';

export default function Orders() {
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [karigarId, setKarigarId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [cardOrderId, setCardOrderId] = useState<number | null>(null);
  const [payOrderId, setPayOrderId] = useState<number | null>(null);
  const [customerBillOrderId, setCustomerBillOrderId] = useState<number | null>(null);
  const [karigarBillOrderId, setKarigarBillOrderId] = useState<number | null>(null);

  const { data: karigarsRes } = useQuery({ queryKey: ['karigars'], queryFn: () => karigarsApi.index() });
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', { status, karigarId, q, from, to }],
    queryFn: () =>
      ordersApi.index({
        status: status || undefined,
        karigar_id: karigarId ? Number(karigarId) : undefined,
        q: q || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
  });

  const orders = data?.data || [];

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">ORDERS</div>
        </div>
      </div>
      <StitchDivider />

      <div className="filter-bar">
        <input type="text" placeholder="Search order # or customer..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | '')}>
          <option value="">All Statuses</option>
          <option value="progress">In Progress</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
        </select>
        <select value={karigarId} onChange={(e) => setKarigarId(e.target.value)}>
          <option value="">All Karigars</option>
          {karigarsRes?.data.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {isLoading && <p style={{ color: 'var(--text-faint)' }}>Loading orders…</p>}
      {error && <p style={{ color: 'var(--red-bright)' }}>Failed to load orders.</p>}

      {data && (
        orders.length === 0 ? (
          <EmptyState title="No orders found" subtitle="Try adjusting your search or filters." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Karigar</th>
                  <th>Assigned</th>
                  <th>Deadline</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <OrderRow
                    key={o.id}
                    order={o}
                    onViewCard={setCardOrderId}
                    onAddPayment={setPayOrderId}
                    onCustomerBill={setCustomerBillOrderId}
                    onKarigarBill={setKarigarBillOrderId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <OrderCardModal orderId={cardOrderId} onClose={() => setCardOrderId(null)} />
      <CustomerBillModal orderId={customerBillOrderId} onClose={() => setCustomerBillOrderId(null)} />
      <KarigarBillModal orderId={karigarBillOrderId} onClose={() => setKarigarBillOrderId(null)} />
      {payOrderId !== null && (
        <AddPaymentModal
          orderId={payOrderId}
          open={payOrderId !== null}
          onClose={() => setPayOrderId(null)}
          onSaved={() => {
            setPayOrderId(null);
            refetch();
          }}
        />
      )}
    </>
  );
}
