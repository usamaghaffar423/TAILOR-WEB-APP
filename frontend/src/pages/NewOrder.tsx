import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { DateInput } from '@/components/ui/DateInput';
import { MeasurementFieldsForm } from '@/components/measurements/MeasurementFieldsForm';
import { StyleCustomizationFields } from '@/components/orders/StyleCustomizationFields';
import { RepeatOrderModal } from '@/components/orders/RepeatOrderModal';
import { customersApi } from '@/api/customers';
import { karigarsApi } from '@/api/karigars';
import { settingsApi } from '@/api/settings';
import { ordersApi } from '@/api/orders';
import { uploadsApi } from '@/api/uploads';
import { formatCurrency } from '@/lib/format';
import { STYLE_FIELDS, supportsStyleCustomization } from '@/lib/styleFields';
import type { CustomStyleField } from '@/lib/styleFields';
import { ORDER_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS } from '@/lib/orderOptions';
import type { OrderStatus, PaymentMethod } from '@/types';

type PaymentStatus = 'none' | 'partial' | 'full';

const PAYMENT_STATUS_OPTIONS = [
  { value: 'none', label: 'No Payment Yet' },
  { value: 'partial', label: 'Partial Payment (Advance)' },
  { value: 'full', label: 'Paid in Full' },
];

