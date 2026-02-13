import { api } from './client';

export interface TeamMember {
  id: string;
  employee_id: string;
  full_name: string;
  email: string | null;
  role: string;
  is_active: boolean;
  region: string | null;
  city: string | null;
  position: string | null;
  tenant_id: string;
  created_at: string;
  last_login: string | null;
}

export const teamApi = {
  getMembers: (skip = 0, limit = 100) =>
    api.get<TeamMember[]>(`/api/v1/users?skip=${skip}&limit=${limit}`),
};
