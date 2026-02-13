import { api } from './client';

export interface PageInfo {
  key: string;
  label: string;
}

export interface RoleScopesResponse {
  scopes: Record<string, string[]>;
  all_pages: PageInfo[];
}

export interface MyScopesResponse {
  role: string;
  allowed_pages: string[];
}

export const roleScopesApi = {
  /** GET /api/v1/admin/role-scopes — all roles' scopes (admin+) */
  getAll: () =>
    api.get<RoleScopesResponse>('/api/v1/admin/role-scopes'),

  /** PUT /api/v1/admin/role-scopes — update scopes (admin+) */
  update: (scopes: Record<string, string[]>) =>
    api.put('/api/v1/admin/role-scopes', { scopes }),

  /** GET /api/v1/role-scopes/my — current user's allowed pages */
  getMyScopes: () =>
    api.get<MyScopesResponse>('/api/v1/role-scopes/my'),
};
