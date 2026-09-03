import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ordersApi } from '@/api/orders';
import { settingsApi } from '@/api/settings';
import { formatDate, formatCurrency } from '@/lib/format';
import { useAuthedImage } from '@/lib/useAuthedImage';
import type { PaymentMethod } from '@/types';
import '@/billPrint.css';

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash',
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
  bank: 'Bank',
  card: 'Card',
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
        <div className="bill-print">
          {/* Header — logo front and center */}
          <div className="bill-head">
            {logoUrl ? (
              <img src={logoUrl} alt="Shop logo" className="bill-logo" />
            ) : (
              <div className="bill-logo-fallback">
                {(shop?.name || 'TM').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
            )}
            <div className="bill-shop">{shop?.name || 'Top Man Tailor'}</div>
            {shop?.address && <div className="bill-shop-meta">{shop.address}</div>}
            {shop?.phone && <div className="bill-shop-meta">{shop.phone}</div>}
          </div>

          <hr className="bill-divider" />

          {/* Order reference */}
          <div className="bill-row"><span>Order #</span><b>{order.order_no}</b></div>
          <div className="bill-row"><span>Order Date</span><span>{formatDate(order.created_at)}</span></div>
          <div className="bill-row"><span>Deadline</span><span>{formatDate(order.deadline)}</span></div>
          <div className="bill-row"><span>Garment</span><span>{template?.label || order.measurement_snapshot.template_label || '—'}</span></div>

          <hr className="bill-divider" />

          {/* Customer details */}
          <div className="bill-section">Customer Details</div>
          <div className="bill-row"><span>Name</span><b>{order.customer?.name || '—'}</b></div>
          <div className="bill-row"><span>Phone</span><span>{order.customer?.phone || '—'}</span></div>
          <div className="bill-row"><span>Customer ID</span><span>{order.customer?.customer_id || '—'}</span></div>
          {order.customer?.address && <div className="bill-row"><span>Address</span><span>{order.customer.address}</span></div>}

          <hr className="bill-divider" />

          {/* Items / Payment */}
          <div className="bill-section">{items.length > 0 ? 'Items' : 'Payment'}</div>
          {items.length > 0 && items.map((it, idx) => (
            <div key={idx} className="bill-row"><span>{it.label}</span><span>{formatCurrency(it.amount)}</span></div>
          ))}
          {items.length > 0 && <hr className="bill-divider" />}
          <div className="bill-row"><span>Total</span><span>{formatCurrency(total)}</span></div>
          <div className="bill-row"><span>Paid</span><span>{formatCurrency(paid)}</span></div>
          <hr className="bill-divider bill-divider--strong" />
          <div className="bill-row bill-total">
            <span>Balance</span>
            <span>{pending > 0 ? formatCurrency(pending) : 'Paid in full'}</span>
          </div>

          {payments.length > 0 && (
            <>
              <hr className="bill-divider" />
              <div className="bill-section">Payment History</div>
              {payments.map((p) => (
                <div key={p.id} className="bill-row">
                  <span>{formatDate(p.date)} · {METHOD_LABEL[p.method]}</span>
                  <span>{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </>
          )}

          {order.measurement_snapshot.notes && (
            <>
              <hr className="bill-divider" />
              <div className="bill-section">Notes</div>
              <div className="bill-text">{order.measurement_snapshot.notes}</div>
            </>
          )}

          <hr className="bill-divider" />

          <div className="bill-footer">Thank you for your order.</div>
        </div>
      )}
    </Dialog>
  );
}
