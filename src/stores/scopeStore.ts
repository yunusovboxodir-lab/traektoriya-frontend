import { create } from 'zustand';
import { roleScopesApi } from '../api/roleScopes';

/** Map pageKey → route path (must match App.tsx routes) */
const PAGE_KEY_TO_PATH: Record<string, string> = {
  dashboard: '/dashboard',
  learning: '/learning',
  products: '/products',
  tasks: '/tasks',
  team: '/team',
  assessments: '/assessments',
  generation: '/generation',
  'knowledge-base': '/knowledge-base',
  kpi: '/kpi',
  chat: '/chat',
  planogram: '/planogram',
  analytics: '/analytics',
  'admin-roles': '/admin/roles',
};

interface ScopeState {
  allowedPages: string[] | null; // null = not loaded yet → allow all
  isLoaded: boolean;
  fetchMyScopes: () => Promise<void>;
  isPageAllowed: (pageKey: string) => boolean;
  /** Returns the route path of the first allowed page (for redirects). */
  getFirstAllowedPath: () => string;
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

  getFirstAllowedPath: () => {
    const { allowedPages } = get();
    // null = not loaded → default to dashboard
    if (allowedPages === null || allowedPages.length === 0) return '/dashboard';
    const firstKey = allowedPages[0];
    return PAGE_KEY_TO_PATH[firstKey] || '/dashboard';
  },

  reset: () => set({ allowedPages: null, isLoaded: false }),
}));
