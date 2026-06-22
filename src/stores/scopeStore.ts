import { create } from 'zustand';
import { roleScopesApi } from '../api/roleScopes';
import { powerApi } from '../api/power';
import {
  PROGRESSIVE_DISCLOSURE_ENABLED,
  isTierGated,
  type Tier,
} from '../config/progressiveDisclosure';

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
  training_plan: '/training-plan',
  case_studio: '/case-studio',
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
  /** Роль и тир Мощи — для прогрессивного раскрытия разделов (онбординг). */
  userRole: string | null;
  userTier: Tier | null;
  fetchMyScopes: () => Promise<void>;
  /** Загрузить тир Мощи текущего юзера (для гейтинга по уровню). role — из authStore. */
  fetchUserTier: (role?: string | null) => Promise<void>;
  isPageAllowed: (pageKey: string) => boolean;
  /** Returns the route path of the first allowed page (for redirects). */
  getFirstAllowedPath: () => string;
  reset: () => void;
}

export const useScopeStore = create<ScopeState>((set, get) => ({
  allowedPages: null,
  isLoaded: false,
  userRole: null,
  userTier: null,

  fetchMyScopes: async () => {
    try {
      const response = await roleScopesApi.getMyScopes();
      set({ allowedPages: response.data.allowed_pages, isLoaded: true });
    } catch {
      // If fetch fails, allow only dashboard (safe fallback)
      set({ allowedPages: ['dashboard'], isLoaded: true });
    }
  },

  fetchUserTier: async (role?: string | null) => {
    if (role !== undefined) set({ userRole: role });
    // Без флага тир не нужен — не дёргаем power зря.
    if (!PROGRESSIVE_DISCLOSURE_ENABLED) return;
    try {
      const res = await powerApi.getMyPower();
      set({ userTier: res.data.tier });
    } catch {
      // оставляем null → трактуется как bronze (консервативно)
    }
  },

  isPageAllowed: (pageKey: string) => {
    const { allowedPages, userRole, userTier } = get();

    // 1) Базовый доступ по role-scope (как раньше)
    const baseAllowed =
      allowedPages === null ||
      allowedPages.includes(pageKey) ||
      Object.entries(LEGACY_TO_NEW)
        .filter(([, newKey]) => newKey === pageKey)
        .map(([oldKey]) => oldKey)
        .some((k) => allowedPages.includes(k));
    if (!baseAllowed) return false;

    // 2) Прогрессивное раскрытие (UX-слой, только ТП, за флагом). OFF → no-op.
    if (isTierGated(pageKey, userRole, userTier)) return false;

    return true;
  },

  getFirstAllowedPath: () => {
    const { allowedPages } = get();
    // null = not loaded → default to dashboard
    if (allowedPages === null || allowedPages.length === 0) return '/dashboard';
    const firstKey = allowedPages[0];
    return PAGE_KEY_TO_PATH[firstKey] || '/dashboard';
  },

  reset: () => set({ allowedPages: null, isLoaded: false, userRole: null, userTier: null }),
}));
