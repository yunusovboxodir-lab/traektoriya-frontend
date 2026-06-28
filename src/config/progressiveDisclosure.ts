/**
 * Прогрессивное раскрытие разделов (онбординг «с нуля», по мотивам Last Z).
 *
 * Решение владельца 2026-06-27: НОВЫЙ полевой сотрудник (ТП/СВ/РМ) в день-1
 * видит ТОЛЬКО «Обучение». Остальные разделы открываются по мере роста тира
 * Мощи — как призовые сундуки (анимация + пояснение «зачем раздел и как им
 * пользоваться»). Админ/суперадмин/ком.дир — полный доступ без онбординга.
 *
 * Раскрытие — UX-слой поверх role-scopes (тир не даёт доступа сверх роли).
 *
 * Включение:
 *   - глобально (прод): env `VITE_PROGRESSIVE_DISCLOSURE='true'` в Vercel;
 *   - локально для теста: `localStorage['traektoriya-progressive']='on'|'off'` + reload.
 * ВКЛЮЧЁН ПО УМОЛЧАНИЮ (владелец 2026-06-28). Глобально выключить:
 *   - env `VITE_PROGRESSIVE_DISCLOSURE='false'` в Vercel, ИЛИ
 *   - per-browser: `localStorage['traektoriya-progressive']='off'` (для эксперт-ревью).
 */

function readLocalOverride(): 'on' | 'off' | null {
  try {
    const v = typeof localStorage !== 'undefined'
      ? localStorage.getItem('traektoriya-progressive')
      : null;
    if (v === 'on' || v === 'off') return v;
  } catch { /* private mode */ }
  return null;
}

const _localOverride = readLocalOverride();
export const PROGRESSIVE_DISCLOSURE_ENABLED =
  _localOverride === 'on' ? true
  : _localOverride === 'off' ? false
  : import.meta.env.VITE_PROGRESSIVE_DISCLOSURE !== 'false'; // по умолчанию ВКЛ

export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';

export const TIER_RANK: Record<Tier, number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
};

export const TIER_LABELS: Record<Tier, { ru: string; uz: string }> = {
  bronze: { ru: 'Бронза', uz: 'Bronza' },
  silver: { ru: 'Серебро', uz: 'Kumush' },
  gold: { ru: 'Золото', uz: 'Oltin' },
  platinum: { ru: 'Платина', uz: 'Platina' },
};

/**
 * Гейтим полевые роли (онбординг с нуля для всех — решение владельца).
 * Админ/суперадмин/ком.дир — полный доступ (тренер/директор, без онбординга).
 */
export const GATING_ROLES = ['sales_rep', 'supervisor', 'regional_manager'];

/**
 * Раздел → при каком тире Мощи открывается + пояснение для сундука-разблокировки.
 * Разделов, которых тут НЕТ, гейтинг не трогает (всегда видны): `learning` (день-1),
 * `dashboard`/`tasks`/... — перечислены явно. Веса/порядок тюнятся по пилоту.
 *
 * День-1 (bronze) = только «Обучение» (его тут нет → всегда видно).
 */
export interface UnlockInfo {
  tier: Tier;
  icon: string;
  label: { ru: string; uz: string };
  /** Зачем раздел + как пользоваться (для окна-пояснения при разблокировке). */
  desc: { ru: string; uz: string };
}

