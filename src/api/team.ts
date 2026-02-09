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
}

export interface UserProgress {
  user_id: string;
  courses_enrolled: number;
  courses_completed: number;
  lessons_completed: number;
  quizzes_passed: number;
  average_score: number;
  total_time_spent_minutes: number;
  last_activity: string | null;
}

export const teamApi = {
  getMembers: (skip = 0, limit = 100) =>
    api.get<TeamMember[]>(`/api/v1/users?skip=${skip}&limit=${limit}`),

  getUserProgress: async (userId: string) => {
    try {
      return await api.get<UserProgress>(`/api/v1/progress/user/${userId}`);
    } catch {
      return { data: null };
    }
  },

  getTeamStats: async () => {
    try {
      return await api.get('/api/v1/analytics/team');
    } catch {
      return { data: null };
    }
  },
};
