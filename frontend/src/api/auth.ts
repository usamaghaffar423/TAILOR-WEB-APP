import { apiFetch } from './client';
import type { Admin, ShopSettings } from '@/types';

export interface LoginResponse {
  token: string;
  admin: Admin;
}

export interface MeResponse {
  admin: Admin;
  shop: ShopSettings;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ data: LoginResponse }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),

  me: () =>
    apiFetch<{ data: MeResponse }>('/auth/me'),
};
