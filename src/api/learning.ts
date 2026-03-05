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
  is_village: boolean;
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
    is_village?: boolean;
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
  question: string | BilingualText;
  type: 'single_choice';
  options: (string | BilingualText)[];
  correct_answer: number;
  explanation?: string | BilingualText;
}

export interface QuizDragDropQuestion {
  question: string | BilingualText;
  type: 'drag_drop';
  subtype: 'ordering' | 'zones';
  items: (string | BilingualText)[];
  correct_order?: number[];
  zones?: (string | BilingualText)[] | null;
  correct_answer?: Record<string, string>;
  explanation?: string | BilingualText;
}

export interface QuizMatchingQuestion {
  question: string | BilingualText;
  type: 'matching';
  left: (string | BilingualText)[];
  right: (string | BilingualText)[];
  correct_pairs: [number, number][];
  explanation?: string | BilingualText;
}

export interface QuizHotspotQuestion {
  question: string | BilingualText;
  type: 'hotspot';
  image_url: string;
  hotspots: Array<{ x: number; y: number; radius: number; label: string; is_correct: boolean }>;
  min_correct: number;
  explanation?: string | BilingualText;
}

export type CourseQuizQuestion =
  | QuizSingleChoiceQuestion
  | QuizDragDropQuestion
  | QuizMatchingQuestion
  | QuizHotspotQuestion;

// Flashcard
export interface FlashCard {
  front: string | BilingualText;
  back: string | BilingualText;
}

