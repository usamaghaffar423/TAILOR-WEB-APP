import type { Order, MeasurementTemplate, Customer, Karigar } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { STATUS_LABEL } from '@/components/ui/Badge';
import { STYLE_FIELDS } from '@/lib/styleFields';

export function buildOrderWhatsAppText(
  order: Order,
  customer: Customer | undefined,
  template: MeasurementTemplate | null,
  paid: number,
  audience: 'karigar' | 'customer'
): string {
  const style = order.style || {};
  const total = Number(order.total_amount);
  const pending = Math.max(0, total - paid);
  const meas = order.measurement_snapshot;

  const lines: string[] = [];
  if (audience === 'karigar') {
    lines.push(`*New Order Assigned — ${order.order_no}*`);
    lines.push(`Customer: ${customer ? customer.name : '—'} (${customer ? customer.phone : '—'})`);
  } else {
    lines.push(`*Order Confirmation — ${order.order_no}*`);
    lines.push('Top Man Tailor');
  }
  lines.push(`Garment: ${template ? template.label : '—'}`);
  lines.push(`Deadline: ${formatDate(order.deadline)}`);
  lines.push(`Status: ${STATUS_LABEL[order.status]}`);
  lines.push('');

  if (meas && template) {
    lines.push('MEASUREMENTS');
    template.fields.forEach((f) => lines.push(`${f.label}: ${meas.fields?.[f.key] || '—'}`));
    if (meas.notes) lines.push(`Notes: ${meas.notes}`);
    lines.push('');
  }

  const styleParts = STYLE_FIELDS
    .filter((f) => style[f.key])
    .map((f) => `${f.label}: ${style[f.key]}`);
  if (styleParts.length) {
    lines.push('STYLE');
    lines.push(...styleParts);
    lines.push('');
  }

  if (audience === 'karigar') {
    lines.push('Assigned by: Top Man Tailor (shop owner)');
  } else {
    lines.push(`Total: ${formatCurrency(total)} | Paid: ${formatCurrency(paid)} | Balance: ${pending > 0 ? formatCurrency(pending) : 'Paid in full'}`);
    lines.push('');
    lines.push('— Top Man Tailor');
  }
  return lines.join('\n');
}

export function sendOrderWhatsApp(
  order: Order,
  customer: Customer | undefined,
  karigar: Karigar | undefined,
  template: MeasurementTemplate | null,
  paid: number,
  audience: 'karigar' | 'customer'
): { ok: true } | { ok: false; message: string } {
  const target = audience === 'karigar' ? karigar : customer;
  if (!target || !target.phone) {
    return { ok: false, message: `No phone number on file for ${audience === 'karigar' ? 'this karigar' : 'this customer'}` };
  }
  const text = buildOrderWhatsAppText(order, customer, template, paid, audience);
  const digits = target.phone.replace(/[^\d]/g, '');
  window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, '_blank');
  return { ok: true };
}
