/**
 * demoData — демо-режим для тестового аккаунта «Продавец (тест)» / seller1.
 *
 * Зачем: показать активность ТП «глазами ТП», как будто он учится уже полгода,
 * не записывая ничего в прод-БД. Решение PO (2026-06-25).
 *
 * Как работает: axios-клиент (api/client.ts) в request-интерсепторе для СЕССИИ
 * seller1 подменяет ответы 5 эндпоинтов на эти мок-данные (запрос не уходит на
 * сервер). Поэтому данные видит ТОЛЬКО seller1 в своём браузере; на сервере их
 * нет → в реальном рейтинге других пользователей и у админа они не участвуют.
 *
 * Гейт читаем из localStorage (employee_id кладёт authStore при логине) — чтобы
 * не создавать цикл импортов client ↔ authStore.
 *
 * Профиль: «Золото / Эксперт», ~полгода обучения (значения согласованы между
 * Power / рейтингом / пульсом / достижениями).
 */

export const DEMO_EMPLOYEE_ID = 'seller1';

function ls(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

/** Текущая сессия = демо-аккаунт seller1? */
export function isDemoSession(): boolean {
  return ls('employee_id') === DEMO_EMPLOYEE_ID;
}

const DEMO_USER = {
  id: () => ls('user_id') || 'demo-seller1',
  employee_id: DEMO_EMPLOYEE_ID,
  full_name: () => ls('user_full_name') || 'Продавец (тест)',
};

// Дата «сегодня» по Ташкенту (UTC+5) в формате YYYY-MM-DD — для квестов дня.
function tashkentToday(): string {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const t = new Date(utcMs + 5 * 3600000);
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${t.getFullYear()}-${m}-${d}`;
}

// ── 1. Power / «Моя мощь» ─────────────────────────────────────────────
function demoPower() {
  return {
    user_id: DEMO_USER.id(),
    full_name: DEMO_USER.full_name(),
    employee_id: DEMO_USER.employee_id,
    role: 'sales_rep',
    power: 4850,
    tier: 'gold',
    next_tier: 'platinum',
    to_next_tier: 1150,
    breakdown: { business: 2100, learning: 1700, achievements: 650, streak: 400 },
    kpi_total: 78,
    current_streak_days: 24,
    courses_completed: 42,
    period: 'half_year',
  };
}

// ── 2. Рейтинг (Лига Чемпионов) ───────────────────────────────────────
function demoLeaderboard() {
  const myProgress = {
    current_level: 'expert',
    level_name: { ru: 'Эксперт', uz: 'Ekspert' },
    total_courses_completed: 42,
    total_time_spent_minutes: 1265,
    avg_quiz_score: 86,
    current_streak_days: 24,
    longest_streak_days: 31,
    last_activity_at: new Date().toISOString(),
    level_progress: {
      trainee:      { completed: 16, total: 16, percentage: 100 },
      practitioner: { completed: 14, total: 14, percentage: 100 },
      expert:       { completed: 12, total: 18, percentage: 67 },
      master:       { completed: 0,  total: 15, percentage: 0 },
    },
    sections_progress: null,
  };

  const mk = (
    rank: number, name: string, emp: string, total: number,
    learning: number, activity: number, streak: number,
    level: string, courses: number, quiz: number, streakDays: number,
    me = false,
  ) => ({
    rank, user_id: me ? DEMO_USER.id() : `u-${emp}`,
    full_name: me ? DEMO_USER.full_name() : name,
    employee_id: emp, role: 'sales_rep', current_level: level,
    courses_completed: courses, avg_quiz_score: quiz, current_streak_days: streakDays,
    is_current_user: me,
    learning_score: learning, activity_score: activity, streak_score: streak,
    total_score: total,
    activity_breakdown: { shelfscan: Math.round(activity * 2), tasks_rate: 88, achievements: 9 },
  });

  const leaderboard = [
    mk(1, 'Азизбек Хайдаров',  'nmedovand3-A1',  91, 47, 28, 16, 'master', 55, 90, 38),
    mk(2, 'Жасур Кадыров',     'nmedovsam3-A2',  88, 46, 27, 15, 'expert', 48, 88, 29),
    mk(3, DEMO_USER.full_name(), DEMO_EMPLOYEE_ID, 84, 44, 25, 15, 'expert', 42, 86, 24, true),
    mk(4, 'Шерзод Маматов',    'nmedovkok-A3',   80, 42, 24, 14, 'expert', 39, 84, 21),
    mk(5, 'Дилшод Рахимов',    'nmedovfer-A4',   76, 40, 23, 13, 'practitioner', 35, 82, 18),
    mk(6, 'Бекзод Юсупов',     'nmedovbux-A5',   71, 37, 21, 13, 'practitioner', 31, 79, 16),
    mk(7, 'Отабек Нуров',      'nmtash3-A6',     66, 34, 20, 12, 'practitioner', 27, 77, 12),
    mk(8, 'Сардор Каримов',    'nmedovnam-A7',   59, 30, 18, 11, 'trainee', 22, 74, 9),
  ];

  return {
    my_rank: 3,
    total_in_group: 51,
    my_progress: myProgress,
    leaderboard,
    formula: {
      weights: { learning: 50, activity: 30, streak: 20 },
      components: { learning: '50% обучение', activity: '30% активность', streak: '20% streak' },
      period: 'half_year',
      period_days: 180,
      role: 'sales_rep',
      is_admin_view: false,
      kpi_pending_crm: true,
      version: 'demo-1',
    },
  };
}

// ── 3. Пульс компетенций ──────────────────────────────────────────────
function demoPulse(userId: string) {
  const lvl = (pct: number) =>
    pct >= 85 ? ['expert', 'Эксперт', 'Ekspert']
    : pct >= 70 ? ['practitioner', 'Практик', 'Amaliyotchi']
    : ['trainee', 'Стажёр', 'Stajyor'];
  const comp = (
    id: string, nameRu: string, nameUz: string, order: number, pct: number,
    done: number, total: number, quiz: number,
  ) => {
    const [l, ru, uz] = lvl(pct);
    return {
      competency_id: id, competency_name: nameRu, competency_name_uz: nameUz,
      sort_order: order, pulse_pct: pct, pulse_level: l, pulse_level_ru: ru, pulse_level_uz: uz,
      courses_completed: done, courses_total: total, score_earned: Math.round(pct * 1.2),
      score_max: 120, avg_quiz_score: quiz,
    };
  };
  return {
    user_id: userId || DEMO_USER.id(),
    overall_pulse: 82,
    overall_level: 'expert',
    overall_level_ru: 'Эксперт',
    overall_level_uz: 'Ekspert',
    total_earned: 590,
    total_max: 720,
    competencies: [
      comp('c1', 'Шаги визита',           'Tashrif bosqichlari',   1, 92, 8, 8, 90),
      comp('c2', 'Работа с возражениями', 'E’tirozlar bilan ishlash', 2, 86, 7, 8, 87),
      comp('c3', 'Мерчендайзинг',         'Merchandayzing',        3, 80, 6, 8, 83),
      comp('c4', 'Знание продукта',       'Mahsulotni bilish',     4, 88, 7, 7, 89),
      comp('c5', 'Переговоры о цене',     'Narx bo’yicha muzokara', 5, 74, 5, 7, 79),
      comp('c6', 'Планирование дня',      'Kun rejalashtirish',    6, 78, 5, 6, 81),
    ],
  };
}

// ── 4. Достижения ─────────────────────────────────────────────────────
function demoAchievements() {
  const iso = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };
  const a = (
    code: string, title: string, desc: string, icon: string,
    tier: string, points: number, daysAgo: number,
  ) => ({ id: code, code, title, description: desc, icon, tier, points, earned_at: iso(daysAgo) });

  return {
    total_points: 650,
    items: [
      a('first_course', 'Первый курс',        'Пройден первый курс',           '🎓', 'bronze',  20, 175),
      a('streak_7',     'Неделя в строю',      '7 дней подряд',                 '🔥', 'bronze',  30, 150),
      a('streak_30',    'Месяц дисциплины',    '30 дней подряд',                '🔥', 'silver',  80, 40),
      a('courses_25',   'Четверть сотни',      '25 курсов пройдено',            '📚', 'silver',  90, 60),
      a('quiz_ace',     'Снайпер тестов',      '10 тестов на 90%+',             '🎯', 'silver',  70, 35),
      a('expert_level', 'Эксперт',             'Достигнут уровень «Эксперт»',   '⭐', 'gold',   150, 28),
      a('objection_pro','Мастер возражений',   'Секция «Возражения» на 85%+',   '💬', 'gold',   120, 20),
      a('top3',         'Призёр лиги',         'Топ-3 в рейтинге ТП',           '🏆', 'gold',    90, 7),
    ],
  };
}

// ── 5. Квесты дня (goals) ─────────────────────────────────────────────
function demoGoals() {
  const today = tashkentToday();
  const g = (
    id: string, title: string, titleUz: string, icon: string, order: number,
    target: number, current: number, status: string,
  ) => ({
    id, title, description: null, type: 'daily_quest',
    target_value: target, current_value: current, unit: null, status,
    percentage: Math.round((current / target) * 100),
    deadline: null, created_at: new Date().toISOString(),
    metadata: { quest_date: today, category: 'daily', order, icon, title_uz: titleUz },
  });
  return {
    items: [
      g('q1', 'Пройди 1 урок',           'Bitta darsni o’ting',      '📚', 1, 1, 1, 'completed'),
      g('q2', 'Набери 90%+ в тесте',     'Testda 90%+ to’pla',       '🎯', 2, 1, 0, 'active'),
      g('q3', 'Загляни в рейтинг',       'Reytingga qarab chiq',          '🏆', 3, 1, 0, 'active'),
    ],
  };
}

/**
 * Вернуть мок-ответ для демо-сессии по конфигу запроса, либо undefined (тогда
 * запрос уходит на сервер как обычно). Только GET.
 */
export function getDemoResponse(url: string | undefined, method: string | undefined): unknown | undefined {
  if (!url) return undefined;
  if ((method || 'get').toLowerCase() !== 'get') return undefined;
  const path = url.split('?')[0];

  if (path === '/api/v1/power/my') return demoPower();
  if (path === '/api/v1/learning/leaderboard') return demoLeaderboard();
  if (path.startsWith('/api/v1/pulse/user/')) return demoPulse(path.split('/').pop() || '');
  if (path === '/api/v1/achievements') return demoAchievements();
  if (path === '/api/v1/goals') return demoGoals();

  return undefined;
}
