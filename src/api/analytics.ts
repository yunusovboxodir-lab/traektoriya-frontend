import { api } from './client';

export const analyticsApi = {
  getOverview: () => api.get('/api/v1/analytics/overview'),
  getLeaderboard: (params?: { period?: string }) =>
    api.get('/api/v1/analytics/leaderboard', { params }),
  getLearningMetrics: () => api.get('/api/v1/analytics/learning'),
  getProductStats: () => api.get('/api/v1/analytics/products'),
};
