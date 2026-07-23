import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { coursesApi, type ContentItem } from '../../api/courses';
import { LessonEditor } from './LessonEditor';
import { useT } from '../../stores/langStore';

// label → labelKey: тексты живут в словарях src/i18n (i18n)
const STATUS_OPTIONS = [
  { value: '', labelKey: 'moderation.status.all' },
  { value: 'draft', labelKey: 'moderation.status.draft' },
  { value: 'review', labelKey: 'moderation.status.review' },
  { value: 'approved', labelKey: 'moderation.status.approved' },
  { value: 'published', labelKey: 'moderation.status.published' },
  { value: 'rejected', labelKey: 'moderation.status.rejected' },
];

const CONTENT_TYPE_OPTIONS = [
  { value: '', labelKey: 'moderation.type.all' },
  { value: 'lesson', labelKey: 'moderation.type.lesson' },
  { value: 'quiz', labelKey: 'moderation.type.quiz' },
  { value: 'video', labelKey: 'moderation.type.video' },
  { value: 'practice', labelKey: 'moderation.type.practice' },
  { value: 'case_study', labelKey: 'moderation.type.case_study' },
  { value: 'summary', labelKey: 'moderation.type.summary' },
];

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  draft:      { background: 'var(--bg-elevated)',  color: 'var(--text-secondary)' },
  generating: { background: 'var(--info-bg)',      color: 'var(--info)' },
  review:     { background: 'var(--warning-bg)',   color: 'var(--warning)' },
  approved:   { background: 'var(--success-bg)',   color: 'var(--success)' },
  published:  { background: 'var(--success-bg)',   color: 'var(--success)' },
  rejected:   { background: 'var(--danger-bg)',    color: 'var(--danger)' },
};

const STATUS_KEYS: Record<string, string> = {
  draft: 'moderation.status.draft',
  generating: 'moderation.status.generating',
  review: 'moderation.status.review',
  approved: 'moderation.status.approved',
  published: 'moderation.status.published',
  rejected: 'moderation.status.rejected',
};

const TYPE_KEYS: Record<string, string> = {
  lesson: 'moderation.type.lesson',
  quiz: 'moderation.type.quiz',
  video: 'moderation.type.video',
  practice: 'moderation.type.practice',
  case_study: 'moderation.type.case_study',
  summary: 'moderation.type.summary',
};

const DIFFICULTY_KEYS: Record<number, string> = {
  1: 'moderation.difficulty.beginner',
  2: 'moderation.difficulty.intermediate',
  3: 'moderation.difficulty.advanced',
  4: 'moderation.difficulty.expert',
};

export function ContentModerationTab() {
  const t = useT();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const limit = 20;

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await coursesApi.getAllContentItems({
        skip: page * limit,
        limit,
        status: statusFilter || undefined,
        content_type: typeFilter || undefined,
        search: search || undefined,
      });
      setItems(resp.data.items);
      setTotal(resp.data.total);
    } catch {
      // silent — UI shows empty state
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = () => {
    setPage(0);
    setSearch(searchInput);
  };

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div>
      {/* Filters */}
      <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{t('moderation.search')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={t('moderation.searchPlaceholder')}
                className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
              <button
                onClick={handleSearch}
                className="px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                {t('moderation.find')}
              </button>
            </div>
          </div>

          {/* Status filter */}
          <div className="w-40">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{t('moderation.statusLabel')}</label>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div className="w-36">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{t('moderation.typeLabel')}</label>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            >
              {CONTENT_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('moderation.found')} <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{total}</span>
        </p>
        {totalPages > 1 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('moderation.pageOf', { page: page + 1, total: totalPages })}
          </p>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-2" style={{ borderColor: 'var(--info)', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-3xl mb-2" style={{ color: 'var(--text-muted)' }}>–</div>
          <p style={{ color: 'var(--text-secondary)' }}>{t('moderation.notFound')}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t('moderation.tryFilters')}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  <th className="px-4 py-3 font-medium text-left" style={{ color: 'var(--text-muted)' }}>{t('moderation.colTitle')}</th>
                  <th className="px-4 py-3 font-medium text-left w-24" style={{ color: 'var(--text-muted)' }}>{t('moderation.typeLabel')}</th>
                  <th className="px-4 py-3 font-medium text-left w-28" style={{ color: 'var(--text-muted)' }}>{t('moderation.statusLabel')}</th>
                  <th className="px-4 py-3 font-medium text-left w-28" style={{ color: 'var(--text-muted)' }}>{t('moderation.colDifficulty')}</th>
                  <th className="px-4 py-3 font-medium text-left w-24" style={{ color: 'var(--text-muted)' }}>{t('moderation.colMedia')}</th>
                  <th className="px-4 py-3 font-medium text-left w-28" style={{ color: 'var(--text-muted)' }}>{t('moderation.colUpdated')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => setEditingItemId(item.id)}
                    className="cursor-pointer transition-colors"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      {item.learning_objective && (
                        <div className="text-xs truncate max-w-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {item.learning_objective}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {TYPE_KEYS[item.content_type] ? t(TYPE_KEYS[item.content_type]) : item.content_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={STATUS_STYLE[item.status] || { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                        {STATUS_KEYS[item.status] ? t(STATUS_KEYS[item.status]) : item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {DIFFICULTY_KEYS[item.difficulty_level] ? t(DIFFICULTY_KEYS[item.difficulty_level]) : `Ур. ${item.difficulty_level}`}
                    </td>
                    <td className="px-4 py-3">
                      {item.media_urls && item.media_urls.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--info)' }}>
                          {t('moderation.filesN', { n: item.media_urls.length })}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(item.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                onClick={() => setEditingItemId(item.id)}
                className="rounded-xl p-4 cursor-pointer hover:shadow-sm transition-shadow"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0" style={STATUS_STYLE[item.status] || { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    {STATUS_KEYS[item.status] ? t(STATUS_KEYS[item.status]) : item.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{TYPE_KEYS[item.content_type] ? t(TYPE_KEYS[item.content_type]) : item.content_type}</span>
                  <span>{DIFFICULTY_KEYS[item.difficulty_level] ? t(DIFFICULTY_KEYS[item.difficulty_level]) : ''}</span>
                  {item.media_urls && item.media_urls.length > 0 && (
                    <span style={{ color: 'var(--info)' }}>{t('moderation.filesN', { n: item.media_urls.length })}</span>
                  )}
                  <span className="ml-auto">{formatDate(item.updated_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}
              >
                {t('common.back')}
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i;
                } else if (page < 3) {
                  pageNum = i;
                } else if (page > totalPages - 4) {
                  pageNum = totalPages - 7 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className="w-8 h-8 rounded-lg text-sm"
                    style={page === pageNum
                      ? { background: 'var(--info)', color: 'var(--text-inverse)' }
                      : { border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }
                    }
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}
              >
                {t('moderation.next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Lesson Editor modal */}
      {editingItemId && (
        <LessonEditor
          itemId={editingItemId}
          onClose={() => setEditingItemId(null)}
          onSaved={() => {
            setEditingItemId(null);
            fetchItems();
          }}
        />
      )}
    </div>
  );
}
