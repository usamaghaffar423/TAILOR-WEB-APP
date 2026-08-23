import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { Button } from '@/components/ui/Button';
import { StyleChipPicker } from '@/components/garment/StyleChipPicker';
import { StyleOptionPicker } from '@/components/garment/StyleOptionPicker';
import { ColorPicker } from '@/components/garment/ColorPicker';
import { GarmentPreview } from '@/components/garment/GarmentPreview';
import { MeasurementFieldsForm } from '@/components/measurements/MeasurementFieldsForm';
import { customersApi } from '@/api/customers';
import { karigarsApi } from '@/api/karigars';
import { settingsApi } from '@/api/settings';
import { ordersApi } from '@/api/orders';
import { uploadsApi } from '@/api/uploads';
import { formatCurrency } from '@/lib/format';
import {
  SLEEVE_ICON, CUFF_ICON, COLLAR_ICON, NECK_ICON, LENGTH_ICON, FIT_ICON, recommendedFit,
  PLACKET_ICON, POCKET_ICON, POCKET_SHALWAR_ICON, REGIONAL_ICON, PUKHTOON_SHALWAR_ICON,
  PUNJABI_SHALWAR_ICON, MORI_ICON, WAIST_TYPE_ICON, DAMAN_ICON,
  POCKET_POSITION_OPTS, POCKET_DEPTH_OPTS,
} from '@/lib/garmentIcons';
import {
  SLEEVE_OPTS, CUFF_OPTS, COLLAR_OPTS, NECK_OPTS, LENGTH_OPTS, FIT_OPTS, PLACKET_OPTS, POCKET_OPTS,
  POCKET_SHALWAR_OPTS, REGIONAL_OPTS, PUKHTOON_SHALWAR_OPTS, PUNJABI_SHALWAR_OPTS, MORI_OPTS,
  WAIST_TYPE_OPTS, DAMAN_OPTS, FABRIC_OPTS,
  BUTTON_STYLE_OPTS, BUTTON_COUNT_OPTS, COLOR_OPTS,
} from '@/lib/styleOptions';
import { bilingual } from '@/lib/styleOptionsUrdu';
import type { Customer, OrderStatus, PaymentMethod } from '@/types';

type PaymentStatus = 'none' | 'partial' | 'full';

