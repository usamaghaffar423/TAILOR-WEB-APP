import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { settingsApi } from '@/api/settings';
import { formatCurrency, formatDate } from '@/lib/format';
import { useAuthedImage } from '@/lib/useAuthedImage';
import { METHOD_LABEL } from '../lib/paymentMethod';
import type { RetailSale } from '../types';
import './ReceiptModal.css';

interface ReceiptModalProps {
  sale: RetailSale | null;
  onClose: () => void;
}

// The receipt prints on the shop's 80mm thermal printer. All layout/sizing
// lives in ReceiptModal.css, scoped to `.receipt-print`; see that file for
// the OS-side paper-size prerequisite. `.customer-bill-print-area` is kept
// only so the app's existing print rules strip the surrounding modal chrome.
export function ReceiptModal({ sale, onClose }: ReceiptModalProps) {
  const { data: shopRes } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.show(),
    staleTime: 30 * 60_000,
  });
  const shop = shopRes?.data;
  const logoUrl = useAuthedImage(shop?.logo_path);

  return (
    <Dialog
      open={sale !== null}
      onClose={onClose}
      title="Sale Receipt"
      bodyId="retailReceiptBody"
      footer={
        sale ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <Button variant="outline" sm onClick={() => window.print()}>Print</Button>
            <Button sm onClick={onClose}>Done</Button>
          </div>
        ) : null
      }
    >
      {sale && (
        <div className="receipt-print customer-bill-print-area">
          <div className="r-head">
            {logoUrl ? (
              <img src={logoUrl} alt="Shop logo" className="logo" />
            ) : (
              <div className="logo-fallback">
                {(shop?.name || 'TM').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
            )}
            <div className="shop-name">{shop?.name || 'Top Man Tailor'}</div>
            {shop?.address && <div className="shop-meta">{shop.address}</div>}
            {shop?.phone && <div className="shop-meta">{shop.phone}</div>}
          </div>

          <hr className="divider" />

          <div className="row"><span>Sale #</span><b>{sale.id}</b></div>
          <div className="row"><span>Date</span><span>{formatDate(sale.sale_date)}</span></div>
          {sale.customer_name && <div className="row"><span>Customer</span><span>{sale.customer_name}</span></div>}
          {sale.customer_phone && <div className="row"><span>Phone</span><span>{sale.customer_phone}</span></div>}

          <hr className="divider" />

          {sale.items.map((item) => (
            <div key={item.id} className="item">
              <div className="item-line">
                <span className="item-name">
                  {item.variant.product.name}
                  {(item.variant.size || item.variant.color) && (
                    <span className="muted"> ({[item.variant.size, item.variant.color].filter(Boolean).join(' / ')})</span>
                  )}
                  {' '}× {item.quantity}
                </span>
                <span className="item-price">{formatCurrency(item.subtotal)}</span>
              </div>
              {/*
                Optional stitched-item detail (measurements / karigar / deadline)
                goes here as <div className="item-detail">…</div> once this modal
                shares the unified Sale receipt. Pure retail sales have none.
              */}
            </div>
          ))}

          <hr className="divider strong" />
          <div className="row total-row">
            <span>Total</span>
            <span>{formatCurrency(sale.total_amount)}</span>
          </div>
          <div className="row"><span>Payment</span><span>{METHOD_LABEL[sale.payment_method]}</span></div>

          <hr className="divider" />

          <div className="footer">Thank you for shopping with us.</div>
        </div>
      )}
    </Dialog>
  );
}
