import { api } from './client';

export const kpiApi = {
  getMyKPI: (period?: string) =>
    api.get('/api/v1/kpi/my', { params: period ? { period } : {} }),

  getUserKPI: (userId: string, period?: string) =>
    api.get(`/api/v1/kpi/${userId}`, { params: period ? { period } : {} }),

  getLeaderboard: (params?: { period?: string; limit?: number }) =>
    api.get('/api/v1/kpi/leaderboard/top', { params }),

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
};
