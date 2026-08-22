import { apiFetch } from './client';
import type { Karigar, KarigarOrderItem } from '@/types';

export interface KarigarDetail {
  karigar: Karigar;
  orders: KarigarOrderItem[];
}

export interface CreateKarigarPayload {
  name: string;
  phone?: string | null;
  speciality?: string | null;
  max_capacity?: number;
}

export const karigarsApi = {
  index: () => apiFetch<{ data: Karigar[] }>('/karigars'),

  store: (payload: CreateKarigarPayload) =>
    apiFetch<{ data: Karigar }>('/karigars', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: CreateKarigarPayload) =>
    apiFetch<{ data: Karigar }>(`/karigars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  destroy: (id: number) =>
    apiFetch<{ message: string }>(`/karigars/${id}`, { method: 'DELETE' }),

  show: (id: number, month?: string) =>
    apiFetch<{ data: KarigarDetail }>(`/karigars/${id}${month ? `?month=${month}` : ''}`),
};
