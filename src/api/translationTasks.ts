import { api } from './client';

export interface TranslationTaskData {
  id: string;
  course_id: string;
  course_title: string | null;
  block_index: number;
  block_type: string | null;
  field_path: string | null;
  original_ru: string;
  current_uz: string | null;
  best_uz: string | null;
  status: string;
  round_number: number;
  variants_count: number;
  votes_up: number;
  votes_down: number;
}

export const translationTasksApi = {
  getMyTask: () =>
    api.get<{ task: TranslationTaskData | null; remaining_in_batch?: number; pending?: number; message?: string }>('/api/v1/translation-tasks/my-task'),

  submitVariant: (taskId: string, suggestedUz: string) =>
    api.post('/api/v1/translation-tasks/submit', { task_id: taskId, suggested_uz: suggestedUz }),

  vote: (taskId: string, vote: 'up' | 'down') =>
    api.post(`/api/v1/translation-tasks/${taskId}/vote`, { vote }),

  getQueue: (status?: string, limit?: number) =>
    api.get<{ items: TranslationTaskData[]; total: number }>('/api/v1/translation-tasks/queue', {
      params: { status, limit },
    }),

  selectVariant: (taskId: string, variantIndex: number) =>
    api.post(`/api/v1/translation-tasks/${taskId}/select`, { variant_index: variantIndex }),

  autoSelect: (taskId: string) =>
    api.post(`/api/v1/translation-tasks/${taskId}/auto-select`),
};
