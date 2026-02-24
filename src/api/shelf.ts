import { api } from './client';

export interface ShelfAnalysis {
  id: string;
  score: number;
  category: string | null;
  image_url: string | null;
  criteria_scores: Record<string, number> | null;
  products_found: {
    our_brands?: Array<{ name: string; count: number }>;
    competitors?: Array<{ name: string; count: number }>;
  } | null;
  tasks_generated: number;
  created_at: string;
}

export const shelfApi = {
  list: (params?: { limit?: number; skip?: number }) =>
    api.get<{ items: ShelfAnalysis[]; total: number }>('/api/v1/shelf/analyses', { params }),
};
