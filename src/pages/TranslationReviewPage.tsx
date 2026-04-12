/**
 * TranslationReviewPage — админ-панель проверки предложений перевода.
 *
 * Показывает очередь предложений с фильтром по статусу.
 * 3 действия: Одобрить (+XP), Отклонить (комментарий), Закрыть (качественный перевод).
 */
import { useState, useEffect, useCallback } from 'react';
import { translationApi, type TranslationSuggestion } from '../api/translationSuggestions';
const STATUS_TABS = [
  { id: 'pending', label: 'На проверке', color: 'text-yellow-600' },
  { id: 'approved', label: 'Одобренные', color: 'text-green-600' },
  { id: 'rejected', label: 'Отклонённые', color: 'text-red-600' },
  { id: 'locked', label: 'Качественные', color: 'text-blue-600' },
];

export function TranslationReviewPage() {
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState<TranslationSuggestion[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await translationApi.getQueue(status);
      setItems(res.data.items);
      setCounts(res.data.counts);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleReview = async (id: string, action: 'approve' | 'reject' | 'lock') => {
    try {
      await translationApi.review(id, action, reviewComment || undefined);
      setReviewingId(null);
      setReviewComment('');
      loadQueue();
    } catch (e) {
      alert('Ошибка: ' + String(e));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Проверка переводов</h2>

      {/* Табы статусов */}
      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatus(tab.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              status === tab.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            {counts[tab.id] ? (
              <span className="ml-1.5 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                {counts[tab.id]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Список */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p>Нет предложений</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border p-4 space-y-3">
              {/* Мета */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{item.user_name}</span>
                  <span>•</span>
                  <span>{item.course_title}</span>
                  <span>•</span>
                  <span>Блок #{item.block_index}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>

              {/* Оригинал RU */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 font-medium mb-1">Оригинал (RU):</p>
                <p className="text-sm text-gray-800">{item.original_ru}</p>
              </div>

              {/* Текущий UZ */}
              {item.current_uz && (
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-600 font-medium mb-1">Текущий (UZ):</p>
                  <p className="text-sm text-amber-900">{item.current_uz}</p>
                </div>
              )}

              {/* Предложенный перевод */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-1">Предложение:</p>
                <p className="text-sm text-blue-900 font-medium">{item.suggested_uz}</p>
              </div>

              {/* Действия (только для pending) */}
              {item.status === 'pending' && (
                <div className="pt-2 border-t">
                  {reviewingId === item.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Комментарий (необязательно)..."
                        className="w-full border rounded-lg p-2 text-sm resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(item.id, 'approve')}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"
                        >
                          ✅ Одобрить (+{item.bonus_xp} XP)
                        </button>
                        <button
                          onClick={() => handleReview(item.id, 'reject')}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700"
                        >
                          ❌ Отклонить
                        </button>
                        <button
                          onClick={() => handleReview(item.id, 'lock')}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                        >
                          🔒 Качественный
                        </button>
                        <button
                          onClick={() => { setReviewingId(null); setReviewComment(''); }}
                          className="px-3 py-1.5 text-gray-500 text-xs hover:text-gray-700"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReviewingId(item.id)}
                      className="text-sm text-blue-600 font-medium hover:text-blue-800"
                    >
                      Рассмотреть →
                    </button>
                  )}
                </div>
              )}

              {/* Комментарий админа (для rejected/locked) */}
              {item.admin_comment && (
                <div className="bg-gray-100 rounded-lg p-2 text-xs text-gray-600">
                  Админ: {item.admin_comment}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
