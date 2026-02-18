import { api } from './client';

// ───────────────────────────────────────
// Types
// ───────────────────────────────────────

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  type: 'learning' | 'shelf_quality' | 'kpi' | 'custom';
  target_value: number;
  current_value: number;
  unit: string | null;
  status: 'active' | 'completed' | 'failed' | 'paused';
  percentage: number;
  deadline: string | null;
  created_at: string;
}

export interface Nudge {
  id: string;
  type: 'reminder' | 'suggestion' | 'alert' | 'celebration';
  title: string;
  message: string;
  action_url: string | null;
  action_text: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  earned_at: string;
}

export interface AchievementCatalogItem {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  source_module: string | null;
}

// ───────────────────────────────────────
// API
// ───────────────────────────────────────

export const goalsApi = {
  list: (status?: string) =>
    api.get<{ items: Goal[] }>('/api/v1/goals', { params: status ? { status } : {} }),

  update: (id: string, data: Partial<Pick<Goal, 'status' | 'current_value'>>) =>
    api.patch<Goal>('/api/v1/goals/' + id, data),
};

export const nudgesApi = {
  list: (params?: { unread_only?: boolean; limit?: number }) =>
    api.get<{ items: Nudge[] }>('/api/v1/nudges', { params }),

  markRead: (id: string) =>
    api.patch('/api/v1/nudges/' + id + '/read'),
};

export const achievementsApi = {
  my: () =>
    api.get<{ items: UserAchievement[]; total_points: number }>('/api/v1/achievements'),

  catalog: () =>
    api.get<{ items: AchievementCatalogItem[] }>('/api/v1/achievements/catalog'),
};
