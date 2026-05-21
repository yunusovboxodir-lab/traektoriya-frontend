import { api } from './client';

export interface TeamMember {
  id: string;
  employee_id: string;
  full_name: string;
  email: string | null;
  role: string;
  is_active: boolean;
  region: string | null;
  city: string | null;
  position: string | null;
  tenant_id: string;
  created_at: string;
  last_login: string | null;
  total_active_minutes: number;
}

// --- Team Learning Analytics ---

export interface MemberLearningData {
  id: string;
  name: string;
  employee_id: string;
  current_level: string;
  courses_completed: number;
  courses_total: number;
  completion_percentage: number;
  avg_quiz_score: number;
  last_activity_at: string | null;
  days_since_activity: number;
  current_streak_days: number;
  total_time_spent_minutes: number;
  lms_score: number;
  needs_attention: boolean;
  attention_reasons: string[];
}

export interface LevelDistribution {
  level: string;
  count: number;
  percentage: number;
}

export interface TeamLearningResponse {
  total_members: number;
  avg_completion_percentage: number;
  avg_quiz_score: number;
  active_learners_7d: number;
  members_needing_attention: number;
  level_distribution: LevelDistribution[];
  members: MemberLearningData[];
}

// --- Регионы и дилеры (для каскадных выпадашек) ---

export interface Region {
  id: string;
  name: string;
  country: string;
  is_active: boolean;
}

export interface Dealer {
  id: string;
  name: string;
  region_id: string;
  region_name: string | null;
  contact_info: Record<string, unknown> | null;
  is_active: boolean;
}

export interface Team {
  id: string;
  name: string;
  supervisor_id: string | null;
  dealer_id: string;
  region_id: string;
  is_active: boolean;
  member_count?: number;
  supervisor_name?: string | null;
  dealer_name?: string | null;
  region_name?: string | null;
}

export const teamApi = {
  getMembers: (skip = 0, limit = 100) =>
    api.get<TeamMember[]>(`/api/v1/users?skip=${skip}&limit=${limit}`),

  getTeamLearning: () =>
    api.get<TeamLearningResponse>('/api/v1/supervisor/team-learning'),

  // --- Регионы ---
  getRegions: (includeInactive = false) =>
    api.get<{ items: Region[]; total: number }>('/api/v1/teams/regions', {
      params: includeInactive ? { include_inactive: true } : undefined,
    }),

  createRegion: (data: { name: string; country?: string }) =>
    api.post<Region & { message: string }>('/api/v1/teams/regions', data),

  updateRegion: (regionId: string, data: { name?: string; country?: string; is_active?: boolean }) =>
    api.patch<Region & { message: string }>(`/api/v1/teams/regions/${regionId}`, data),

  // --- Дилеры ---
  getDealers: (regionId?: string, includeInactive = false) =>
    api.get<{ items: Dealer[]; total: number }>('/api/v1/teams/dealers', {
      params: {
        ...(regionId ? { region_id: regionId } : {}),
        ...(includeInactive ? { include_inactive: true } : {}),
      },
    }),

  createDealer: (data: { name: string; region_id: string; contact_info?: Record<string, unknown> }) =>
    api.post<Dealer & { message: string }>('/api/v1/teams/dealers', data),

  updateDealer: (dealerId: string, data: { name?: string; region_id?: string; is_active?: boolean }) =>
    api.patch<Dealer & { message: string }>(`/api/v1/teams/dealers/${dealerId}`, data),

  // --- Команды (носитель связи супервайзер → дилер) ---
  getTeams: (params?: { dealer_id?: string; region_id?: string; supervisor_id?: string }) =>
    api.get<{ items: Team[]; total: number }>('/api/v1/teams', { params }),

  createTeam: (data: { name: string; dealer_id: string; region_id: string; supervisor_id?: string }) =>
    api.post<Team & { message: string }>('/api/v1/teams', data),

  updateTeam: (teamId: string, data: { name?: string; supervisor_id?: string; dealer_id?: string; region_id?: string; is_active?: boolean }) =>
    api.patch<Team & { message: string }>(`/api/v1/teams/${teamId}`, data),
};
