import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { documentsApi, type DocumentResponse, type DocumentStats } from '../api/documents';
import { ragApi } from '../api/rag';

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const DOC_TYPE_LABELS: Record<string, string> = {
  job_description: 'ДИ',
  standard: 'Стандарт',
  product: 'Продукт',
  policy: 'Политика',
  training: 'Учебный',
  other: 'Прочее',
};

const FILTER_TABS: { label: string; value: string | null }[] = [
  { label: 'Все', value: null },
  { label: 'Стандарты', value: 'standard' },
  { label: 'Продукты', value: 'product' },
  { label: 'ДИ', value: 'job_description' },
  { label: 'Политики', value: 'policy' },
  { label: 'Учебные', value: 'training' },
  { label: 'Прочее', value: 'other' },
];

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.zip'];
const PAGE_SIZE = 20;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function IconUploadCloud({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.572 5.345A3.75 3.75 0 0117.25 19.5H6.75z" />
    </svg>
  );
}

function IconRefresh({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
    </svg>
  );
}

function IconTrash({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function IconX({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconDocument({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function FileTypeIcon({ fileType }: { fileType: string }) {
  const ext = fileType?.toLowerCase() || '';
  let colorClass = 'text-gray-400';
  if (ext.includes('pdf')) colorClass = 'text-red-500';
  else if (ext.includes('doc')) colorClass = 'text-blue-500';
  else if (ext.includes('txt')) colorClass = 'text-gray-500';
  else if (ext.includes('zip')) colorClass = 'text-yellow-500';

  return <IconDocument className={`w-5 h-5 ${colorClass}`} />;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'uploaded':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Загружен
        </span>
      );
    case 'processing':
    case 'extracting_text':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
          Индексируется...
        </span>
      );
    case 'processed':
    case 'completed':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Готов
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Ошибка
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          {status}
        </span>
      );
  }
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function KnowledgeBasePage() {
  // ----- State -----
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadDocType, setUploadDocType] = useState('standard');
  const [uploadCategory, setUploadCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ name: string; ok: boolean }[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [reindexingIds, setReindexingIds] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----- Derived stats -----
  const indexedCount = useMemo(() => {
    if (!stats?.by_type) return 0;
    return stats.by_type.reduce((sum, t) => sum + (t.processed_count || 0), 0);
  }, [stats]);

  const pendingCount = useMemo(() => {
    if (!stats) return 0;
    return Math.max(0, stats.total_documents - indexedCount);
  }, [stats, indexedCount]);

  // ----- Data Fetching -----
  const loadDocuments = useCallback(
    async (currentOffset = 0, currentFilter: string | null = activeFilter) => {
      try {
        setIsLoading(true);
        setError(null);
        const params: Record<string, unknown> = {
          limit: PAGE_SIZE,
          offset: currentOffset,
        };
        if (currentFilter) params.document_type = currentFilter;

        const res = await documentsApi.list(params as Parameters<typeof documentsApi.list>[0]);
        const data = res.data;

        if (currentOffset === 0) {
          setDocuments(data.documents || []);
        } else {
          setDocuments((prev) => [...prev, ...(data.documents || [])]);
        }
        setTotal(data.total || 0);
      } catch (e: unknown) {
          setError('Не удалось загрузить документы');
      } finally {
        setIsLoading(false);
      }
    },
    [activeFilter],
  );

  const loadStats = useCallback(async () => {
    try {
      const res = await documentsApi.getStats();
      setStats(res.data);
    } catch {
      // Stats are non-critical
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await documentsApi.getCategories();
      setCategories(res.data || []);
    } catch {
      // Categories are non-critical
    }
  }, []);

  useEffect(() => {
    loadDocuments(0);
    loadStats();
    loadCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ----- Filter -----
  const handleFilterChange = useCallback(
    (value: string | null) => {
      setActiveFilter(value);
      setOffset(0);
      loadDocuments(0, value);
    },
    [loadDocuments],
  );

  // ----- Pagination -----
  const handleLoadMore = useCallback(() => {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    loadDocuments(next);
  }, [offset, loadDocuments]);

  // ----- Drag & Drop -----
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(isAcceptedFile);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
      setUploadResults([]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(isAcceptedFile);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
      setUploadResults([]);
    }
    // Reset input so the same file(s) can be selected again
    e.target.value = '';
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ----- Upload -----
  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    setIsUploading(true);
    setUploadResults([]);

    const results: { name: string; ok: boolean }[] = [];

    for (const file of selectedFiles) {
      try {
        const isZip = file.name.toLowerCase().endsWith('.zip');
        let docId: string | undefined;
        const cat = uploadCategory.trim() || undefined;

        if (isZip) {
          const res = await documentsApi.uploadZip(file, uploadDocType, cat);
          // uploadZip may return array or single doc
          const data = res.data;
          if (Array.isArray(data) && data.length > 0) {
            docId = data[0].id;
          } else if (data?.id) {
            docId = data.id;
          }
        } else {
          const res = await documentsApi.upload(file, uploadDocType, cat);
          docId = res.data?.id;
        }

        // Trigger RAG processing
        if (docId) {
          try {
            await ragApi.processDocument(docId);
          } catch {
            // Non-critical: document uploaded, indexing can be retried
          }
        }

        results.push({ name: file.name, ok: true });
      } catch {
        results.push({ name: file.name, ok: false });
      }
    }

    setUploadResults(results);
    setSelectedFiles([]);
    setIsUploading(false);

    // Refresh data
    setOffset(0);
    loadDocuments(0);
    loadStats();
    loadCategories();
  }, [selectedFiles, isUploading, uploadDocType, uploadCategory, loadDocuments, loadStats, loadCategories]);

  // ----- Re-index -----
  const handleReindex = useCallback(async (docId: string) => {
    setReindexingIds((prev) => new Set(prev).add(docId));
    try {
      await ragApi.processDocument(docId, { force_reprocess: true });
    } catch {
      // Reindex failed — will refresh anyway
    } finally {
      setReindexingIds((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
      loadDocuments(0);
      loadStats();
    }
  }, [loadDocuments, loadStats]);

  // ----- Delete -----
  const handleDelete = useCallback(
    async (docId: string) => {
      try {
        await documentsApi.delete(docId);
        setDeleteConfirmId(null);
        setOffset(0);
        loadDocuments(0);
        loadStats();
      } catch {
        // Delete failed silently
      }
    },
    [loadDocuments, loadStats],
  );

  // ----- Render: Loading -----
  if (isLoading && documents.length === 0 && !error) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // ----- Render: Error (full-page) -----
  if (error && documents.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => {
              loadDocuments(0);
              loadStats();
            }}
            className="text-red-600 underline text-sm mt-1"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const hasMore = documents.length < total;

  return (
    <div>
      {/* ---- Page Header ---- */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">База знаний</h1>
        <p className="text-sm text-gray-500 mt-1">
          Управление документами и индексацией для RAG-системы
        </p>
      </div>

      {/* ---- Stats Row ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          label="Всего документов"
          value={stats?.total_documents ?? 0}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
        <StatCard
          label="Размер базы"
          value={stats ? (stats.total_size_mb ?? 0).toFixed(1) + ' МБ' : '0 МБ'}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          }
        />
        <StatCard
          label="Проиндексировано"
          value={indexedCount}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Ожидают обработки"
          value={pendingCount}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* ---- Filter Tabs ---- */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.value;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => handleFilterChange(tab.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- Two-Column Layout ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- Left: Upload Section ---- */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-4 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Загрузка документов
              </h2>

              {/* Document type selector */}
              <div className="mb-3">
                <label htmlFor="upload-doc-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Тип документа
                </label>
                <select
                  id="upload-doc-type"
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category / Position selector */}
              <div className="mb-4">
                <label htmlFor="upload-category" className="block text-sm font-medium text-gray-700 mb-1">
                  Должность / Классификация
                </label>
                <input
                  id="upload-category"
                  type="text"
                  list="category-suggestions"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  placeholder="Например: Торговый представитель"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
                <datalist id="category-suggestions">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-400 mt-1">
                  К какой должности относится документ (необязательно)
                </p>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg px-4 py-8 cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                }`}
              >
                <IconUploadCloud
                  className={`w-10 h-10 mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`}
                />
                <p className="text-sm text-gray-600 text-center">
                  Перетащите файлы сюда или нажмите для выбора
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF, DOCX, DOC, TXT, ZIP
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Selected files list */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Выбрано {selectedFiles.length}{' '}
                    {pluralize(selectedFiles.length, 'файл', 'файла', 'файлов')}
                  </p>
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                    {selectedFiles.map((file, idx) => (
                      <li
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileTypeIcon fileType={file.name.split('.').pop() || ''} />
                          <div className="min-w-0">
                            <p className="text-sm text-gray-800 truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Удалить файл"
                        >
                          <IconX className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Upload button */}
              <button
                type="button"
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  'Загрузить'
                )}
              </button>

              {/* Upload results */}
              {uploadResults.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {uploadResults.map((r, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                        r.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {r.ok ? (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      )}
                      <span className="truncate">{r.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---- Right: Document Table ---- */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Table - Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Документ</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Тип</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Должность</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Размер</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileTypeIcon fileType={doc.file_type} />
                          <span className="truncate max-w-[200px] text-gray-900" title={doc.original_filename}>
                            {doc.original_filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {doc.document_type ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {doc.category ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                            {doc.category}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleReindex(doc.id)}
                            disabled={reindexingIds.has(doc.id)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                            title="Переиндексировать"
                          >
                            <IconRefresh
                              className={`w-4 h-4 ${reindexingIds.has(doc.id) ? 'animate-spin' : ''}`}
                            />
                          </button>
                          {deleteConfirmId === doc.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDelete(doc.id)}
                                className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                              >
                                Да
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                              >
                                Нет
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(doc.id)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Удалить"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card list - Mobile */}
            <div className="sm:hidden divide-y divide-gray-100">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileTypeIcon fileType={doc.file_type} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={doc.original_filename}>
                          {doc.original_filename}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {doc.document_type && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                            </span>
                          )}
                          <StatusBadge status={doc.status} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleReindex(doc.id)}
                        disabled={reindexingIds.has(doc.id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                      >
                        <IconRefresh
                          className={`w-4 h-4 ${reindexingIds.has(doc.id) ? 'animate-spin' : ''}`}
                        />
                      </button>
                      {deleteConfirmId === doc.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(doc.id)}
                            className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                          >
                            Да
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            Нет
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(doc.id)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>{formatDate(doc.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state */}
            {!isLoading && documents.length === 0 && (
              <div className="text-center py-16 px-4">
                <IconDocument className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  Документы ещё не загружены
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Загрузите файлы для создания базы знаний
                </p>
              </div>
            )}

            {/* Loading indicator (for pagination) */}
            {isLoading && documents.length > 0 && (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            )}

            {/* Pagination */}
            {!isLoading && hasMore && (
              <div className="px-4 py-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="w-full py-2.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Показать ещё ({total - documents.length}{' '}
                  {pluralize(
                    total - documents.length,
                    'документ',
                    'документа',
                    'документов',
                  )}
                  )
                </button>
              </div>
            )}

            {/* Document count footer */}
            {documents.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Показано {documents.length} из {total}{' '}
                  {pluralize(total, 'документа', 'документов', 'документов')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Delete Confirmation Overlay (click-outside dismiss) ---- */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 bg-transparent"
          onClick={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}
