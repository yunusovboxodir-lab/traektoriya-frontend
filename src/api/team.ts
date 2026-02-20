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

export const teamApi = {
  getMembers: (skip = 0, limit = 100) =>
    api.get<TeamMember[]>(`/api/v1/users?skip=${skip}&limit=${limit}`),

  getTeamLearning: () =>
    api.get<TeamLearningResponse>('/api/v1/supervisor/team-learning'),
};
