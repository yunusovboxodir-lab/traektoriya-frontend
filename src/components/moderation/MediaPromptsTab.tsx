import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';

// ─── Types ──────────────────────────────────────────────

interface MediaPromptItem {
  course_id: string;
  course_code: string;
  course_title_ru: string;
  level: string;
  slide_order: number;
  type: 'image' | 'video' | 'infographic';
  prompt_ru: string;
  prompt_uz?: string | null;
  status: 'pending' | 'in_progress' | 'done';
  media_url?: string | null;
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Ожидает', bg: 'bg-gray-100', text: 'text-gray-600' },
  in_progress: { label: 'В работе', bg: 'bg-amber-100', text: 'text-amber-700' },
  done: { label: 'Готово', bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

const TYPE_ICONS: Record<string, string> = {
  image: '🖼️',
  video: '🎬',
  infographic: '📊',
};

const LEVEL_NAMES: Record<string, string> = {
  trainee: 'Стажёр',
  practitioner: 'Практик',
  expert: 'Эксперт',
  master: 'Мастер',
};

// ─── Component ──────────────────────────────────────────

export function MediaPromptsTab() {
  const [prompts, setPrompts] = useState<MediaPromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [updatingIdx, setUpdatingIdx] = useState<number | null>(null);

  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      const resp = await api.get<{ prompts: MediaPromptItem[] }>('/api/v1/learning/media-prompts', { params });
      setPrompts(resp.data.prompts);
      setError('');
    } catch {
      setError('Не удалось загрузить медиа-промпты');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const updatePrompt = async (courseId: string, slideOrder: number, updates: { status?: string; media_url?: string }) => {
    try {
      await api.patch(`/api/v1/learning/media-prompts/${courseId}/${slideOrder}`, updates);
      await fetchPrompts();
    } catch {
      setError('Ошибка обновления промпта');
    }
  };

  const handleStatusChange = async (prompt: MediaPromptItem, newStatus: string, idx: number) => {
    setUpdatingIdx(idx);
    await updatePrompt(prompt.course_id, prompt.slide_order, { status: newStatus });
    setUpdatingIdx(null);
  };

  const handleMediaUrlSubmit = async (prompt: MediaPromptItem, url: string, idx: number) => {
    setUpdatingIdx(idx);
    await updatePrompt(prompt.course_id, prompt.slide_order, { status: 'done', media_url: url });
    setUpdatingIdx(null);
  };

  // Filter
  const filtered = prompts.filter(p => {
    if (filterType !== 'all' && p.type !== filterType) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Медиа-промпты для дизайнера</h2>
        <p className="text-sm text-gray-500">Задания на создание изображений, видео и инфографики для учебных курсов</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {[
            { value: 'all', label: 'Все' },
            { value: 'pending', label: 'Ожидают' },
            { value: 'in_progress', label: 'В работе' },
            { value: 'done', label: 'Готово' },
          ].map(s => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterStatus === s.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {[
            { value: 'all', label: 'Все типы' },
            { value: 'image', label: '🖼️ Фото' },
            { value: 'video', label: '🎬 Видео' },
            { value: 'infographic', label: '📊 Инфо' },
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterType === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 self-center ml-2">{filtered.length} промптов</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <span className="text-3xl mb-3 block">🎨</span>
          <p>Медиа-промпты не найдены</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((prompt, idx) => {
            const isExpanded = expandedIdx === idx;
            const isUpdating = updatingIdx === idx;
            const style = STATUS_STYLES[prompt.status] || STATUS_STYLES.pending;

            return (
              <div
                key={`${prompt.course_id}-${prompt.slide_order}`}
                className={`rounded-xl border transition-all ${
                  isExpanded ? 'border-blue-200 shadow-md bg-white' : 'border-gray-200 bg-white hover:shadow-sm'
                }`}
              >
                {/* Row */}
                <div
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                >
                  {/* Type icon */}
                  <span className="text-xl shrink-0">{TYPE_ICONS[prompt.type] || '📎'}</span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{prompt.course_title_ru}</p>
                    <p className="text-xs text-gray-400">
                      Слайд {prompt.slide_order} · {LEVEL_NAMES[prompt.level] || prompt.level} · {prompt.course_code}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>

                  {/* Media indicator */}
                  {prompt.media_url && (
                    <span className="text-emerald-500 text-xs font-bold">✓ Медиа</span>
                  )}

                  {/* Expand arrow */}
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                    {/* Prompt text */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Промпт (RU):</p>
                      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{prompt.prompt_ru}</p>
                    </div>
                    {prompt.prompt_uz && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Промпт (UZ):</p>
                        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3">{prompt.prompt_uz}</p>
                      </div>
                    )}

                    {/* Current media */}
                    {prompt.media_url && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Текущее медиа:</p>
                        {prompt.type === 'video' ? (
                          <a href={prompt.media_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                            {prompt.media_url}
                          </a>
                        ) : (
                          <img src={prompt.media_url} alt="Media" className="max-h-48 rounded-xl border border-gray-200" />
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {/* Status buttons */}
                      {prompt.status !== 'in_progress' && (
                        <button
                          onClick={() => handleStatusChange(prompt, 'in_progress', idx)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors"
                        >
                          {isUpdating ? '...' : 'Взять в работу'}
                        </button>
                      )}

                      {prompt.status !== 'done' && (
                        <MediaUrlInput
                          onSubmit={(url) => handleMediaUrlSubmit(prompt, url, idx)}
                          isUpdating={isUpdating}
                        />
                      )}

                      {prompt.status === 'done' && (
                        <button
                          onClick={() => handleStatusChange(prompt, 'pending', idx)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                          Вернуть в ожидание
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Media URL input sub-component ──────────────────────

function MediaUrlInput({
  onSubmit,
  isUpdating,
}: {
  onSubmit: (url: string) => void;
  isUpdating: boolean;
}) {
  const [showInput, setShowInput] = useState(false);
  const [url, setUrl] = useState('');

  const handleSubmit = () => {
    if (!url.trim()) return;
    onSubmit(url.trim());
    setUrl('');
    setShowInput(false);
  };

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
      >
        Загрузить медиа (URL)
      </button>
    );
  }

  return (
    <div className="flex gap-2 flex-1 min-w-[250px]">
      <input
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="https://... URL медиафайла"
        className="flex-1 border rounded-lg px-3 py-1.5 text-xs"
        autoFocus
      />
      <button
        onClick={handleSubmit}
        disabled={isUpdating || !url.trim()}
        className="px-3 py-1.5 text-xs font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
      >
        {isUpdating ? '...' : 'Сохранить'}
      </button>
      <button
        onClick={() => { setShowInput(false); setUrl(''); }}
        className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    </div>
  );
}
