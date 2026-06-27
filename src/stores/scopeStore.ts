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
 * Клиентская политика доступа поверх backend role-scopes (решение PO 2026-06-25).
 * Функция возвращает true, если страницу нужно ПРИНУДИТЕЛЬНО скрыть для роли.
 * Применяется в isPageAllowed → действует и в навигации (StatusBar/мобайл),
 * и в защите роутов (ProtectedRoute).
 *
 *  - training_plan (План обучения): только Админ / Суперадмин / Ком.дир / РМ.
 *  - planogram (Планограмма): только admin/superadmin (в UI у них — frozen);
 *    остальным полностью скрыта (ShelfScan — отдельный замороженный продукт).
 */
const ROLE_FORCE_DENY: Record<string, (role: string | null) => boolean> = {
  training_plan: (role) =>
    !['superadmin', 'admin', 'commercial_dir', 'regional_manager'].includes(role || ''),
  planogram: (role) => !['superadmin', 'admin'].includes(role || ''),
  // goals (Цели): часть функций завязана на ShelfScan (тип shelf_quality), а он
  // заморожен/будет отдельным продуктом → раздел полупустой. Прячем у всех кроме
  // admin/superadmin до разморозки (PO 2026-06-28). Маршрут/код живы — вернуть легко.
  goals: (role) => !['superadmin', 'admin'].includes(role || ''),
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

    // 1.5) Клиентская ролевая политика (PO 2026-06-25): План обучения / Планограмма.
    const denyFn = ROLE_FORCE_DENY[pageKey];
    if (denyFn && denyFn(userRole)) return false;

    // 2) Прогрессивное раскрытие (UX-слой, только ТП, за флагом). OFF → no-op.
    if (isTierGated(pageKey, userRole, userTier)) return false;

    return true;
  },

  getFirstAllowedPath: () => {
    const { allowedPages, isPageAllowed } = get();
    // null = not loaded → default to dashboard
    if (allowedPages === null || allowedPages.length === 0) return '/dashboard';
    // ВАЖНО: возвращаем первую страницу, реально прошедшую isPageAllowed (с учётом
    // клиентской политики ROLE_FORCE_DENY) — иначе редирект на запрещённую страницу
    // (напр. ТП → training_plan) зацикливается с ProtectedRoute (чёрный мигающий экран).
    for (const key of allowedPages) {
      if (isPageAllowed(key)) {
        const path = PAGE_KEY_TO_PATH[key];
        if (path) return path;
      }
    }
    return '/dashboard';
  },

  reset: () => set({ allowedPages: null, isLoaded: false, userRole: null, userTier: null }),
}));
