// API клиент Module 17: Case Studio (Кейсотека)
import { api } from './client';
import type {
  CaseCategory,
  CaseScenario,
  CaseScenarioDetail,
  CaseScenarioStatus,
  CaseSolution,
  CaseTargetRole,
  CategoryCreateIn,
  CategoryUpdateIn,
  CaseRating,
  LeaderboardEntry,
  MyStats,
  RatingCreateIn,
  ScenarioCreateIn,
  ScenarioUpdateIn,
  SolutionCreateIn,
} from '../types/caseStudio';

const PREFIX = '/api/v1/case-studio';

export const caseStudioApi = {
  // -------------------------- Categories --------------------------
  listCategories: (params?: { only_active?: boolean }) =>
    api.get<CaseCategory[]>(`${PREFIX}/categories`, { params }),

  createCategory: (data: CategoryCreateIn) =>
    api.post<CaseCategory>(`${PREFIX}/categories`, data),

  updateCategory: (id: string, data: CategoryUpdateIn) =>
    api.patch<CaseCategory>(`${PREFIX}/categories/${id}`, data),

  deleteCategory: (id: string) =>
    api.delete<void>(`${PREFIX}/categories/${id}`),

  // -------------------------- Scenarios --------------------------
  listScenarios: (params?: {
    target_role?: CaseTargetRole;
    category_id?: string;
    status?: CaseScenarioStatus;
    only_with_etalon?: boolean;
    skip?: number;
    limit?: number;
  }) => api.get<CaseScenario[]>(`${PREFIX}/scenarios`, { params }),

  getScenario: (id: string) =>
    api.get<CaseScenarioDetail>(`${PREFIX}/scenarios/${id}`),

  createScenario: (data: ScenarioCreateIn) =>
    api.post<CaseScenario>(`${PREFIX}/scenarios`, data),

  updateScenario: (id: string, data: ScenarioUpdateIn) =>
    api.patch<CaseScenario>(`${PREFIX}/scenarios/${id}`, data),

  publishScenario: (id: string) =>
    api.post<CaseScenario>(`${PREFIX}/scenarios/${id}/publish`),

  archiveScenario: (id: string) =>
    api.post<CaseScenario>(`${PREFIX}/scenarios/${id}/archive`),

  deleteScenario: (id: string) =>
    api.delete<void>(`${PREFIX}/scenarios/${id}`),

  assignTasks: (
    scenarioId: string,
    payload: {
      mode: 'by_users' | 'by_roles';
      user_ids?: string[];
      roles?: string[];
      priority: 'low' | 'medium' | 'high';
      due_in_days: number;
    },
  ) =>
    api.post<{ created: number; assignee_count: number; skipped_quota: number }>(
      `${PREFIX}/scenarios/${scenarioId}/assign-tasks`,
      payload,
    ),

  // -------------------------- Solutions --------------------------
  addSolution: (scenarioId: string, data: SolutionCreateIn) =>
    api.post<CaseSolution>(`${PREFIX}/scenarios/${scenarioId}/solutions`, data),

  // -------------------------- Ratings --------------------------
  rate: (data: RatingCreateIn) =>
    api.post<CaseRating>(`${PREFIX}/ratings`, data),

  // -------------------------- XP / Leaderboard --------------------------
  leaderboard: (limit = 20) =>
    api.get<LeaderboardEntry[]>(`${PREFIX}/leaderboard`, { params: { limit } }),

  myStats: () => api.get<MyStats>(`${PREFIX}/my-stats`),
};
