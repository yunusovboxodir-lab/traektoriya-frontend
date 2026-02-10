import { api } from './client';

export interface Assessment {
  id: string;
  title: string;
  description: string | null;
  assessment_type: string;
  territory: string | null;
  pass_threshold: number;
  time_limit_minutes: number | null;
  question_count: number;
  is_active: boolean;
}

export interface AssessmentQuestion {
  id: string;
  question_type: string;
  content: string;
  options: string[] | null;
  difficulty: number;
  points: number;
}

export interface AssessmentAttempt {
  id: string;
  score: number | null;
  passed: boolean | null;
  total_questions: number;
  correct_answers_count: number;
  attempt_number: number;
  completed_at: string | null;
  expires_at: string | null;
}

export const assessmentsApi = {
  getAssessments: () => api.get('/api/v1/assessments'),
  getAssessment: (id: string) => api.get(`/api/v1/assessments/${id}`),
  startAttempt: (id: string) => api.post(`/api/v1/assessments/${id}/start`),
  submitAttempt: (id: string, answers: Record<string, string[]>) =>
    api.post(`/api/v1/assessments/${id}/submit`, { answers }),
  getResults: (id: string) => api.get(`/api/v1/assessments/${id}/results`),
};
