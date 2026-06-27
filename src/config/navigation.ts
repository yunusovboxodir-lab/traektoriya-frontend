/**
 * navigation.ts — ЕДИНЫЙ источник истины по разделам навигации.
 *
 * Раньше список разделов был скопирован в трёх местах (StatusBar — десктоп-дропдаун,
 * MobileBottomNav — нижние табы, MobileProfileDrawer — мобильный drawer), и любая
 * правка меню требовала руками синхронизировать все три. Легко забыть → расхождения:
 * «Активности» (📅) были только на десктопе, AI-Студия по-разному гейтилась.
 *
 * Теперь все три читают NAV_REGISTRY. Добавил/убрал/переименовал раздел один раз —
 * он меняется везде. Метаданные раздела (иконка, путь, гейтинг, где показывать)
 * живут здесь же. Сюда же позже ляжет `unlockTier` для прогрессивного раскрытия
 * (онбординг «с нуля»: разделы открываются по росту Мощи).
 */
import type { Tier } from './progressiveDisclosure';

export interface NavDestination {
  /** Ключ страницы для scope/политик (см. scopeStore.isPageAllowed). */
  pageKey: string;
  /** Маршрут (должен совпадать с App.tsx). */
  path: string;
  /** Ключ i18n для подписи. */
  labelKey: string;
  /** Эмодзи-иконка раздела. */
  icon: string;
  /** 'main' — основной раздел; 'admin' — админ-блок (виден ролям rank>=3). */
  group: 'main' | 'admin';
  /** Показывать фиксированным табом в нижней мобильной навигации. */
  mobilePrimary?: boolean;
  /** Доступен только superadmin/admin (напр. AI-Студия — инструменты тренера). */
  superAdminOnly?: boolean;
  /** Показывать серым с замком (заморожен). Сейчас никто не заморожен. */
  frozen?: boolean;
  /** (Пункт 2, онбординг) минимальный тир Мощи для раскрытия. Не задан → виден всегда. */
  unlockTier?: Tier;
}

/**
 * Единый реестр. Порядок = порядок показа на десктопе (StatusBar): сначала main,
 * затем admin-блок. На мобайле: mobilePrimary → нижние табы, остальное → drawer.
 */
export const NAV_REGISTRY: NavDestination[] = [
  { pageKey: 'dashboard',     path: '/dashboard',             labelKey: 'nav.home',         icon: '🏠', group: 'main', mobilePrimary: true },
  { pageKey: 'learning',      path: '/learning',              labelKey: 'nav.learning',     icon: '📚', group: 'main', mobilePrimary: true },
  { pageKey: 'products',      path: '/products',              labelKey: 'nav.products',     icon: '📦', group: 'main' },
  { pageKey: 'tasks',         path: '/tasks',                 labelKey: 'nav.tasks',        icon: '📋', group: 'main', mobilePrimary: true },
  { pageKey: 'team',          path: '/team',                  labelKey: 'nav.team',         icon: '👥', group: 'main' },
  { pageKey: 'competencies',  path: '/competencies',          labelKey: 'nav.competencies', icon: '🎯', group: 'main' },
  { pageKey: 'ai-studio',     path: '/ai-studio',             labelKey: 'nav.aiStudio',     icon: '✨', group: 'main', superAdminOnly: true },
  { pageKey: 'goals',         path: '/goals',                 labelKey: 'nav.goals',        icon: '🏆', group: 'main' },
  { pageKey: 'offline',       path: '/activities',            labelKey: 'nav.offline',      icon: '📅', group: 'main' },
  { pageKey: 'analytics',     path: '/analytics',             labelKey: 'nav.analytics',    icon: '📊', group: 'main' },
  { pageKey: 'training_plan', path: '/training-plan',         labelKey: 'nav.trainingPlan', icon: '🎓', group: 'main' },
  // ── Админ-блок (rank >= 3) ──
  // Обратная связь — репорты со скринами (вкладка reports в Аналитике).
  { pageKey: 'analytics',     path: '/analytics?tab=reports', labelKey: 'nav.feedback',     icon: '🗣️', group: 'admin' },
  { pageKey: 'admin-roles',   path: '/admin/roles',           labelKey: 'nav.settings',     icon: '⚙️', group: 'admin' },
];

/** Иерархия ролей (для isAdmin/isSuperOrAdmin). */
export const ROLE_RANK: Record<string, number> = {
  superadmin: 5,
  commercial_dir: 4,
  admin: 3,
  regional_manager: 2,
  supervisor: 2,
  sales_rep: 1,
};

/** rank >= 3 (admin/commercial_dir/superadmin) — видит админ-блок. */
export const isAdminRole = (role?: string | null): boolean =>
  (ROLE_RANK[role || ''] ?? 0) >= 3;

/** Строго superadmin/admin — для superAdminOnly-разделов. */
export const isSuperOrAdminRole = (role?: string | null): boolean =>
  role === 'superadmin' || role === 'admin';

export interface NavVisibilityCtx {
  isPageAllowed: (pageKey: string) => boolean;
  isAdmin: boolean;
  isSuperOrAdmin: boolean;
}

/**
 * Единое правило видимости раздела — общее для всех трёх меню.
 * (frozen-раздел остаётся «видимым», но потребитель рисует его серым с замком;
 *  для не-админа frozen скрывается полностью.)
 */
export function isNavVisible(d: NavDestination, ctx: NavVisibilityCtx): boolean {
  if (!ctx.isPageAllowed(d.pageKey)) return false;
  if (d.group === 'admin' && !ctx.isAdmin) return false;
  if (d.superAdminOnly && !ctx.isSuperOrAdmin) return false;
  if (d.frozen && !ctx.isAdmin) return false;
  return true;
}

/** Видимые разделы для десктоп-дропдауна (main, затем admin). */
export function visibleDesktopItems(ctx: NavVisibilityCtx): NavDestination[] {
  return NAV_REGISTRY.filter((d) => isNavVisible(d, ctx));
}

/** Нижние табы мобайла (mobilePrimary). Drawer-кнопка добавляется в самом компоненте. */
export function mobilePrimaryItems(ctx: NavVisibilityCtx): NavDestination[] {
  return NAV_REGISTRY.filter((d) => d.mobilePrimary && isNavVisible(d, ctx));
}

/** Вторичные разделы для мобильного drawer (всё, что не в нижних табах). */
export function mobileDrawerItems(ctx: NavVisibilityCtx): NavDestination[] {
  return NAV_REGISTRY.filter((d) => !d.mobilePrimary && isNavVisible(d, ctx));
}
