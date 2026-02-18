import { create } from 'zustand';
import {
  goalsApi,
  nudgesApi,
  achievementsApi,
  type Goal,
  type Nudge,
  type UserAchievement,
  type AchievementCatalogItem,
} from '../api/goals';

interface GoalsState {
  goals: Goal[];
  nudges: Nudge[];
  achievements: UserAchievement[];
  catalog: AchievementCatalogItem[];
  totalPoints: number;
  loading: boolean;

  fetchGoals: (status?: string) => Promise<void>;
  fetchNudges: (unreadOnly?: boolean, limit?: number) => Promise<void>;
  markNudgeRead: (id: string) => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchCatalog: () => Promise<void>;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  nudges: [],
  achievements: [],
  catalog: [],
  totalPoints: 0,
  loading: false,

  fetchGoals: async (status?: string) => {
    set({ loading: true });
    try {
      const res = await goalsApi.list(status);
      set({ goals: res.data.items });
    } catch {
      // keep existing state
    } finally {
      set({ loading: false });
    }
  },

  fetchNudges: async (unreadOnly = true, limit = 3) => {
    try {
      const res = await nudgesApi.list({ unread_only: unreadOnly, limit });
      set({ nudges: res.data.items });
    } catch {
      // keep existing
    }
  },

  markNudgeRead: async (id: string) => {
    // Optimistic update
    set((s) => ({ nudges: s.nudges.filter((n) => n.id !== id) }));
    try {
      await nudgesApi.markRead(id);
    } catch {
      // Refetch on error
      get().fetchNudges();
    }
  },

  fetchAchievements: async () => {
    try {
      const res = await achievementsApi.my();
      set({ achievements: res.data.items, totalPoints: res.data.total_points });
    } catch {
      // keep existing
    }
  },

  fetchCatalog: async () => {
    try {
      const res = await achievementsApi.catalog();
      set({ catalog: res.data.items });
    } catch {
      // keep existing
    }
  },
}));
