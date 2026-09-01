import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { settingsApi } from '@/api/settings';
import { formatDate, formatCurrency } from '@/lib/format';
import { useAuthedImage } from '@/lib/useAuthedImage';
import type { PaymentMethod } from '@/types';
import type { Sale } from '../types';

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash',
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
  bank: 'Bank',
  card: 'Card',
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

interface SaleReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

// Merges the old CustomerBillModal (tailoring) and retail's ReceiptModal
// (POS) into one bill shape — reuses the exact same print CSS classes
// (.customer-bill-print-area) both already hook into, so print/screen
// layout stays identical to what both bills already looked like.
export function SaleReceiptModal({ sale, onClose }: SaleReceiptModalProps) {
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

  if (!sale) return null;

  const payments = sale.payments || [];
  const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const total = Number(sale.total);
  const pending = Math.max(0, total - paid);
  const displayNo = sale.sale_no || (sale.legacy_retail_sale_id ? `#${sale.legacy_retail_sale_id}` : `#${sale.id}`);

  return (
    <Dialog
      open={sale !== null}
      onClose={onClose}
      title="Sale Receipt"
      bodyId="saleReceiptBody"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
          <Button variant="outline" sm onClick={() => window.print()}>Print</Button>
          <Button sm onClick={onClose}>Done</Button>
        </div>
      }
    >
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

        <div style={row}><span>Sale #</span><b>{displayNo}</b></div>
        <div style={row}><span>Date</span><span>{formatDate(sale.created_at)}</span></div>
        {sale.customer && <div style={row}><span>Customer</span><b>{sale.customer.name}</b></div>}
        {sale.customer?.phone && <div style={row}><span>Phone</span><span>{sale.customer.phone}</span></div>}

        <hr style={divider} />

        <div style={{ fontSize: 11, fontWeight: 700, color: '#777', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Items</div>
        {sale.items.map((item) => {
          const template = item.measurement_snapshot
            ? templatesRes?.data.find((t) => t.template_key === item.measurement_snapshot!.template_key)
            : null;

          return (
            <div key={item.id} style={{ marginBottom: item.needs_stitching ? 10 : 0 }}>
              <div style={row}>
                <span>{item.label}{item.qty > 1 ? ` × ${item.qty}` : ''}</span>
                <span>{formatCurrency(item.line_total)}</span>
              </div>
              {item.needs_stitching && (
                <div style={{ background: '#f7f7f7', borderRadius: 6, padding: '8px 10px', marginTop: 4, fontSize: 11.5 }}>
                  {item.measurement_snapshot && (
                    <div style={{ marginBottom: 4 }}>Garment: {item.measurement_snapshot.template_label}</div>
                  )}
                  {item.karigar && <div>Karigar: {item.karigar.name}</div>}
                  {item.deadline && <div>Deadline: {formatDate(item.deadline)}</div>}
                  {template && item.measurement_snapshot && (
                    <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
                      {template.fields.map((f) => {
                        const val = item.measurement_snapshot!.fields?.[f.key];
                        return val ? <span key={f.key}>{f.label}: {Array.isArray(val) ? val.join('/') : val}</span> : null;
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <hr style={divider} />

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

        <hr style={divider} />

        <div style={{ textAlign: 'center', fontSize: 12, color: '#555' }}>
          Thank you for your order.
        </div>
      </div>
    </Dialog>
  );
}
