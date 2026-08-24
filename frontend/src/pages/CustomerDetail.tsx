import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { customersApi } from '@/api/customers';
import { settingsApi } from '@/api/settings';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { MeasurementBlock } from '@/components/measurements/MeasurementBlock';
import { MeasurementFieldsForm } from '@/components/measurements/MeasurementFieldsForm';
import { OrderCardModal } from '@/components/orders/OrderCardModal';
import { CustomerBillModal } from '@/components/orders/CustomerBillModal';
import { KarigarBillModal } from '@/components/orders/KarigarBillModal';
import { AddPaymentModal } from '@/components/payments/AddPaymentModal';
import { EDIT_ICON, PAYMENT_ICON, CUSTOMER_BILL_ICON, KARIGAR_BILL_ICON } from '@/lib/garmentIcons';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/format';

export default function CustomerDetail() {
  const { id } = useParams();
  const customerId = Number(id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', customerId],
    queryFn: () => customersApi.show(customerId),
    staleTime: 15 * 60_000,
  });
  const { data: templatesRes } = useQuery({ queryKey: ['templates'], queryFn: () => settingsApi.getTemplates() });

  const [contactEditing, setContactEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string | string[]>>({});
  const [editNotes, setEditNotes] = useState('');
  const [cardOrderId, setCardOrderId] = useState<number | null>(null);
  const [payOrderId, setPayOrderId] = useState<number | null>(null);
  const [customerBillOrderId, setCustomerBillOrderId] = useState<number | null>(null);
  const [karigarBillOrderId, setKarigarBillOrderId] = useState<number | null>(null);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['customers', customerId] });
  }

  const contactMutation = useMutation({
    mutationFn: () => customersApi.update(customerId, { name: editName.trim(), phone: editPhone.trim(), address: editAddress.trim() || null }),
    onSuccess: () => {
      toast.success('Customer profile updated');
      setContactEditing(false);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const measurementMutation = useMutation({
    mutationFn: () => customersApi.upsertMeasurement(customerId, editingTemplate as string, editFields, editNotes.trim() || null),
    onSuccess: () => {
      toast.success('Measurements updated');
      setEditingTemplate(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => customersApi.destroy(customerId),
    onSuccess: () => {
      toast.success('Customer deleted');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleDelete() {
    if (window.confirm('Delete this customer? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  }

  if (isLoading) return <p style={{ color: 'var(--text-faint)' }}>Loading customer…</p>;
  if (error || !data) return <EmptyState title="Customer not found" subtitle="It may have been removed." />;

  const { customer, measurements, orders } = data.data;
  const totalSpent = orders.reduce((s, o) => s + Number(o.paid_amount ?? 0), 0);
  const totalPending = orders.reduce((s, o) => s + Math.max(0, Number(o.total_amount) - Number(o.paid_amount ?? 0)), 0);

  function startEditContact() {
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditAddress(customer.address || '');
    setContactEditing(true);
  }

  function startEditMeasurement(templateKey: string, fields: Record<string, string | string[]>, notes: string | null) {
    setEditingTemplate(templateKey);
    setEditFields(fields);
    setEditNotes(notes || '');
  }

  function handleWhatsAppSummary() {
    let text = `Measurement Summary — ${customer.name} (${customer.customer_id})\n`;
    if (measurements.length === 0) {
      text += 'No measurements on file yet.';
    } else {
      measurements.forEach((m) => {
        const tpl = templatesRes?.data.find((t) => t.template_key === m.template_key);
        text += `\n${tpl?.label || m.template_key}:\n`;
        (tpl?.fields || []).forEach((f) => {
          text += `${f.label}: ${m.fields?.[f.key] || '—'}\n`;
        });
      });
    }
    text += '\n— Top Man Tailor';
    const digits = (customer.phone || '').replace(/[^\d]/g, '');
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, '_blank');
  }

  return (
    <>
      <div className="hero-row no-print">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">{customer.name.toUpperCase()}</div>
          <div className="hero-date">{customer.customer_id} · {customer.phone}</div>
        </div>
        <div className="hero-actions">
          <Link to={`/orders/new?customerId=${customer.id}`}><Button>+ New Order</Button></Link>
          <Button variant="outline" onClick={handleWhatsAppSummary}>WhatsApp Summary</Button>
          <Button variant="outline" onClick={() => window.print()}>Print</Button>
          <Button variant="outline" onClick={handleDelete} disabled={deleteMutation.isPending}>Delete</Button>
        </div>
      </div>
      <StitchDivider />

      <div className="print-area print-sheet">
        <div className="grid-2">
          <div>
            <div className="panel">
              <div className="panel-head">
                <h3>Contact Info</h3>
                {!contactEditing && (
                  <button className="row-icon-btn no-print" title="Edit contact info" onClick={startEditContact}>{EDIT_ICON}</button>
                )}
              </div>
              <div className="form-grid cols-2" style={{ marginTop: 12 }}>
                <div className="field"><label>Full Name</label><input type="text" value={contactEditing ? editName : customer.name} disabled={!contactEditing} onChange={(e) => setEditName(e.target.value)} /></div>
                <div className="field"><label>Phone</label><input type="text" value={contactEditing ? editPhone : customer.phone} disabled={!contactEditing} onChange={(e) => setEditPhone(e.target.value)} /></div>
                <div className="field span-2"><label>Address</label><input type="text" value={contactEditing ? editAddress : (customer.address || '—')} disabled={!contactEditing} onChange={(e) => setEditAddress(e.target.value)} /></div>
                <div className="field"><label>Customer ID</label><input type="text" className="mono" value={customer.customer_id} disabled /></div>
                <div className="field"><label>Customer Since</label><input type="text" value={formatDate(customer.created_at)} disabled /></div>
              </div>
              {contactEditing && (
                <div className="hero-actions no-print" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                  <Button variant="outline" sm onClick={() => setContactEditing(false)}>Cancel</Button>
                  <Button sm onClick={() => contactMutation.mutate()} disabled={contactMutation.isPending}>Save Changes</Button>
                </div>
              )}
            </div>

            <div className="panel panel-spacer">
              <div className="panel-head"><h3>Measurements</h3></div>
              {measurements.length === 0 ? (
                <EmptyState title="No measurements saved" subtitle="Measurements are captured when an order is created." />
              ) : (
                measurements.map((m) => {
                  const tpl = templatesRes?.data.find((t) => t.template_key === m.template_key);
                  if (!tpl) return null;
                  const isEditing = editingTemplate === m.template_key;
                  return (
                    <div key={m.template_key} style={{ marginBottom: 18 }}>
                      {isEditing ? (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{tpl.label}</div>
                          <MeasurementFieldsForm template={tpl} fields={editFields} onFieldChange={(key, value) => setEditFields((f) => ({ ...f, [key]: value }))} />
                          <div className="field" style={{ marginTop: 12 }}>
                            <label>Notes</label>
                            <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                          </div>
                          <div className="hero-actions no-print" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                            <Button variant="outline" sm onClick={() => setEditingTemplate(null)}>Cancel</Button>
                            <Button sm onClick={() => measurementMutation.mutate()} disabled={measurementMutation.isPending}>Save Measurements</Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Last updated {formatDate(m.updated_at)}</div>
                            <button className="row-icon-btn no-print" title={`Edit ${tpl.label} measurements`} onClick={() => startEditMeasurement(m.template_key, m.fields, m.notes)}>{EDIT_ICON}</button>
                          </div>
                          <MeasurementBlock template={tpl} fields={m.fields} notes={m.notes} />
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <div className="panel">
              <div className="panel-head"><h3>Summary</h3></div>
              <div className="oc-kv"><span>Total Spent</span><b className="mono">{formatCurrency(totalSpent)}</b></div>
              <div className="oc-kv"><span>Pending Balance</span><b className={`mono ${totalPending > 0 ? 'balance-pending' : 'balance-paid'}`}>{formatCurrency(totalPending)}</b></div>
              <div className="oc-kv"><span>Total Orders</span><b className="mono">{orders.length}</b></div>
            </div>

            <div className="panel panel-spacer">
              <div className="panel-head"><h3>Order History</h3></div>
              {orders.length === 0 ? (
                <EmptyState title="No orders yet" subtitle="Create the first order for this customer." />
              ) : (
                orders
                  .slice()
                  .sort((a, b) => new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime())
                  .map((o) => {
                    const paid = Number(o.paid_amount ?? 0);
                    const pending = Math.max(0, Number(o.total_amount) - paid);
                    return (
                      <div key={o.id} className="order-row clickable" onClick={() => setCardOrderId(o.id)}>
                        <div className="order-avatar mono">{o.order_no.replace('ORD-', '#')}</div>
                        <div className="order-info">
                          <div className="order-name">{formatCurrency(o.total_amount)} total</div>
                          <div className="order-meta">{o.karigar_name} · {pending > 0 ? `${formatCurrency(pending)} pending` : 'Paid in full'}</div>
                        </div>
                        <div className="order-deadline">Deadline<b>{formatDateShort(o.deadline)}</b></div>
                        <Badge status={o.status} />
                        <div className="row-actions">
                          <button className="row-icon-btn" title="Add payment" onClick={(e) => { e.stopPropagation(); setPayOrderId(o.id); }}>{PAYMENT_ICON}</button>
                          <button className="row-icon-btn" title="Customer Bill" onClick={(e) => { e.stopPropagation(); setCustomerBillOrderId(o.id); }}>{CUSTOMER_BILL_ICON}</button>
                          <button className="row-icon-btn" title="Karigar Bill" onClick={(e) => { e.stopPropagation(); setKarigarBillOrderId(o.id); }}>{KARIGAR_BILL_ICON}</button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>

      <OrderCardModal orderId={cardOrderId} onClose={() => setCardOrderId(null)} />
      <CustomerBillModal orderId={customerBillOrderId} onClose={() => setCustomerBillOrderId(null)} />
      <KarigarBillModal orderId={karigarBillOrderId} onClose={() => setKarigarBillOrderId(null)} />
      {payOrderId !== null && (
        <AddPaymentModal
          orderId={payOrderId}
          open={payOrderId !== null}
          onClose={() => setPayOrderId(null)}
          onSaved={() => {
            setPayOrderId(null);
            refresh();
          }}
        />
      )}
    </>
  );
}
