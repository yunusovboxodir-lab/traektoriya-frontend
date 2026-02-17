import { api } from './client';

// Types matching backend Pydantic schemas
export interface BilingualText {
  ru: string;
  uz?: string | null;
}

export interface LevelRange {
  start: string;
  end: string;
}

export interface SectionProgress {
  completed: number;
  total: number;
  percentage: number;
}

export interface LevelProgress {
  level: string;
  courses_completed: number;
  courses_total: number;
  percentage: number;
  is_current_user_level: boolean;
  is_locked: boolean;
}

export interface UnlockCondition {
  type: string;
  required_level?: string;
  current_level?: string;
  progress_to_unlock?: number;
  required_section_id?: string;
  required_completion?: number;
}

export interface SectionMap {
  section_id: string;
  title: BilingualText;
  icon?: string | null;
  color?: string | null;
  level_range: LevelRange;
  is_unlocked: boolean;
  unlock_condition?: UnlockCondition | null;
  progress?: SectionProgress | null;
  levels?: LevelProgress[] | null;
  ai_recommended_count: number;
}

export interface LevelUpRequirements {
  completion: { current: number; required: number };
  quiz_score: { current: number; required: number };
  days: { current: number; required: number };
}

export interface UserLevelProgress {
  current: string;
  next?: string | null;
  percentage_to_next: number;
  requirements?: LevelUpRequirements | null;
}

export interface UserMap {
  id: string;
  name: string;
  current_level: string;
  level_progress: UserLevelProgress;
}

export interface AIRecommendation {
  course_id: string;
  section_id: string;
  title: BilingualText;
  reason?: string | null;
  priority: number;
  has_personal_intro: boolean;
}

export interface LearningMapResponse {
  user: UserMap;
  sections: SectionMap[];
  ai_recommendations: {
    updated_at?: string | null;
    courses: AIRecommendation[];
  };
}

// Section courses
export interface CourseItem {
  id: string;
  course_code: string;
  title: BilingualText;
  duration_minutes: number;
  status: 'completed' | 'available' | 'locked';
  completed_at?: string | null;
  quiz_score?: number | null;
  is_ai_recommended: boolean;
  recommendation?: { reason?: string; has_personal_intro?: boolean } | null;
}

export interface LevelCourses {
  level: string;
  level_name: BilingualText;
  is_unlocked: boolean;
  is_completed: boolean;
  courses?: CourseItem[] | null;
  courses_preview_count?: number | null;
  unlock_message?: string | null;
}

export interface SectionCoursesResponse {
  section: {
    section_id: string;
    title: BilingualText;
    description: BilingualText;
    level_range: LevelRange;
  };
  user_progress: {
    completed: number;
    total: number;
    percentage: number;
    current_level: string;
  };
  levels: LevelCourses[];
}

// Quiz question types
export interface QuizSingleChoiceQuestion {
  question: string;
  type: 'single_choice';
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export interface QuizDragDropQuestion {
  question: string;
  type: 'drag_drop';
  subtype: 'ordering' | 'zones';
  items: string[];
  correct_order?: number[];
  zones?: string[] | null;
  correct_answer?: Record<string, string>;
  explanation?: string;
}

export interface QuizMatchingQuestion {
  question: string;
  type: 'matching';
  left: string[];
  right: string[];
  correct_pairs: [number, number][];
  explanation?: string;
}

export interface QuizHotspotQuestion {
  question: string;
  type: 'hotspot';
  image_url: string;
  hotspots: Array<{ x: number; y: number; radius: number; label: string; is_correct: boolean }>;
  min_correct: number;
  explanation?: string;
}

export type CourseQuizQuestion =
  | QuizSingleChoiceQuestion
  | QuizDragDropQuestion
  | QuizMatchingQuestion
  | QuizHotspotQuestion;

// Flashcard
export interface FlashCard {
  front: string;
  back: string;
}

// Field task
export interface FieldTask {
  title: string;
  description: string;
  criteria: string[];
  deadline_days: number;
}

// Media prompt
export interface MediaPrompt {
  slide_order: number;
  type: 'image' | 'video' | 'infographic';
  prompt_ru: string;
  prompt_uz?: string | null;
  status: 'pending' | 'in_progress' | 'done';
  media_url?: string | null;
}

// Course detail
export interface CourseDetailResponse {
  course: {
    id: string;
    course_code: string;
    title: BilingualText;
    section_id?: string;
    level: string;
    duration_minutes: number;
    course_type: string;
    description: BilingualText;
  };
  personalization?: {
    has_intro: boolean;
    recommendation_reason?: string;
    intro_slides: unknown[];
    custom_task?: unknown;
  } | null;
  content: {
    slides: Array<{ order: number; type: string; title: string; content: string }>;
    quiz: CourseQuizQuestion[];
    field_task?: FieldTask | null;
    spaced_repetition_cards: FlashCard[];
    media_prompts?: MediaPrompt[];
  };
}

// Course completion
export interface CourseCompleteRequest {
  quiz_score: number;
  time_spent_seconds?: number;
}

export interface CourseCompleteResponse {
  course_id: string;
  quiz_score: number;
  passed: boolean;
  new_level: string;
  level_up?: { from: string; to: string; message: string } | null;
  total_courses_completed: number;
  streak_days: number;
}

// Progress
export interface ProgressResponse {
  current_level: string;
  level_name: BilingualText;
  total_courses_completed: number;
  total_time_spent_minutes: number;
  avg_quiz_score: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_at?: string | null;
  level_progress?: Record<string, { completed: number; total: number; percentage: number }> | null;
  sections_progress?: Record<string, unknown> | null;
}

// Learning modules
export interface LearningModule {
  role: string;
  title: BilingualText;
  icon: string;
  sections_count: number;
  courses_count: number;
  is_available: boolean;
}

export interface LearningModulesResponse {
  modules: LearningModule[];
}

// Level display names
export const LEVEL_NAMES: Record<string, string> = {
  trainee: 'Стажёр',
  practitioner: 'Практик',
  expert: 'Эксперт',
  master: 'Мастер',
};

export const LEVEL_COLORS: Record<string, string> = {
  trainee: '#4CAF50',
  practitioner: '#2196F3',
  expert: '#FF9800',
  master: '#F44336',
};

export const MODULE_ICONS: Record<string, string> = {
  store: '🏪',
  groups: '👔',
  public: '🌐',
  emoji_events: '👑',
  precision_manufacturing: '🏭',
  engineering: '⚙️',
};

export const learningApi = {
  getModules: () =>
    api.get<LearningModulesResponse>('/api/v1/learning/modules'),

  getMap: (targetRole = 'sales_rep') =>
    api.get<LearningMapResponse>('/api/v1/learning/map', {
      params: { target_role: targetRole },
    }),

  getSectionCourses: (sectionId: string) =>
    api.get<SectionCoursesResponse>(`/api/v1/learning/sections/${sectionId}/courses`),

  getCourseDetail: (courseId: string, personalize = false) =>
    api.get<CourseDetailResponse>(`/api/v1/learning/courses/${courseId}`, {
      params: { personalize },
    }),

  completeCourse: (courseId: string, data: CourseCompleteRequest) =>
    api.post<CourseCompleteResponse>(`/api/v1/learning/courses/${courseId}/complete`, data),

  getProgress: () =>
    api.get<ProgressResponse>('/api/v1/learning/progress'),
};
