import { apiFetch } from '@/api/client';
import type { Paginated, RetailPaymentMethod, RetailSale } from '../types';

export interface SalesFilters {
  date_from?: string;
  date_to?: string;
  payment_method?: RetailPaymentMethod;
  product_id?: number;
  page?: number;
}

export interface CreateSalePayload {
  payment_method?: RetailPaymentMethod;
  customer_name?: string;
  customer_phone?: string;
  items: { variant_id: number; quantity: number; unit_price: number }[];
}

function buildQuery(filters: SalesFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const retailSalesApi = {
  list: (filters: SalesFilters = {}) =>
    apiFetch<Paginated<RetailSale>>(`/retail/sales${buildQuery(filters)}`),

  get: (id: number) => apiFetch<{ data: RetailSale }>(`/retail/sales/${id}`),

  create: (payload: CreateSalePayload) =>
    apiFetch<{ data: RetailSale }>('/retail/sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
