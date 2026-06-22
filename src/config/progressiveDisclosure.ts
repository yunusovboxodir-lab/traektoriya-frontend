/**
 * Прогрессивное раскрытие разделов (онбординг-кривая, по мотивам Last Z).
 *
 * У роли ТП «продвинутые» разделы открываются по росту тира Мощи. Рабочий
 * минимум дня-1 (dashboard/learning/tasks/products/planogram) НЕ гейтится.
 * Раскрытие — только UX-слой поверх role-scopes (тир не даёт доступа сверх роли).
 *
 * За флагом: VITE_PROGRESSIVE_DISCLOSURE='true'. По умолчанию ВЫКЛ —
 * поведение идентично текущему (демо-safe). Включение = env-переменная в Vercel.
 */
export const PROGRESSIVE_DISCLOSURE_ENABLED =
  import.meta.env.VITE_PROGRESSIVE_DISCLOSURE === 'true';

export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';

export const TIER_RANK: Record<Tier, number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
};

/** Гейтим ТОЛЬКО полевые роли. Админ/СВ/РМ — полный доступ по role-scope. */
export const GATING_ROLES = ['sales_rep'];

/**
 * pageKey → минимальный тир для открытия (для ТП).
 * Разделы, которых тут НЕТ, видны всегда (рабочий минимум дня-1).
 * Веса тюнятся по итогам пилота.
 */
export const MIN_TIER_BY_PAGE: Record<string, Tier> = {
  competencies: 'silver',
  goals: 'silver',
  case_studio: 'gold',
  training_plan: 'gold',
  offline: 'gold',
  analytics: 'platinum',
};

const PAGE_LABELS: Record<string, { ru: string; uz: string }> = {
  competencies: { ru: 'Компетенции', uz: 'Kompetensiyalar' },
  goals: { ru: 'Цели', uz: 'Maqsadlar' },
  case_studio: { ru: 'Кейсотека', uz: 'Keyslar' },
  training_plan: { ru: 'План обучения', uz: "O'qish rejasi" },
  offline: { ru: 'Активности', uz: 'Faolliklar' },
  analytics: { ru: 'Аналитика', uz: 'Tahlil' },
};

const TIER_LABELS: Record<Tier, { ru: string; uz: string }> = {
  bronze: { ru: 'Бронза', uz: 'Bronza' },
  silver: { ru: 'Серебро', uz: 'Kumush' },
  gold: { ru: 'Золото', uz: 'Oltin' },
  platinum: { ru: 'Платина', uz: 'Platina' },
};

/** Закрыт ли раздел для пользователя по тиру (UX-гейтинг). */
export function isTierGated(
  pageKey: string,
  role: string | null | undefined,
  tier: Tier | null,
): boolean {
  if (!PROGRESSIVE_DISCLOSURE_ENABLED) return false;
  if (!role || !GATING_ROLES.includes(role)) return false;
  const need = MIN_TIER_BY_PAGE[pageKey];
  if (!need) return false;
  return TIER_RANK[tier ?? 'bronze'] < TIER_RANK[need];
}

/** Разделы, открывающиеся на следующих тирах (для подсказки «скоро откроется»). */
export function nextUnlocks(
  tier: Tier | null,
  lang: 'ru' | 'uz',
): { page: string; tier: string; rank: number }[] {
  if (!PROGRESSIVE_DISCLOSURE_ENABLED) return [];
  const cur = TIER_RANK[tier ?? 'bronze'];
  return Object.entries(MIN_TIER_BY_PAGE)
    .filter(([, t]) => TIER_RANK[t] > cur)
    .sort((a, b) => TIER_RANK[a[1]] - TIER_RANK[b[1]])
    .map(([page, t]) => ({
      page: PAGE_LABELS[page]?.[lang] ?? page,
      tier: TIER_LABELS[t][lang],
      rank: TIER_RANK[t],
    }));
}
