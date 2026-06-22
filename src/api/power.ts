import { api } from './client';

export interface PowerBreakdown {
  business: number;
  learning: number;
  achievements: number;
  streak: number;
}

export interface PowerResponse {
  user_id: string;
  full_name: string | null;
  employee_id: string | null;
  role: string | null;
  power: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  next_tier: 'silver' | 'gold' | 'platinum' | null;
  to_next_tier: number;
  breakdown: PowerBreakdown;
  kpi_total: number;
  current_streak_days: number;
  courses_completed: number;
  period: string;
}

export const powerApi = {
  // Накопительная «Мощь ТП» текущего пользователя (read-only, все роли).
  getMyPower: (period?: string) =>
    api.get<PowerResponse>('/api/v1/power/my', { params: period ? { period } : {} }),
};
