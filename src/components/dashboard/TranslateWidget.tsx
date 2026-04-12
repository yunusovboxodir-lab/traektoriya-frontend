/**
 * TranslateWidget — виджет "Улучши перевод" для Главной.
 *
 * Показывает 1 блок из пройденного курса с RU текстом и текущим UZ.
 * Пользователь предлагает улучшенный перевод → получает XP.
 */
import { useState, useEffect, useCallback } from 'react';
import { translationApi, type TranslationTask } from '../../api/translationSuggestions';
export function TranslateWidget() {
  const [task, setTask] = useState<TranslationTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTask = useCallback(async () => {
    setLoading(true);
    try {
      const res = await translationApi.getMyTasks(1);
      setTask(res.data.tasks[0] || null);
    } catch {
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleSubmit = async () => {
    if (!task || !suggestion.trim() || suggestion.trim().length < 3) return;
    setSubmitting(true);
    setError(null);
    try {
      await translationApi.suggest({
        course_id: task.course_id,
        block_index: task.block_index,
        block_type: task.block_type,
        field_path: task.field_path,
        original_ru: task.original_ru,
        current_uz: task.current_uz,
        suggested_uz: suggestion.trim(),
      });
      setSubmitted(true);
      setSuggestion('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    setTask(null);
    loadTask();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-5">
        <div className="animate-pulse h-20 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  if (!task) return null; // Нет доступных задач

  if (submitted) {
    return (
      <div className="bg-green-50 rounded-2xl border border-green-200 p-5 text-center">
        <p className="text-2xl mb-1">✅</p>
        <p className="text-sm font-medium text-green-800">Спасибо! Перевод отправлен на проверку</p>
        <p className="text-xs text-green-600 mt-1">+25 XP после одобрения админом</p>
        <button
          onClick={() => { setSubmitted(false); loadTask(); }}
          className="mt-3 text-xs text-green-700 underline"
        >
          Перевести ещё
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-5">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌐</span>
          <h3 className="text-sm font-semibold text-gray-800">
            Улучши перевод — получи баллы
          </h3>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          +25 XP
        </span>
      </div>

      {/* Курс */}
      <p className="text-xs text-gray-400 mb-2 truncate">
        Курс: {task.course_title_ru}
      </p>

      {/* Оригинал RU */}
      <div className="bg-gray-50 rounded-lg p-3 mb-2">
        <p className="text-xs text-gray-500 mb-1 font-medium">Русский:</p>
        <p className="text-sm text-gray-800 leading-relaxed">
          {task.original_ru.length > 200
            ? task.original_ru.slice(0, 200) + '...'
            : task.original_ru}
        </p>
      </div>

      {/* Текущий UZ */}
      {task.current_uz && (
        <div className="bg-amber-50 rounded-lg p-3 mb-2">
          <p className="text-xs text-amber-600 mb-1 font-medium">Текущий UZ:</p>
          <p className="text-sm text-amber-900 leading-relaxed">
            {task.current_uz.length > 200
              ? task.current_uz.slice(0, 200) + '...'
              : task.current_uz}
          </p>
        </div>
      )}

      {/* Поле ввода */}
      <textarea
        value={suggestion}
        onChange={(e) => setSuggestion(e.target.value)}
        placeholder="Ваш вариант перевода на узбекский..."
        className="w-full border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        rows={3}
      />

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}

      {/* Кнопки */}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={handleSkip}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Пропустить
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || suggestion.trim().length < 3}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Отправка...' : 'Отправить'}
        </button>
      </div>
    </div>
  );
}
