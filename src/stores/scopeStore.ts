import { create } from 'zustand';
import { roleScopesApi } from '../api/roleScopes';

interface ScopeState {
  allowedPages: string[] | null; // null = not loaded yet → allow all
  isLoaded: boolean;
  fetchMyScopes: () => Promise<void>;
  isPageAllowed: (pageKey: string) => boolean;
  reset: () => void;
}

export const useScopeStore = create<ScopeState>((set, get) => ({
  allowedPages: null,
  isLoaded: false,

  fetchMyScopes: async () => {
    try {
      const response = await roleScopesApi.getMyScopes();
      set({ allowedPages: response.data.allowed_pages, isLoaded: true });
    } catch {
      // If fetch fails, allow all pages (backwards compatible)
      set({ allowedPages: null, isLoaded: true });
    }
  },

  isPageAllowed: (pageKey: string) => {
    const { allowedPages } = get();
    // null = not loaded or error → allow all
    if (allowedPages === null) return true;
    return allowedPages.includes(pageKey);
  },

  reset: () => set({ allowedPages: null, isLoaded: false }),
}));
