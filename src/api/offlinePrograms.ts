import { api } from './client';
import type {
  Program, Slide, Question, Category,
  SessionDashboard, QrPayload,
} from '../types/offlineProgram';

// ---------------------------------------------------------------------------
// Programs CRUD
// ---------------------------------------------------------------------------

export const offlineProgramsApi = {
  list: (params?: { target_role?: string; is_active?: boolean }) =>
    api.get<{ count: number; programs: Program[] }>('/api/v1/offline/programs', { params }),

  getById: (id: string) =>
    api.get<Program>(`/api/v1/offline/programs/${id}`),

  getByCode: (code: string) =>
    api.get<Program>(`/api/v1/offline/programs/by-code/${code}`),

  create: (data: Partial<Program>) =>
    api.post<Program>('/api/v1/offline/programs', data),

  update: (id: string, data: Partial<Program>) =>
    api.put<Program>(`/api/v1/offline/programs/${id}`, data),

  remove: (id: string) =>
    api.delete(`/api/v1/offline/programs/${id}`),

  replaceSlides: (id: string, slides: Slide[]) =>
    api.put<{ slides: Slide[] }>(`/api/v1/offline/programs/${id}/slides`, { slides }),

  replaceQuestions: (id: string, questions: Question[]) =>
    api.put<{ questions: Question[] }>(`/api/v1/offline/programs/${id}/questions`, { questions }),

  replaceCategories: (id: string, categories: Category[]) =>
    api.put<{ categories: Category[] }>(`/api/v1/offline/programs/${id}/categories`, { categories }),
};

// ---------------------------------------------------------------------------
// Sessions — расширения для проектора
// ---------------------------------------------------------------------------

export const offlineSessionExtraApi = {
  getDashboard: (sessionId: string, phase: 'pre' | 'post' | 'both' = 'both') =>
    api.get<SessionDashboard>(`/api/v1/offline/sessions/${sessionId}/dashboard`, {
      params: { phase },
    }),

  getQr: (sessionId: string) =>
    api.get<QrPayload>(`/api/v1/offline/sessions/${sessionId}/qr`),
};

// ---------------------------------------------------------------------------
// Mobile guest test
// ---------------------------------------------------------------------------

export interface GuestTestSubmit {
  access_code: string;
  test_type: 'pre' | 'post';
  participant_name: string;
  total_score: number;
  max_score: number;
  percentage: number;
  answers?: Record<string, unknown>;
  categories?: Record<string, unknown>;
  duration_seconds?: number;
}

export interface MobileSessionInfo {
  session: {
    id: string;
    title: string;
    status: string;
    access_code: string;
  };
  program: {
    id: string;
    code: string;
    title: string;
    title_uz?: string;
    description?: string;
    description_uz?: string;
    max_score: number;
    num_questions: number;
    theme_color: string;
    icon?: string | null;
    questions: Array<{
      order_index: number;
      question: string;
      question_uz?: string;
      category?: string | null;
      max_score: number;
      options: Array<{ text: string; text_uz?: string; score: number }>;
    }>;
    categories: Array<{
      code: string;
      label: string;
      label_uz?: string;
      color: string;
    }>;
  } | null;
}

export const offlineGuestApi = {
  /** Получить программу + вопросы для мобильного теста (без авторизации). */
  getMobileSession: (accessCode: string) =>
    api.get<MobileSessionInfo>(`/api/v1/offline/m/${accessCode}`),

  submitGuestTest: (data: GuestTestSubmit) =>
    api.post('/api/v1/offline/tests/guest', data),
};
