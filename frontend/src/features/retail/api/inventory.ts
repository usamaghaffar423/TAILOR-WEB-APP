import { apiFetch } from '@/api/client';
import type { Paginated, RetailInventoryItem, RetailStockMovement } from '../types';

export const retailInventoryApi = {
  list: (lowStockOnly = false) =>
    apiFetch<{ data: RetailInventoryItem[] }>(
      `/retail/inventory${lowStockOnly ? '?low_stock=1' : ''}`
    ),

  restock: (variantId: number, qty: number, note?: string) =>
    apiFetch<{ data: RetailInventoryItem }>(`/retail/inventory/${variantId}/restock`, {
      method: 'POST',
      body: JSON.stringify({ qty, note }),
    }),

  adjust: (variantId: number, new_qty: number, note: string) =>
    apiFetch<{ data: RetailInventoryItem }>(`/retail/inventory/${variantId}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ new_qty, note }),
    }),

  movements: (variantId: number, page = 1) =>
    apiFetch<Paginated<RetailStockMovement>>(`/retail/inventory/${variantId}/movements?page=${page}`),
};