export default function NewOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data: templatesRes } = useQuery({ queryKey: ['templates'], queryFn: () => settingsApi.getTemplates() });
  const { data: karigarsRes } = useQuery({ queryKey: ['karigars'], queryFn: () => karigarsApi.index() });

  // ---- Customer ----
  const [custSearch, setCustSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cAddress, setCAddress] = useState('');
  const { data: custResultsRes } = useQuery({
    queryKey: ['customers', custSearch],
    queryFn: () => customersApi.index(custSearch),
    enabled: custSearch.trim().length > 0 && selectedCustomer === null,
  });

  const preCustomerId = searchParams.get('customerId');
  useEffect(() => {
    if (preCustomerId) {
      customersApi.show(Number(preCustomerId)).then((res) => selectCustomer(res.data.customer));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preCustomerId]);

  function selectCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setCName(customer.name);
    setCPhone(customer.phone);
    setCAddress(customer.address || '');
    setCustSearch(`${customer.name} (${customer.customer_id})`);
    customersApi.getMeasurements(customer.id).then((res) => {
      const latest = [...res.data].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
      if (latest) {
        setTemplateKey(latest.template_key);
        setFields(latest.fields);
        setNotes(latest.notes || '');
      }
    });
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
  const isKameez = templateKey.startsWith('shalwar-kameez');

  function handleTemplateChange(key: string) {
    setTemplateKey(key);
    setFields({});
  }

  // ---- Style ----
  const [region, setRegion] = useState<string>(REGIONAL_OPTS[0]);
  const [collar, setCollar] = useState(COLLAR_OPTS[0]);
  const [sleeve, setSleeve] = useState(SLEEVE_OPTS[0]);
  const [cuff, setCuff] = useState(CUFF_OPTS[0]);
  const [neck, setNeck] = useState(NECK_OPTS[0]);
  const [fit, setFit] = useState(recommendedFit(REGIONAL_OPTS[0]));
  const [fitTouched, setFitTouched] = useState(false);
  const [length, setLength] = useState(LENGTH_OPTS[0]);
  const [pukhtoonShalwar, setPukhtoonShalwar] = useState(PUKHTOON_SHALWAR_OPTS[0]);
  const [punjabiShalwar, setPunjabiShalwar] = useState(PUNJABI_SHALWAR_OPTS[0]);
  const [mori, setMori] = useState(MORI_OPTS[1]);
  const [waistType, setWaistType] = useState(WAIST_TYPE_OPTS[0]);
  const [placket, setPlacket] = useState(PLACKET_OPTS[0]);
  const [pocket, setPocket] = useState(POCKET_OPTS[0]);
  const [pocketShalwar, setPocketShalwar] = useState(POCKET_SHALWAR_OPTS[0]);
  const [pocketPosition, setPocketPosition] = useState('');
  const [pocketDepth, setPocketDepth] = useState('');
  const [daman, setDaman] = useState(DAMAN_OPTS[0]);
  const [fabric, setFabric] = useState(FABRIC_OPTS[0]);
  const [buttonStyle, setButtonStyle] = useState(BUTTON_STYLE_OPTS[0]);
  const [buttonCount, setButtonCount] = useState(BUTTON_COUNT_OPTS[0]);
  const [color, setColor] = useState(COLOR_OPTS[0].hex);

  function handleRegionChange(v: string) {
    setRegion(v);
    if (!fitTouched) setFit(recommendedFit(v));
  }
  function handleFitChange(v: string) {
    setFit(v);
    setFitTouched(true);
  }

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
  const [total, setTotal] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('none');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [advance, setAdvance] = useState('');

  const totalNum = parseFloat(total) || 0;
  const paidNow = paymentStatus === 'full' ? totalNum : paymentStatus === 'partial' ? parseFloat(advance) || 0 : 0;
  const remaining = totalNum ? Math.max(0, totalNum - paidNow) : 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      let customerId = selectedCustomer?.id;
      if (customerId) {
        await customersApi.update(customerId, { name: cName.trim(), phone: cPhone.trim(), address: cAddress.trim() || null });
      } else {
        const res = await customersApi.store({ name: cName.trim(), phone: cPhone.trim(), address: cAddress.trim() || null });
        customerId = res.data.id;
      }

      await customersApi.upsertMeasurement(customerId, templateKey, fields, notes.trim() || null);

      const style: Record<string, string> = {
        collar, sleeve, cuff, neck, placket, pocket, fabric, buttonStyle, buttonCount, color,
      };
      if (pocketPosition) style.pocketPosition = pocketPosition;
      if (pocketDepth) style.pocketDepth = pocketDepth;
      if (isKameez) {
        style.regionalStyle = region;
        style.fit = fit;
        style.length = length;
        style.shalwarStyle = region === 'Pukhtoon' ? pukhtoonShalwar : punjabiShalwar;
        style.pocketShalwar = pocketShalwar;
        style.daman = daman;
        if (region === 'Pukhtoon') {
          style.mori = mori;
          style.waistType = waistType;
        }
      }

      const orderRes = await ordersApi.store({
        customer_id: customerId,
        template_key: templateKey,
        style,
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
      navigate(`/orders?q=${encodeURIComponent(order.order_no)}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSave() {
    if (!cName.trim() || !cPhone.trim()) {
      toast.error('Customer name and phone are required');
      return;
    }
    if (!totalNum || totalNum <= 0) {
      toast.error('Enter a valid total order amount');
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
              onChange={(e) => {
                setCustSearch(e.target.value);
                setSelectedCustomer(null);
              }}
            />
            {custSearch.trim() && !selectedCustomer && (
              <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, marginTop: 6 }}>
                {(custResultsRes?.data.length ?? 0) === 0 ? (
                  <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-faint)' }}>No matching customers — this will be a new customer.</div>
                ) : (
                  custResultsRes!.data.map((c) => (
                    <div key={c.id} style={{ padding: '10px 12px', fontSize: 12.5, cursor: 'pointer', borderBottom: '1px solid var(--border)' }} onClick={() => selectCustomer(c)}>
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
          <div className="field mono"><label>Customer ID</label><input type="text" value={selectedCustomer?.customer_id || 'Auto-generated on save'} disabled /></div>
          <div className="field span-3"><label>Address</label><input type="text" placeholder="Street, area, city" value={cAddress} onChange={(e) => setCAddress(e.target.value)} /></div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">2</span>Measurements</div>
        <div className="form-grid cols-2">
          <div className="field span-2">
            <label>Garment Template</label>
            <select value={templateKey} onChange={(e) => handleTemplateChange(e.target.value)}>
              {templatesRes?.data.map((t) => <option key={t.template_key} value={t.template_key}>{t.label}</option>)}
            </select>
          </div>
        </div>
        {template && (
          <div style={{ marginTop: 16 }}>
            <MeasurementFieldsForm template={template} fields={fields} onFieldChange={(key, value) => setFields((f) => ({ ...f, [key]: value }))} />
          </div>
        )}
        <div className="form-grid cols-2" style={{ marginTop: 14 }}>
          <div className="field span-2"><label>Notes</label><textarea placeholder="Fit preferences, special instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">3</span>Style Customization</div>
        <div className="grid-2" style={{ marginTop: 16, alignItems: 'start' }}>
          <div>
            <div className="field"><label>Collar</label><StyleOptionPicker options={COLLAR_OPTS} iconMap={COLLAR_ICON} value={collar} onChange={setCollar} /></div>
            <div className="field" style={{ marginTop: 16 }}><label>Sleeve</label><StyleOptionPicker options={SLEEVE_OPTS} iconMap={SLEEVE_ICON} value={sleeve} onChange={setSleeve} /></div>
            <div className="field" style={{ marginTop: 16 }}><label>Cuff</label><StyleOptionPicker options={CUFF_OPTS} iconMap={CUFF_ICON} value={cuff} onChange={setCuff} /></div>

            {isKameez && (
              <>
                <div className="field" style={{ marginTop: 16 }}><label>Garment Style</label><StyleOptionPicker options={REGIONAL_OPTS} iconMap={REGIONAL_ICON} value={region} onChange={handleRegionChange} /></div>
                <div className="field" style={{ marginTop: 16 }}><label>Fit</label><StyleOptionPicker options={FIT_OPTS} iconMap={FIT_ICON} value={fit} onChange={handleFitChange} /></div>
                <div className="field" style={{ marginTop: 16 }}><label>Length</label><StyleOptionPicker options={LENGTH_OPTS} iconMap={LENGTH_ICON} value={length} onChange={setLength} /></div>
                {region === 'Pukhtoon' ? (
                  <div className="field" style={{ marginTop: 16 }}><label>Shalwar Style (Pukhtoon)</label><StyleOptionPicker options={PUKHTOON_SHALWAR_OPTS} iconMap={PUKHTOON_SHALWAR_ICON} value={pukhtoonShalwar} onChange={setPukhtoonShalwar} /></div>
                ) : (
                  <div className="field" style={{ marginTop: 16 }}><label>Shalwar Style (Punjabi)</label><StyleOptionPicker options={PUNJABI_SHALWAR_OPTS} iconMap={PUNJABI_SHALWAR_ICON} value={punjabiShalwar} onChange={setPunjabiShalwar} /></div>
                )}
                {region === 'Pukhtoon' && (
                  <div className="field" style={{ marginTop: 16 }}><label>Mori / Pauncha (Bottom Opening)</label><StyleOptionPicker options={MORI_OPTS} iconMap={MORI_ICON} value={mori} onChange={setMori} /></div>
                )}
                <div className="field" style={{ marginTop: 16 }}><label>Daman / Hem Style</label><StyleOptionPicker options={DAMAN_OPTS} iconMap={DAMAN_ICON} value={daman} onChange={setDaman} /></div>
              </>
            )}

            <div className="field" style={{ marginTop: 16 }}>
              <label>Fabric Color</label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            <details className="adv-toggle">
              <summary>More Style Options</summary>
              <div className="adv-toggle-body">
                <div className="field"><label>Neck</label><StyleOptionPicker options={NECK_OPTS} iconMap={NECK_ICON} value={neck} onChange={setNeck} /></div>
                <div className="field" style={{ marginTop: 16 }}><label>Front Style</label><StyleOptionPicker options={PLACKET_OPTS} iconMap={PLACKET_ICON} value={placket} onChange={setPlacket} /></div>
                <div className="field" style={{ marginTop: 16 }}><label>Qameez Pocket</label><StyleOptionPicker options={POCKET_OPTS} iconMap={POCKET_ICON} value={pocket} onChange={setPocket} /></div>
                {isKameez && (
                  <>
                    <div className="field" style={{ marginTop: 16 }}><label>Shalwar Pocket</label><StyleOptionPicker options={POCKET_SHALWAR_OPTS} iconMap={POCKET_SHALWAR_ICON} value={pocketShalwar} onChange={setPocketShalwar} /></div>
                    {region === 'Pukhtoon' && (
                      <div className="field" style={{ marginTop: 16 }}><label>Waist Type (Pukhtoon)</label><StyleOptionPicker options={WAIST_TYPE_OPTS} iconMap={WAIST_TYPE_ICON} value={waistType} onChange={setWaistType} /></div>
                    )}
                  </>
                )}
                <div className="form-grid cols-2" style={{ marginTop: 16 }}>
                  <div className="field"><label>Pocket Position</label><StyleChipPicker options={POCKET_POSITION_OPTS} value={pocketPosition} onChange={setPocketPosition} /></div>
                  <div className="field"><label>Pocket Depth</label><StyleChipPicker options={POCKET_DEPTH_OPTS} value={pocketDepth} onChange={setPocketDepth} /></div>
                </div>
                <div className="form-grid cols-2" style={{ marginTop: 16 }}>
                  <div className="field"><label>Fabric</label><select value={fabric} onChange={(e) => setFabric(e.target.value)}>{FABRIC_OPTS.map((o) => <option key={o} value={o}>{bilingual(o)}</option>)}</select></div>
                  <div className="field"><label>Button Style</label><select value={buttonStyle} onChange={(e) => setButtonStyle(e.target.value)}>{BUTTON_STYLE_OPTS.map((o) => <option key={o} value={o}>{bilingual(o)}</option>)}</select></div>
                  <div className="field"><label>Button Count</label><select value={buttonCount} onChange={(e) => setButtonCount(e.target.value)}>{BUTTON_COUNT_OPTS.map((o) => <option key={o} value={o}>{bilingual(o)}</option>)}</select></div>
                </div>
              </div>
            </details>
          </div>
          <div className="panel" style={{ background: 'var(--surface-2)', position: 'sticky', top: 90 }}>
            <div className="preview-panel">
              <GarmentPreview templateKey={templateKey} templateLabel={template?.label || templateKey} color={color} />
            </div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">4</span>Reference Photos</div>
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
        <div className="form-section-title"><span className="num">5</span>Assign &amp; Deadline</div>
        <div className="form-grid">
          <div className="field">
            <label>Karigar</label>
            <select value={karigarId} onChange={(e) => setKarigarId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Select karigar…</option>
              {karigarsRes?.data.map((k) => <option key={k.id} value={k.id}>{k.name} — {k.speciality || ''}</option>)}
            </select>
          </div>
          <div className="field"><label>Deadline</label><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
          <div className="field">
            <label>Order Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
              <option value="progress">In Progress</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          <div className="field"><label>Total Order Amount (Rs)</label><input type="number" min={0} placeholder="e.g. 4500" value={total} onChange={(e) => setTotal(e.target.value)} /></div>
          <div className="field">
            <label>Payment Status</label>
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}>
              <option value="none">No Payment Yet</option>
              <option value="partial">Partial Payment (Advance)</option>
              <option value="full">Paid in Full</option>
            </select>
            <div className="hint">Most customers pay on delivery — "No Payment Yet" is fine for now.</div>
          </div>
          {paymentStatus !== 'none' && (
            <div className="field">
              <label>Payment Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                <option value="cash">Cash</option>
                <option value="easypaisa">Easypaisa</option>
                <option value="jazzcash">JazzCash</option>
                <option value="bank">Bank</option>
              </select>
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
    </>
  );
}
