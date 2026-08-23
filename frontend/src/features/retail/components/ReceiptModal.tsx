import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { settingsApi } from '@/api/settings';
import { formatCurrency, formatDate } from '@/lib/format';
import { useAuthedImage } from '@/lib/useAuthedImage';
import { METHOD_LABEL } from '../lib/paymentMethod';
import type { RetailSale } from '../types';

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

interface ReceiptModalProps {
  sale: RetailSale | null;
  onClose: () => void;
}

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

          <div style={row}><span>Sale #</span><b>{sale.id}</b></div>
          <div style={row}><span>Date</span><span>{formatDate(sale.sale_date)}</span></div>
          {sale.customer_name && <div style={row}><span>Customer</span><span>{sale.customer_name}</span></div>}
          {sale.customer_phone && <div style={row}><span>Phone</span><span>{sale.customer_phone}</span></div>}

          <hr style={divider} />

          {sale.items.map((item) => (
            <div key={item.id} style={row}>
              <span>
                {item.variant.product.name}
                {(item.variant.size || item.variant.color) && (
                  <span style={{ color: '#777' }}> ({[item.variant.size, item.variant.color].filter(Boolean).join(' / ')})</span>
                )}
                {' '}× {item.quantity}
              </span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          ))}

          <hr style={{ ...divider, borderTop: '1px solid #111', margin: '8px 0' }} />
          <div style={{ ...row, fontSize: 15, fontWeight: 700 }}>
            <span>Total</span>
            <span>{formatCurrency(sale.total_amount)}</span>
          </div>
          <div style={row}><span>Payment</span><span>{METHOD_LABEL[sale.payment_method]}</span></div>

          <hr style={divider} />

          <div style={{ textAlign: 'center', fontSize: 12, color: '#555' }}>
            Thank you for shopping with us.
          </div>
        </div>
      )}
    </Dialog>
  );
}
