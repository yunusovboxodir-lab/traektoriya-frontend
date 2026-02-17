import { useState, useEffect, useCallback } from 'react';
import { coursesApi, type ContentItem } from '../../api/courses';
import { LessonEditor } from './LessonEditor';

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'draft', label: 'Черновик' },
  { value: 'review', label: 'На проверке' },
  { value: 'approved', label: 'Утверждён' },
  { value: 'published', label: 'Опубликован' },
  { value: 'rejected', label: 'Отклонён' },
];

const CONTENT_TYPE_OPTIONS = [
  { value: '', label: 'Все типы' },
  { value: 'lesson', label: 'Урок' },
  { value: 'quiz', label: 'Квиз' },
  { value: 'video', label: 'Видео' },
  { value: 'practice', label: 'Практика' },
  { value: 'case_study', label: 'Кейс' },
  { value: 'summary', label: 'Итог' },
];

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  generating: 'bg-blue-100 text-blue-700',
  review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  published: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  generating: 'Генерация',
  review: 'На проверке',
  approved: 'Утверждён',
  published: 'Опубликован',
  rejected: 'Отклонён',
};

const TYPE_LABELS: Record<string, string> = {
  lesson: 'Урок',
  quiz: 'Квиз',
  video: 'Видео',
  practice: 'Практика',
  case_study: 'Кейс',
  summary: 'Итог',
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Начальный',
  2: 'Средний',
  3: 'Продвинутый',
  4: 'Экспертный',
};

export function ContentModerationTab() {
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
    } catch (err) {
      console.error('Failed to load content items', err);
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
      <div className="bg-white rounded-xl border p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Поиск</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Поиск по названию..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleSearch}
                className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
              >
                Найти
              </button>
            </div>
          </div>

          {/* Status filter */}
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Статус</label>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div className="w-36">
            <label className="block text-xs font-medium text-gray-500 mb-1">Тип</label>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {CONTENT_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm text-gray-500">
          Найдено: <span className="font-medium text-gray-700">{total}</span> элементов
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-gray-400">
            Страница {page + 1} из {totalPages}
          </p>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-gray-400">Загрузка...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <div className="text-3xl mb-2">📭</div>
          <p className="text-gray-500">Контент не найден</p>
          <p className="text-sm text-gray-400 mt-1">Попробуйте изменить фильтры</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Название</th>
                  <th className="px-4 py-3 font-medium text-gray-600 w-24">Тип</th>
                  <th className="px-4 py-3 font-medium text-gray-600 w-28">Статус</th>
                  <th className="px-4 py-3 font-medium text-gray-600 w-28">Сложность</th>
                  <th className="px-4 py-3 font-medium text-gray-600 w-24">Медиа</th>
                  <th className="px-4 py-3 font-medium text-gray-600 w-28">Обновлён</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => setEditingItemId(item.id)}
                    className="border-t hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 truncate max-w-xs">
                        {item.title}
                      </div>
                      {item.learning_objective && (
                        <div className="text-xs text-gray-400 truncate max-w-xs mt-0.5">
                          {item.learning_objective}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">
                        {TYPE_LABELS[item.content_type] || item.content_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {DIFFICULTY_LABELS[item.difficulty_level] || `Ур. ${item.difficulty_level}`}
                    </td>
                    <td className="px-4 py-3">
                      {item.media_urls && item.media_urls.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                          📎 {item.media_urls.length}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
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
                className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-gray-900 text-sm flex-1">{item.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{TYPE_LABELS[item.content_type] || item.content_type}</span>
                  <span>{DIFFICULTY_LABELS[item.difficulty_level]}</span>
                  {item.media_urls && item.media_urls.length > 0 && (
                    <span className="text-blue-600">📎 {item.media_urls.length}</span>
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
                className="px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40 hover:bg-gray-50"
              >
                Назад
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
                    className={`w-8 h-8 rounded-lg text-sm ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40 hover:bg-gray-50"
              >
                Вперёд
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
