import { api } from './client';
import { getTenantId } from './documents';

export const ragApi = {
  processDocument: (documentId: string, options?: { force_reprocess?: boolean; chunking_strategy?: string }) =>
    api.post('/api/v1/rag/process', { document_id: documentId, use_mock_embeddings: true, ...options }),

  processBatch: async (options?: { document_type?: string; force_reprocess?: boolean }) => {
    const tenantId = await getTenantId();
    return api.post('/api/v1/rag/process-batch', { tenant_id: tenantId, use_mock_embeddings: true, ...options });
  },

  search: async (query: string, options?: { document_type?: string; limit?: number }) => {
    const tenantId = await getTenantId();
    return api.post('/api/v1/rag/search', { query, tenant_id: tenantId, use_mock_embeddings: true, ...options });
  },

  searchStandards: async (query: string, limit = 5) => {
    const tenantId = await getTenantId();
    return api.post('/api/v1/rag/search-standards', null, { params: { query, tenant_id: tenantId, limit, use_mock_embeddings: true } });
  },

  getStats: async () => {
    const tenantId = await getTenantId();
    return api.get('/api/v1/rag/stats', { params: { tenant_id: tenantId } });
  },

  getChunks: (documentId: string, limit = 50) =>
    api.get(`/api/v1/rag/chunks/${documentId}`, { params: { limit } }),
};
