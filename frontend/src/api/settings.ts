import { apiFetch } from './client';
import type { ShopSettings, MeasurementTemplate, ThemeDefault } from '@/types';

export interface UpdateSettingsPayload {
  name?: string;
  address?: string | null;
  phone?: string | null;
  theme_default?: ThemeDefault;
}

export const settingsApi = {
  show: () => apiFetch<{ data: ShopSettings }>('/settings'),

  update: (payload: UpdateSettingsPayload) =>
    apiFetch<{ data: ShopSettings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return apiFetch<{ data: ShopSettings }>('/settings/logo', {
      method: 'POST',
      body: formData,
    });
  },

  uploadBanner: (file: File) => {
    const formData = new FormData();
    formData.append('banner', file);
    return apiFetch<{ data: ShopSettings }>('/settings/banner', {
      method: 'POST',
      body: formData,
    });
  },

  getTemplates: () => apiFetch<{ data: MeasurementTemplate[] }>('/templates'),

  updateTemplate: (key: string, payload: Pick<MeasurementTemplate, 'label' | 'fields'>) =>
    apiFetch<{ data: MeasurementTemplate }>(`/templates/${key}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  changePassword: (current_password: string, new_password: string) =>
    apiFetch<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ current_password, new_password }),
    }),

  clearCache: () => apiFetch<{ message: string }>('/settings/clear-cache', { method: 'POST' }),
};
