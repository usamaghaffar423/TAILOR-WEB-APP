import { Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ordersApi } from '@/api/orders';
import { settingsApi } from '@/api/settings';
import { formatDate } from '@/lib/format';
import { getOrderShalwarStyle, colorName } from '@/lib/orderCard';
import type { Order } from '@/types';

interface KarigarBillModalProps {
  orderId: number | null;
  onClose: () => void;
}

// Style category names in Urdu, ordered for display. Only categories with an
// Urdu label are shown — fields without one aren't guessed at.
function buildUrduStyleRows(order: Order) {
  const style = order.style || {};
  const shalwarStyle = getOrderShalwarStyle(style);
  const rows: Array<[string, string | undefined]> = [
    ['طرز', style.regionalStyle], // Regional Style
    ['فٹنگ', style.fit], // Fit
    ['لمبائی', style.length], // Length
    ['کالر', style.collar], // Collar
    ['گلا', style.neck], // Neck
    ['آستین', style.sleeve], // Sleeve
    ['کف', style.cuff], // Cuff
    ['شلوار', shalwarStyle?.label], // Shalwar Style
    ['پٹی', style.placket], // Placket
    ['جیب', style.pocket], // Pocket
    ['موری', style.mori], // Mori
    ['کمر', style.waistType], // Waist Type
    ['دامن', style.daman], // Daman
    ['کپڑا', style.fabric], // Fabric
    ['بٹن', style.buttonStyle], // Button Style
    ['بٹن تعداد', style.buttonCount], // Button Count
    ['رنگ', style.color ? colorName(style.color) : undefined], // Color
  ];
  return rows.filter((row): row is [string, string] => Boolean(row[1]));
}

function displayValue(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val.length > 0 ? val.join(' / ') : '—';
  return val || '—';
}

export function KarigarBillModal({ orderId, onClose }: KarigarBillModalProps) {
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

  if (orderId === null) return null;
  const order = orderRes?.data;
  const shop = shopRes?.data;
  const template = templatesRes?.data.find((t) => t.template_key === order?.measurement_snapshot.template_key) || null;
  const urduStyleRows = order ? buildUrduStyleRows(order) : [];

  const groups = template ? [...new Set(template.fields.map((f) => f.group || 'Measurements'))] : [];
  const showGroups = groups.length > 1;
  let lastGroup: string | null = null;

  return (
    <Dialog
      open={orderId !== null}
      onClose={onClose}
      title="Karigar Bill"
      wide
      bodyId="karigarBillBody"
      footer={
        !isLoading && order ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <Button variant="outline" sm onClick={() => window.print()}>Print</Button>
            <Button sm onClick={onClose}>Close</Button>
          </div>
        ) : null
      }
    >
      {isLoading && <p style={{ color: 'var(--text-faint)' }}>لوڈ ہو رہا ہے…</p>}
      {error && <p style={{ color: 'var(--red-bright)' }}>آرڈر لوڈ نہیں ہو سکا۔</p>}
      {order && (
        <div
          className="karigar-bill-print-area"
          dir="rtl"
          style={{ background: '#fff', color: '#111', padding: 20, borderRadius: 8, textAlign: 'right' }}
        >
          <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 14, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>
            {shop?.name || 'Top Man Tailor'}
          </div>

          <div style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.9 }}>
            <div>آرڈر نمبر: <b>{order.order_no}</b></div>
            <div>تاریخ: {formatDate(order.created_at)}</div>
            <div>آخری تاریخ: <b>{formatDate(order.deadline)}</b></div>
            <div>گاہک کا نام: {order.customer?.name || '—'}</div>
            <div>فون نمبر: {order.customer?.phone || '—'}</div>
            <div>لباس کی قسم: {template?.label || order.measurement_snapshot.template_label}</div>
          </div>

          {template && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>پیمائش</div>
              <div style={{ fontSize: 13, lineHeight: 1.9 }}>
                {template.fields.map((f) => {
                  const g = f.group || 'Measurements';
                  const heading = showGroups && g !== lastGroup;
                  if (heading) lastGroup = g;
                  return (
                    <Fragment key={f.key}>
                      {heading && <div style={{ fontWeight: 700, marginTop: 8 }}>{g}</div>}
                      <div>{f.label}: <b>{displayValue(order.measurement_snapshot.fields?.[f.key])}</b></div>
                    </Fragment>
                  );
                })}
              </div>
              {order.measurement_snapshot.notes && (
                <div style={{ marginTop: 8, fontSize: 12.5 }}>نوٹس: {order.measurement_snapshot.notes}</div>
              )}
            </div>
          )}

          {urduStyleRows.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>اسٹائل کی تفصیلات</div>
              <div style={{ fontSize: 13, lineHeight: 1.9 }}>
                {urduStyleRows.map(([label, value]) => (
                  <div key={label}>{label}: <b>{value}</b></div>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: 13, marginBottom: 30 }}>
            <div>کاریگر کا نام: {order.karigar?.name || '—'}</div>
            <div>تفویض کردہ تاریخ: {formatDate(order.assigned_date)}</div>
          </div>

          <div style={{ fontSize: 14, marginTop: 40 }}>دستخط کاریگر: _______________</div>
        </div>
      )}
    </Dialog>
  );
}
