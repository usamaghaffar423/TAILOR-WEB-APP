import { Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
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

function displayValue(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val.length > 0 ? val.join(' / ') : '—';
  return val || '—';
}

const sectionHead: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 16,
  background: '#f2f2f2',
  padding: '8px 14px',
  marginBottom: 12,
  borderLeft: '4px solid #111',
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

  const groups = template ? [...new Set(template.fields.map((f) => f.group || 'Measurements'))] : [];
  const showGroups = groups.length > 1;
  let lastGroup: string | null = null;

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
        <div className="customer-bill-print-area" style={{ background: '#fff', color: '#111', padding: '36px 40px', fontSize: 15, lineHeight: 1.65 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, borderBottom: '3px solid #111', paddingBottom: 18 }}>
            {logoUrl && <img src={logoUrl} alt="Shop logo" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />}
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{shop?.name || 'Top Man Tailor'}</div>
              {shop?.address && <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{shop.address}</div>}
              {shop?.phone && <div style={{ fontSize: 13, color: '#555' }}>{shop.phone}</div>}
            </div>
          </div>

          <table style={{ width: '100%', marginBottom: 26, borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', verticalAlign: 'top', paddingRight: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, borderBottom: '1px solid #ccc', paddingBottom: 6 }}>Order Details</div>
                  <div style={{ marginBottom: 7 }}>Order #: <b>{order.order_no}</b></div>
                  <div style={{ marginBottom: 7 }}>Order Date: {formatDate(order.created_at)}</div>
                  <div style={{ marginBottom: 7 }}>Deadline: <b style={{ fontSize: 17 }}>{formatDate(order.deadline)}</b></div>
                  <div>Garment: <b>{template?.label || order.measurement_snapshot.template_label || '—'}</b></div>
                </td>
                <td style={{ width: '50%', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, borderBottom: '1px solid #ccc', paddingBottom: 6 }}>Customer Details</div>
                  <div style={{ marginBottom: 7 }}>Name: <b>{order.customer?.name || '—'}</b></div>
                  <div style={{ marginBottom: 7 }}>Phone: {order.customer?.phone || '—'}</div>
                  <div>Customer ID: {order.customer?.customer_id || '—'}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {styleRows.length > 0 && (
            <div style={{ marginBottom: 26 }}>
              <div style={sectionHead}>Style Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {styleRows.map((r) => (
                  <div key={r.label} style={{ border: '1px solid #ddd', borderRadius: 6, padding: '9px 12px' }}>
                    <div style={{ fontSize: 11.5, color: '#777' }}>{r.label}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>{r.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {template && (
            <div style={{ marginBottom: 26 }}>
              <div style={sectionHead}>Measurements</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
                <tbody>
                  {template.fields.map((f) => {
                    const g = f.group || 'Measurements';
                    const heading = showGroups && g !== lastGroup;
                    if (heading) lastGroup = g;
                    return (
                      <Fragment key={f.key}>
                        {heading && (
                          <tr>
                            <td colSpan={2} style={{ fontWeight: 700, fontSize: 14, color: '#555', paddingTop: lastGroup !== groups[0] ? 14 : 0, paddingBottom: 4 }}>
                              {g}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td style={{ padding: '7px 10px', borderBottom: '1px solid #eee', width: '55%' }}>{f.label}</td>
                          <td style={{ padding: '7px 10px', borderBottom: '1px solid #eee', fontWeight: 700 }}>{displayValue(order.measurement_snapshot.fields?.[f.key])}</td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
              {order.measurement_snapshot.notes && (
                <div style={{ marginTop: 10, fontSize: 13.5, background: '#f7f7f7', padding: '8px 12px', borderRadius: 4 }}>Notes: {order.measurement_snapshot.notes}</div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 10 }}>
            <div style={sectionHead}>Payment</div>
            <table style={{ width: '100%', marginBottom: 14, fontSize: 15 }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0' }}>Total</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(total)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0' }}>Paid</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(paid)}</td>
                </tr>
                <tr style={{ borderTop: '2px solid #111' }}>
                  <td style={{ padding: '8px 0 0', fontWeight: 700 }}>Balance</td>
                  <td style={{ padding: '8px 0 0', textAlign: 'right', fontWeight: 700, fontSize: 17 }}>{pending > 0 ? formatCurrency(pending) : 'Paid in full'}</td>
                </tr>
              </tbody>
            </table>
            {payments.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #999', padding: '6px 8px' }}>Date</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #999', padding: '6px 8px' }}>Method</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #999', padding: '6px 8px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{formatDate(p.date)}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{METHOD_LABEL[p.method]}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ textAlign: 'center', fontSize: 13.5, color: '#555', borderTop: '1px solid #ccc', marginTop: 26, paddingTop: 16 }}>
            Thank you for your order.
          </div>
        </div>
      )}
    </Dialog>
  );
}
