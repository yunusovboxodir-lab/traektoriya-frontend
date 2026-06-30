/**
 * engineHealth.ts — клиент Health API движка самоулучшения (admin).
 *
 * Бэкенд: app/api/v1/engine_health.py · /api/v1/engine-health/*
 * Спека: _docs/SELF_IMPROVEMENT_ENGINE.md · витрина = тикет SIE-P0-6.
 */
import { api } from './client';

export type EffStatus = 'winner' | 'weak' | 'dead' | 'unknown';

export interface EffItem {
  course_id: string;
  course_code: string | null;
  title_ru: string | null;
  period: string;
  anchor_metric: string;
  status: EffStatus;
  lift: number;
  sample_size: number;
  completers_kpi_delta: number;
  control_kpi_delta: number;
  confidence: number;
  computed_at: string | null;
}

export interface EffCounts {
  winner: number;
  weak: number;
  dead: number;
  unknown: number;
  total: number;
}

export interface ContentEffectivenessResponse {
  period: string | null;
  anchor_metric: string;
  min_sample_gate: number;
  counts: EffCounts;
  items: EffItem[];
}

export interface LoopInfo {
  id: 'L0' | 'L1' | 'L2';
  title: string;
  cadence: string;
  anchor: string;
  state: string;
  note: string;
  verdicts_total?: number;
  verdicts_decided?: number;
}

export interface LoopsResponse {
  loops: LoopInfo[];
}

export interface SummaryResponse {
  latest_period: string | null;
  anchor_metric: string;
  content_counts: EffCounts;
  engine_state: 'live' | 'armed_waiting_flow';
}

export interface CoverageResponse {
  state: string;
  note: string;
  items: unknown[];
}

export const engineHealthApi = {
  summary: () =>
    api.get<SummaryResponse>('/api/v1/engine-health/summary'),

  loops: () =>
    api.get<LoopsResponse>('/api/v1/engine-health/loops'),

  contentEffectiveness: (period?: string) =>
    api.get<ContentEffectivenessResponse>(
      '/api/v1/engine-health/content-effectiveness',
      { params: period ? { period } : undefined },
    ),

  coverage: () =>
    api.get<CoverageResponse>('/api/v1/engine-health/coverage'),
};
