import { api } from './client';

// ======== Request Types ========

export interface GenerateLessonFromTextRequest {
  topic: string;
  description?: string;
  difficulty?: number; // 1-4 (1=beginner, 2=intermediate, 3=advanced, 4=expert)
  context_text?: string;
  language?: string;
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
  language?: string;
  use_mock?: boolean;
}

// ======== V1 Response Types ========

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

// ======== V2 Response Types (Problem-First pipeline) ========

export interface V2ProblemStory {
  narrative: string;
  challenge_question: string;
  stakes_description: string;
}

export interface V2SolutionStep {
  step_number: number;
  title: string;
  description: string;
  standard_quote?: string | null;
  pro_tip?: string | null;
}

export interface V2ContentSection {
  heading: string;
  body: string;
  key_numbers?: string[] | null;
  anti_pattern?: string | null;
}

export interface V2Exercise {
  exercise_type: string;
  bloom_level: string;
  difficulty: number;
  question: string;
  context?: string | null;
  options?: string[] | null;
  matching_left?: string[] | null;
  matching_right?: string[] | null;
  ordered_items?: string[] | null;
  dialogue_lines?: Record<string, unknown>[] | null;
  action_description?: string | null;
  correct_answer_index?: number | null;
  correct_answer_indices?: number[] | null;
  correct_answer_text?: string | null;
  correct_answer_bool?: boolean | null;
  correct_matching_pairs?: string[][] | null;
  correct_order?: number[] | null;
  correct_dialogue_index?: number | null;
  mistakes_to_find?: string[] | null;
  explanation: string;
  consequences?: Record<string, unknown>[] | null;
  standard_reference?: string | null;
  content_section_index: number;
}

export interface V2Reflection {
  intro_text: string;
  questions: string[];
  action_prompt: string;
  key_takeaways: string[];
}

export interface V2Metadata {
  generation_version: string;
  quality_score: number;
  quality_verdict: string;
  model: string;
  rag_sources: number;
  is_grounded: boolean;
  language: string;
  generated_at?: string | null;
}

export interface GeneratedLessonV2Response {
  version: string;
  title: string;
  title_uz?: string | null;
  learning_objective: string;
  learning_objective_uz?: string | null;
  estimated_duration_minutes: number;
  problem_story: V2ProblemStory;
  solution: V2SolutionStep[];
  solution_summary: string;
  sections: V2ContentSection[];
  exercises: V2Exercise[];
  reflection: V2Reflection;
  metadata: V2Metadata;
}

// ======== V2 → Legacy Converter ========

/**
 * Convert v2 structured response to legacy GenerateLessonResponse format.
 * This allows reusing existing UI components while benefiting from
 * the richer v2 content pipeline.
 */
export function convertV2ToLegacy(v2: GeneratedLessonV2Response): GenerateLessonResponse {
  // Build rich markdown content from v2 structured sections
  const parts: string[] = [];

  // Problem story
  parts.push(`## ${String.fromCodePoint(0x1F525)} Проблема`);
  parts.push('');
  parts.push(v2.problem_story.narrative);
  parts.push('');
  parts.push(`**${v2.problem_story.challenge_question}**`);
  parts.push('');
  parts.push(`*${v2.problem_story.stakes_description}*`);
  parts.push('');

  // Solution steps
  parts.push(`## ${String.fromCodePoint(0x2705)} Решение`);
  parts.push('');
  for (const s of v2.solution) {
    parts.push(`### ${s.step_number}. ${s.title}`);
    parts.push('');
    parts.push(s.description);
    if (s.standard_quote) {
      parts.push('');
      parts.push(`> ${s.standard_quote}`);
    }
    if (s.pro_tip) {
      parts.push('');
      parts.push(`**Pro tip:** ${s.pro_tip}`);
    }
    parts.push('');
  }
  parts.push(`**${v2.solution_summary}**`);
  parts.push('');

  // Deep content sections
  for (const s of v2.sections) {
    parts.push(`## ${s.heading}`);
    parts.push('');
    parts.push(s.body);
    if (s.key_numbers && s.key_numbers.length > 0) {
      parts.push('');
      for (const n of s.key_numbers) {
        parts.push(`- ${n}`);
      }
    }
    if (s.anti_pattern) {
      parts.push('');
      parts.push(`**Как НЕ надо:** ${s.anti_pattern}`);
    }
    parts.push('');
  }

  // Reflection
  parts.push(`## ${String.fromCodePoint(0x1F4AD)} Рефлексия`);
  parts.push('');
  parts.push(v2.reflection.intro_text);
  parts.push('');
  for (const q of v2.reflection.questions) {
    parts.push(`- ${q}`);
  }
  parts.push('');
  parts.push(`**${v2.reflection.action_prompt}**`);

  const content = parts.join('\n');

  // Convert exercises with options to QuizQuestion format
  const quizQuestions: QuizQuestion[] = v2.exercises
    .filter((ex) => ex.options && ex.options.length >= 2)
    .map((ex) => {
      // Determine correct answer
      let correctAnswer: string | number;
      if (ex.correct_answer_index != null) {
        correctAnswer = String.fromCharCode(65 + ex.correct_answer_index);
      } else if (ex.correct_answer_bool != null) {
        correctAnswer = ex.correct_answer_bool ? 'A' : 'B';
      } else {
        correctAnswer = 'A';
      }

      return {
        question: ex.context ? `${ex.context}\n\n${ex.question}` : ex.question,
        question_type: ex.exercise_type,
        options: ex.options!,
        correct_answer: correctAnswer,
        explanation: ex.explanation,
      };
    });

  const lesson: GeneratedLesson = {
    title: v2.title,
    title_uz: v2.title_uz,
    learning_objective: v2.learning_objective,
    content,
    summary: v2.solution_summary,
    key_points: v2.reflection.key_takeaways,
    estimated_duration_minutes: v2.estimated_duration_minutes,
    quiz_questions: quizQuestions,
    is_grounded: v2.metadata.is_grounded,
    source_count: v2.metadata.rag_sources,
  };

  return {
    lesson,
    metadata: {
      model: v2.metadata.model,
      is_grounded: v2.metadata.is_grounded,
      sources_used: v2.metadata.rag_sources,
    },
    quiz_questions: quizQuestions,
  };
}

