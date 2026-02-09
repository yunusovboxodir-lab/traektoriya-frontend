import { api } from './client';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  task_type: string;
  assignee_id: string | null;
  creator_id: string | null;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  course_id: string | null;
  store_id: string | null;
  tags: string[] | null;
  progress: number;
  estimated_time: number | null;
  actual_time: number | null;
  created_at: string;
  updated_at: string;
}

export interface KanbanBoard {
  todo: Task[];
  in_progress: Task[];
  review: Task[];
  done: Task[];
}

export interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
}

export interface DashboardWidget {
  key: string;
  label: string;
  value: number;
  icon: string;
}

export interface DashboardData {
  widgets: DashboardWidget[];
  tasks_summary: TaskStats;
}

export const tasksApi = {
  getKanban: (assigneeId?: string) => {
    const params = assigneeId ? { assignee_id: assigneeId } : {};
    return api.get<KanbanBoard>('/api/v1/tasks/kanban', { params });
  },

  getStats: () =>
    api.get<TaskStats>('/api/v1/tasks/stats'),

  getAll: (params?: { status?: string; priority?: string; assignee_id?: string }) =>
    api.get<{ items: Task[]; total: number }>('/api/v1/tasks', { params }),

  getById: (id: string) =>
    api.get<Task>('/api/v1/tasks/' + id),

  create: (data: Partial<Task>) =>
    api.post<Task>('/api/v1/tasks', data),

  update: (id: string, data: Partial<Task>) =>
    api.patch<Task>('/api/v1/tasks/' + id, data),

  delete: (id: string) =>
    api.delete('/api/v1/tasks/' + id),

  addComment: (taskId: string, content: string) =>
    api.post('/api/v1/tasks/' + taskId + '/comments', { content }),
};

export const dashboardApi = {
  getWidgets: () =>
    api.get<DashboardData>('/api/v1/dashboard/widgets'),
};

export const analyticsApi = {
  getOverview: () =>
    api.get('/api/v1/analytics/overview'),

  getLeaderboard: (limit = 10) =>
    api.get('/api/v1/analytics/leaderboard', { params: { limit } }),

  getUserStats: (userId: string) =>
    api.get('/api/v1/analytics/user/' + userId),
};
