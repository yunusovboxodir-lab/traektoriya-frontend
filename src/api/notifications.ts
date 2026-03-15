import { api } from './client';

export interface AppNotification {
  id: string;
  type: 'task_assigned' | 'task_reassigned' | 'learning_assigned' | 'morning_briefing' | 'learning_reminder' | 'weekly_digest' | 'system';
  title: string;
  body: string | null;
  is_read: boolean;
  related_id: string | null;
  related_type: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  items: AppNotification[];
  unread_count: number;
}

export const notificationsApi = {
  list: (limit = 30, unread_only = false) =>
    api.get<NotificationsResponse>('/notifications', {
      params: { limit, unread_only },
    }),

  readAll: () => api.post<{ ok: boolean }>('/notifications/read-all'),

  markRead: (id: string) =>
    api.patch<AppNotification>(`/notifications/${id}/read`),

  remove: (id: string) =>
    api.delete<{ deleted: boolean }>(`/notifications/${id}`),
};
