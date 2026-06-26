import { create } from 'zustand';
import { authApi } from '../api/client';
import { useScopeStore } from './scopeStore';

interface User {
  id: string;
  employee_id: string;
  full_name: string;
  email?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  team_id?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (employee_id: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
}

// Дублируем идентичность юзера в localStorage — нужно демо-режиму (api/demoData.ts),
// чтобы читать employee_id без импорта authStore (иначе цикл client ↔ authStore).
function persistUserIdentity(user: { id?: string; employee_id?: string; full_name?: string } | null) {
  if (!user) {
    localStorage.removeItem('employee_id');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_full_name');
    return;
  }
  if (user.employee_id) localStorage.setItem('employee_id', user.employee_id);
  if (user.id) localStorage.setItem('user_id', user.id);
  if (user.full_name) localStorage.setItem('user_full_name', user.full_name);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,

  login: async (employee_id: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(employee_id, password);
      const { access_token, refresh_token, user } = response.data;

      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      persistUserIdentity(user);

      set({
        user,
        accessToken: access_token,
        refreshToken: refresh_token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Авто-выбор языка из user.telegram_lang (если пользователь раньше
      // не выбирал язык вручную — синхронизируем с серверной настройкой)
      const { applyUserLang } = await import('./langStore');
      applyUserLang((user as { telegram_lang?: string | null }).telegram_lang);

      // Load role scopes + power tier (для прогрессивного раскрытия) after login
      useScopeStore.getState().fetchMyScopes();
      useScopeStore.getState().fetchUserTier(user?.role);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login failed';
      set({
        isLoading: false,
        error: message,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      persistUserIdentity(null);
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      useScopeStore.getState().reset();
    }
  },

  setUser: (user) => set({ user }),

  fetchUser: async () => {
    try {
      const response = await authApi.me();
      persistUserIdentity(response.data);
      set({ user: response.data });
      // Тир Мощи для прогрессивного раскрытия (роль из /me)
      useScopeStore.getState().fetchUserTier(response.data?.role);
      // Авто-выбор языка при восстановлении сессии
      const { applyUserLang } = await import('./langStore');
      applyUserLang((response.data as { telegram_lang?: string | null }).telegram_lang);
    } catch {
      // Token expired or invalid — clear auth
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    }
  },
}));

// Auto-fetch user and scopes on app load if token exists
if (localStorage.getItem('accessToken')) {
  useAuthStore.getState().fetchUser();
  useScopeStore.getState().fetchMyScopes();
}
