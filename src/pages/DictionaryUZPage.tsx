import { useState, useEffect, useCallback } from 'react';
import { useT } from '../stores/langStore';
import { useAuthStore } from '../stores/authStore';
import { dictionaryApi, type DictionaryEntry, type DictionaryStats } from '../api/dictionary';

const CATEGORIES = [
  { value: '', label: 'Все' },
  { value: 'product', label: 'Продукты' },
  { value: 'role', label: 'Должности' },
  { value: 'process', label: 'Процессы' },
  { value: 'sales', label: 'Продажи' },
  { value: 'merchandising', label: 'Мерчандайзинг' },
  { value: 'kpi', label: 'KPI' },
  { value: 'general', label: 'Общее' },
];

export function DictionaryUZPage() {
  const t = useT();
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'commercial_dir';

  // Состояние
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<DictionaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'translate' | 'admin'>('translate');

  // Фильтры
  const [category, setCategory] = useState('');
  const [showPending, setShowPending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Форма добавления
  const [newRu, setNewRu] = useState('');
  const [newUz, setNewUz] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Загрузка данных
  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      if (searchTerm.length >= 2) {
        const res = await dictionaryApi.search(searchTerm);
        setEntries(res.data);
        setTotal(res.data.length);
      } else {
        const res = await dictionaryApi.list({
          limit: 50,
          category: category || undefined,
          pending_only: showPending || undefined,
        });
        setEntries(res.data.items);
        setTotal(res.data.total);
      }
    } catch {
      setMessage('Ошибка загрузки словаря');
    } finally {
      setLoading(false);
    }
  }, [category, showPending, searchTerm]);

  const loadStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await dictionaryApi.stats();
      setStats(res.data);
    } catch { /* ignore */ }
  }, [isAdmin]);

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => { loadStats(); }, [loadStats]);

  // Добавить перевод
  const handleSubmit = async () => {
    if (!newRu.trim() || !newUz.trim()) return;
    setSubmitting(true);
    setMessage('');
    try {
      await dictionaryApi.create({
        russian_term: newRu.trim(),
        uzbek_translation: newUz.trim(),
        context_category: newCategory,
      });
      setMessage('Перевод добавлен!');
      setNewRu('');
      setNewUz('');
      loadEntries();
      loadStats();
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Ошибка при добавлении');
    } finally {
      setSubmitting(false);
    }
  };

  // Одобрить
  const handleVerify = async (id: string) => {
    try {
      await dictionaryApi.verify(id);
      loadEntries();
      loadStats();
    } catch {
      setMessage('Ошибка при одобрении');
    }
  };

  // Удалить
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить запись?')) return;
    try {
      await dictionaryApi.delete(id);
      loadEntries();
      loadStats();
    } catch {
      setMessage('Ошибка при удалении');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dictionary.title') || 'Словарь UZ'}</h1>
          <p className="text-gray-500 mt-1">{t('dictionary.subtitle') || 'Краудсорсинг переводов FMCG-терминов'}</p>
        </div>
        {stats && (
          <div className="flex gap-4 text-sm">
            <div className="bg-blue-50 rounded-lg px-3 py-2 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-gray-500">всего</div>
            </div>
            <div className="bg-green-50 rounded-lg px-3 py-2 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              <div className="text-gray-500">одобрено</div>
            </div>
            <div className="bg-yellow-50 rounded-lg px-3 py-2 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-gray-500">ожидает</div>
            </div>
          </div>
        )}
      </div>

      {/* Табы */}
      {isAdmin && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('translate')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${tab === 'translate' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Добавить перевод
          </button>
          <button
            onClick={() => setTab('admin')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${tab === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Управление ({stats?.pending || 0} на модерации)
          </button>
        </div>
      )}

      {/* Уведомление */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('Ошибка') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* === РЕЖИМ ПЕРЕВОДЧИКА === */}
      {tab === 'translate' && (
        <>
          {/* Форма добавления */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Добавить перевод</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Русский термин</label>
                <input
                  type="text"
                  value={newRu}
                  onChange={e => setNewRu(e.target.value)}
                  placeholder="Например: Торговая точка"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Узбекский перевод (латиница)</label>
                <input
                  type="text"
                  value={newUz}
                  onChange={e => setNewUz(e.target.value)}
                  placeholder="Например: Savdo nuqtasi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.filter(c => c.value).map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <button
                onClick={handleSubmit}
                disabled={submitting || !newRu.trim() || !newUz.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Сохранение...' : 'Добавить'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* === РЕЖИМ АДМИНА === */}
      {tab === 'admin' && isAdmin && (
        <div className="flex items-center gap-3 mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showPending}
              onChange={e => setShowPending(e.target.checked)}
              className="rounded"
            />
            Только на модерации
          </label>
        </div>
      )}

      {/* Поиск и фильтры */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Поиск по русскому термину..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{total} записей</span>
      </div>

      {/* Таблица */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Загрузка...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Словарь пуст. Добавьте первый перевод!</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 font-semibold">Русский</th>
                <th className="px-4 py-3 text-left text-gray-600 font-semibold">Узбекский</th>
                <th className="px-4 py-3 text-left text-gray-600 font-semibold">Категория</th>
                <th className="px-4 py-3 text-center text-gray-600 font-semibold">Статус</th>
                {isAdmin && <th className="px-4 py-3 text-center text-gray-600 font-semibold">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{entry.russian_term}</td>
                  <td className="px-4 py-3 text-blue-700">{entry.uzbek_translation}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                      {entry.context_category || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {entry.is_verified ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Одобрено</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">На модерации</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!entry.is_verified && (
                          <button
                            onClick={() => handleVerify(entry.id)}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            Одобрить
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
