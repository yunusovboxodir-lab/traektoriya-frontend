import { api } from './client';

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
  created_at: string;
  updated_at: string;
}

export interface CourseDetail extends Course {
  content_items?: ContentItem[];
}

export const coursesApi = {
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
};
