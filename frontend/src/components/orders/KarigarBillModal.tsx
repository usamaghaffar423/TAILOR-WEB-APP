import { Fragment, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ordersApi } from '@/api/orders';
import { settingsApi } from '@/api/settings';
import { formatDate } from '@/lib/format';
import { useAuthedImage } from '@/lib/useAuthedImage';
import { printBillElement } from '@/lib/printBill';
import { STYLE_FIELDS, parseCustomStyleFields } from '@/lib/styleFields';
import type { Order } from '@/types';
import '@/billPrint.css';

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
  const billRef = useRef<HTMLDivElement>(null);

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
            <Button variant="outline" sm onClick={() => printBillElement(billRef.current)}>Print</Button>
            <Button sm onClick={onClose}>Close</Button>
          </div>
        ) : null
      }
    >
      {isLoading && <p style={{ color: 'var(--text-faint)' }}>لوڈ ہو رہا ہے…</p>}
      {error && <p style={{ color: 'var(--red-bright)' }}>آرڈر لوڈ نہیں ہو سکا۔</p>}
      {order && (
        <div className="bill-print bill-print--urdu" dir="rtl" ref={billRef}>
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
            <div className="bill-shop-meta">ورک آرڈر — کاریگر کاپی</div>
          </div>

          <hr className="bill-divider" />

          {/* Order reference */}
          <div className="bill-row"><span>آرڈر نمبر</span><b><bdi>{order.order_no}</bdi></b></div>
          <div className="bill-row"><span>تاریخ</span><bdi>{formatDate(order.created_at)}</bdi></div>
          <div className="bill-row"><span>آخری تاریخ</span><b><bdi>{formatDate(order.deadline)}</bdi></b></div>
          <div className="bill-row"><span>لباس کی قسم</span><b><bdi>{template?.label || order.measurement_snapshot.template_label || '—'}</bdi></b></div>

          <hr className="bill-divider" />

          {/* Customer details */}
          <div className="bill-section">گاہک کی تفصیلات</div>
          <div className="bill-row"><span>نام</span><b><bdi>{order.customer?.name || '—'}</bdi></b></div>
          <div className="bill-row"><span>فون</span><bdi>{order.customer?.phone || '—'}</bdi></div>

          <hr className="bill-divider" />

          {/* Karigar assignment */}
          <div className="bill-section">کاریگر کی تفصیلات</div>
          <div className="bill-row"><span>کاریگر</span><b><bdi>{order.karigar?.name || '—'}</bdi></b></div>
          <div className="bill-row"><span>تفویض کردہ تاریخ</span><bdi>{formatDate(order.assigned_date)}</bdi></div>

          {template && (
            <>
              <hr className="bill-divider" />
              <div className="bill-section">پیمائش</div>
              {template.fields.map((f) => {
                const g = f.group || 'پیمائش';
                const heading = showGroups && g !== lastGroup;
                if (heading) lastGroup = g;
                return (
                  <Fragment key={f.key}>
                    {heading && <div className="bill-group-heading">{g}</div>}
                    <div className="bill-row">
                      <span>{f.label}</span>
                      <b><bdi>{displayValue(order.measurement_snapshot.fields?.[f.key])}</bdi></b>
                    </div>
                  </Fragment>
                );
              })}
              {order.measurement_snapshot.notes && (
                <div className="bill-note">
                  نوٹس: <bdi>{order.measurement_snapshot.notes}</bdi>
                </div>
              )}
            </>
          )}

          {urduStyleRows.length > 0 && (
            <>
              <hr className="bill-divider" />
              <div className="bill-section">اسٹائل کی تفصیلات</div>
              {urduStyleRows.map(([label, value]) => (
                <div key={label} className="bill-row">
                  <span>{label}</span>
                  <b><bdi>{value}</bdi></b>
                </div>
              ))}
            </>
          )}

          <hr className="bill-divider" />

          <div className="bill-sign">دستخط کاریگر: _______________</div>
        </div>
      )}
    </Dialog>
  );
}
