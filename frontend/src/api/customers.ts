import { apiFetch } from './client';
import type { Customer, Measurement, CustomerOrderItem } from '@/types';

export interface CustomerDetail {
  customer: Customer;
  measurements: Measurement[];
  orders: CustomerOrderItem[];
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  address?: string | null;
}

export const customersApi = {
  index: (q?: string) =>
    apiFetch<{ data: Customer[] }>(`/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  store: (payload: CreateCustomerPayload) =>
    apiFetch<{ data: Customer }>('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  show: (id: number) => apiFetch<{ data: CustomerDetail }>(`/customers/${id}`),

  update: (id: number, payload: CreateCustomerPayload) =>
    apiFetch<{ data: Customer }>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getMeasurements: (id: number) =>
    apiFetch<{ data: Measurement[] }>(`/customers/${id}/measurements`),

  upsertMeasurement: (id: number, templateKey: string, fields: Record<string, string | string[]>, notes?: string | null) =>
    apiFetch<{ data: Measurement }>(`/customers/${id}/measurements/${templateKey}`, {
      method: 'PUT',
      body: JSON.stringify({ fields, notes }),
    }),

  destroy: (id: number) => apiFetch<{ message: string }>(`/customers/${id}`, { method: 'DELETE' }),
};
