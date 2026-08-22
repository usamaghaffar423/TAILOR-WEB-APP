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

const sectionHead: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 16,
  background: '#eee',
  padding: '8px 14px',
  marginBottom: 12,
  borderRight: '4px solid #111',
};

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

  const groups = template ? [...new Set(template.fields.map((f) => f.group || 'پیمائش'))] : [];
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
          style={{ background: '#fff', color: '#111', padding: '36px 40px', textAlign: 'right', fontSize: 15, lineHeight: 1.65 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28, borderBottom: '3px solid #111', paddingBottom: 18 }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{shop?.name || 'Top Man Tailor'}</div>
            <div style={{ fontSize: 15, color: '#555', marginTop: 6 }}>ورک آرڈر — کاریگر کاپی</div>
          </div>

          <table style={{ width: '100%', marginBottom: 26, borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, borderBottom: '1px solid #ccc', paddingBottom: 6 }}>آرڈر کی تفصیلات</div>
                  <div style={{ marginBottom: 7 }}>آرڈر نمبر: <b><bdi>{order.order_no}</bdi></b></div>
                  <div style={{ marginBottom: 7 }}>تاریخ: <bdi>{formatDate(order.created_at)}</bdi></div>
                  <div style={{ marginBottom: 7 }}>آخری تاریخ: <b style={{ fontSize: 17 }}><bdi>{formatDate(order.deadline)}</bdi></b></div>
                  <div>لباس کی قسم: <b><bdi>{template?.label || order.measurement_snapshot.template_label || '—'}</bdi></b></div>
                </td>
                <td style={{ width: '50%', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, borderBottom: '1px solid #ccc', paddingBottom: 6 }}>گاہک کی تفصیلات</div>
                  <div style={{ marginBottom: 7 }}>نام: <b><bdi>{order.customer?.name || '—'}</bdi></b></div>
                  <div>فون: <bdi>{order.customer?.phone || '—'}</bdi></div>
                </td>
              </tr>
            </tbody>
          </table>

          {template && (
            <div style={{ marginBottom: 26 }}>
              <div style={sectionHead}>پیمائش</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
                <tbody>
                  {template.fields.map((f) => {
                    const g = f.group || 'پیمائش';
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
                          <td style={{ padding: '7px 10px', borderBottom: '1px solid #eee', fontWeight: 700 }}><bdi>{displayValue(order.measurement_snapshot.fields?.[f.key])}</bdi></td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
              {order.measurement_snapshot.notes && (
                <div style={{ marginTop: 10, fontSize: 13.5, background: '#f7f7f7', padding: '8px 12px', borderRadius: 4 }}>نوٹس: <bdi>{order.measurement_snapshot.notes}</bdi></div>
              )}
            </div>
          )}

          {urduStyleRows.length > 0 && (
            <div style={{ marginBottom: 26 }}>
              <div style={sectionHead}>اسٹائل کی تفصیلات</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {urduStyleRows.map(([label, value]) => (
                  <div key={label} style={{ border: '1px solid #ddd', borderRadius: 6, padding: '9px 12px' }}>
                    <div style={{ fontSize: 11.5, color: '#777' }}>{label}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}><bdi>{value}</bdi></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <table style={{ width: '100%', marginTop: 10, fontSize: 15, borderTop: '1px solid #ccc', paddingTop: 14 }}>
            <tbody>
              <tr>
                <td style={{ paddingTop: 14 }}>کاریگر: <b><bdi>{order.karigar?.name || '—'}</bdi></b></td>
                <td style={{ paddingTop: 14, textAlign: 'left' }}>تفویض کردہ تاریخ: <bdi>{formatDate(order.assigned_date)}</bdi></td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 70, fontSize: 16, borderTop: '1px solid #111', paddingTop: 16, width: 300 }}>
            دستخط کاریگر: _______________
          </div>
        </div>
      )}
    </Dialog>
  );
}
