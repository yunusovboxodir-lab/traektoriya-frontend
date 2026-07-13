/**
 * organizations.ts — мультиорг API (бэк PR #36/онбординг).
 * POST/GET /organizations — только платформенный superadmin.
 * GET /tenant — организация текущего юзера (брендинг), любой авторизованный.
 */
import { api } from './client';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
}

export interface OrgListItem {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface CreateOrgRequest {
  name: string;
  slug: string;
  description?: string;
  primary_color?: string;
  admin_employee_id: string;
  admin_password: string;
  admin_full_name?: string;
  admin_email?: string;
}

export interface CreateOrgResponse {
  organization: OrgListItem;
  admin: { id: string; employee_id: string; role: string; tenant_id: string };
  login_hint: { employee_id: string; tenant_slug: string; note: string };
}

export const organizationsApi = {
  myTenant: () => api.get<TenantInfo>('/api/v1/tenant'),
  list: () => api.get<OrgListItem[]>('/api/v1/organizations'),
  create: (data: CreateOrgRequest) => api.post<CreateOrgResponse>('/api/v1/organizations', data),
};
