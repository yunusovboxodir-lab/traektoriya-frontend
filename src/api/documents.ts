import { api } from './client';

export interface DocumentResponse {
  id: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  document_type: string | null;
  status: string;
  title: string | null;
  category: string | null;
  chunk_count: number | null;
  word_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  total: number;
  documents: DocumentResponse[];
}

export interface DocumentStats {
  tenant_id: string;
  by_type: Array<{
    document_type: string;
    count: number;
    total_size_mb: number;
    processed_count: number;
  }>;
  total_documents: number;
  total_size_mb: number;
}

// Helper to get tenant_id
async function getTenantId(): Promise<string> {
  const cached = localStorage.getItem('tenantId');
  if (cached) return cached;

  try {
    const resp = await api.get('/api/v1/tenant');
    const id = resp.data?.id;
    if (id) {
      localStorage.setItem('tenantId', id);
      return id;
    }
  } catch (e) {
    console.error('Failed to get tenant:', e);
  }
  return '';
}

export { getTenantId };

export const documentsApi = {
  upload: async (file: File, documentType: string) => {
    const tenantId = await getTenantId();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenant_id', tenantId);
    formData.append('document_type', documentType);
    return api.post<DocumentResponse>('/api/v1/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadBatch: async (files: File[], documentType: string) => {
    const tenantId = await getTenantId();
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('tenant_id', tenantId);
    formData.append('document_type', documentType);
    return api.post('/api/v1/documents/upload-batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadZip: async (file: File, documentType: string) => {
    const tenantId = await getTenantId();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenant_id', tenantId);
    formData.append('document_type', documentType);
    return api.post('/api/v1/documents/upload-zip', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  list: async (params?: { document_type?: string; status?: string; limit?: number; offset?: number }) => {
    const tenantId = await getTenantId();
    return api.get<DocumentListResponse>('/api/v1/documents', { params: { tenant_id: tenantId, ...params } });
  },

  get: (documentId: string) => api.get<DocumentResponse>(`/api/v1/documents/${documentId}`),
  getText: (documentId: string) => api.get(`/api/v1/documents/${documentId}/text`),
  getTypes: () => api.get<string[]>('/api/v1/documents/types'),

  getStats: async () => {
    const tenantId = await getTenantId();
    return api.get<DocumentStats>('/api/v1/documents/stats', { params: { tenant_id: tenantId } });
  },

  updateType: (documentId: string, documentType: string) =>
    api.patch(`/api/v1/documents/${documentId}/type`, null, { params: { document_type: documentType } }),

  delete: (documentId: string) => api.delete(`/api/v1/documents/${documentId}`),
};
