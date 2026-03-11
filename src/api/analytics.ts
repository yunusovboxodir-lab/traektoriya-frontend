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
};
