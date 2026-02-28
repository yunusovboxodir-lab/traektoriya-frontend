import { api } from './client';

export interface ShelfAnalysis {
  id: string;
  score: number;
  alert_level: 'good' | 'warning' | 'critical';
  category: string | null;
  outlet_name: string | null;
  summary: string | null;
  image_url: string | null;
  criteria_scores: Record<string, number> | null;
  products_found: {
    our_brands?: Array<{ name: string; count: number }>;
    competitors?: Array<{ name: string; count: number }>;
  } | null;
  tasks_generated: number;
  created_at: string;
  // Correction fields
  corrected_score: number | null;
  corrected_brands: string[] | null;
  correction_feedback: string | null;
  corrected_by: string | null;
  corrected_at: string | null;
}

export interface CriterionScore {
  score: number;
  max: number;
  percentage: number;
  status: 'ok' | 'warning' | 'critical';
  issues: string[];
}

export interface ShelfAnalysisDetail extends ShelfAnalysis {
  criteria: Record<string, CriterionScore>;
  detected_brands: string[];
  issues: Array<{ category: string; severity: string; description: string }>;
}

export interface CorrectionRequest {
  corrected_score?: number;
  corrected_brands?: string[];
  feedback?: string;
}

export interface CorrectionResponse {
  id: string;
  original_score: number;
  corrected_score: number | null;
  corrected_brands: string[] | null;
  correction_feedback: string | null;
  corrected_by: string | null;
  corrected_at: string | null;
}

export const shelfApi = {
  list: (params?: { limit?: number; skip?: number }) =>
    api.get<{ items: ShelfAnalysis[]; total: number }>('/api/v1/shelf/analyses', { params }),

  getDetail: (analysisId: string) =>
    api.get<ShelfAnalysisDetail>(`/api/v1/shelf/analyses/${analysisId}`),

  /** Submit admin correction for a shelf analysis */
  correct: (analysisId: string, data: CorrectionRequest) =>
    api.patch<CorrectionResponse>(`/api/v1/shelf/analyses/${analysisId}/correct`, data),
};
