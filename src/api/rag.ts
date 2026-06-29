import { api } from './client';
import { getTenantId } from './documents';

/**
 * Mock-эмбеддинги (аудит 2026-06-29): при true RAG отдаёт ФЕЙКОВЫЙ
 * семантический поиск (случайные/детерминированные векторы). Реальные
 * эмбеддинги (false) требуют загруженной модели e5-large на проде.
 * Пока e5 не подтверждён — оставляем mock, чтобы поиск не падал.
 * ⚠️ Владелец: после докачки e5 поставить VITE_RAG_REAL_EMBEDDINGS=true
 *    в Vercel env — тогда поиск станет настоящим без правки кода.
 */
const USE_MOCK_EMBEDDINGS = import.meta.env.VITE_RAG_REAL_EMBEDDINGS !== 'true';

export const ragApi = {
  processDocument: (documentId: string, options?: { force_reprocess?: boolean; chunking_strategy?: string }) =>
    api.post('/api/v1/rag/process', { document_id: documentId, use_mock_embeddings: USE_MOCK_EMBEDDINGS, ...options }),

  processBatch: async (options?: { document_type?: string; force_reprocess?: boolean }) => {
    const tenantId = await getTenantId();
    return api.post('/api/v1/rag/process-batch', { tenant_id: tenantId, use_mock_embeddings: USE_MOCK_EMBEDDINGS, ...options });
  },

  search: async (query: string, options?: { document_type?: string; limit?: number }) => {
    const tenantId = await getTenantId();
    return api.post('/api/v1/rag/search', { query, tenant_id: tenantId, use_mock_embeddings: USE_MOCK_EMBEDDINGS, ...options });
  },

  searchStandards: async (query: string, limit = 5) => {
    const tenantId = await getTenantId();
    return api.post('/api/v1/rag/search-standards', null, { params: { query, tenant_id: tenantId, limit, use_mock_embeddings: USE_MOCK_EMBEDDINGS } });
  },

  getStats: async () => {
    const tenantId = await getTenantId();
    return api.get('/api/v1/rag/stats', { params: { tenant_id: tenantId } });
  },

  getChunks: (documentId: string, limit = 50) =>
    api.get(`/api/v1/rag/chunks/${documentId}`, { params: { limit } }),
};
