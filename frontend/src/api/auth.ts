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

  // Bounded wait: fetch has no timeout of its own, so a hung backend would
  // otherwise leave the app waiting on a blank screen forever.
  me: () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    return apiFetch<{ data: MeResponse }>('/auth/me', { signal: controller.signal }).finally(() =>
      clearTimeout(timer)
    );
  },
};
