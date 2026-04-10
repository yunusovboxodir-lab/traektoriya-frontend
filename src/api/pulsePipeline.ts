import { api } from './client';

// ---------------------------------------------------------------------------
// Types — Pulse Pipeline
// ---------------------------------------------------------------------------

export interface DraftCompetency {
  tmp_id?: string;
  name: string;
  name_uz?: string | null;
  description: string;
  category?: string | null;
  bloom_level?: string | null;
  ksa_type?: string | null;
  suggested_difficulty?: number | null;
  keywords?: string[] | null;
  domain?: string | null;
}

export interface DraftCourse {
  tmp_id?: string;
  title_ru: string;
  title_uz?: string | null;
  level: 'trainee' | 'practitioner' | 'expert' | 'master';
  weight: number;
  competency_ids: string[];
  short_description_ru?: string | null;
  short_description_uz?: string | null;
  course_type: string;
}

export interface TerritoryCounts {
  trainee: number;
  practitioner: number;
  expert: number;
  master: number;
}

export interface GenerationProgress {
  items_total: number;
  items_completed: number;
  failed: Array<{
    course_id: string;
    language: string;
    error: string;
  }>;
  success_count?: number;
  started_at?: string;
  completed_at?: string;
}

export interface PulsePipelineStatus {
  job_id: string;
  status: string; // pending | running | completed | failed | cancelled
  progress: number;
  current_step?: string | null;
  items_total?: number | null;
  items_completed?: number | null;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  error_message?: string | null;
  input_params?: Record<string, unknown> | null;
  output_data?: {
    target_role?: string;
    document_id?: string;
    current_stage?: string;
    draft_competencies?: DraftCompetency[];
    approved_competency_ids?: string[];
    role_name_extracted?: string;
    extracted_kpis?: string[];
    draft_courses?: DraftCourse[];
    territory_counts?: TerritoryCounts;
    rationale?: string;
    section_id?: string;
    created_course_ids?: string[];
    generation?: GenerationProgress;
  } | null;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface StartPipelineRequest {
  document_id: string;
  target_role: string;
  standards_document_ids?: string[];
  language?: 'ru' | 'uz';
}

export interface StartPipelineResponse {
  job_id: string;
  target_role: string;
  draft_competencies: DraftCompetency[];
  role_name_extracted?: string | null;
  extracted_kpis?: string[] | null;
}

export interface ApproveCompetenciesResponse {
  job_id: string;
  approved_competency_ids: string[];
  count: number;
}

export interface GenerateCoursesResponse {
  job_id: string;
  draft_courses: DraftCourse[];
  territory_counts: TerritoryCounts;
  rationale?: string | null;
  total_courses: number;
  estimated_cost_usd: number;
}

export interface ApproveCoursesResponse {
  job_id: string;
  section_id: string;
  created_course_ids: string[];
  count: number;
}

export interface GenerateContentResponse {
  job_id: string;
  items_total: number;
  status: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const pulsePipelineApi = {
  start: (body: StartPipelineRequest) =>
    api.post<StartPipelineResponse>('/api/v1/pulse/pipeline/start', body),

  getStatus: (jobId: string) =>
    api.get<PulsePipelineStatus>(`/api/v1/pulse/pipeline/${jobId}`),

  updateCompetencies: (jobId: string, competencies: DraftCompetency[]) =>
    api.patch(`/api/v1/pulse/pipeline/${jobId}/competencies`, { competencies }),

  approveCompetencies: (jobId: string) =>
    api.post<ApproveCompetenciesResponse>(`/api/v1/pulse/pipeline/${jobId}/approve-competencies`),

  generateCourses: (jobId: string, minPerTerritory = 15) =>
    api.post<GenerateCoursesResponse>(`/api/v1/pulse/pipeline/${jobId}/generate-courses`, {
      min_per_territory: minPerTerritory,
    }),

  updateCourses: (jobId: string, courses: DraftCourse[]) =>
    api.patch(`/api/v1/pulse/pipeline/${jobId}/courses`, { courses }),

  approveCourses: (jobId: string, sectionId?: string) =>
    api.post<ApproveCoursesResponse>(`/api/v1/pulse/pipeline/${jobId}/approve-courses`, {
      section_id: sectionId || null,
    }),

  generateContent: (jobId: string) =>
    api.post<GenerateContentResponse>(`/api/v1/pulse/pipeline/${jobId}/generate-content`),

  retryCourse: (jobId: string, courseId: string) =>
    api.post(`/api/v1/pulse/pipeline/${jobId}/retry-course/${courseId}`),

  cancel: (jobId: string, force = false) =>
    api.delete(`/api/v1/pulse/pipeline/${jobId}${force ? '?force=true' : ''}`),
};
