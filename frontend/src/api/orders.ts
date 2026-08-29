import { apiFetch } from './client';
import type { Order, OrderListItem, OrderStatus, OrderStyle, OrderItem } from '@/types';

export interface OrderFilters {
  status?: OrderStatus;
  karigar_id?: number;
  q?: string;
  from?: string;
  to?: string;
}

export interface CreateOrderPayload {
  customer_id: number;
  template_key: string;
  style: OrderStyle;
  items?: OrderItem[];
  karigar_id: number;
  deadline: string;
  status?: OrderStatus;
  total_amount: number;
  advance_amount?: number;
  advance_method?: string;
}

export interface UpdateOrderPayload {
  karigar_id?: number;
  deadline?: string;
  status?: OrderStatus;
  total_amount?: number;
  style?: OrderStyle;
  items?: OrderItem[];
}

function buildQuery(filters: OrderFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const ordersApi = {
  index: (filters: OrderFilters = {}) =>
    apiFetch<{ data: OrderListItem[] }>(`/orders${buildQuery(filters)}`),

  store: (payload: CreateOrderPayload) =>
    apiFetch<{ data: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  show: (id: number) => apiFetch<{ data: Order }>(`/orders/${id}`),

  updateStatus: (id: number, status: OrderStatus) =>
    apiFetch<{ data: Order }>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  update: (id: number, payload: UpdateOrderPayload) =>
    apiFetch<{ data: Order }>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  destroy: (id: number) =>
    apiFetch<{ message: string }>(`/orders/${id}`, { method: 'DELETE' }),
};
