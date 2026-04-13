/**
 * TranslateWidget — виджет "Улучши перевод" для Главной.
 *
 * Два режима:
 * 1. status="open" — пользователь предлагает улучшенный перевод
 * 2. status="applied" — пользователь голосует за/против применённого перевода
 */
import { useState, useEffect, useCallback } from 'react';
import { translationTasksApi, type TranslationTaskData } from '../../api/translationTasks';

export function TranslateWidget() {
  const [task, setTask] = useState<TranslationTaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitMessage, setWaitMessage] = useState<string | null>(null);
  const [, setRemaining] = useState<number>(0);

  const loadTask = useCallback(async () => {
    setLoading(true);
    setSubmitted(false);
    setVoted(false);
    setSuggestion('');
    setError(null);
    setWaitMessage(null);
    try {
      const res = await translationTasksApi.getMyTask();
      const data = res.data;
      setTask(data.task ?? null);
      setRemaining(data.remaining_in_batch ?? 0);
      if (!data.task && data.message) {
        setWaitMessage(data.message);
      }
    } catch {
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  // --- Отправка варианта перевода (open) ---
  const handleSubmit = async () => {
    if (!task || !suggestion.trim() || suggestion.trim().length < 3) return;
    setSubmitting(true);
    setError(null);
    try {
      await translationTasksApi.submitVariant(task.id, suggestion.trim());
      setSubmitted(true);
      setSuggestion('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Голосование (applied) ---
  const handleVote = async (vote: 'up' | 'down') => {
    if (!task) return;
    setSubmitting(true);
    setError(null);
    try {
      await translationTasksApi.vote(task.id, vote);
      setVoted(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || 'Ошибка голосования');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    loadTask();
  };

  // --- Рендер ---

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-5">
        <div className="animate-pulse h-20 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  // Нет задачи — либо все выполнены, либо ждём следующую пачку
  if (!task) {
    if (waitMessage) {
      return (
        <div className="bg-white rounded-2xl shadow-sm border p-5 text-center">
          <span className="text-2xl">⏳</span>
          <p className="text-sm text-gray-600 mt-2">{waitMessage}</p>
          <p className="text-xs text-gray-400 mt-1">Задачи выдаются по 3 штуки с интервалом 5ч</p>
        </div>
      );
    }
    return null;
  }

  // Успешная отправка / голосование
  if (submitted || voted) {
    return (
      <div className="bg-green-50 rounded-2xl border border-green-200 p-5 text-center">
        <p className="text-2xl mb-1">✅</p>
        <p className="text-sm font-medium text-green-800">
          {submitted ? 'Спасибо! Перевод отправлен' : 'Голос учтён!'}
        </p>
        <p className="text-xs text-green-600 mt-1">+25 XP</p>
        <button
          onClick={loadTask}
          className="mt-3 text-xs text-green-700 underline"
        >
          Следующий
        </button>
      </div>
    );
  }

  // Заголовок — общий для обоих режимов
  const header = (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🌐</span>
        <h3 className="text-sm font-semibold text-gray-800">Улучши перевод</h3>
      </div>
      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
        +25 XP
      </span>
    </div>
  );

  // Блок с оригиналом RU
  const ruBlock = (
    <div className="bg-gray-50 rounded-lg p-3 mb-2">
      <p className="text-xs text-gray-500 mb-1 font-medium">Русский:</p>
      <p className="text-sm text-gray-800 leading-relaxed">
        {task.original_ru.length > 200
          ? task.original_ru.slice(0, 200) + '...'
          : task.original_ru}
      </p>
    </div>
  );

  // --- Режим голосования (applied) ---
  if (task.status === 'applied') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-5">
        {header}
        {task.course_title && (
          <p className="text-xs text-gray-400 mb-2 truncate">Курс: {task.course_title}</p>
        )}
        {ruBlock}

        {/* Применённый перевод */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <p className="text-xs text-blue-600 mb-1 font-medium">Применённый UZ:</p>
          <p className="text-sm text-blue-900 leading-relaxed">
            {(task.best_uz ?? '').length > 200
              ? (task.best_uz ?? '').slice(0, 200) + '...'
              : task.best_uz}
          </p>
        </div>

        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

        {/* Кнопки голосования */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Пропустить
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleVote('down')}
              disabled={submitting}
              className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              👎
            </button>
            <button
              onClick={() => handleVote('up')}
              disabled={submitting}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              👍
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Режим перевода (open / default) ---
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-5">
      {header}
      {task.course_title && (
        <p className="text-xs text-gray-400 mb-2 truncate">Курс: {task.course_title}</p>
      )}
      {ruBlock}

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

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

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
