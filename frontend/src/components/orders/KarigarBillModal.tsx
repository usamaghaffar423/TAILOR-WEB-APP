import { Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ordersApi } from '@/api/orders';
import { settingsApi } from '@/api/settings';
import { formatDate } from '@/lib/format';
import { useAuthedImage } from '@/lib/useAuthedImage';
import { STYLE_FIELDS, parseCustomStyleFields } from '@/lib/styleFields';
import type { Order } from '@/types';

interface KarigarBillModalProps {
  orderId: number | null;
  onClose: () => void;
}

// Style rows in Urdu, ordered for display — only fields the order actually
// has a value for are shown.
function buildUrduStyleRows(order: Order) {
  const style = order.style || {};
  return [
    ...STYLE_FIELDS.filter((f) => style[f.key]).map((f): [string, string] => [f.labelUrdu, style[f.key] as string]),
    ...parseCustomStyleFields(style.custom_fields).map((f): [string, string] => [f.label, f.value]),
  ];
}

function displayValue(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val.length > 0 ? val.join(' / ') : '—';
  return val || '—';
}

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

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#777',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 6,
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
    staleTime: 30 * 60_000,
  });
  const shop = shopRes?.data;
  const logoUrl = useAuthedImage(shop?.logo_path);

  if (orderId === null) return null;
  const order = orderRes?.data;
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
            <div style={{ fontSize: 11.5, color: '#555', marginTop: 3 }}>ورک آرڈر — کاریگر کاپی</div>
          </div>

          <hr style={divider} />

          {/* Order reference */}
          <div style={row}><span>آرڈر نمبر</span><b><bdi>{order.order_no}</bdi></b></div>
          <div style={row}><span>تاریخ</span><bdi>{formatDate(order.created_at)}</bdi></div>
          <div style={row}><span>آخری تاریخ</span><b><bdi>{formatDate(order.deadline)}</bdi></b></div>
          <div style={row}><span>لباس کی قسم</span><b><bdi>{template?.label || order.measurement_snapshot.template_label || '—'}</bdi></b></div>

          <hr style={divider} />

          {/* Customer details */}
          <div style={sectionLabel}>گاہک کی تفصیلات</div>
          <div style={row}><span>نام</span><b><bdi>{order.customer?.name || '—'}</bdi></b></div>
          <div style={row}><span>فون</span><bdi>{order.customer?.phone || '—'}</bdi></div>

          <hr style={divider} />

          {/* Karigar assignment */}
          <div style={sectionLabel}>کاریگر کی تفصیلات</div>
          <div style={row}><span>کاریگر</span><b><bdi>{order.karigar?.name || '—'}</bdi></b></div>
          <div style={row}><span>تفویض کردہ تاریخ</span><bdi>{formatDate(order.assigned_date)}</bdi></div>

          {template && (
            <>
              <hr style={divider} />
              <div style={sectionLabel}>پیمائش</div>
              {template.fields.map((f) => {
                const g = f.group || 'پیمائش';
                const heading = showGroups && g !== lastGroup;
                if (heading) lastGroup = g;
                return (
                  <Fragment key={f.key}>
                    {heading && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#999', marginTop: lastGroup !== groups[0] ? 10 : 2, marginBottom: 2 }}>
                        {g}
                      </div>
                    )}
                    <div style={row}>
                      <span>{f.label}</span>
                      <b><bdi>{displayValue(order.measurement_snapshot.fields?.[f.key])}</bdi></b>
                    </div>
                  </Fragment>
                );
              })}
              {order.measurement_snapshot.notes && (
                <div style={{ marginTop: 8, fontSize: 12, background: '#f7f7f7', padding: '7px 10px', borderRadius: 4 }}>
                  نوٹس: <bdi>{order.measurement_snapshot.notes}</bdi>
                </div>
              )}
            </>
          )}

          {urduStyleRows.length > 0 && (
            <>
              <hr style={divider} />
              <div style={sectionLabel}>اسٹائل کی تفصیلات</div>
              {urduStyleRows.map(([label, value]) => (
                <div key={label} style={row}>
                  <span>{label}</span>
                  <b><bdi>{value}</bdi></b>
                </div>
              ))}
            </>
          )}

          <hr style={divider} />

          <div style={{ marginTop: 30, fontSize: 13, borderTop: '1px solid #111', paddingTop: 10, width: '100%', textAlign: 'center' }}>
            دستخط کاریگر: _______________
          </div>
        </div>
      )}
    </Dialog>
  );
}
