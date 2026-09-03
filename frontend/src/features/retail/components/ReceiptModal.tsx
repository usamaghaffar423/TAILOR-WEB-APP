import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { settingsApi } from '@/api/settings';
import { formatCurrency, formatDate } from '@/lib/format';
import { useAuthedImage } from '@/lib/useAuthedImage';
import { METHOD_LABEL } from '../lib/paymentMethod';
import type { RetailSale } from '../types';
import '@/billPrint.css';

interface ReceiptModalProps {
  sale: RetailSale | null;
  onClose: () => void;
}

// Prints on the shop's 80mm thermal printer. Layout/sizing lives in
// src/billPrint.css (shared by every bill in the app), scoped to
// `.bill-print`; see that file for the OS-side paper-size prerequisite.
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
        <div className="bill-print">
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

          <div className="bill-row"><span>Sale #</span><b>{sale.id}</b></div>
          <div className="bill-row"><span>Date</span><span>{formatDate(sale.sale_date)}</span></div>
          {sale.customer_name && <div className="bill-row"><span>Customer</span><span>{sale.customer_name}</span></div>}
          {sale.customer_phone && <div className="bill-row"><span>Phone</span><span>{sale.customer_phone}</span></div>}

          <hr className="bill-divider" />

          {sale.items.map((item) => (
            <div key={item.id} className="bill-item">
              <div className="bill-row">
                <span>
                  {item.variant.product.name}
                  {(item.variant.size || item.variant.color) && (
                    <span> ({[item.variant.size, item.variant.color].filter(Boolean).join(' / ')})</span>
                  )}
                  {' '}× {item.quantity}
                </span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
              {/*
                A stitched item's measurement / karigar / deadline lines go
                here as <div className="bill-item-detail">…</div> once this
                modal shares the unified Sale receipt. Pure retail has none.
              */}
            </div>
          ))}

          <hr className="bill-divider bill-divider--strong" />
          <div className="bill-row bill-total">
            <span>Total</span>
            <span>{formatCurrency(sale.total_amount)}</span>
          </div>
          <div className="bill-row"><span>Payment</span><span>{METHOD_LABEL[sale.payment_method]}</span></div>

          <hr className="bill-divider" />

          <div className="bill-footer">Thank you for shopping with us.</div>
        </div>
      )}
    </Dialog>
  );
}