export default function NewOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const { data: templatesRes } = useQuery({ queryKey: ['templates'], queryFn: () => settingsApi.getTemplates() });
  const { data: karigarsRes } = useQuery({ queryKey: ['karigars'], queryFn: () => karigarsApi.index() });

  // ---- Customer ----
  // This page creates orders for NEW customers. Picking an existing customer
  // opens RepeatOrderModal instead, which loads everything from their last
  // order before the form appears.
  const [custSearch, setCustSearch] = useState('');
  // ?customerId= (old "+ New Order" links) opens the popup straight away.
  const [repeatCustomerId, setRepeatCustomerId] = useState<number | null>(() => {
    const pre = searchParams.get('customerId');
    return pre ? Number(pre) : null;
  });
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cAddress, setCAddress] = useState('');
  const { data: custResultsRes } = useQuery({
    queryKey: ['customers', custSearch],
    queryFn: () => customersApi.index(custSearch),
    enabled: custSearch.trim().length > 0 && repeatCustomerId === null,
  });

  function closeRepeatOrder() {
    setRepeatCustomerId(null);
    setCustSearch('');
  }

  // ---- Measurements ----
  const [templateKey, setTemplateKey] = useState('');
  const [fields, setFields] = useState<Record<string, string | string[]>>({});
  const [notes, setNotes] = useState('');
  useEffect(() => {
    if (templatesRes && !templateKey && templatesRes.data.length > 0) {
      const shalwarQameez = templatesRes.data.find((t) => t.template_key === 'shalwar-kameez-men');
      setTemplateKey((shalwarQameez || templatesRes.data[0]).template_key);
    }
  }, [templatesRes, templateKey]);
  const template = templatesRes?.data.find((t) => t.template_key === templateKey) || null;
  const hasStyleFields = supportsStyleCustomization(templateKey);

  function handleTemplateChange(key: string) {
    setTemplateKey(key);
    setFields({});
  }

  // ---- Style ----
  const [styleValues, setStyleValues] = useState<Record<string, string>>({});
  function setStyleField(key: string, value: string) {
    setStyleValues((s) => ({ ...s, [key]: value }));
  }

  // Per-order custom style fields — not saved to the shared field list, so
  // adding one here can never affect (or drop) fields on other orders.
  const [customStyleFields, setCustomStyleFields] = useState<CustomStyleField[]>([]);

  // ---- Photos ----
  const [photos, setPhotos] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const photoUrls = photos.map((f) => URL.createObjectURL(f));
  useEffect(() => () => photoUrls.forEach((u) => URL.revokeObjectURL(u)), [photoUrls]);

  function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    setPhotos((p) => [...p, ...files]);
  }

  // ---- Assign & Deadline ----
  const [karigarId, setKarigarId] = useState<number | ''>('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<OrderStatus>('progress');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('none');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [advance, setAdvance] = useState('');

  // ---- Items (billed line items — e.g. Stitching Charges, Fabric/Kapra) ----
  const [items, setItems] = useState<{ label: string; amount: string }[]>([{ label: 'Stitching Charges', amount: '' }]);
  function updateItem(idx: number, patch: Partial<{ label: string; amount: string }>) {
    setItems((its) => its.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((its) => [...its, { label: '', amount: '' }]);
  }
  function removeItem(idx: number) {
    setItems((its) => its.filter((_, i) => i !== idx));
  }

  const totalNum = items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);
  const paidNow = paymentStatus === 'full' ? totalNum : paymentStatus === 'partial' ? parseFloat(advance) || 0 : 0;
  const remaining = totalNum ? Math.max(0, totalNum - paidNow) : 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await customersApi.store({ name: cName.trim(), phone: cPhone.trim(), address: cAddress.trim() || null });
      const customerId = res.data.id;

      await customersApi.upsertMeasurement(customerId, templateKey, fields, notes.trim() || null);

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
        customer_id: customerId,
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
      toast.success(`Order ${order.order_no} created`);
      // A new order touches orders, dashboard KPIs, the customer it was
      // created/updated for, and the assigned karigar's workload.
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['karigars'] });
      navigate(`/orders?q=${encodeURIComponent(order.order_no)}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSave() {
    if (!cName.trim() || !cPhone.trim()) {
      toast.error('Customer name and phone are required');
      return;
    }
    const incompleteItem = items.find((it) => (it.label.trim() && !(parseFloat(it.amount) > 0)) || (!it.label.trim() && it.amount.trim()));
    if (incompleteItem) {
      toast.error('Every item needs both a name and an amount');
      return;
    }
    if (!totalNum || totalNum <= 0) {
      toast.error('Add at least one item with an amount');
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
    saveMutation.mutate();
  }

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">NEW ORDER</div>
          <div className="hero-date">Fill in customer, measurements and style details</div>
        </div>
      </div>
      <StitchDivider />

      <div className="form-section">
        <div className="form-section-title"><span className="num">↻</span>Existing Customer?</div>
        <div className="form-grid cols-2" style={{ marginTop: 14 }}>
          <div className="field span-2" style={{ position: 'relative' }}>
            <label>Search by name, phone, or customer ID</label>
            <input
              type="text"
              placeholder="Start typing to find a repeat customer..."
              value={custSearch}
              onChange={(e) => setCustSearch(e.target.value)}
            />
            {custSearch.trim() && repeatCustomerId === null && (
              <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, marginTop: 6 }}>
                {(custResultsRes?.data.length ?? 0) === 0 ? (
                  <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-faint)' }}>No matching customers — fill in the details below for a new customer.</div>
                ) : (
                  custResultsRes!.data.map((c) => (
                    <div key={c.id} style={{ padding: '10px 12px', fontSize: 12.5, cursor: 'pointer', borderBottom: '1px solid var(--border)' }} onClick={() => setRepeatCustomerId(c.id)}>
                      <b>{c.name}</b> <span style={{ color: 'var(--text-faint)' }}>{c.customer_id} · {c.phone}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">1</span>Customer Details</div>
        <div className="form-grid">
          <div className="field"><label>Full Name</label><input type="text" placeholder="e.g. Ahmad Khan" value={cName} onChange={(e) => setCName(e.target.value)} /></div>
          <div className="field"><label>Phone</label><input type="text" placeholder="+92 3xx xxxxxxx" value={cPhone} onChange={(e) => setCPhone(e.target.value)} /></div>
          <div className="field mono"><label>Customer ID</label><input type="text" value="Auto-generated on save" disabled /></div>
          <div className="field span-3"><label>Address</label><input type="text" placeholder="Street, area, city" value={cAddress} onChange={(e) => setCAddress(e.target.value)} /></div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">2</span>Measurements</div>
        <div className="form-grid cols-2">
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
          <div style={{ marginTop: 16 }}>
            <MeasurementFieldsForm template={template} fields={fields} onFieldChange={(key, value) => setFields((f) => ({ ...f, [key]: value }))} />
          </div>
        )}
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">3</span>Style Customization</div>
        {hasStyleFields ? (
          <StyleCustomizationFields
            templateKey={templateKey}
            styleValues={styleValues}
            onStyleChange={setStyleField}
            customFields={customStyleFields}
            onCustomFieldsChange={setCustomStyleFields}
          />
        ) : (
          <p style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 10 }}>
            Style customization options are defined for Shalwar Qameez and Waistcoat orders.
          </p>
        )}
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">4</span>Notes</div>
        <div className="form-grid" style={{ marginTop: 14 }}>
          <div className="field span-3">
            <textarea
              className="notes-big"
              placeholder="Fit preferences, special instructions, style notes — anything the karigar bill should carry..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">5</span>Reference Photos</div>
        <div style={{ marginTop: 14 }}>
          <label
            className={`photo-drop${dragOver ? ' dragover' : ''}`}
            htmlFor="photoInput"
            tabIndex={0}
            onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.getElementById('photoInput')?.click();
              }
            }}
          >
            <div className="photo-drop-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <rect x={3} y={3} width={18} height={18} rx={2} />
                <circle cx={8.5} cy={8.5} r={1.5} />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <div className="photo-drop-text">Click to upload or drag &amp; drop</div>
            <div className="photo-drop-hint">Fabric samples or design references · PNG, JPG · multiple allowed</div>
          </label>
          <input
            id="photoInput"
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="photo-count">{photos.length ? `${photos.length} photo${photos.length === 1 ? '' : 's'} attached` : ''}</div>
          <div className="photo-thumbs">
            {photoUrls.map((url, i) => (
              <div key={i} className="photo-thumb">
                <img src={url} alt="" />
                <button className="rm" type="button" onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}>&times;</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">6</span>Assign &amp; Deadline</div>
        <div className="form-grid">
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
          <div className="field span-3">
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
                    placeholder="Amount (Rs)"
                    className="mono"
                    value={it.amount}
                    onChange={(e) => updateItem(idx, { amount: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  {items.length > 1 && (
                    <button type="button" className="row-icon-btn" title="Remove item" onClick={() => removeItem(idx)}>&minus;</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <Button type="button" variant="outline" sm onClick={addItem}>+ Add Item</Button>
            </div>
          </div>
          <div className="field"><label>Order Total (Rs)</label><input type="text" className="mono" value={totalNum ? formatCurrency(totalNum) : ''} disabled /></div>
          <div className="field">
            <label>Payment Status</label>
            <Dropdown value={paymentStatus} onChange={(v) => setPaymentStatus(v as PaymentStatus)} options={PAYMENT_STATUS_OPTIONS} />
            <div className="hint">Most customers pay on delivery — "No Payment Yet" is fine for now.</div>
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
          <div className="field"><label>Remaining Balance (Rs)</label><input type="text" className="mono" value={totalNum ? formatCurrency(remaining) : ''} disabled /></div>
        </div>
      </div>

      <div className="hero-actions" style={{ justifyContent: 'flex-end', marginBottom: 40 }}>
        <Button variant="outline" onClick={() => navigate('/orders')}>Cancel</Button>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save Order'}</Button>
      </div>

      <RepeatOrderModal
        customerId={repeatCustomerId}
        onClose={closeRepeatOrder}
        onCreated={(order) => navigate(`/orders?q=${encodeURIComponent(order.order_no)}`)}
      />
    </>
  );
}
