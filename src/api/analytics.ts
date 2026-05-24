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
