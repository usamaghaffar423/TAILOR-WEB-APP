import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { DateInput } from '@/components/ui/DateInput';
import { MeasurementFieldsForm } from '@/components/measurements/MeasurementFieldsForm';
import { customersApi } from '@/api/customers';
import { karigarsApi } from '@/api/karigars';
import { settingsApi } from '@/api/settings';
import { formatCurrency } from '@/lib/format';
import { STYLE_FIELDS, STYLE_FIELD_OPTIONS } from '@/lib/styleFields';
import { PAYMENT_METHOD_OPTIONS } from '@/lib/orderOptions';
import { useRetailProducts } from '@/features/retail/hooks/useRetailProducts';
import { salesApi } from '../api/sales';
import type { SaleItemPayload } from '../api/sales';
import { SaleReceiptModal } from '../components/SaleReceiptModal';
import type { Customer, PaymentMethod } from '@/types';
import type { RetailProduct, RetailProductVariant } from '@/features/retail/types';
import type { Sale } from '../types';

type PaymentStatus = 'none' | 'partial' | 'full';

interface CartLine {
  uid: string;
  variant: (RetailProductVariant & { product: RetailProduct }) | null;
  label: string;
  qty: number;
  unitPrice: string;
  needsStitching: boolean;
  templateKey: string;
  fields: Record<string, string | string[]>;
  notes: string;
  styleValues: Record<string, string>;
  customStyleFields: { label: string; value: string }[];
  karigarId: number | '';
  deadline: string;
  recipientName: string;
}

