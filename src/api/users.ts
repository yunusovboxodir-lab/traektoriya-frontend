import { api } from './client';

export interface UserListItem {
  id: string;
  employee_id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  position: string | null;
  department: string | null;
  region: string | null;
  city: string | null;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string | null;
  last_login: string | null;
  total_active_minutes: number;
}

export interface UsersListResponse {
  items: UserListItem[];
  total: number;
}

export interface CreateUserPayload {
  employee_id: string;
  password: string;
  full_name?: string;
  email?: string;
  role?: string;
  position?: string;
  department?: string;
  region?: string;
  city?: string;
  phone?: string;
}

export const usersApi = {
  list: (params?: { role?: string; is_active?: boolean; skip?: number; limit?: number }) =>
    api.get<UsersListResponse>('/api/v1/users', { params }),

  create: (data: CreateUserPayload) =>
    api.post<UserListItem>('/api/v1/users', data),

  updateRole: (employeeId: string, role: string) =>
    api.patch(`/api/v1/users/${employeeId}/role`, { role }),

  updateProfile: (employeeId: string, data: Partial<{
    full_name: string;
    email: string;
    position: string;
    department: string;
    region: string;
    city: string;
    phone: string;
    is_active: boolean;
  }>) =>
    api.patch(`/api/v1/users/${employeeId}/profile`, data),
};
