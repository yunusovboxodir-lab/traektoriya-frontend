import { api } from './client';

// ---------------------------------------------------------------------------
// Types — Competency Matrix
// ---------------------------------------------------------------------------

export interface CompetencyGap {
  competency_id: string;
  competency_name: string;
  category: string;
  required_level: number;
  current_level: number;
  gap: number;
  weight: string;
  ksa_type: string;
  bloom_level: string;
}

export interface UserMatrix {
  user_id: string;
  position_profile_id: string;
  position_title: string;
  total_competencies: number;
  gaps_count: number;
  avg_gap: number;
  gaps: CompetencyGap[];
}

export interface TeamMemberMatrix {
  user_id: string;
  employee_id: string;
  full_name: string | null;
  total_competencies: number;
  gaps_count: number;
  avg_gap: number;
  gaps: CompetencyGap[];
}

export interface TeamMatrixResponse {
  team_id: string;
  profile_id: string;
  profile_title: string;
  members_count: number;
  members: TeamMemberMatrix[];
}

// ---------------------------------------------------------------------------
// Types — Position Profiles
// ---------------------------------------------------------------------------

export interface ProfileCompetency {
  competency_id: string;
  competency_name: string;
  category: string;
  required_level: number;
  weight: string;
  ksa_type: string;
  bloom_level: string;
}

export interface PositionProfile {
  id: string;
  title: string;
  target_role: string | null;
  status: string;
  department: string | null;
  total_competencies: number;
  created_at: string;
  updated_at: string;
}

export interface PositionProfileDetail extends PositionProfile {
  description: string | null;
  required_competencies: ProfileCompetency[];
}

// ---------------------------------------------------------------------------
// Types — Manual Assessment
// ---------------------------------------------------------------------------

export interface ManualAssessInput {
  user_id: string;
  competency_id: string;
  level: number;
  notes?: string;
}

export interface AssessResult {
  user_id: string;
  competency_id: string;
  current_level: number;
  source: string;
  message: string;
}

// ---------------------------------------------------------------------------
// API — Competency Matrix
// ---------------------------------------------------------------------------

export const competencyMatrixApi = {
  getUserMatrix: (userId: string, profileId?: string) =>
    api.get<UserMatrix>(`/api/v1/competency-matrix/user/${userId}`, {
      params: profileId ? { profile_id: profileId } : undefined,
    }),

  getTeamMatrix: (teamId: string, profileId?: string) =>
    api.get<TeamMatrixResponse>(`/api/v1/competency-matrix/team/${teamId}`, {
      params: profileId ? { profile_id: profileId } : undefined,
    }),

  getPositionMatrix: (profileId: string) =>
    api.get(`/api/v1/competency-matrix/position/${profileId}`),

  manualAssess: (data: ManualAssessInput) =>
    api.post<AssessResult>('/api/v1/competency-matrix/assess', data),

  autoAssess: (userId: string) =>
    api.post(`/api/v1/competency-matrix/auto-assess/${userId}`),
};

// ---------------------------------------------------------------------------
// API — Position Profiles
// ---------------------------------------------------------------------------

export const competencyProfilesApi = {
  getProfiles: (skip = 0, limit = 50, statusFilter?: string) =>
    api.get<{ items: PositionProfile[]; total: number }>(
      '/api/v1/competency-profiles',
      { params: { skip, limit, status: statusFilter } },
    ),

  getProfile: (id: string) =>
    api.get<PositionProfileDetail>(`/api/v1/competency-profiles/${id}`),

  createFromDocument: (documentId: string, targetRole?: string) =>
    api.post('/api/v1/competency-profiles/from-document', {
      document_id: documentId,
      target_role: targetRole,
    }),

  createManual: (data: {
    title: string;
    target_role?: string;
    description?: string;
    department?: string;
    competencies: Array<{
      competency_id: string;
      required_level: number;
      weight?: string;
    }>;
  }) => api.post('/api/v1/competency-profiles', data),

  updateProfile: (id: string, data: Partial<{
    title: string;
    target_role: string;
    description: string;
    department: string;
    status: string;
    required_competencies: unknown[];
  }>) => api.put(`/api/v1/competency-profiles/${id}`, data),

  deleteProfile: (id: string) =>
    api.delete(`/api/v1/competency-profiles/${id}`),

  assignUsers: (profileId: string, userIds: string[]) =>
    api.post(`/api/v1/competency-profiles/${profileId}/assign-users`, {
      profile_id: profileId,
      user_ids: userIds,
    }),
};