// ======== Other Response Types ========

export interface ExtractedCompetency {
  name: string;
  name_uz?: string | null;
  description: string;
  domain?: string | null;
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

// ======== Enrich Types ========

export interface EnrichLessonRequest {
  language?: string;
  use_mock?: boolean;
}

export interface EnrichLessonResponse {
  content_item_id: string;
  title: string;
  is_grounded: boolean;
  rag_sources: number;
  quality_score: number;
  quality_verdict: string;
  message: string;
}

// ======== Constants ========

// Generation requests can take 2-5 minutes (4-step AI pipeline).
// Browser default timeout (~2 min) is too short.
const GENERATION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

// ======== API Methods ========

export const generationApi = {
  // Generate lesson from topic text — V2 (Problem-First pipeline)
  generateLessonFromText: (data: GenerateLessonFromTextRequest) =>
    api.post<GeneratedLessonV2Response>('/api/v1/generate/lesson-v2-from-text', data, {
      timeout: GENERATION_TIMEOUT,
    }),

  // Generate lesson from topic text — V1 (legacy, for fallback)
  generateLessonFromTextV1: (data: GenerateLessonFromTextRequest) =>
    api.post<GenerateLessonResponse>('/api/v1/generate/lesson-from-text', data, {
      timeout: GENERATION_TIMEOUT,
    }),

  // Extract competencies from uploaded document
  extractCompetencies: (data: ExtractCompetenciesRequest) =>
    api.post<ExtractionResponse>('/api/v1/generate/extract-competencies', data, {
      timeout: GENERATION_TIMEOUT,
    }),

  // Generate lesson from competency ID — V2 (Problem-First pipeline)
  generateLessonFromCompetency: (data: GenerateLessonFromCompetencyRequest) =>
    api.post<GeneratedLessonV2Response>('/api/v1/generate/lesson-v2', data, {
      timeout: GENERATION_TIMEOUT,
    }),

  // Generate lesson from competency ID — V1 (legacy, for fallback)
  generateLessonFromCompetencyV1: (data: GenerateLessonFromCompetencyRequest) =>
    api.post<GenerateLessonResponse>('/api/v1/generate/lesson', data, {
      timeout: GENERATION_TIMEOUT,
    }),

  // Get generation service status
  getStatus: () => api.get('/api/v1/generate/status'),

  // List recently generated lessons
  getLessons: (limit = 20) =>
    api.get('/api/v1/generate/lessons', { params: { limit } }),

  // Enrich an existing lesson with RAG corporate standards
  enrichLesson: (contentItemId: string, data?: EnrichLessonRequest) =>
    api.post<EnrichLessonResponse>(`/api/v1/generate/lesson/${contentItemId}/enrich`, data || {}, {
      timeout: GENERATION_TIMEOUT,
    }),
};
