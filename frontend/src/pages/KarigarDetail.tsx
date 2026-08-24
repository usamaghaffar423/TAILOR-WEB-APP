import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { karigarsApi } from '@/api/karigars';
import { ordersApi } from '@/api/orders';
import { settingsApi } from '@/api/settings';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrderCardModal } from '@/components/orders/OrderCardModal';
import { CustomerBillModal } from '@/components/orders/CustomerBillModal';
import { KarigarBillModal } from '@/components/orders/KarigarBillModal';
import { AddPaymentModal } from '@/components/payments/AddPaymentModal';
import { EditKarigarModal } from '@/components/karigars/EditKarigarModal';
import { Dropdown } from '@/components/ui/Dropdown';
import { ORDER_STATUS_OPTIONS } from '@/lib/orderOptions';
import { WHATSAPP_ICON, PAYMENT_ICON, CUSTOMER_BILL_ICON, KARIGAR_BILL_ICON } from '@/lib/garmentIcons';
import { formatDateShort } from '@/lib/format';
import { sendOrderWhatsApp } from '@/lib/orderCard';
import type { OrderStatus } from '@/types';

export default function KarigarDetail() {
  const { id } = useParams();
  const karigarId = Number(id);
  const queryClient = useQueryClient();

  const [month, setMonth] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [editOpen, setEditOpen] = useState(false);
  const [cardOrderId, setCardOrderId] = useState<number | null>(null);
  const [payOrderId, setPayOrderId] = useState<number | null>(null);
  const [customerBillOrderId, setCustomerBillOrderId] = useState<number | null>(null);
  const [karigarBillOrderId, setKarigarBillOrderId] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['karigars', karigarId, month],
    queryFn: () => karigarsApi.show(karigarId, month || undefined),
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['karigars', karigarId] });
  }

  if (isLoading) return <p style={{ color: 'var(--text-faint)' }}>Loading karigar…</p>;
  if (error || !data) return <EmptyState title="Karigar not found" subtitle="It may have been removed." />;

  const { karigar, orders: allOrders } = data.data;
  const orders = allOrders.filter((o) => !status || o.status === status);
  const active = allOrders.filter((o) => o.status !== 'delivered').length;
  const delivered = allOrders.filter((o) => o.status === 'delivered').length;

  const months = [...new Set(allOrders.map((o) => {
    const d = new Date(o.assigned_date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }))].sort().reverse();

  async function handleWhatsApp(orderId: number) {
    try {
      const [orderRes, templatesRes] = await Promise.all([ordersApi.show(orderId), settingsApi.getTemplates()]);
      const order = orderRes.data;
      const template = templatesRes.data.find((t) => t.template_key === order.measurement_snapshot.template_key) || null;
      const paid = order.payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? Number(order.paid_amount ?? 0);
      const result = sendOrderWhatsApp(order, order.customer, order.karigar, template, paid, 'karigar');
      if (!result.ok) toast.error(result.message);
    } catch {
      toast.error('Failed to load order details');
    }
  }

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">{karigar.name.toUpperCase()}</div>
          <div className="hero-date">{karigar.speciality || '—'} · {karigar.phone || '—'}</div>
        </div>
        <div className="hero-actions">
          <Button variant="outline" onClick={() => setEditOpen(true)}>Edit Karigar</Button>
        </div>
      </div>
      <StitchDivider />

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Active Orders</div>
          <div className="kpi-num display">{active}</div>
          <div className="kpi-sub">of {karigar.max_capacity || '—'} capacity</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Orders</div>
          <div className="kpi-num display">{allOrders.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Delivered</div>
          <div className="kpi-num display">{delivered}</div>
        </div>
      </div>

      <div className="filter-bar">
        <Dropdown
          className="dropdown-filter"
          value={month}
          onChange={setMonth}
          options={[
            { value: '', label: 'All Months' },
            ...months.map((m) => {
              const [y, mo] = m.split('-');
              const label = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
              return { value: m, label };
            }),
          ]}
        />
        <Dropdown
          className="dropdown-filter"
          value={status}
          onChange={(v) => setStatus(v as OrderStatus | '')}
          options={[{ value: '', label: 'All Statuses' }, ...ORDER_STATUS_OPTIONS]}
        />
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders found" subtitle="Try a different filter." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Order #</th><th>Customer</th><th>Assigned</th><th>Deadline</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="clickable" onClick={() => setCardOrderId(o.id)}>
                  <td className="cell-mono">{o.order_no}</td>
                  <td>{o.customer_name}</td>
                  <td className="cell-mono cell-muted">{formatDateShort(o.assigned_date)}</td>
                  <td className="cell-mono">{formatDateShort(o.deadline)}</td>
                  <td><Badge status={o.status} /></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="row-actions">
                      <button className="row-icon-btn" title="View order card" onClick={() => setCardOrderId(o.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx={12} cy={12} r={3} />
                        </svg>
                      </button>
                      <button className="row-icon-btn" title="Send order to karigar on WhatsApp" onClick={() => handleWhatsApp(o.id)}>{WHATSAPP_ICON}</button>
                      <button className="row-icon-btn" title="Add payment" onClick={() => setPayOrderId(o.id)}>{PAYMENT_ICON}</button>
                      <button className="row-icon-btn" title="Customer Bill" onClick={() => setCustomerBillOrderId(o.id)}>{CUSTOMER_BILL_ICON}</button>
                      <button className="row-icon-btn" title="Karigar Bill" onClick={() => setKarigarBillOrderId(o.id)}>{KARIGAR_BILL_ICON}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EditKarigarModal
        karigar={karigar}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          refresh();
        }}
      />
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
            refresh();
          }}
        />
      )}
    </>
  );
}
