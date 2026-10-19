import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { DateInput } from '@/components/ui/DateInput';
import { MeasurementFieldsForm } from '@/components/measurements/MeasurementFieldsForm';
import { StyleCustomizationFields } from '@/components/orders/StyleCustomizationFields';
import { customersApi } from '@/api/customers';
import type { CustomerDetail } from '@/api/customers';
import { ordersApi } from '@/api/orders';
import { karigarsApi } from '@/api/karigars';
import { settingsApi } from '@/api/settings';
import { uploadsApi } from '@/api/uploads';
import { formatCurrency, formatDateShort } from '@/lib/format';
import { STYLE_FIELDS, parseCustomStyleFields, supportsStyleCustomization } from '@/lib/styleFields';
import type { CustomStyleField } from '@/lib/styleFields';
import { ORDER_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS } from '@/lib/orderOptions';
import type { Measurement, Order, OrderStatus, PaymentMethod } from '@/types';

type PaymentStatus = 'none' | 'partial' | 'full';

const PAYMENT_STATUS_OPTIONS = [
  { value: 'none', label: 'No Payment Yet' },
  { value: 'partial', label: 'Partial Payment (Advance)' },
  { value: 'full', label: 'Paid in Full' },
];

interface RepeatOrderModalProps {
  /** Existing customer to create another order for; null keeps the popup closed. */
  customerId: number | null;
  onClose: () => void;
  onCreated?: (order: Order) => void;
}

/**
 * New order for a customer who already has one on file. Everything the shop
 * captured last time — measurements, notes, style, karigar, item names — is
 * fetched BEFORE the form appears, so the tailor only changes what is
 * different this time and enters the new price/payment. Each order keeps its
 * own payments, so earlier orders stay paid/unpaid exactly as they were.
 */
export function RepeatOrderModal({ customerId, onClose, onCreated }: RepeatOrderModalProps) {
  const open = customerId !== null;
  const id = customerId ?? 0;

  const detailQuery = useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.show(id),
    enabled: open,
  });
  const latestMeasurementQuery = useQuery({
    queryKey: ['customers', id, 'measurements', 'latest'],
    queryFn: () => customersApi.latestMeasurement(id).catch(() => ({ data: null })),
    enabled: open,
  });
  // orders come back newest-created first (CustomerController::show)
  const latestOrderId = detailQuery.data?.data.orders[0]?.id ?? null;
  const latestOrderQuery = useQuery({
    queryKey: ['orders', latestOrderId, 'repeat-prefill'],
    queryFn: () => ordersApi.show(latestOrderId!),
    enabled: open && latestOrderId !== null,
  });
  const { data: templatesRes } = useQuery({ queryKey: ['templates'], queryFn: () => settingsApi.getTemplates(), enabled: open });

  const detail = detailQuery.data?.data;
  const ready =
    !!detail &&
    !!templatesRes &&
    !latestMeasurementQuery.isLoading &&
    (latestOrderId === null || !latestOrderQuery.isLoading);
  const failed = detailQuery.isError;

  return (
    <Dialog open={open} onClose={onClose} title={detail ? `New Order — ${detail.customer.name}` : 'New Order'} wide>
      {failed ? (
        <p style={{ color: 'var(--red-bright)' }}>Couldn't load this customer. Close and try again.</p>
      ) : !ready ? (
        <p style={{ color: 'var(--text-faint)' }}>Loading customer's previous order details…</p>
      ) : (
        <RepeatOrderForm
          key={id}
          detail={detail}
          latestMeasurement={latestMeasurementQuery.data?.data ?? null}
          latestOrder={latestOrderQuery.data?.data ?? null}
          onClose={onClose}
          onCreated={onCreated}
        />
      )}
    </Dialog>
  );
}

interface RepeatOrderFormProps {
  detail: CustomerDetail;
  latestMeasurement: Measurement | null;
  latestOrder: Order | null;
  onClose: () => void;
  onCreated?: (order: Order) => void;
}

