import { create } from 'zustand';
import { authApi } from '../lib/api';

interface User {
  id: string;
  username: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'SUPPLIER_ADMIN' | 'SUPPLIER_STAFF' | 'MARKET_ADMIN' | 'MARKET_STAFF';
  phoneVerified: boolean;
  supplierId?: string;
  marketId?: string;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (login, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login({ login, password });
      const { accessToken, user } = data.data;
      localStorage.setItem('access_token', accessToken);
      set({ user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await authApi.logout().catch(() => {});
    localStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.me();
      set({ user: data.data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Role helpers
export const isAdmin = (role?: string) => role === 'SUPER_ADMIN';
export const isSupplier = (role?: string) => role === 'SUPPLIER_ADMIN' || role === 'SUPPLIER_STAFF';
export const isMarket = (role?: string) => role === 'MARKET_ADMIN' || role === 'MARKET_STAFF';
