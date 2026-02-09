import { api } from './client';

export interface Course {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  category: string;
  target_audience: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  course_id: string;
  title: string;
  content_type: string;
  content_text: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CourseDetail extends Course {
  content_items?: ContentItem[];
}

export const coursesApi = {
  getCourses: (skip: number = 0, limit: number = 100) =>
    api.get<{ courses: Course[]; total: number }>('/api/v1/courses', {
      params: { skip, limit },
    }),

  getCourse: (courseId: string) =>
    api.get<CourseDetail>('/api/v1/courses/' + courseId),

  getCourseContent: (courseId: string) =>
    api.get<ContentItem[]>('/api/v1/courses/' + courseId + '/content'),

  createCourse: (data: {
    title: string;
    description: string;
    category: string;
    target_audience: string;
  }) =>
    api.post<Course>('/api/v1/courses', data),

  updateCourse: (courseId: string, data: Partial<Course>) =>
    api.patch<Course>('/api/v1/courses/' + courseId, data),

  deleteCourse: (courseId: string) =>
    api.delete('/api/v1/courses/' + courseId),

  addContentItem: (courseId: string, data: {
    title: string;
    content_type: string;
    content_text: string;
  }) =>
    api.post<ContentItem>('/api/v1/courses/' + courseId + '/content', data),

  updateContentItem: (itemId: string, data: Partial<ContentItem>) =>
    api.patch<ContentItem>('/api/v1/courses/items/' + itemId, data),

  deleteContentItem: (itemId: string) =>
    api.delete('/api/v1/courses/items/' + itemId),
};
