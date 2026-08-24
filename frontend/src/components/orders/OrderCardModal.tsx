import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MeasurementBlock } from '@/components/measurements/MeasurementBlock';
import { EditOrderModal } from './EditOrderModal';
import { AddPaymentModal } from '@/components/payments/AddPaymentModal';
import { ordersApi } from '@/api/orders';
import { settingsApi } from '@/api/settings';
import { formatDate, formatCurrency } from '@/lib/format';
import { sendOrderWhatsApp } from '@/lib/orderCard';
import { STYLE_FIELDS, parseCustomStyleFields } from '@/lib/styleFields';
import { useEffect, useState } from 'react';
import { useAuthedImage } from '@/lib/useAuthedImage';

interface OrderCardModalProps {
  orderId: number | null;
  onClose: () => void;
  startInEdit?: boolean;
}

export function OrderCardModal({ orderId, onClose, startInEdit }: OrderCardModalProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: orderRes, isLoading, error } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => ordersApi.show(orderId as number),
    enabled: orderId !== null,
  });

  useEffect(() => {
    if (orderId !== null) setEditOpen(Boolean(startInEdit));
  }, [orderId, startInEdit]);
  const { data: templatesRes } = useQuery({
    queryKey: ['templates'],
    queryFn: () => settingsApi.getTemplates(),
    staleTime: 5 * 60_000,
  });

  if (orderId === null) return null;
  const order = orderRes?.data;
  const template = templatesRes?.data.find((t) => t.template_key === order?.measurement_snapshot.template_key) || null;

  const paid = order?.payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? Number(order?.paid_amount ?? 0);
  const pending = order ? Math.max(0, Number(order.total_amount) - paid) : 0;
  const style = order?.style || {};

  const styleRows: Array<[string, string]> = order
    ? [
        ...STYLE_FIELDS.filter((f) => style[f.key]).map((f): [string, string] => [f.label, style[f.key] as string]),
        ...parseCustomStyleFields(style.custom_fields).map((f): [string, string] => [f.label, f.value]),
      ]
    : [];

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    // Order edits (status, total, deadline) and payments both shift
    // Dashboard KPIs.
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }

  function handleWhatsApp(audience: 'karigar' | 'customer') {
    if (!order) return;
    const result = sendOrderWhatsApp(order, order.customer, order.karigar, template, paid, audience);
    if (!result.ok) toast.error(result.message);
  }

  return (
    <>
      <Dialog
        open={orderId !== null}
        onClose={onClose}
        title="Order Card"
        wide
        bodyId="ocBody"
        footer={
          !isLoading && order ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, width: '100%' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button variant="outline" sm onClick={() => setEditOpen(true)}>Edit Order</Button>
                <Button variant="outline" sm onClick={() => setPayOpen(true)}>Add Payment</Button>
                <Button variant="outline" sm onClick={() => handleWhatsApp('karigar')}>WhatsApp Karigar</Button>
                <Button variant="outline" sm onClick={() => handleWhatsApp('customer')}>WhatsApp Customer</Button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" sm onClick={() => window.print()}>Print</Button>
                <Button sm onClick={onClose}>Close</Button>
              </div>
            </div>
          ) : null
        }
      >
        {isLoading && <p style={{ color: 'var(--text-faint)' }}>Loading order…</p>}
        {error && <p style={{ color: 'var(--red-bright)' }}>Failed to load order.</p>}
        {order && (
          <>
            <div className="oc-header">
              <div>
                <div className="oc-order-no mono">{order.order_no}</div>
                <div className="oc-sub">Assigned {formatDate(order.assigned_date)} · Deadline {formatDate(order.deadline)}</div>
              </div>
              <Badge status={order.status} />
            </div>
            <div className="oc-grid">
              <div className="oc-block">
                <div className="oc-section-title">Customer</div>
                <div className="oc-kv"><span>Name</span><b>{order.customer?.name || '—'}</b></div>
                <div className="oc-kv"><span>Phone</span><b className="mono">{order.customer?.phone || '—'}</b></div>
                <div className="oc-kv"><span>Address</span><b>{order.customer?.address || '—'}</b></div>
              </div>
              <div className="oc-block">
                <div className="oc-section-title">Assignment</div>
                <div className="oc-kv"><span>Karigar</span><b>{order.karigar?.name || '—'}</b></div>
                <div className="oc-kv"><span>Total</span><b className="mono">{formatCurrency(order.total_amount)}</b></div>
                <div className="oc-kv"><span>Paid</span><b className="mono">{formatCurrency(paid)}</b></div>
                <div className="oc-kv"><span>Balance</span><b className={`mono ${pending > 0 ? 'balance-pending' : 'balance-paid'}`}>{pending > 0 ? formatCurrency(pending) : 'Paid'}</b></div>
              </div>
            </div>

            {template ? (
              <MeasurementBlock template={template} fields={order.measurement_snapshot.fields} notes={order.measurement_snapshot.notes} />
            ) : (
              <div className="oc-notes">Measurement template not found.</div>
            )}

            {styleRows.length > 0 && (
              <div className="oc-block" style={{ marginTop: 14 }}>
                <div className="oc-section-title">Style Customization</div>
                {styleRows.map(([label, val]) => (
                  <div key={label} className="oc-kv"><span>{label}</span><b>{val}</b></div>
                ))}
              </div>
            )}

            {order.photos && order.photos.length > 0 && (
              <>
                <div className="oc-section-title" style={{ marginTop: 18 }}>Reference Photos</div>
                <div className="photo-thumbs">
                  {order.photos.map((p) => (
                    <div key={p.id} className="photo-thumb">
                      <PhotoThumb path={p.file_path} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </Dialog>

      {order && (
        <EditOrderModal
          order={order}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            refresh();
          }}
        />
      )}
      {order && (
        <AddPaymentModal
          orderId={order.id}
          open={payOpen}
          onClose={() => setPayOpen(false)}
          onSaved={() => {
            setPayOpen(false);
            refresh();
          }}
        />
      )}
    </>
  );
}

function PhotoThumb({ path }: { path: string }) {
  const url = useAuthedImage(path);
  return url ? <img src={url} alt="Reference" /> : null;
}
