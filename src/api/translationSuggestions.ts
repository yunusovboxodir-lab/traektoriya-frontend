import { api } from './client';

export interface TranslationTask {
  course_id: string;
  course_title_ru: string;
  block_index: number;
  block_type: string | null;
  field_path: string | null;
  original_ru: string;
  current_uz: string | null;
}

export interface TranslationSuggestion {
  id: string;
  user_id: string;
  course_id: string;
  course_title: string | null;
  block_index: number;
  block_type: string | null;
  field_path: string | null;
  original_ru: string;
  current_uz: string | null;
  suggested_uz: string;
  status: string;
  admin_comment: string | null;
  bonus_xp: number;
  created_at: string;
  user_name: string | null;
}

export const translationApi = {
  getMyTasks: (limit = 3) =>
    api.get<{ tasks: TranslationTask[]; total: number }>(
      '/api/v1/translation-suggestions/my-tasks',
      { params: { limit } },
    ),

  suggest: (data: {
    course_id: string;
    block_index: number;
    block_type?: string | null;
    field_path?: string | null;
    original_ru: string;
    current_uz?: string | null;
    suggested_uz: string;
  }) => api.post('/api/v1/translation-suggestions/suggest', data),

  getQueue: (status = 'pending', limit = 20, skip = 0) =>
    api.get<{
      items: TranslationSuggestion[];
      total: number;
      counts: Record<string, number>;
    }>('/api/v1/translation-suggestions/queue', {
      params: { status_filter: status, limit, skip },
    }),

  review: (id: string, action: 'approve' | 'reject' | 'lock', comment?: string, bonusXp?: number) =>
    api.patch(`/api/v1/translation-suggestions/${id}/review`, {
      action,
      comment,
      bonus_xp: bonusXp,
    }),
};
