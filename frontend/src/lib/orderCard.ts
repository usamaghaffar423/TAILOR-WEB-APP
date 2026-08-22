import type { Order, MeasurementTemplate, Customer, Karigar } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { STATUS_LABEL } from '@/components/ui/Badge';
import { COLOR_OPTS } from '@/lib/styleOptions';
import { PUKHTOON_SHALWAR_ICON, PUNJABI_SHALWAR_ICON, SALWAR_ICON } from '@/lib/garmentIcons';
import type { ReactNode } from 'react';

export function colorName(hex: string | undefined): string {
  const match = COLOR_OPTS.find((c) => c.hex.toLowerCase() === (hex || '').toLowerCase());
  return match ? match.name : hex || '—';
}

// Resolves the shalwar-style row for the Order Card / WhatsApp text: prefers
// the new region-specific value, falls back to the legacy flat "salwar"
// value for orders saved before the Pukhtoon/Punjabi update.
export function getOrderShalwarStyle(style: Order['style']): { label: string; icon: ReactNode } | null {
  if (style.shalwarStyle) {
    const iconMap = style.regionalStyle === 'Punjabi' ? PUNJABI_SHALWAR_ICON : PUKHTOON_SHALWAR_ICON;
    return { label: style.shalwarStyle, icon: iconMap[style.shalwarStyle] };
  }
  if (style.salwar) {
    return { label: style.salwar, icon: SALWAR_ICON[style.salwar] };
  }
  return null;
}

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

  const shalwarStyle = getOrderShalwarStyle(style);
  const styleParts: string[] = [];
  if (style.regionalStyle) styleParts.push(`Region: ${style.regionalStyle}`);
  if (style.fit) styleParts.push(`Fit: ${style.fit}`);
  if (style.length) styleParts.push(`Length: ${style.length}`);
  if (style.collar) styleParts.push(`Collar: ${style.collar}`);
  if (style.neck) styleParts.push(`Neck: ${style.neck}`);
  if (style.sleeve) styleParts.push(`Sleeve: ${style.sleeve}`);
  if (style.cuff) styleParts.push(`Cuff: ${style.cuff}`);
  if (shalwarStyle) styleParts.push(`Shalwar: ${shalwarStyle.label}`);
  if (style.mori) styleParts.push(`Mori / Pauncha: ${style.mori}`);
  if (style.waistType) styleParts.push(`Waist: ${style.waistType}`);
  if (style.placket) styleParts.push(`Front Style: ${style.placket}`);
  if (style.pocket) styleParts.push(`Qameez Pocket: ${style.pocket}`);
  if (style.buttonStyle) styleParts.push(`Buttons: ${style.buttonStyle}`);
  if (style.buttonCount) styleParts.push(`Button Count: ${style.buttonCount}`);
  if (style.fabric) styleParts.push(`Fabric: ${style.fabric}`);
  if (style.color) styleParts.push(`Color: ${colorName(style.color)}`);
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

// Plain label/value style rows (no icons) — shared by the Customer Bill and
// Karigar Bill, which need text-only style summaries rather than
// OrderCardModal's illustrated cards.
export function getStyleSummaryRows(order: Order): Array<{ label: string; value: string }> {
  const style = order.style || {};
  const shalwarStyle = getOrderShalwarStyle(style);
  const rows: Array<[string, string | undefined]> = [
    ['Region', style.regionalStyle],
    ['Fit', style.fit],
    ['Length', style.length],
    ['Collar', style.collar],
    ['Neck', style.neck],
    ['Sleeve', style.sleeve],
    ['Cuff', style.cuff],
    ['Shalwar', shalwarStyle?.label],
    ['Front Style', style.placket],
    ['Qameez Pocket', style.pocket],
    ['Shalwar Pocket', style.pocketShalwar],
    ['Mori / Pauncha', style.mori],
    ['Waist', style.waistType],
    ['Daman', style.daman],
    ['Pocket Position', style.pocketPosition],
    ['Pocket Depth', style.pocketDepth],
    ['Fabric', style.fabric],
    ['Buttons', style.buttonStyle],
    ['Button Count', style.buttonCount],
    ['Color', style.color ? colorName(style.color) : undefined],
  ];
  return rows
    .filter((row): row is [string, string] => Boolean(row[1]))
    .map(([label, value]) => ({ label, value }));
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
