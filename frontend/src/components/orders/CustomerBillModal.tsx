import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { MeasurementBlock } from '@/components/measurements/MeasurementBlock';
import { ordersApi } from '@/api/orders';
import { settingsApi } from '@/api/settings';
import { formatDate, formatCurrency } from '@/lib/format';
import { getStyleSummaryRows } from '@/lib/orderCard';
import { useAuthedImage } from '@/lib/useAuthedImage';
import type { PaymentMethod } from '@/types';

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash',
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
  bank: 'Bank',
};

interface CustomerBillModalProps {
  orderId: number | null;
  onClose: () => void;
}

export function CustomerBillModal({ orderId, onClose }: CustomerBillModalProps) {
  const { data: orderRes, isLoading, error } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => ordersApi.show(orderId as number),
    enabled: orderId !== null,
  });
  const { data: templatesRes } = useQuery({
    queryKey: ['templates'],
    queryFn: () => settingsApi.getTemplates(),
    staleTime: 5 * 60_000,
  });
  const { data: shopRes } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.show(),
    staleTime: 5 * 60_000,
  });
  const shop = shopRes?.data;
  const logoUrl = useAuthedImage(shop?.logo_path);

  if (orderId === null) return null;
  const order = orderRes?.data;
  const template = templatesRes?.data.find((t) => t.template_key === order?.measurement_snapshot.template_key) || null;

  const payments = order?.payments || [];
  const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const total = order ? Number(order.total_amount) : 0;
  const pending = Math.max(0, total - paid);
  const styleRows = order ? getStyleSummaryRows(order) : [];

  return (
    <Dialog
      open={orderId !== null}
      onClose={onClose}
      title="Customer Bill"
      wide
      bodyId="customerBillBody"
      footer={
        !isLoading && order ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <Button variant="outline" sm onClick={() => window.print()}>Print</Button>
            <Button sm onClick={onClose}>Close</Button>
          </div>
        ) : null
      }
    >
      {isLoading && <p style={{ color: 'var(--text-faint)' }}>Loading bill…</p>}
      {error && <p style={{ color: 'var(--red-bright)' }}>Failed to load order.</p>}
      {order && (
        <div className="customer-bill-print-area" style={{ background: '#fff', color: '#111', padding: 20, borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, borderBottom: '1px solid #ddd', paddingBottom: 14 }}>
            {logoUrl && <img src={logoUrl} alt="Shop logo" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />}
            <div>
              <div style={{ fontSize: 19, fontWeight: 700 }}>{shop?.name || 'Top Man Tailor'}</div>
              {shop?.address && <div style={{ fontSize: 12, color: '#555' }}>{shop.address}</div>}
              {shop?.phone && <div style={{ fontSize: 12, color: '#555' }}>{shop.phone}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16, fontSize: 13 }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Order Details</div>
              <div>Order #: {order.order_no}</div>
              <div>Order Date: {formatDate(order.created_at)}</div>
              <div>Deadline: {formatDate(order.deadline)}</div>
              <div>Garment: {template?.label || order.measurement_snapshot.template_label}</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Customer Details</div>
              <div>Name: {order.customer?.name || '—'}</div>
              <div>Phone: {order.customer?.phone || '—'}</div>
              <div>Customer ID: {order.customer?.customer_id || '—'}</div>
            </div>
          </div>

          {styleRows.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>Style Summary</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.7 }}>
                {styleRows.map((r) => (
                  <span key={r.label} style={{ marginRight: 16 }}>
                    <b>{r.label}:</b> {r.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {template && (
            <div style={{ marginBottom: 16, fontSize: 12.5 }}>
              <MeasurementBlock template={template} fields={order.measurement_snapshot.fields} notes={order.measurement_snapshot.notes} />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>Payment</div>
            <div style={{ display: 'flex', gap: 24, fontSize: 13, marginBottom: 8 }}>
              <div>Total: <b>{formatCurrency(total)}</b></div>
              <div>Paid: <b>{formatCurrency(paid)}</b></div>
              <div>Balance: <b>{pending > 0 ? formatCurrency(pending) : 'Paid in full'}</b></div>
            </div>
            {payments.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '4px 8px' }}>Date</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '4px 8px' }}>Method</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '4px 8px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>{formatDate(p.date)}</td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>{METHOD_LABEL[p.method]}</td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ textAlign: 'center', fontSize: 12.5, color: '#555', borderTop: '1px solid #ddd', paddingTop: 12 }}>
            Thank you for your order.
          </div>
        </div>
      )}
    </Dialog>
  );
}