function RepeatOrderForm({ detail, latestMeasurement, latestOrder, onClose, onCreated }: RepeatOrderFormProps) {
  const queryClient = useQueryClient();
  const { customer, measurements, orders } = detail;

  const { data: templatesRes } = useQuery({ queryKey: ['templates'], queryFn: () => settingsApi.getTemplates() });
  const { data: karigarsRes } = useQuery({ queryKey: ['karigars'], queryFn: () => karigarsApi.index() });

  // ---- Measurements: saved profile first (Edit Order syncs back into it),
  // then the last order's snapshot for customers with no profile row. ----
  const snapshot = latestOrder?.measurement_snapshot;
  const [templateKey, setTemplateKey] = useState(
    () => latestMeasurement?.template_key || snapshot?.template_key || 'shalwar-kameez-men'
  );
  const [fields, setFields] = useState<Record<string, string | string[]>>(
    () => latestMeasurement?.fields ?? snapshot?.fields ?? {}
  );
  const [notes, setNotes] = useState(() => latestMeasurement?.notes ?? snapshot?.notes ?? '');
  const template = templatesRes?.data.find((t) => t.template_key === templateKey) || null;

  function handleTemplateChange(key: string) {
    setTemplateKey(key);
    // Different garment this time — start from their saved profile for it.
    const saved = measurements.find((m) => m.template_key === key);
    setFields(saved?.fields ?? {});
    if (saved?.notes) setNotes(saved.notes);
  }

  // ---- Style (from the last order) ----
  const [styleValues, setStyleValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    STYLE_FIELDS.forEach((f) => {
      const v = latestOrder?.style?.[f.key];
      if (v) init[f.key] = v;
    });
    return init;
  });
  const [customStyleFields, setCustomStyleFields] = useState<CustomStyleField[]>(() =>
    parseCustomStyleFields(latestOrder?.style?.custom_fields)
  );

  // ---- Assign & deadline — same karigar as last time; the old deadline is
  // in the past, so the new one is always picked fresh. ----
  const [karigarId, setKarigarId] = useState<number | ''>(() => latestOrder?.karigar_id ?? '');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<OrderStatus>('progress');

  // ---- Items: same item names, new amounts (last price shown as a hint) ----
  const lastItems = latestOrder?.items && latestOrder.items.length > 0 ? latestOrder.items : null;
  const [items, setItems] = useState<{ label: string; amount: string; lastAmount?: number }[]>(() =>
    lastItems
      ? lastItems.map((it) => ({ label: it.label, amount: '', lastAmount: Number(it.amount) }))
      : [{ label: 'Stitching Charges', amount: '' }]
  );
  function updateItem(idx: number, patch: Partial<{ label: string; amount: string }>) {
    setItems((its) => its.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  // ---- Payment for THIS order only — starts at zero every time ----
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('none');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [advance, setAdvance] = useState('');

  const totalNum = items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);
  const paidNow = paymentStatus === 'full' ? totalNum : paymentStatus === 'partial' ? parseFloat(advance) || 0 : 0;
  const remaining = totalNum ? Math.max(0, totalNum - paidNow) : 0;

  // ---- Photos ----
  const [photos, setPhotos] = useState<File[]>([]);
  const photoUrls = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => photoUrls.forEach((u) => URL.revokeObjectURL(u)), [photoUrls]);

  const outstanding = Number(customer.total_unpaid_balance ?? 0);

  const mutation = useMutation({
    mutationFn: async () => {
      await customersApi.upsertMeasurement(customer.id, templateKey, fields, notes.trim() || null);

      const style: Record<string, string> = {};
      STYLE_FIELDS.forEach((f) => {
        const v = styleValues[f.key];
        if (v) style[f.key] = v;
      });
      const filledCustomFields = customStyleFields.filter((f) => f.value.trim());
      if (filledCustomFields.length > 0) {
        style.custom_fields = JSON.stringify(filledCustomFields);
      }

      const orderItems = items
        .filter((it) => it.label.trim() && parseFloat(it.amount) > 0)
        .map((it) => ({ label: it.label.trim(), amount: parseFloat(it.amount) }));

      const orderRes = await ordersApi.store({
        customer_id: customer.id,
        template_key: templateKey,
        measurement_notes: notes.trim() || null,
        style,
        items: orderItems,
        karigar_id: karigarId as number,
        deadline,
        status,
        total_amount: totalNum,
        ...(paidNow > 0 ? { advance_amount: paidNow, advance_method: method } : {}),
      });

      if (photos.length > 0) {
        await uploadsApi.store(orderRes.data.id, photos);
      }
      return orderRes.data;
    },
    onSuccess: (order) => {
      toast.success(`Order ${order.order_no} created for ${customer.name}`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['karigars'] });
      onCreated?.(order);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSave() {
    const incompleteItem = items.find((it) => (it.label.trim() && !(parseFloat(it.amount) > 0)) || (!it.label.trim() && it.amount.trim()));
    if (incompleteItem) {
      toast.error(incompleteItem.label.trim() ? `Enter the amount for "${incompleteItem.label.trim()}" (or remove it)` : 'Every item needs both a name and an amount');
      return;
    }
    if (!totalNum || totalNum <= 0) {
      toast.error('Enter the new order amount');
      return;
    }
    if (paymentStatus === 'partial' && (!paidNow || paidNow <= 0)) {
      toast.error('Enter the amount paid, or switch to "No Payment Yet"');
      return;
    }
    if (paidNow > totalNum) {
      toast.error("Amount paid can't exceed the total order amount");
      return;
    }
    if (!deadline) {
      toast.error('Please choose a deadline');
      return;
    }
    if (!karigarId) {
      toast.error('Please assign a karigar');
      return;
    }
    mutation.mutate();
  }

  return (
    <>
      {/* ---- Customer & previous orders ---- */}
      <div className="oc-kv"><span>Customer</span><b>{customer.name} · <span className="mono">{customer.customer_id}</span> · {customer.phone}</b></div>
      <div className="oc-kv">
        <span>Previous orders</span>
        <b>
          {orders.length}
          {' · '}
          <span className={outstanding > 0 ? 'balance-pending' : 'balance-paid'}>
            {outstanding > 0 ? `${formatCurrency(outstanding)} outstanding` : 'all settled'}
          </span>
        </b>
      </div>
      {orders.length > 0 && (
        <div style={{ marginTop: 8, maxHeight: 132, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
          {orders.map((o) => {
            const pending = Math.max(0, Number(o.total_amount) - Number(o.paid_amount ?? 0));
            return (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', fontSize: 12.5, borderBottom: '1px solid var(--border)' }}>
                <b className="mono">{o.order_no}</b>
                <span style={{ color: 'var(--text-faint)', flex: 1 }}>{formatDateShort(o.assigned_date)} · {formatCurrency(o.total_amount)}</span>
                <span className={`badge ${pending > 0 ? 'badge-progress' : 'badge-ready'}`}>
                  {pending > 0 ? `${formatCurrency(pending)} due` : 'Paid'}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {latestOrder && (
        <div className="hint" style={{ marginTop: 10 }}>
          Measurements, style and karigar are filled in from <b>{latestOrder.order_no}</b>. Change only what's different this time, then enter the new amount.
        </div>
      )}

      {/* ---- Measurements ---- */}
      <div style={{ marginTop: 20 }}>
        <div className="oc-section-title">Measurements</div>
        <div className="form-grid cols-2" style={{ marginTop: 12 }}>
          <div className="field span-2">
            <label>Garment Template</label>
            <Dropdown
              value={templateKey}
              onChange={handleTemplateChange}
              options={templatesRes?.data.map((t) => ({ value: t.template_key, label: t.label })) || []}
            />
          </div>
        </div>
        {template && (
          <div style={{ marginTop: 14 }}>
            <MeasurementFieldsForm template={template} fields={fields} onFieldChange={(key, value) => setFields((f) => ({ ...f, [key]: value }))} />
          </div>
        )}
      </div>

      {/* ---- Style ---- */}
      {supportsStyleCustomization(templateKey) && (
        <div style={{ marginTop: 20 }}>
          <div className="oc-section-title">Style Customization</div>
          <StyleCustomizationFields
            templateKey={templateKey}
            styleValues={styleValues}
            onStyleChange={(key, value) => setStyleValues((s) => ({ ...s, [key]: value }))}
            customFields={customStyleFields}
            onCustomFieldsChange={setCustomStyleFields}
          />
        </div>
      )}

      {/* ---- Notes ---- */}
      <div style={{ marginTop: 20 }}>
        <div className="oc-section-title">Notes</div>
        <textarea
          className="notes-big"
          style={{ marginTop: 12 }}
          placeholder="Fit preferences, special instructions — anything the karigar bill should carry…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* ---- Assign, amount & payment ---- */}
      <div style={{ marginTop: 20 }}>
        <div className="oc-section-title">Order Value &amp; Payment</div>
        <div className="form-grid cols-2" style={{ marginTop: 12 }}>
          <div className="field">
            <label>Karigar</label>
            <Dropdown
              value={karigarId === '' ? '' : String(karigarId)}
              onChange={(v) => setKarigarId(v ? Number(v) : '')}
              placeholder="Select karigar…"
              options={karigarsRes?.data.map((k) => ({ value: String(k.id), label: `${k.name} — ${k.speciality || ''}` })) || []}
            />
          </div>
          <div className="field"><label>Deadline</label><DateInput value={deadline} onChange={setDeadline} /></div>
          <div className="field">
            <label>Order Status</label>
            <Dropdown value={status} onChange={(v) => setStatus(v as OrderStatus)} options={ORDER_STATUS_OPTIONS} />
          </div>
          <div className="field span-2">
            <label>Items</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="e.g. Stitching Charges, Fabric / Kapra"
                    value={it.label}
                    onChange={(e) => updateItem(idx, { label: e.target.value })}
                    style={{ flex: 2 }}
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder={it.lastAmount ? `Last time: ${formatCurrency(it.lastAmount)}` : 'Amount (Rs)'}
                    className="mono"
                    value={it.amount}
                    onChange={(e) => updateItem(idx, { amount: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  {items.length > 1 && (
                    <button type="button" className="row-icon-btn" title="Remove item" onClick={() => setItems((its) => its.filter((_, i) => i !== idx))}>&minus;</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <Button type="button" variant="outline" sm onClick={() => setItems((its) => [...its, { label: '', amount: '' }])}>+ Add Item</Button>
            </div>
          </div>
          <div className="field"><label>Order Total (Rs)</label><input type="text" className="mono" value={totalNum ? formatCurrency(totalNum) : ''} disabled /></div>
          <div className="field">
            <label>Payment Status</label>
            <Dropdown value={paymentStatus} onChange={(v) => setPaymentStatus(v as PaymentStatus)} options={PAYMENT_STATUS_OPTIONS} />
          </div>
          {paymentStatus !== 'none' && (
            <div className="field">
              <label>Payment Method</label>
              <Dropdown value={method} onChange={(v) => setMethod(v as PaymentMethod)} options={PAYMENT_METHOD_OPTIONS} />
            </div>
          )}
          {paymentStatus === 'partial' && (
            <div className="field"><label>Amount Paid Now (Rs)</label><input type="number" min={0} placeholder="e.g. 2000" value={advance} onChange={(e) => setAdvance(e.target.value)} /></div>
          )}
          <div className="field"><label>Remaining on This Order (Rs)</label><input type="text" className="mono" value={totalNum ? formatCurrency(remaining) : ''} disabled /></div>
        </div>
        <div className="hint" style={{ marginTop: 8 }}>
          Payment here applies to this new order only — earlier orders keep their own paid/unpaid status.
        </div>
      </div>

      {/* ---- Photos ---- */}
      <div style={{ marginTop: 20 }}>
        <div className="oc-section-title">Reference Photos</div>
        {photoUrls.length > 0 && (
          <div className="photo-thumbs" style={{ marginTop: 12 }}>
            {photoUrls.map((url, i) => (
              <div key={i} className="photo-thumb">
                <img src={url} alt="" />
                <button className="rm" type="button" title="Remove photo" onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}>&times;</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <Button type="button" variant="outline" sm onClick={() => document.getElementById('repeatOrderPhotoInput')?.click()}>+ Add Photos</Button>
          <input
            id="repeatOrderPhotoInput"
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
              setPhotos((p) => [...p, ...files]);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      <div className="hero-actions" style={{ justifyContent: 'flex-end', marginTop: 24 }}>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={mutation.isPending}>{mutation.isPending ? 'Creating…' : 'Create Order'}</Button>
      </div>
    </>
  );
}
