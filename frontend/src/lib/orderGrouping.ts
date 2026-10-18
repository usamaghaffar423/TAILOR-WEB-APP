import type { OrderListItem } from '@/types';

export interface OrderGroup {
  /** Stable key: `c:{customerId}` when the customer is known, else `p:{normalizedPhone}`. */
  key: string;
  customerId: number | null;
  /** Name of the customer on the MOST RECENT order in the group. */
  customerName: string;
  /** Orders sorted most-recent first. */
  orders: OrderListItem[];
  totalAmount: number;
  totalPaid: number;
  totalBalance: number;
}

/**
 * Normalize a phone number to a canonical digit string so different writings
 * of the same number map to one grouping key:
 *   "+92 300-1234567" / "0300 123 4567" / "00923001234567" → "3001234567"
 * Strips spaces/dashes, leading zeros, and the +92 / 0092 country code.
 */
export function normalizePhone(raw: string | null | undefined): string {
  let digits = (raw ?? '').replace(/\D/g, '');
  digits = digits.replace(/^0+/, '');
  if (digits.startsWith('92') && digits.length > 9) {
    digits = digits.slice(2);
  }
  return digits || 'no-phone';
}

/**
 * Pure grouping transformation for the Orders table.
 *
 * - Orders are bucketed primarily by `customer_id`; orders without one fall
 *   back to the normalized phone number.
 * - Orders within a group (and the groups themselves) are ordered
 *   most-recent-first, so `group.customerName` is always
 *   `group.orders[0].customer_name` — the most recent order's customer name.
 * - Financial totals are aggregated across the whole group.
 */
export function groupOrders(orders: OrderListItem[]): OrderGroup[] {
  const sorted = [...orders].sort((a, b) => {
    const byDate = Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? '');
    return byDate !== 0 ? byDate : b.id - a.id;
  });

  const map = new Map<string, OrderGroup>();
  for (const o of sorted) {
    const key = o.customer_id ? `c:${o.customer_id}` : `p:${normalizePhone(o.customer_phone)}`;
    const total = Number(o.total_amount);
    const paid = Number(o.paid_amount ?? 0);
    const existing = map.get(key);
    if (existing) {
      existing.orders.push(o);
      existing.totalAmount += total;
      existing.totalPaid += paid;
    } else {
      map.set(key, {
        key,
        customerId: o.customer_id ?? null,
        customerName: o.customer_name,
        orders: [o],
        totalAmount: total,
        totalPaid: paid,
        totalBalance: 0,
      });
    }
  }

  return Array.from(map.values()).map((g) => ({ ...g, totalBalance: g.totalAmount - g.totalPaid }));
}
