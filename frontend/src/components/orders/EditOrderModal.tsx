import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { DateInput } from '@/components/ui/DateInput';
import { ordersApi } from '@/api/orders';
import { karigarsApi } from '@/api/karigars';
import { toDateInputValue, formatCurrency } from '@/lib/format';
import { ORDER_STATUS_OPTIONS } from '@/lib/orderOptions';
import { STYLE_FIELDS, STYLE_FIELD_OPTIONS, parseCustomStyleFields } from '@/lib/styleFields';
import type { Order, OrderStatus } from '@/types';

interface EditOrderModalProps {
  order: Order;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditOrderModal({ order, open, onClose, onSaved }: EditOrderModalProps) {
  const [karigarId, setKarigarId] = useState(order.karigar_id);
  const [deadline, setDeadline] = useState(toDateInputValue(order.deadline));
  const [status, setStatus] = useState<OrderStatus>(order.status);

  const [items, setItems] = useState<{ label: string; amount: string }[]>(() =>
    order.items && order.items.length > 0
      ? order.items.map((it) => ({ label: it.label, amount: String(it.amount) }))
      : [{ label: 'Stitching Charges', amount: String(order.total_amount) }]
  );
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

  const isKameez = order.measurement_snapshot.template_key.startsWith('shalwar-kameez');
  const [styleValues, setStyleValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    STYLE_FIELDS.forEach((f) => {
      const v = order.style?.[f.key];
      if (v) init[f.key] = v;
    });
    return init;
  });
  function setStyleField(key: string, value: string) {
    setStyleValues((s) => ({ ...s, [key]: value }));
  }

  const [customStyleFields, setCustomStyleFields] = useState(() => parseCustomStyleFields(order.style?.custom_fields));
  const [addingCustomStyleField, setAddingCustomStyleField] = useState(false);
  const [newCustomStyleFieldLabel, setNewCustomStyleFieldLabel] = useState('');

  function addCustomStyleField() {
    const label = newCustomStyleFieldLabel.trim();
    if (!label) return;
    setCustomStyleFields((f) => [...f, { label, value: '' }]);
    setNewCustomStyleFieldLabel('');
    setAddingCustomStyleField(false);
  }
  function updateCustomStyleField(idx: number, value: string) {
    setCustomStyleFields((f) => f.map((cf, i) => (i === idx ? { ...cf, value } : cf)));
  }
  function removeCustomStyleField(idx: number) {
    setCustomStyleFields((f) => f.filter((_, i) => i !== idx));
  }

  const { data: karigarsRes } = useQuery({ queryKey: ['karigars'], queryFn: () => karigarsApi.index() });

  const mutation = useMutation({
    mutationFn: async () => {
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

      await ordersApi.update(order.id, {
        karigar_id: karigarId,
        deadline,
        status,
        total_amount: totalNum,
        items: orderItems,
        style,
      });
    },
    onSuccess: () => {
      toast.success('Order updated');
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSave() {
    const incompleteItem = items.find((it) => (it.label.trim() && !(parseFloat(it.amount) > 0)) || (!it.label.trim() && it.amount.trim()));
    if (incompleteItem) {
      toast.error('Every item needs both a name and an amount');
      return;
    }
    if (!totalNum || totalNum <= 0) {
      toast.error('Add at least one item with an amount');
      return;
    }
    if (!deadline) {
      toast.error('Please choose a deadline');
      return;
    }
    mutation.mutate();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Edit ${order.order_no}`}
      wide
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save Changes'}</Button>
        </>
      }
    >
      <div className="form-grid cols-2">
        <div className="field">
          <label>Karigar</label>
          <Dropdown
            value={String(karigarId)}
            onChange={(v) => setKarigarId(Number(v))}
            options={karigarsRes?.data.map((k) => ({ value: String(k.id), label: `${k.name} — ${k.speciality || ''}` })) || []}
          />
        </div>
        <div className="field">
          <label>Deadline</label>
          <DateInput value={deadline} onChange={setDeadline} />
        </div>
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
        <div className="field">
          <label>Order Total (Rs)</label>
          <input type="text" className="mono" value={totalNum ? formatCurrency(totalNum) : ''} disabled />
        </div>
      </div>

      {isKameez && (
        <div style={{ marginTop: 20 }}>
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
                      value={styleValues[f.key] || ''}
                      onChange={(e) => setStyleField(f.key, e.target.value)}
                    />
                  ) : (
                    <Dropdown
                      value={styleValues[f.key] || ''}
                      onChange={(v) => setStyleField(f.key, v)}
                      options={options}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {customStyleFields.length > 0 && (
            <div className="form-grid cols-2" style={{ marginTop: 14 }}>
              {customStyleFields.map((cf, idx) => (
                <div className="field freetext" key={idx}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{cf.label}</span>
                    <button type="button" className="row-icon-btn" title="Remove field" onClick={() => removeCustomStyleField(idx)}>&minus;</button>
                  </label>
                  <input type="text" value={cf.value} onChange={(e) => updateCustomStyleField(idx, e.target.value)} />
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            {addingCustomStyleField ? (
              <form onSubmit={(e) => { e.preventDefault(); addCustomStyleField(); }} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="text"
                  value={newCustomStyleFieldLabel}
                  onChange={(e) => setNewCustomStyleFieldLabel(e.target.value)}
                  placeholder="Field name, e.g. Special Request"
                  autoFocus
                  style={{ flex: 1, maxWidth: 260 }}
                />
                <button type="submit" className="row-icon-btn" title="Add field" disabled={!newCustomStyleFieldLabel.trim()}>+</button>
                <button type="button" className="row-icon-btn" title="Cancel" onClick={() => { setAddingCustomStyleField(false); setNewCustomStyleFieldLabel(''); }}>&times;</button>
              </form>
            ) : (
              <Button type="button" variant="outline" sm onClick={() => setAddingCustomStyleField(true)}>+ Add Custom Field</Button>
            )}
          </div>
        </div>
      )}

      <div className="hint" style={{ marginTop: 14 }}>Measurements and photos stay locked to what the karigar was given — start a new order if those need to change.</div>
    </Dialog>
  );
}
