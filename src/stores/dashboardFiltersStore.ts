/**
 * dashboardFiltersStore — общий store фильтров для виджетов главной.
 *
 * Синхронизирует role + period между:
 *  - LearningRankWidget
 *  - ActivityWidget
 *  - PulseWidget
 *
 * Когда админ меняет role в одном месте — все 3 виджета реагируют.
 * Период тоже общий: сменил месяц → квартал — Rank и Activity пересчитываются.
 *
 * Pulse не зависит от периода (показывает текущее состояние компетенций),
 * но зависит от role: при смене роли админ видит средний pulse выбранной роли
 * через /pulse/role-aggregate.
 */
import { create } from 'zustand';
import type { LeaderboardPeriod, LeaderboardRole } from '../api/learning';

interface DashboardFiltersState {
  role: LeaderboardRole;
  period: LeaderboardPeriod;
  setRole: (role: LeaderboardRole) => void;
  setPeriod: (period: LeaderboardPeriod) => void;
}

export const useDashboardFilters = create<DashboardFiltersState>((set) => ({
  role: 'regional_manager',
  period: 'month',
  setRole: (role) => set({ role }),
  setPeriod: (period) => set({ period }),
}));
