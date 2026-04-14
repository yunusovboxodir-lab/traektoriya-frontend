import { api } from './client';

// ---------------------------------------------------------------------------
// Types — Offline Sessions
// ---------------------------------------------------------------------------

export interface OfflineSession {
  id: string;
  title: string;
  program: string;
  region: string | null;
  access_code: string;
  status: string;
  trainer_id: string | null;
  scheduled_date: string | null;
  presentation_url: string | null;
  participant_count: number;
  created_at: string;
}

export interface OfflineTestResult {
  id: string;
  session_id: string;
  user_id: string;
  user_name?: string;
  test_type: string; // pre | post
  total_score: number;
  max_score: number;
  percentage: number;
  categories: Record<string, number> | null;
  completed_at: string;
}

export interface OfflineGameResult {
  id: string;
  session_id: string;
  team_name: string;
  member_ids: string[];
  total_score: number;
  max_score: number;
  rank: number | null;
  game_type: string | null;
}

// ---------------------------------------------------------------------------
// API — Offline Activities
// ---------------------------------------------------------------------------

export const offlineApi = {
  // Sessions
  createSession: (data: {
    title: string;
    program: string;
    region?: string;
    scheduled_date?: string;
    presentation_url?: string;
  }) => api.post<OfflineSession>('/api/v1/offline/sessions', data),

  getSessions: (params?: { program?: string; region?: string; status?: string }) =>
    api.get<{ sessions: OfflineSession[]; count: number }>('/api/v1/offline/sessions', { params }),

  getSession: (id: string) =>
    api.get<OfflineSession & { test_results: OfflineTestResult[]; game_results: OfflineGameResult[] }>(
      `/api/v1/offline/sessions/${id}`,
    ),

  updateStatus: (id: string, status: string) =>
    api.patch(`/api/v1/offline/sessions/${id}/status`, { status }),

  joinSession: (accessCode: string) =>
    api.post('/api/v1/offline/sessions/join', { access_code: accessCode }),

  // Tests
  submitTest: (data: {
    session_id: string;
    test_type: string;
    total_score: number;
    max_score: number;
    percentage: number;
    answers?: object;
    categories?: object;
    duration_seconds?: number;
  }) => api.post('/api/v1/offline/tests', data),

  getTestResults: (sessionId: string) =>
    api.get<{ items: OfflineTestResult[] }>(`/api/v1/offline/tests/${sessionId}`),

  // Games
  saveGameResult: (data: {
    session_id: string;
    team_name: string;
    member_ids: string[];
    total_score: number;
    max_score: number;
    rank?: number;
    game_type?: string;
  }) => api.post('/api/v1/offline/games', data),

  getGameResults: (sessionId: string) =>
    api.get<{ items: OfflineGameResult[] }>(`/api/v1/offline/games/${sessionId}`),

  // Dashboard
  getDashboard: (params?: { date_from?: string; date_to?: string }) =>
    api.get('/api/v1/offline/dashboard', { params }),
};
