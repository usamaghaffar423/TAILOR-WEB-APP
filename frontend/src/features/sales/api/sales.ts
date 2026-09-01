import { apiFetch } from '@/api/client';
import type { OrderStyle, PaymentMethod } from '@/types';
import type { Sale, SaleItem, SaleListItem, SaleStatus, SaleItemStatus } from '../types';

export interface SaleItemPayload {
  retail_product_variant_id?: number;
  label: string;
  recipient_name?: string;
  qty: number;
  unit_price: number;
  needs_stitching?: boolean;
  template_key?: string;
  style?: OrderStyle | Record<string, string>;
  karigar_id?: number;
  deadline?: string;
}

export interface CreateSalePayload {
  customer_id?: number;
  items: SaleItemPayload[];
  discount?: number;
  status?: SaleStatus;
  advance_amount?: number;
  advance_method?: PaymentMethod;
  advance_date?: string;
  advance_note?: string;
}

export interface UpdateSaleItemPayload {
  id: number;
  karigar_id?: number | null;
  deadline?: string | null;
  item_status?: SaleItemStatus;
  style?: Record<string, string>;
}

export interface UpdateSalePayload {
  status?: SaleStatus;
  items?: UpdateSaleItemPayload[];
}

export interface SaleFilters {
  status?: SaleStatus;
  karigar_id?: number;
  q?: string;
  from?: string;
  to?: string;
  // '1' = only sales with a stitched line, '0' = only pure retail sales.
  stitched?: '0' | '1';
}

function buildQuery(filters: SaleFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const salesApi = {
  index: (filters: SaleFilters = {}) => apiFetch<{ data: SaleListItem[] }>(`/sales${buildQuery(filters)}`),

  store: (payload: CreateSalePayload) =>
    apiFetch<{ data: Sale }>('/sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  show: (id: number) => apiFetch<{ data: Sale }>(`/sales/${id}`),

  update: (id: number, payload: UpdateSalePayload) =>
    apiFetch<{ data: Sale }>(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  updateItemStatus: (itemId: number, item_status: SaleItemStatus) =>
    apiFetch<{ data: SaleItem }>(`/sales/items/${itemId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ item_status }),
    }),

  destroy: (id: number) => apiFetch<{ message: string }>(`/sales/${id}`, { method: 'DELETE' }),
};
