import { api } from './client';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  points: number;
}

export interface QuizData {
  questions: QuizQuestion[];
  passing_score: number;
  time_limit_minutes: number | null;
}

export interface QuizResult {
  content_item_id: string;
  course_id: string;
  answers: Record<string, string>;
  score: number;
  time_spent_seconds: number;
  passed: boolean;
}

export const quizApi = {
  submitResult: async (result: QuizResult) => {
    try {
      return await api.post('/api/v1/progress/quiz-result', result);
    } catch {
      // API might not exist yet - save locally
      const saved = JSON.parse(localStorage.getItem('quiz_results') || '[]');
      saved.push({ ...result, submitted_at: new Date().toISOString() });
      localStorage.setItem('quiz_results', JSON.stringify(saved));
      return { data: result, local: true };
    }
  },
};
