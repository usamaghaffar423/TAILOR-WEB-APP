import { apiFetch } from './client';
import type { OrderPhoto } from '@/types';

export const uploadsApi = {
  store: (orderId: number, files: File[]) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('photos[]', file);
    }
    return apiFetch<{ data: OrderPhoto[] }>(`/uploads/order/${orderId}`, {
      method: 'POST',
      body: formData,
    });
  },

  destroy: (photoId: number) =>
    apiFetch<{ message: string }>(`/uploads/${photoId}`, { method: 'DELETE' }),
};
