/**
 * tenantStore — организация текущего юзера (мультиорг брендинг).
 * Ленивая загрузка из GET /api/v1/tenant; StatusBar дергает fetchTenant()
 * один раз после авторизации. При ошибке остаёмся на платформенном брендинге.
 */
import { create } from 'zustand';
import { organizationsApi, type TenantInfo } from '../api/organizations';

interface TenantState {
  tenant: TenantInfo | null;
  loaded: boolean;
  fetchTenant: () => Promise<void>;
  reset: () => void;
}

let inflight: Promise<void> | null = null;

export const useTenantStore = create<TenantState>((set, get) => ({
  tenant: null,
  loaded: false,

  fetchTenant: async () => {
    if (get().loaded || inflight) return inflight ?? Promise.resolve();
    inflight = organizationsApi
      .myTenant()
      .then((res) => set({ tenant: res.data, loaded: true }))
      .catch(() => set({ tenant: null, loaded: true }))
      .finally(() => { inflight = null; });
    return inflight;
  },

  reset: () => set({ tenant: null, loaded: false }),
}));
