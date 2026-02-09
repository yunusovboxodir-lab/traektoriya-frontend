import { api } from './client';

// ===========================================
// ТИПЫ ЗАПРОСОВ
// ===========================================

export interface GenerateLessonRequest {
  topic: string;
  course_id?: string | null;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  language?: string;
  include_quiz?: boolean;
  quiz_count?: number;
  max_tokens?: number;
}

export interface ExtractCompetenciesRequest {
  text: string;
  domain: 'sales' | 'management' | 'product_knowledge' | 'customer_service';
  language?: string;
}

// ===========================================
// ТИПЫ ОТВЕТОВ
// ===========================================

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface GeneratedLesson {
  title: string;
  content: string;
  summary: string;
  key_points: string[];
  difficulty: string;
  estimated_duration_minutes: number;
  quiz_questions: QuizQuestion[];
}

export interface GenerationMetadata {
  model: string;
  tokens_used: number;
  generation_time_seconds: number;
  is_grounded: boolean;
  sources_used: number;
}

export interface GenerateLessonResponse {
  lesson: GeneratedLesson;
  metadata: GenerationMetadata;
}

export interface Competency {
  name: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
  indicators: string[];
}

export interface ExtractCompetenciesResponse {
  competencies: Competency[];
  metadata: GenerationMetadata;
}

// ===========================================
// API МЕТОДЫ
// ===========================================

export const generationApi = {
  generateLesson: (data: GenerateLessonRequest) =>
    api.post<GenerateLessonResponse>('/api/v1/generation/lesson', data),

  extractCompetencies: (data: ExtractCompetenciesRequest) =>
    api.post<ExtractCompetenciesResponse>('/api/v1/generation/competencies/extract', data),
};
