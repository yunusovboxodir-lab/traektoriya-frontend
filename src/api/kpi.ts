import { api } from './client';

// ---------------------------------------------------------------------------
// Типы KPI (Scoring v2.0, Этап 2 — 4 компонента)
// ---------------------------------------------------------------------------

/** Компоненты KPI (0–100 каждый). */
export interface KPIComponents {
  sales: number;
  execution: number;
  learning: number;
  discipline: number;
}

/** Вклад каждого компонента с учётом cap-правила. */
export interface KPIContributions {
  sales: number;
  execution: number;
  learning: number;
  discipline: number;
}

/** Веса компонентов (должны суммироваться в 1.0). */
export interface KPIWeights {
  sales: number;
  execution: number;
  learning: number;
  discipline: number;
}

/**
 * Поле breakdown — полная детализация KPI (Scoring v2.0, Этап 2).
 * Присутствует в KPIRecord если период рассчитан по новой формуле.
 */
export interface KPIBreakdown {
  formula: string;
  components: KPIComponents;
  contributions: KPIContributions;
  kpi_raw: number;
  streak_bonus: number;
  streak_days: number;
  kpi_final: number;
  /** true = прокси до интеграции CRM, данные предварительные */
  proxy: {
    sales: boolean;
    discipline: boolean;
  };
  weights: KPIWeights;
  learning_detail?: Record<string, unknown>;
  execution_detail?: Record<string, unknown>;
  discipline_detail?: Record<string, unknown>;
}

/**
 * Запись KPIRecord из /api/v1/kpi/my и /api/v1/kpi/{user_id}.
 *
 * Обратная совместимость:
 *   ai_score    = Sales (прокси)
 *   lms_score   = Learning
 *   crm_score   = Execution
 *   total_kpi   = KPI_final
 *
 * Полная детализация 4 компонентов — в поле breakdown (может отсутствовать
 * для старых записей, рассчитанных до Этапа 2).
 */
export interface KPIRecord {
  id: string;
  user_id: string;
  period: string;
  /** Sales-прокси (обратная совместимость). */
  ai_score: number;
  /** Learning-score (обратная совместимость). */
  lms_score: number;
  /** Execution-score (обратная совместимость). */
  crm_score: number;
  /** KPI_final = итоговый KPI с учётом streak-бонуса. */
  total_kpi: number;
  /** Полная детализация 4 компонентов — только в Этапе 2+. */
  breakdown?: KPIBreakdown;
  calculated_at?: string;
  is_closed?: boolean;
}

// ---------------------------------------------------------------------------
// Типы Чемпионата-2026 (Scoring v2.0, Этап 3)
// ---------------------------------------------------------------------------

/**
 * Лидер чемпионата — место в лиге по перцентилю закрытого периода.
 */
export interface ChampionshipLeader {
  rank: number;
  user_id: string;
  full_name: string;
  employee_id: string;
  role: string;
  /** KPI_final закрытого периода. */
  kpi_final: number;
  /** Перцентиль внутри лиги (100 = лучший). */
  percentile: number;
}

/**
 * Участник категории «Лучший прирост» — рост KPI к прошлому закрытому периоду.
 */
export interface ChampionshipImproved {
  user_id: string;
  full_name: string;
  employee_id: string;
  role: string;
  /** Прирост KPI (kpi_final текущий − прошлый). */
  delta: number;
  /** KPI прошлого периода. */
  from: number;
  /** KPI текущего периода. */
  to: number;
}

/**
 * Ответ GET /api/v1/kpi/championship.
 * period может быть null если ещё нет закрытых периодов.
 */
export interface ChampionshipResponse {
  period: string | null;
  previous_period: string | null;
  league: string;
  ranked_by: string;
  closed: boolean;
  computed_at: string | null;
  leaders: ChampionshipLeader[];
  most_improved: ChampionshipImproved[];
  /** Присутствует при пустом результате (нет закрытых периодов). */
  note?: string;
}

export const kpiApi = {
  getMyKPI: (period?: string) =>
    api.get('/api/v1/kpi/my', { params: period ? { period } : {} }),

  getUserKPI: (userId: string, period?: string) =>
    api.get(`/api/v1/kpi/${userId}`, { params: period ? { period } : {} }),

  getLeaderboard: (params?: { period?: string; limit?: number; role?: string }) =>
    api.get('/api/v1/kpi/leaderboard/top', { params }),

  getLeaderboardAggregate: (params: { from_period: string; to_period: string; limit?: number; role?: string }) =>
    api.get('/api/v1/kpi/leaderboard/aggregate', { params }),

  getTeamRatings: (period?: string) =>
    api.get('/api/v1/kpi/team-rating/all', { params: period ? { period } : {} }),

  calculate: (userId?: string, period?: string) =>
    api.post('/api/v1/kpi/calculate', { user_id: userId, period }),

  recordBonus: (userId: string, taskId: string, basePoints?: number) =>
    api.post('/api/v1/kpi/bonus', {
      user_id: userId,
      task_id: taskId,
      base_points: basePoints ?? 10,
    }),

  getBoostTips: () =>
    api.get('/api/v1/kpi/boost-tips'),

  /**
   * Чемпионат-2026 (Scoring v2.0, Этап 3).
   * Ранжирование по перцентилю внутри лиги по ЗАКРЫТЫМ периодам.
   * + категория «Лучший прирост» (рост к прошлому закрытому периоду).
   */
  getChampionship: (params?: { period?: string; role?: string; limit?: number }) =>
    api.get<ChampionshipResponse>('/api/v1/kpi/championship', { params }),
};