export const PAGE_UNLOCKS: Record<string, UnlockInfo> = {
  dashboard: {
    tier: 'silver', icon: '🏠',
    label: { ru: 'Главная', uz: 'Bosh sahifa' },
    desc: {
      ru: 'Твой прогресс и место в рейтинге. Заходи, чтобы видеть рост Мощи и сравнивать себя с командой.',
      uz: 'Sening progressing va reytingdagi o‘rning. Kuch o‘sishini ko‘rish va jamoa bilan solishtirish uchun kir.',
    },
  },
  tasks: {
    tier: 'silver', icon: '📋',
    label: { ru: 'Задачи', uz: 'Vazifalar' },
    desc: {
      ru: 'Здесь твои рабочие задачи и поручения. Отмечай выполненное — это влияет на Мощь.',
      uz: 'Bu yerda ish vazifalaring. Bajarilganini belgilab bor — bu Kuchga ta’sir qiladi.',
    },
  },
  products: {
    tier: 'gold', icon: '📦',
    label: { ru: 'Товары', uz: 'Mahsulotlar' },
    desc: {
      ru: 'Карточки продуктов: характеристики, выгоды, аргументы для клиента. Открывай перед визитом.',
      uz: 'Mahsulot kartalari: xususiyatlar, foydalar, mijoz uchun dalillar. Tashrifdan oldin och.',
    },
  },
  goals: {
    tier: 'gold', icon: '🏆',
    label: { ru: 'Цели', uz: 'Maqsadlar' },
    desc: {
      ru: 'Твои цели и челленджи. Выполняй, чтобы быстрее расти и попадать в топ.',
      uz: 'Maqsad va challenjlaring. Tezroq o‘sish va topga chiqish uchun bajar.',
    },
  },
  competencies: {
    tier: 'gold', icon: '🎯',
    label: { ru: 'Компетенции', uz: 'Kompetensiyalar' },
    desc: {
      ru: 'Карта твоих навыков. Видно, где силён и что подтянуть — с подсказками, какие курсы помогут.',
      uz: 'Ko‘nikmalaring xaritasi. Qayerda kuchli, nimani yaxshilash kerakligi — qaysi kurs yordam berishi bilan.',
    },
  },
  offline: {
    tier: 'gold', icon: '📅',
    label: { ru: 'Активности', uz: 'Faolliklar' },
    desc: {
      ru: 'Офлайн-тренинги и мероприятия. Записывайся и проходи — за это тоже растёт Мощь.',
      uz: 'Oflayn treninglar va tadbirlar. Yozil va o‘t — buning uchun ham Kuch oshadi.',
    },
  },
  analytics: {
    tier: 'platinum', icon: '📊',
    label: { ru: 'Аналитика', uz: 'Tahlil' },
    desc: {
      ru: 'Глубокая статистика по обучению и результатам. Для тех, кто хочет видеть картину целиком.',
      uz: 'O‘qish va natijalar bo‘yicha chuqur statistika. Umumiy manzarani ko‘rmoqchilar uchun.',
    },
  },
  team: {
    tier: 'platinum', icon: '👥',
    label: { ru: 'Команда', uz: 'Jamoa' },
    desc: {
      ru: 'Твоя команда и её прогресс. Смотри, кто рядом и как идут дела у коллег.',
      uz: 'Jamoang va uning progressi. Yoningda kim borligi va hamkasblar ahvolini ko‘r.',
    },
  },
  case_studio: {
    tier: 'platinum', icon: '🗂️',
    label: { ru: 'Кейсотека', uz: 'Keyslar' },
    desc: {
      ru: 'Разбор реальных рабочих ситуаций. Тренируйся на кейсах, чтобы увереннее действовать в поле.',
      uz: 'Haqiqiy ish vaziyatlari tahlili. Maydonda ishonchli harakat qilish uchun keyslarda mashq qil.',
    },
  },
  training_plan: {
    tier: 'platinum', icon: '🎓',
    label: { ru: 'План обучения', uz: "O'qish rejasi" },
    desc: {
      ru: 'Твой персональный маршрут обучения. Видно, что пройти дальше и в каком порядке.',
      uz: 'Shaxsiy o‘qish marshruting. Keyin nimani va qaysi tartibda o‘tishni ko‘rsatadi.',
    },
  },
};

/** pageKey → минимальный тир (производное от PAGE_UNLOCKS). */
export const MIN_TIER_BY_PAGE: Record<string, Tier> = Object.fromEntries(
  Object.entries(PAGE_UNLOCKS).map(([page, info]) => [page, info.tier]),
);

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

/** Разделы, открывающиеся ИМЕННО на этом тире (для сундука-разблокировки). */
export function pagesUnlockedAtTier(tier: Tier): string[] {
  return Object.entries(PAGE_UNLOCKS)
    .filter(([, info]) => info.tier === tier)
    .map(([page]) => page);
}

/** Все разделы, доступные на данном тире и ниже (накопительно). */
export function pagesUnlockedUpTo(tier: Tier | null): string[] {
  const r = TIER_RANK[tier ?? 'bronze'];
  return Object.entries(PAGE_UNLOCKS)
    .filter(([, info]) => TIER_RANK[info.tier] <= r)
    .map(([page]) => page);
}

/** Разделы, открывающиеся на следующих тирах (для подсказки «скоро откроется»). */
export function nextUnlocks(
  tier: Tier | null,
  lang: 'ru' | 'uz',
): { page: string; tier: string; rank: number; label: string; icon: string }[] {
  if (!PROGRESSIVE_DISCLOSURE_ENABLED) return [];
  const cur = TIER_RANK[tier ?? 'bronze'];
  return Object.entries(PAGE_UNLOCKS)
    .filter(([, info]) => TIER_RANK[info.tier] > cur)
    .sort((a, b) => TIER_RANK[a[1].tier] - TIER_RANK[b[1].tier])
    .map(([page, info]) => ({
      page,
      tier: TIER_LABELS[info.tier][lang],
      rank: TIER_RANK[info.tier],
      label: info.label[lang],
      icon: info.icon,
    }));
}
