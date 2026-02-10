import { api } from './client';

// ======== Request Types ========

export interface GenerateLessonFromTextRequest {
  topic: string;
  description?: string;
  difficulty?: number; // 1-4 (1=beginner, 2=intermediate, 3=advanced, 4=expert)
  context_text?: string;
  use_mock?: boolean;
}

export interface ExtractCompetenciesRequest {
  document_id: string;
  save_to_db?: boolean;
  use_mock?: boolean;
}

export interface GenerateLessonFromCompetencyRequest {
  competency_id: string;
  difficulty?: number;
  use_rag_context?: boolean;
  save_to_db?: boolean;
  course_id?: string;
  use_mock?: boolean;
}

// ======== Response Types ========

export interface QuizQuestion {
  question: string;
  question_type?: string;
  options: string[];
  correct_answer: string | number;
  explanation: string;
}

export interface GeneratedLesson {
  title: string;
  title_uz?: string | null;
  learning_objective?: string;
  introduction?: string;
  content: string;
  practical_tips?: string[];
  summary?: string | string[];
  key_points?: string[];
  estimated_duration_minutes?: number;
  quiz_questions?: QuizQuestion[];
  competency_id?: string | null;
  content_item_id?: string | null;
  is_grounded?: boolean;
  source_count?: number;
  difficulty?: string;
}

export interface GenerationMetadata {
  model?: string;
  tokens_used?: number;
  generation_time_seconds?: number;
  is_grounded?: boolean;
  sources_used?: number;
}

export interface GenerateLessonResponse {
  lesson?: GeneratedLesson;
  metadata?: GenerationMetadata;
  // Direct fields (backend may return flat or nested)
  title?: string;
  content?: string;
  introduction?: string;
  practical_tips?: string[];
  summary?: string[];
  quiz_questions?: QuizQuestion[];
  is_grounded?: boolean;
  source_count?: number;
}

export interface ExtractedCompetency {
  name: string;
  name_uz?: string | null;
  description: string;
  category: string;
  bloom_level?: string;
  ksa_type?: string;
  suggested_difficulty?: number;
  keywords?: string[];
  id?: string;
}

export interface ExtractionResponse {
  role_name: string;
  role_name_uz?: string | null;
  competencies: ExtractedCompetency[];
  total_extracted: number;
  document_id: string;
  saved_to_db: boolean;
}

export interface GeneratedLessonListItem {
  id: string;
  title: string;
  content_type?: string;
  status?: string;
  difficulty_level?: number;
  duration_minutes?: number;
  is_grounded?: boolean;
  competency_name?: string;
  course_title?: string;
  created_at: string;
}

// ======== API Methods ========

export const generationApi = {
  // Generate lesson from topic text (simple mode)
  generateLessonFromText: (data: GenerateLessonFromTextRequest) =>
    api.post<GenerateLessonResponse>('/api/v1/generate/lesson-from-text', data),

  // Extract competencies from uploaded document
  extractCompetencies: (data: ExtractCompetenciesRequest) =>
    api.post<ExtractionResponse>('/api/v1/generate/extract-competencies', data),

  // Generate lesson from competency ID (uses RAG standards)
  generateLessonFromCompetency: (data: GenerateLessonFromCompetencyRequest) =>
    api.post<GenerateLessonResponse>('/api/v1/generate/lesson', data),

  // Get generation service status
  getStatus: () => api.get('/api/v1/generate/status'),

  // List recently generated lessons
  getLessons: (limit = 20) =>
    api.get('/api/v1/generate/lessons', { params: { limit } }),
};
