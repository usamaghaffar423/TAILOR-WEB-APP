import { apiFetch } from './client';
import type { Payment, PaymentMethod, PaymentSummary, OrderBalance } from '@/types';

export interface PaymentListItem extends Payment {
  order_no: string;
  customer_name: string;
}

export interface PaymentFilters {
  method?: PaymentMethod;
  from?: string;
  to?: string;
  q?: string;
}

export interface CreatePaymentPayload {
  order_id: number;
  amount: number;
  method: PaymentMethod;
  date: string;
  note?: string | null;
}

function buildQuery(filters: PaymentFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const paymentsApi = {
  index: (filters: PaymentFilters = {}) =>
    apiFetch<{ data: PaymentListItem[] }>(`/payments${buildQuery(filters)}`),

  store: (payload: CreatePaymentPayload) =>
    apiFetch<{ data: Payment }>('/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  summary: () => apiFetch<{ data: PaymentSummary }>('/payments/summary'),

  balances: () => apiFetch<{ data: OrderBalance[] }>('/payments/balances'),
};
