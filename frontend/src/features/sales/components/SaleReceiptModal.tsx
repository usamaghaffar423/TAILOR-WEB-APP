import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { settingsApi } from '@/api/settings';
import { formatDate, formatCurrency } from '@/lib/format';
import { useAuthedImage } from '@/lib/useAuthedImage';
import type { PaymentMethod } from '@/types';
import type { Sale } from '../types';
import '@/billPrint.css';

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash',
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
  bank: 'Bank',
  card: 'Card',
};

interface SaleReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

// Merges the old CustomerBillModal (tailoring) and retail's ReceiptModal
// (POS) into one bill shape. Shares src/billPrint.css / the `.bill-print`
// layout with every other bill, so print (80mm thermal) and screen stay
// consistent across the app.
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

        <div className="bill-row"><span>Sale #</span><b>{displayNo}</b></div>
        <div className="bill-row"><span>Date</span><span>{formatDate(sale.created_at)}</span></div>
        {sale.customer && <div className="bill-row"><span>Customer</span><b>{sale.customer.name}</b></div>}
        {sale.customer?.phone && <div className="bill-row"><span>Phone</span><span>{sale.customer.phone}</span></div>}

        <hr className="bill-divider" />

        <div className="bill-section">Items</div>
        {sale.items.map((item) => {
          const template = item.measurement_snapshot
            ? templatesRes?.data.find((t) => t.template_key === item.measurement_snapshot!.template_key)
            : null;

          return (
            <div key={item.id} className="bill-item">
              <div className="bill-row">
                <span>{item.label}{item.qty > 1 ? ` × ${item.qty}` : ''}</span>
                <span>{formatCurrency(item.line_total)}</span>
              </div>
              {item.needs_stitching && (
                <div className="bill-item-detail">
                  {item.measurement_snapshot && (
                    <div>Garment: {item.measurement_snapshot.template_label}</div>
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

        <hr className="bill-divider" />

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

        <hr className="bill-divider" />

        <div className="bill-footer">Thank you for your order.</div>
      </div>
    </Dialog>
  );
}
