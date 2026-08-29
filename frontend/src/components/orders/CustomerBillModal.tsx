import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ordersApi } from '@/api/orders';
import { settingsApi } from '@/api/settings';
import { formatDate, formatCurrency } from '@/lib/format';
import { useAuthedImage } from '@/lib/useAuthedImage';
import type { PaymentMethod } from '@/types';

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash',
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
  bank: 'Bank',
};

const divider: React.CSSProperties = {
  border: 'none',
  borderTop: '1px dashed #999',
  margin: '14px 0',
};

const row: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  fontSize: 13,
  padding: '3px 0',
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
    staleTime: 30 * 60_000,
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
  const items = order?.items || [];

  return (
    <Dialog
      open={orderId !== null}
      onClose={onClose}
      title="Customer Bill"
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
        <div
          className="customer-bill-print-area"
          style={{
            background: '#fff',
            color: '#111',
            width: 380,
            maxWidth: '100%',
            margin: '0 auto',
            padding: '24px 22px',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {/* Header — logo front and center */}
          <div style={{ textAlign: 'center' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Shop logo" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, margin: '0 auto 10px' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 8, background: '#eee', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, color: '#888' }}>
                {(shop?.name || 'TM').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
            )}
            <div style={{ fontSize: 19, fontWeight: 700 }}>{shop?.name || 'Top Man Tailor'}</div>
            {shop?.address && <div style={{ fontSize: 11.5, color: '#555', marginTop: 3 }}>{shop.address}</div>}
            {shop?.phone && <div style={{ fontSize: 11.5, color: '#555' }}>{shop.phone}</div>}
          </div>

          <hr style={divider} />

          {/* Order reference */}
          <div style={row}><span>Order #</span><b>{order.order_no}</b></div>
          <div style={row}><span>Order Date</span><span>{formatDate(order.created_at)}</span></div>
          <div style={row}><span>Deadline</span><span>{formatDate(order.deadline)}</span></div>
          <div style={row}><span>Garment</span><span>{template?.label || order.measurement_snapshot.template_label || '—'}</span></div>

          <hr style={divider} />

          {/* Customer details */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#777', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Customer Details</div>
          <div style={row}><span>Name</span><b>{order.customer?.name || '—'}</b></div>
          <div style={row}><span>Phone</span><span>{order.customer?.phone || '—'}</span></div>
          <div style={row}><span>Customer ID</span><span>{order.customer?.customer_id || '—'}</span></div>
          {order.customer?.address && <div style={row}><span>Address</span><span style={{ textAlign: 'right' }}>{order.customer.address}</span></div>}

          <hr style={divider} />

          {/* Payment */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#777', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            {items.length > 0 ? 'Items' : 'Payment'}
          </div>
          {items.length > 0 && items.map((it, idx) => (
            <div key={idx} style={row}><span>{it.label}</span><span>{formatCurrency(it.amount)}</span></div>
          ))}
          {items.length > 0 && <hr style={divider} />}
          <div style={row}><span>Total</span><span>{formatCurrency(total)}</span></div>
          <div style={row}><span>Paid</span><span>{formatCurrency(paid)}</span></div>
          <hr style={{ ...divider, borderTop: '1px solid #111', margin: '8px 0' }} />
          <div style={{ ...row, fontSize: 15, fontWeight: 700 }}>
            <span>Balance</span>
            <span>{pending > 0 ? formatCurrency(pending) : 'Paid in full'}</span>
          </div>

          {payments.length > 0 && (
            <>
              <hr style={divider} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#777', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Payment History</div>
              {payments.map((p) => (
                <div key={p.id} style={row}>
                  <span>{formatDate(p.date)} · {METHOD_LABEL[p.method]}</span>
                  <span>{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </>
          )}

          {order.measurement_snapshot.notes && (
            <>
              <hr style={divider} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#777', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 12.5, whiteSpace: 'pre-wrap' }}>{order.measurement_snapshot.notes}</div>
            </>
          )}

          <hr style={divider} />

          <div style={{ textAlign: 'center', fontSize: 12, color: '#555' }}>
            Thank you for your order.
          </div>
        </div>
      )}
    </Dialog>
  );
}
