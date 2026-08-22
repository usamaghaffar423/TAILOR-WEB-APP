import { apiFetch } from '@/api/client';
import type { RetailProduct, RetailProductVariant } from '../types';

export interface CreateRetailProductPayload {
  name: string;
  category?: string | null;
  description?: string | null;
  sale_price: number;
  variants?: { size?: string; color?: string }[];
}

export interface UpdateRetailProductPayload {
  name?: string;
  category?: string | null;
  description?: string | null;
  sale_price?: number;
  is_active?: boolean;
}

export const retailProductsApi = {
  list: () => apiFetch<{ data: RetailProduct[] }>('/retail/products'),

  get: (id: number) => apiFetch<{ data: RetailProduct }>(`/retail/products/${id}`),

  create: (payload: CreateRetailProductPayload) =>
    apiFetch<{ data: RetailProduct }>('/retail/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: UpdateRetailProductPayload) =>
    apiFetch<{ data: RetailProduct }>(`/retail/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deactivate: (id: number) =>
    apiFetch<{ message: string }>(`/retail/products/${id}`, { method: 'DELETE' }),

  addVariant: (productId: number, data: { size?: string; color?: string }) =>
    apiFetch<{ data: RetailProductVariant }>(`/retail/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadVariantImage: (variantId: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiFetch<{ data: RetailProductVariant }>(`/retail/variants/${variantId}/image`, {
      method: 'POST',
      body: formData,
    });
  },

  deleteVariant: (variantId: number) =>
    apiFetch<{ message: string }>(`/retail/variants/${variantId}`, { method: 'DELETE' }),
};
