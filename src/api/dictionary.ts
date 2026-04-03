import { api } from './client';

export interface DictionaryEntry {
  id: string;
  russian_term: string;
  uzbek_translation: string;
  context_category: string | null;
  example_context: string | null;
  contributor_id: string | null;
  is_verified: boolean;
  verified_by: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface DictionaryListResponse {
  items: DictionaryEntry[];
  total: number;
  skip: number;
  limit: number;
}

export interface DictionaryStats {
  total: number;
  verified: number;
  pending: number;
  categories: Record<string, number>;
  top_contributors: Array<{ user_id: string; count: number }>;
}

export const dictionaryApi = {
  list: (params?: { skip?: number; limit?: number; category?: string; verified_only?: boolean; pending_only?: boolean }) =>
    api.get<DictionaryListResponse>('/api/v1/translation-dict', { params }),

  search: (term: string, limit = 20) =>
    api.get<DictionaryEntry[]>('/api/v1/translation-dict/search', { params: { term, limit } }),

  stats: () =>
    api.get<DictionaryStats>('/api/v1/translation-dict/stats'),

  randomTask: () =>
    api.get<{ message: string; entry: DictionaryEntry | null }>('/api/v1/translation-dict/random-task'),

  create: (data: { russian_term: string; uzbek_translation: string; context_category?: string; example_context?: string }) =>
    api.post<DictionaryEntry>('/api/v1/translation-dict', data),

  update: (id: string, data: { uzbek_translation?: string; context_category?: string; example_context?: string }) =>
    api.put<DictionaryEntry>(`/api/v1/translation-dict/${id}`, data),

  verify: (id: string) =>
    api.put<DictionaryEntry>(`/api/v1/translation-dict/${id}/verify`),

  delete: (id: string) =>
    api.delete(`/api/v1/translation-dict/${id}`),

  bulkImport: (entries: Array<{ russian_term: string; uzbek_translation: string; context_category?: string }>, overwrite = false) =>
    api.post<{ created: number; updated: number; skipped: number; total: number }>('/api/v1/translation-dict/import', { entries, overwrite }),
};