// Field task
export interface FieldTask {
  title: string | BilingualText;
  description: string | BilingualText;
  criteria: (string | BilingualText)[];
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

// Lesson Data — rich v2 format (scene, infographic, dialogue, quiz)
export interface LessonDataScene {
  location: string;
  time: string;
  crisis: string;
  context: string;
  dialogue: Array<{
    speaker: string;
    line: string;
    side?: 'left' | 'right';
    color?: string;
  }>;
  stakes: string;
}

export interface LessonDataInfographic {
  title: string;
  nodes: Array<{
    id: string;
    label: string;
    name?: string;
    color?: string;
    level?: number;
    kpi?: number;
    vacant?: boolean;
    detail?: string;
    icon?: string;
  }>;
  metrics: Array<{
    label: string;
    value: string;
    unit: string;
  }>;
}

export interface LessonDataDialogueExchange {
  situation: string;
  wrong: { speaker?: string; text: string; consequence?: string };
  right: { speaker?: string; text: string; outcome?: string };
  lesson: string;
}

export interface LessonDataDialogue {
  title: string;
  scenario: string;
  exchanges: LessonDataDialogueExchange[];
}

export interface LessonDataQuizOption {
  id: string;
  text: string;
  correct: boolean;
  explanation: string;
}

export interface LessonDataQuizQuestion {
  id: number | string;
  text: string;
  options: LessonDataQuizOption[];
}

export interface LessonDataQuiz {
  title: string;
  questions: LessonDataQuizQuestion[];
}

export interface LessonData {
  id: string;
  module: string;
  title: string;
  subtitle: string;
  brand: string;
  accent: string;
  accentSoft: string;
  scene?: LessonDataScene;
  infographic?: LessonDataInfographic;
  dialogueLesson?: LessonDataDialogue;
  quiz?: LessonDataQuiz;
}

// =============================================
// Block Architecture v3 — cinematic + micro-blocks
// =============================================

// Cinematic scene
export interface CinematicLocation {
  day: string;        // "ВТОРНИК"
  time: string;       // "10:30"
  subtitle: string;   // "ПЛАНОВЫЙ ВИЗИТ"
}

export interface CinematicCharacter {
  id: string;
  name: string;
  role?: string;
  side: 'left' | 'right';
  emoji?: string;       // emoji inside SVG head
  color?: string;       // fill color
  detail?: string;      // e.g. "clipboard" for extra SVG detail
}

export interface CinematicDialogue {
  characterId: string;
  text: string;
  delayMs: number;      // delay before this dialogue starts
}

export interface CinematicCrisis {
  emoji: string;
  badge: string;        // "ЭКСТРЕННАЯ СИТУАЦИЯ"
  headline: string;
  description: string;
  stakes: string;
  cta: string;          // CTA button text
}

export interface CinematicProblemFlash {
  text: string;
  delayMs: number;
}

export interface BlockCinematicSceneData {
  atmosphere: string;   // "store_chaos" | "dark_office" | etc.
  location: CinematicLocation;
  characters: CinematicCharacter[];
  dialogues: CinematicDialogue[];
  problemFlash?: CinematicProblemFlash;
  crisis: CinematicCrisis;
}

// Key Point (4 variants)
export interface BlockKeyPointData {
  icon: string;
  title: string;
  body?: string;
  variant: 'default' | 'number' | 'chips' | 'steps';
  number?: string;       // for variant=number (e.g. "+15-25%")
  numberCaption?: string;
  chips?: string[];
  steps?: Array<{ num: number; text: string }>;
  footnote?: string;
  callout?: string;      // green callout box at bottom
}

// Swipe True/False
export interface SwipeCard {
  text: string;
  answer: boolean;
  feedback: string;
}
export interface BlockSwipeCardsData {
  cards: SwipeCard[];
}

// Sorting
export interface SortingItem {
  label: string;
  correctPosition: number;
}
export interface BlockSortingData {
  title: string;
  subtitle?: string;
  items: SortingItem[];
}

// Fill Blank
export interface BlockFillBlankData {
  sentenceBefore: string;
  sentenceAfter?: string;
  correctAnswer: string;
  options: string[];
}

// Dialogue Choice
export interface DialogueOption {
  letter: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}
export interface BlockDialogueChoiceData {
  situation: string;
  options: DialogueOption[];
}

// Quiz (final question)
export interface BlockQuizData {
  question: string;
  options: DialogueOption[];
}

// Results
export interface BlockResultsData {
  xpReward: number;
}

// Block union type
export type LessonBlock =
  | { type: 'cinematic_scene'; data: BlockCinematicSceneData }
  | { type: 'key_point'; data: BlockKeyPointData }
  | { type: 'swipe_cards'; data: BlockSwipeCardsData }
  | { type: 'sorting'; data: BlockSortingData }
  | { type: 'fill_blank'; data: BlockFillBlankData }
  | { type: 'dialogue_choice'; data: BlockDialogueChoiceData }
  | { type: 'quiz'; data: BlockQuizData }
  | { type: 'results'; data: BlockResultsData };

// V3 lesson data (block architecture)
export interface BlockLessonData {
  version: '3.0';
  title: string;
  accent: string;
  accentSoft: string;
  blocks: LessonBlock[];
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
    slides: Array<{ order: number; type: string; title: string | BilingualText; content: string | BilingualText }>;
    quiz: CourseQuizQuestion[];
    field_task?: FieldTask | null;
    spaced_repetition_cards: FlashCard[];
    media_prompts?: MediaPrompt[];
    lesson_data?: LessonData | BlockLessonData | null;
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

// Leaderboard
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  employee_id: string;
  role: string;
  current_level: string;
  courses_completed: number;
  avg_quiz_score: number;
  current_streak_days: number;
  is_current_user: boolean;
}

export interface LeaderboardResponse {
  my_rank: number;
  total_in_group: number;
  my_progress: ProgressResponse | null;
  leaderboard: LeaderboardEntry[];
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

export const LEVEL_NAMES_UZ: Record<string, string> = {
  trainee: 'Stajyor',
  practitioner: 'Amaliyotchi',
  expert: 'Ekspert',
  master: 'Usta',
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

  getLeaderboard: (limit = 20) =>
    api.get<LeaderboardResponse>('/api/v1/learning/leaderboard', {
      params: { limit },
    }),
};
