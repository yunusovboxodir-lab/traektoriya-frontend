import { api } from './client';

// ============================================================================
// Interfaces
// ============================================================================

export interface Course {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  code: string;
  target_role: string;
  status: string;
  total_lessons: number;
  total_duration_minutes: number;
  version: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaEntry {
  url: string;
  type: 'image' | 'video';
  storage_path?: string | null;
  original_filename?: string | null;
}

export interface ContentItem {
  id: string;
  course_id: string;
  title: string;
  content_type: string;
  content: string;
  difficulty_level: number;
  status: string;
  duration_minutes: number;
  points: number;
  learning_objective: string;
  path: string;
  sort_order: number;
  version: number;
  media_urls?: MediaEntry[] | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  content_item_id: string;
  question_type: string;
  question: string;
  question_uz?: string | null;
  options?: Array<{ id: string; text: string; text_uz?: string }> | null;
  correct_answer: string | string[] | Record<string, unknown>;
  explanation?: string | null;
  explanation_uz?: string | null;
  distractor_explanations?: Record<string, string> | null;
  sort_order: number;
  points: number;
  difficulty: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentItemDetail extends ContentItem {
  quiz_questions: QuizQuestion[];
}

export interface CourseDetail extends Course {
  content_items?: ContentItem[];
}

// ============================================================================
// API
// ============================================================================

export const coursesApi = {
  // --- Courses ---
  getCourses: (skip: number = 0, limit: number = 100) =>
    api.get<{ items: Course[]; total: number; skip: number; limit: number }>('/api/v1/courses', {
      params: { skip, limit },
    }),

  getCourse: (courseId: string) =>
    api.get<CourseDetail>('/api/v1/courses/' + courseId),

  getCourseContent: (courseId: string) =>
    api.get<{ items: ContentItem[]; total: number; skip: number; limit: number }>('/api/v1/courses/' + courseId + '/content'),

  createCourse: (data: {
    title: string;
    description: string;
    code: string;
    tenant_id: string;
  }) =>
    api.post<Course>('/api/v1/courses', data),

  updateCourse: (courseId: string, data: Partial<Course>) =>
    api.patch<Course>('/api/v1/courses/' + courseId, data),

  deleteCourse: (courseId: string) =>
    api.delete('/api/v1/courses/' + courseId),

  addContentItem: (courseId: string, data: {
    title: string;
    content_type: string;
    content: string;
    course_id: string;
    path: string;
  }) =>
    api.post<ContentItem>('/api/v1/courses/' + courseId + '/content', data),

  updateContentItem: (itemId: string, data: Partial<ContentItem>) =>
    api.patch<ContentItem>('/api/v1/courses/items/' + itemId, data),

  deleteContentItem: (itemId: string) =>
    api.delete('/api/v1/courses/items/' + itemId),

  // --- Content Items (all items across courses) ---
  getAllContentItems: (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    content_type?: string;
    search?: string;
    course_id?: string;
  }) =>
    api.get<{ items: ContentItem[]; total: number; skip: number; limit: number }>(
      '/api/v1/courses/items',
      { params },
    ),

  getContentItemDetail: (itemId: string) =>
    api.get<ContentItemDetail>('/api/v1/courses/items/' + itemId + '/detail'),

  // --- Quiz Questions ---
  getQuestions: (itemId: string) =>
    api.get<{ items: QuizQuestion[]; total: number }>(
      '/api/v1/courses/items/' + itemId + '/questions',
    ),

  createQuestion: (itemId: string, data: {
    question_type?: string;
    question: string;
    question_uz?: string;
    options?: Array<{ id: string; text: string; text_uz?: string }>;
    correct_answer: string | string[];
    explanation?: string;
    explanation_uz?: string;
    points?: number;
    difficulty?: number;
    sort_order?: number;
  }) =>
    api.post<QuizQuestion>(
      '/api/v1/courses/items/' + itemId + '/questions',
      data,
    ),

  updateQuestion: (questionId: string, data: Partial<QuizQuestion>) =>
    api.patch<QuizQuestion>('/api/v1/courses/questions/' + questionId, data),

  deleteQuestion: (questionId: string) =>
    api.delete('/api/v1/courses/questions/' + questionId),

  // --- Media ---
  uploadMedia: (itemId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ContentItem>(
      '/api/v1/courses/items/' + itemId + '/media',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  addMediaUrl: (itemId: string, url: string, type: 'video' | 'image' = 'video') =>
    api.post<ContentItem>(
      '/api/v1/courses/items/' + itemId + '/media-url',
      { url, type },
    ),

  deleteMedia: (itemId: string, index: number) =>
    api.delete<ContentItem>(
      '/api/v1/courses/items/' + itemId + '/media/' + index,
    ),
};
