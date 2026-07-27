import { api } from './client';

export const analyticsApi = {
  getOverview: (params?: { period?: string }) =>
    api.get('/api/v1/analytics/overview', { params }),
  getLeaderboard: (params?: { period?: string; team_id?: string }) =>
    api.get('/api/v1/analytics/leaderboard', { params }),
  getLearningMetrics: () => api.get('/api/v1/analytics/learning'),
  getProductStats: () => api.get('/api/v1/analytics/products'),
  getTeamAnalytics: (teamId: string) =>
    api.get(`/api/v1/analytics/team/${teamId}`),
  getUserStats: (userId: string) =>
    api.get(`/api/v1/analytics/user/${userId}`),
  exportAnalytics: (reportType: 'kpi' | 'tasks' | 'overview', period?: string) =>
    api.get('/api/v1/analytics/export', {
      params: { report_type: reportType, ...(period ? { period } : {}) },
      responseType: 'blob',
    }),

  // AI L&D Analytics
  getLmsDashboard: (params?: { track?: string }) =>
    api.get('/api/v1/analytics/lms/dashboard', { params }),
  getLmsClusters: (params?: { week?: string; status?: string; category?: string; track?: string }) =>
    api.get('/api/v1/analytics/lms/clusters', { params }),
  getLmsInsights: () => api.get('/api/v1/analytics/lms/insights'),
  getLmsKpiMapping: (params?: { track?: string }) =>
    api.get('/api/v1/analytics/lms/kpi-mapping', { params }),

  // ROI обучения: петля «обучение → KPI-дельта»
  getLearningRoi: (params?: { baseline?: string; region?: string }) =>
    api.get<LearningRoiData>('/api/v1/analytics/learning-roi', { params }),

  // Пульс обучения (exec-дашборд руководителя, вкладка «Обзор»)
  getLearningPulse: (params?: { exclude_demo?: boolean }) =>
    api.get<LearningPulseData>('/api/v1/analytics/learning-pulse', {
      params: { exclude_demo: true, ...params },
    }),
};

// --- ROI обучения ---

export interface RoiProgramRow {
  type: 'offline';
  code: string;
  title: string;
  participants: number;
  avg_pre: number | null;
  avg_post: number | null;
  learning_gain: number | null;
  participants_with_kpi: number;
  avg_kpi_baseline: number | null;
  avg_kpi_next: number | null;
  avg_kpi_delta: number | null;
}

export interface RoiCourseRow {
  type: 'online';
  section: string;
  title: string;
  completions: number;
  avg_quiz: number | null;
  participants_with_kpi: number;
  avg_kpi_baseline: number | null;
  avg_kpi_next: number | null;
  avg_kpi_delta: number | null;
}

export interface LearningRoiData {
  period: { baseline: string; comparison: string };
  summary: {
    trainings: number;
    participants: number;
    participants_with_kpi: number;
    avg_kpi_delta: number | null;
  };
  programs: RoiProgramRow[];
  courses: RoiCourseRow[];
}

// ---------------------------------------------------------------------------
// Пульс обучения — exec-дашборд руководителя (замена вкладки «Обзор»)
// Контракт: GET /api/v1/analytics/learning-pulse?exclude_demo=true
// ---------------------------------------------------------------------------

export type LearningPulseRoleId = 'sales_rep' | 'supervisor' | 'regional_manager';

/** Ось компетенции, агрегированная бэком по всей роли (без разреза по городу/дилеру/команде). */
export interface LearningPulseRoleAxis {
  competency_id: string;
  name: string;
  name_uz: string;
  /** 0..1 — доля от целевого уровня */
  avg_pct: number;
  courses_completed: number;
  courses_total: number;
}

export interface LearningPulseRoleSummary {
  role: LearningPulseRoleId;
  role_ru: string;
  count: number;
  /** 0..1 */
  avg_pulse: number;
  axes: LearningPulseRoleAxis[];
}

/** Ось компетенции на уровне одного сотрудника (используется для клиентской агрегации при драм-дауне). */
export interface LearningPulsePersonAxis {
  name: string;
  name_uz?: string;
  /** 0..1 */
  pct: number;
  courses_completed: number;
  courses_total: number;
}

export interface LearningPulsePerson {
  user_id: string;
  employee_id: string;
  full_name: string;
  role: LearningPulseRoleId;
  city: string;
  dealer: string;
  team: string;
  supervisor_name: string;
  /** 0..1 */
  pulse: number;
  level_ru: string;
  active_minutes: number;
  last_login: string | null;
  courses_completed: number;
  axes: LearningPulsePersonAxis[];
}

export interface LearningPulseTeam {
  name: string;
  supervisor_name: string;
  members: number;
}

export interface LearningPulseDealer {
  name: string;
  teams: LearningPulseTeam[];
}

export interface LearningPulseCity {
  name: string;
  rm_name: string | null;
  dealers: LearningPulseDealer[];
}

export interface LearningPulseData {
  scope: { people_total: number; demo_excluded: number };
  roles: LearningPulseRoleSummary[];
  people: LearningPulsePerson[];
  hierarchy: { cities: LearningPulseCity[] };
}
