import { create } from 'zustand';
import { roleScopesApi } from '../api/roleScopes';

/** Map pageKey → route path (must match App.tsx routes) */
const PAGE_KEY_TO_PATH: Record<string, string> = {
  // Consolidated navigation (10 items)
  dashboard: '/dashboard',
  learning: '/learning',
  products: '/products',
  tasks: '/tasks',
  team: '/team',
  competencies: '/competencies',
  'ai-studio': '/ai-studio',
  goals: '/goals',
  planogram: '/planogram',
  analytics: '/analytics',
  'admin-roles': '/admin/roles',

  // Legacy pageKeys — map to new consolidated paths
  // (backend may still return these until role_scopes are updated)
  assessments: '/competencies',
  'competency-matrix': '/competencies',
  'competency-profiles': '/competencies',
  generation: '/ai-studio',
  'knowledge-base': '/ai-studio',
  chat: '/ai-studio',
  kpi: '/dashboard',
  reports: '/analytics',
  supervisor: '/team',
  'admin-users': '/team',
};

/**
 * Map legacy pageKeys to new consolidated pageKeys.
 * When backend returns old pageKeys like 'assessments', treat them as 'competencies'.
 */
const LEGACY_TO_NEW: Record<string, string> = {
  assessments: 'competencies',
  'competency-matrix': 'competencies',
  'competency-profiles': 'competencies',
  generation: 'ai-studio',
  'knowledge-base': 'ai-studio',
  chat: 'ai-studio',
  kpi: 'dashboard',
  reports: 'analytics',
  supervisor: 'team',
  'admin-users': 'team',
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
      // If fetch fails, allow only dashboard (safe fallback)
      set({ allowedPages: ['dashboard'], isLoaded: true });
    }
  },

  isPageAllowed: (pageKey: string) => {
    const { allowedPages } = get();
    // null = not loaded or error → allow all
    if (allowedPages === null) return true;

    // Direct match
    if (allowedPages.includes(pageKey)) return true;

    // Check if any legacy key maps to this new pageKey
    // e.g. if 'competencies' is checked but backend sent 'assessments'
    const legacyKeys = Object.entries(LEGACY_TO_NEW)
      .filter(([, newKey]) => newKey === pageKey)
      .map(([oldKey]) => oldKey);

    return legacyKeys.some((k) => allowedPages.includes(k));
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
