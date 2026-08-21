import { create } from 'zustand';
import type { Admin, ShopSettings } from '@/types';

const TOKEN_KEY = 'tmt_token';

interface AuthState {
  token: string | null;
  admin: Admin | null;
  shop: ShopSettings | null;
  isAuthenticated: boolean;
  setAuth: (token: string, admin: Admin, shop: ShopSettings) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initialise from localStorage so refresh doesn't log the user out
  token: localStorage.getItem(TOKEN_KEY),
  admin: null,
  shop: null,
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),

  setAuth: (token, admin, shop) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ token, admin, shop, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, admin: null, shop: null, isAuthenticated: false });
  },
}));