function makeLine(stitched: boolean): CartLine {
  return {
    uid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    variant: null,
    label: stitched ? 'Stitching Charges' : '',
    qty: 1,
    unitPrice: '',
    needsStitching: stitched,
    templateKey: '',
    fields: {},
    notes: '',
    styleValues: {},
    customStyleFields: [],
    karigarId: '',
    deadline: '',
    recipientName: '',
  };
}

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function NewSalePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preStitched = searchParams.get('stitched') !== '0'; // /orders/new pre-enables it, /retail/pos doesn't

  const { data: templatesRes } = useQuery({ queryKey: ['templates'], queryFn: () => settingsApi.getTemplates() });
  const { data: karigarsRes } = useQuery({ queryKey: ['karigars'], queryFn: () => karigarsApi.index() });
  const { data: retailProductsRes } = useRetailProducts();

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
  }

  function clearCustomer() {
    setSelectedCustomer(null);
    setCName('');
    setCPhone('');
    setCAddress('');
    setCustSearch('');
  }

  // ---- Product search (retail catalog) ----
  const [productQuery, setProductQuery] = useState('');
  const debouncedProductQuery = useDebounced(productQuery, 300);
  const products = retailProductsRes?.data || [];
  const productResults = useMemo(() => {
    if (debouncedProductQuery.trim().length < 2) return [];
    const q = debouncedProductQuery.trim().toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));
  }, [products, debouncedProductQuery]);

  // ---- Cart lines ----
  const [lines, setLines] = useState<CartLine[]>([makeLine(preStitched)]);

  function updateLine(uid: string, patch: Partial<CartLine>) {
    setLines((ls) => ls.map((l) => (l.uid === uid ? { ...l, ...patch } : l)));
  }
  function addPlainLine() {
    setLines((ls) => [...ls, makeLine(false)]);
  }
  function addStitchedLine() {
    setLines((ls) => [...ls, makeLine(true)]);
  }
  function removeLine(uid: string) {
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.uid !== uid) : ls));
  }

  function addProductToCart(product: RetailProduct, variant: RetailProductVariant) {
    const stock = variant.inventory?.quantity_in_stock ?? 0;
    const fullVariant = { ...variant, product };
    setLines((ls) => {
      const existing = ls.find((l) => l.variant?.id === variant.id && !l.needsStitching);
      if (existing) {
        const nextQty = existing.qty + 1;
        if (nextQty > stock) {
          toast.error('No more stock available for this variant.');
          return ls;
        }
        return ls.map((l) => (l.uid === existing.uid ? { ...l, qty: nextQty } : l));
      }
      if (stock < 1) {
        toast.error('No stock available for this variant.');
        return ls;
      }
      const blank = ls.find((l) => !l.needsStitching && !l.variant && !l.label.trim());
      const newLine: CartLine = {
        ...(blank || makeLine(false)),
        variant: fullVariant,
        label: `${product.name}${[variant.size, variant.color].filter(Boolean).length ? ` (${[variant.size, variant.color].filter(Boolean).join('/')})` : ''}`,
        qty: 1,
        unitPrice: String(product.sale_price),
      };
      return blank ? ls.map((l) => (l.uid === blank.uid ? newLine : l)) : [...ls, newLine];
    });
  }

  // Auto-load a customer's saved measurement once a stitched line's
  // template is chosen — mirrors New Order's existing "select customer ->
  // prefill measurements" convenience, scoped per-line since each line can
  // use a different garment template.
  function onTemplateChange(uid: string, templateKey: string) {
    updateLine(uid, { templateKey, fields: {}, notes: '' });
    if (selectedCustomer) {
      customersApi.getMeasurements(selectedCustomer.id).then((res) => {
        const match = res.data.find((m) => m.template_key === templateKey);
        if (match) {
          updateLine(uid, { fields: match.fields, notes: match.notes || '' });
        }
      });
    }
  }

  // ---- Payment ----
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('none');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [advance, setAdvance] = useState('');

  const totalNum = lines.reduce((sum, l) => sum + l.qty * (parseFloat(l.unitPrice) || 0), 0);
  const paidNow = paymentStatus === 'full' ? totalNum : paymentStatus === 'partial' ? parseFloat(advance) || 0 : 0;
  const remaining = totalNum ? Math.max(0, totalNum - paidNow) : 0;
  const hasStitchedLine = lines.some((l) => l.needsStitching);

  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let customerId = selectedCustomer?.id;
      if (cName.trim() && cPhone.trim()) {
        if (customerId) {
          await customersApi.update(customerId, { name: cName.trim(), phone: cPhone.trim(), address: cAddress.trim() || null });
        } else {
          const res = await customersApi.store({ name: cName.trim(), phone: cPhone.trim(), address: cAddress.trim() || null });
          customerId = res.data.id;
        }
      }

      // Measurements live on the customer, not the sale — same as the
      // legacy Order Studio flow. Save each stitched line's fields before
      // creating the sale, so the backend's snapshot picks up what was just
      // entered here.
      for (const line of lines) {
        if (line.needsStitching && customerId && line.templateKey) {
          await customersApi.upsertMeasurement(customerId, line.templateKey, line.fields, line.notes.trim() || null);
        }
      }

      const items: SaleItemPayload[] = lines.map((line) => {
        const item: SaleItemPayload = {
          label: line.label.trim(),
          qty: line.qty,
          unit_price: parseFloat(line.unitPrice) || 0,
        };
        if (line.variant) item.retail_product_variant_id = line.variant.id;
        if (line.recipientName.trim()) item.recipient_name = line.recipientName.trim();
        if (line.needsStitching) {
          item.needs_stitching = true;
          item.template_key = line.templateKey;
          item.karigar_id = line.karigarId as number;
          item.deadline = line.deadline;

          const style: Record<string, string> = {};
          STYLE_FIELDS.forEach((f) => {
            const v = line.styleValues[f.key];
            if (v) style[f.key] = v;
          });
          const filledCustomFields = line.customStyleFields.filter((f) => f.value.trim());
          if (filledCustomFields.length > 0) {
            style.custom_fields = JSON.stringify(filledCustomFields);
          }
          item.style = style;
        }
        return item;
      });

      const res = await salesApi.store({
        customer_id: customerId,
        items,
        ...(paidNow > 0 ? { advance_amount: paidNow, advance_method: method } : {}),
      });
      return res.data;
    },
    onSuccess: (sale) => {
      toast.success(`Sale ${sale.sale_no || `#${sale.id}`} created`);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['karigars'] });
      queryClient.invalidateQueries({ queryKey: ['retail-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['retail-products'] });
      queryClient.invalidateQueries({ queryKey: ['retail-dashboard'] });
      setCompletedSale(sale);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function resetForm() {
    setCompletedSale(null);
    clearCustomer();
    setLines([makeLine(preStitched)]);
    setPaymentStatus('none');
    setMethod('cash');
    setAdvance('');
    setProductQuery('');
  }

  function handleSave() {
    if (lines.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    const incomplete = lines.find((l) => !l.label.trim() || !l.qty || !(parseFloat(l.unitPrice) > 0));
    if (incomplete) {
      toast.error('Every line needs a name, quantity, and a price above 0');
      return;
    }
    if (hasStitchedLine && !(cName.trim() && cPhone.trim())) {
      toast.error('A customer is required for any item that needs stitching');
      return;
    }
    const badStitch = lines.find((l) => l.needsStitching && (!l.templateKey || !l.karigarId || !l.deadline));
    if (badStitch) {
      toast.error('Every stitched item needs a garment template, karigar, and deadline');
      return;
    }
    if (paymentStatus === 'partial' && (!paidNow || paidNow <= 0)) {
      toast.error('Enter the amount paid, or switch to "No Payment Yet"');
      return;
    }
    if (paidNow > totalNum) {
      toast.error("Amount paid can't exceed the total");
      return;
    }
    saveMutation.mutate();
  }

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">NEW SALE</div>
          <div className="hero-date">Any item can optionally need stitching — one cart, one bill</div>
        </div>
      </div>
      <StitchDivider />

      <div className="form-section">
        <div className="form-section-title"><span className="num">1</span>Customer{hasStitchedLine ? ' (required — a stitched item needs someone to hand it to)' : ' (optional for walk-in retail)'}</div>
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
          <div className="field"><label>Full Name</label><input type="text" placeholder="e.g. Ahmad Khan" value={cName} onChange={(e) => setCName(e.target.value)} /></div>
          <div className="field"><label>Phone</label><input type="text" placeholder="+92 3xx xxxxxxx" value={cPhone} onChange={(e) => setCPhone(e.target.value)} /></div>
          <div className="field span-2"><label>Address</label><input type="text" placeholder="Street, area, city" value={cAddress} onChange={(e) => setCAddress(e.target.value)} /></div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">2</span>Add Retail Item</div>
        <div style={{ marginTop: 14, position: 'relative' }}>
          <input
            type="text"
            placeholder="Search products by name…"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
          />
          {debouncedProductQuery.trim().length >= 2 && (
            productResults.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>No products found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                {productResults.map((product) => (
                  <div key={product.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <b style={{ fontSize: 13 }}>{product.name}</b>
                      <span className="cell-mono" style={{ fontSize: 12.5 }}>{formatCurrency(product.sale_price)}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {product.variants.map((v) => {
                        const stock = v.inventory?.quantity_in_stock ?? 0;
                        const disabled = stock <= 0;
                        const label = [v.size, v.color].filter(Boolean).join(' / ') || `#${v.id}`;
                        return (
                          <div
                            key={v.id}
                            className={`swatch-chip${disabled ? '' : ''}`}
                            style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : { cursor: 'pointer' }}
                            onClick={() => !disabled && addProductToCart(product, v)}
                          >
                            {label} ({stock})
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">3</span>Cart</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
          {lines.map((line, idx) => (
            <div key={line.uid} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <b style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>LINE {idx + 1}{line.variant ? ' · RETAIL ITEM' : ''}</b>
                {lines.length > 1 && (
                  <button type="button" className="row-icon-btn" title="Remove line" onClick={() => removeLine(line.uid)}>&minus;</button>
                )}
              </div>

              <div className="form-grid cols-4">
                <div className="field span-2">
                  <label>Item / Charge Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Stitching Charges, Fabric / Kapra"
                    value={line.label}
                    disabled={!!line.variant}
                    onChange={(e) => updateLine(line.uid, { label: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Qty</label>
                  <input
                    type="number"
                    min={1}
                    max={line.variant?.inventory?.quantity_in_stock ?? undefined}
                    value={line.qty}
                    onChange={(e) => updateLine(line.uid, { qty: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </div>
                <div className="field">
                  <label>Unit Price (Rs)</label>
                  <input
                    type="number"
                    min={0}
                    className="mono"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(line.uid, { unitPrice: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <label className="swatch-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={line.needsStitching}
                    onChange={(e) => updateLine(line.uid, { needsStitching: e.target.checked, label: e.target.checked && !line.label.trim() ? 'Stitching Charges' : line.label })}
                    style={{ margin: 0 }}
                  />
                  Needs Stitching?
                </label>
              </div>

              {line.needsStitching && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--border-strong)' }}>
                  <div className="form-grid cols-2">
                    <div className="field">
                      <label>Recipient (optional)</label>
                      <input type="text" placeholder="e.g. for my father" value={line.recipientName} onChange={(e) => updateLine(line.uid, { recipientName: e.target.value })} />
                    </div>
                    <div className="field">
                      <label>Garment Template</label>
                      <Dropdown
                        value={line.templateKey}
                        onChange={(v) => onTemplateChange(line.uid, v)}
                        options={templatesRes?.data.map((t) => ({ value: t.template_key, label: t.label })) || []}
                      />
                    </div>
                  </div>

                  {line.templateKey && (
                    <div style={{ marginTop: 14 }}>
                      {(() => {
                        const template = templatesRes?.data.find((t) => t.template_key === line.templateKey) || null;
                        return template ? (
                          <MeasurementFieldsForm
                            template={template}
                            fields={line.fields}
                            onFieldChange={(key, value) => updateLine(line.uid, { fields: { ...line.fields, [key]: value } })}
                          />
                        ) : null;
                      })()}
                    </div>
                  )}

                  <div className="form-grid cols-2" style={{ marginTop: 14 }}>
                    <div className="field span-2"><label>Notes</label><textarea placeholder="Fit preferences, special instructions..." value={line.notes} onChange={(e) => updateLine(line.uid, { notes: e.target.value })} /></div>
                  </div>

                  {line.templateKey.startsWith('shalwar-kameez') && (
                    <div style={{ marginTop: 16 }}>
                      <div className="oc-section-title">Style Customization</div>
                      <div className="form-grid cols-2" style={{ marginTop: 12 }}>
                        {STYLE_FIELDS.map((f) => {
                          const options = STYLE_FIELD_OPTIONS[f.key] || [];
                          return (
                            <div className={`field${f.freeText ? ' freetext' : ''}`} key={f.key}>
                              <label>{f.label}</label>
                              {f.freeText ? (
                                <input
                                  type="text"
                                  value={line.styleValues[f.key] || ''}
                                  onChange={(e) => updateLine(line.uid, { styleValues: { ...line.styleValues, [f.key]: e.target.value } })}
                                />
                              ) : (
                                <Dropdown
                                  value={line.styleValues[f.key] || ''}
                                  onChange={(v) => updateLine(line.uid, { styleValues: { ...line.styleValues, [f.key]: v } })}
                                  options={options}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="form-grid cols-2" style={{ marginTop: 16 }}>
                    <div className="field">
                      <label>Karigar</label>
                      <Dropdown
                        value={line.karigarId === '' ? '' : String(line.karigarId)}
                        onChange={(v) => updateLine(line.uid, { karigarId: v ? Number(v) : '' })}
                        placeholder="Select karigar…"
                        options={karigarsRes?.data.map((k) => ({ value: String(k.id), label: `${k.name} — ${k.speciality || ''}` })) || []}
                      />
                    </div>
                    <div className="field">
                      <label>Deadline</label>
                      <DateInput value={line.deadline} onChange={(v) => updateLine(line.uid, { deadline: v })} />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 12, textAlign: 'right', fontSize: 13 }}>
                Line Total: <b className="mono">{formatCurrency(line.qty * (parseFloat(line.unitPrice) || 0))}</b>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <Button type="button" variant="outline" sm onClick={addPlainLine}>+ Add Item</Button>
          <Button type="button" variant="outline" sm onClick={addStitchedLine}>+ Add Stitched Item</Button>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">4</span>Payment</div>
        <div className="form-grid" style={{ marginTop: 14 }}>
          <div className="field"><label>Order Total (Rs)</label><input type="text" className="mono" value={totalNum ? formatCurrency(totalNum) : ''} disabled /></div>
          <div className="field">
            <label>Payment Status</label>
            <Dropdown
              value={paymentStatus}
              onChange={(v) => setPaymentStatus(v as PaymentStatus)}
              options={[
                { value: 'none', label: 'No Payment Yet' },
                { value: 'partial', label: 'Partial Payment (Advance)' },
                { value: 'full', label: 'Paid in Full' },
              ]}
            />
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
        <Button variant="outline" onClick={() => navigate('/')}>Cancel</Button>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Confirm Sale'}</Button>
      </div>

      <SaleReceiptModal sale={completedSale} onClose={resetForm} />
    </>
  );
}
