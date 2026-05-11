/**
 * Module 17: Case Studio — детали кейса.
 *
 * Что показывает:
 *  - Заголовок, категорию, target_role, статус, метаданные
 *  - Ситуацию + оригинальный диалог
 *  - Все решения, отсортированные по avg_rating (TOP-3 с медалями)
 *  - Форма «Предложить решение»
 *  - Кнопки оценки (звёзды) на сценарий и каждое решение
 *
 * Роль:
 *  - Видимость проверяется на бэке (если нет — 404)
 *  - Оценивать/предлагать может только в пределах своей роли или ниже
 *  - Автор может опубликовать draft и архивировать
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { caseStudioApi } from '../api/caseStudio';
import { useAuthStore } from '../stores/authStore';
import type {
  CaseScenarioDetail,
  CaseSolution,
  DialogueLine,
} from '../types/caseStudio';

const ROLE_LABELS: Record<string, string> = {
  sales_rep: 'ТП',
  supervisor: 'СВ',
  regional_manager: 'РМ',
  commercial_dir: 'КД',
};

const SPEAKER_LABELS: Record<string, string> = {
  client: 'Клиент',
  tp: 'ТП',
  sv: 'СВ',
  rm: 'РМ',
  other: 'Другой',
};

const TOP_MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function CaseStudioDetailPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [scenario, setScenario] = useState<CaseScenarioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!scenarioId) return;
    setLoading(true);
    caseStudioApi
      .getScenario(scenarioId)
      .then((res) => setScenario(res.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [scenarioId, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  if (loading) return <div className="max-w-4xl mx-auto p-6 text-stone-500">Загрузка…</div>;
  if (error) return <div className="max-w-4xl mx-auto p-6 text-red-600">Ошибка: {error}</div>;
  if (!scenario) return <div className="max-w-4xl mx-auto p-6">Кейс не найден</div>;

  const isAuthor = user && scenario.author_id === user.id;
  const canManage = user && ['admin', 'superadmin', 'trainer'].includes(user.role);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => navigate('/case-studio')}
        className="text-sm text-stone-500 hover:text-stone-800 mb-4"
      >
        ← К списку кейсов
      </button>

      <div className="bg-white border border-stone-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {scenario.category && (
            <span
              className="px-2 py-0.5 text-xs rounded-full border"
              style={
                scenario.category.color
                  ? {
                      backgroundColor: `${scenario.category.color}15`,
                      borderColor: `${scenario.category.color}40`,
                      color: scenario.category.color,
                    }
                  : undefined
              }
            >
              {scenario.category.icon ? `${scenario.category.icon} ` : ''}
              {scenario.category.label_ru}
            </span>
          )}
          <span className="px-2 py-0.5 text-xs rounded-full border bg-blue-50 text-blue-700 border-blue-200">
            Для роли: {ROLE_LABELS[scenario.target_role] || scenario.target_role}
          </span>
          {scenario.status === 'draft' && (
            <span className="px-2 py-0.5 text-xs rounded-full border bg-stone-100 text-stone-700 border-stone-300">
              Черновик
            </span>
          )}
          {scenario.status === 'archived' && (
            <span className="px-2 py-0.5 text-xs rounded-full border bg-amber-50 text-amber-700 border-amber-200">
              В архиве
            </span>
          )}
        </div>

        <h1 className="text-2xl font-serif text-stone-800 mb-3">{scenario.title_ru}</h1>
        <div className="text-sm text-stone-500 mb-4">
          {formatDate(scenario.created_at)} ·{' '}
          {scenario.ratings_count > 0 && <>★ {scenario.ratings_count} оценок · </>}
          {scenario.views_count} просмотров
        </div>

        <div className="prose prose-stone max-w-none mb-4">
          <h3 className="text-stone-800 font-medium mb-2">Ситуация</h3>
          <p className="text-stone-700 whitespace-pre-wrap">{scenario.situation_ru}</p>
        </div>

        {scenario.original_dialogue && scenario.original_dialogue.length > 0 && (
          <div className="mt-4">
            <h3 className="text-stone-800 font-medium mb-2">Диалог</h3>
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
              {scenario.original_dialogue.map((line, idx) => (
                <DialogueLineView key={idx} line={line} />
              ))}
            </div>
          </div>
        )}

        {/* Author actions */}
        {(isAuthor || canManage) && scenario.status === 'draft' && (
          <div className="mt-6 flex gap-2">
            <button
              onClick={async () => {
                await caseStudioApi.publishScenario(scenario.id);
                reload();
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Опубликовать
            </button>
          </div>
        )}
        {(isAuthor || canManage) && scenario.status === 'published' && (
          <div className="mt-6 flex gap-2">
            <button
              onClick={async () => {
                if (!confirm('Архивировать кейс?')) return;
                await caseStudioApi.archiveScenario(scenario.id);
                reload();
              }}
              className="px-3 py-1.5 text-sm border border-stone-300 text-stone-700 rounded hover:bg-stone-50"
            >
              Архивировать
            </button>
          </div>
        )}
        {(isAuthor || canManage) && (
          <div className="mt-3">
            <button
              onClick={async () => {
                if (!confirm('Удалить кейс? Восстановить сможет только админ через БД.')) return;
                await caseStudioApi.deleteScenario(scenario.id);
                navigate('/case-studio');
              }}
              className="px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50"
            >
              🗑 Удалить кейс
            </button>
          </div>
        )}

        {/* Rating for scenario */}
        {scenario.status === 'published' && (
          <div className="mt-6 pt-6 border-t border-stone-200">
            <RatingControl
              targetType="scenario"
              targetId={scenario.id}
              onRated={reload}
            />
          </div>
        )}
      </div>

      {/* Solutions */}
      {scenario.status === 'published' && (
        <>
          <h2 className="text-xl font-serif text-stone-800 mb-4">
            Решения ({scenario.solutions.length})
          </h2>

          <div className="space-y-4 mb-6">
            {scenario.solutions.map((sol) => (
              <SolutionCard key={sol.id} solution={sol} onRated={reload} />
            ))}
            {scenario.solutions.length === 0 && (
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 text-center">
                <p className="text-stone-600">
                  Пока нет решений. Будь первым — предложи свой подход ниже.
                </p>
              </div>
            )}
          </div>

          {/* Add solution form */}
          <SolutionForm scenarioId={scenario.id} onAdded={reload} />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dialogue line view
// ---------------------------------------------------------------------------

function DialogueLineView({ line }: { line: DialogueLine }) {
  const isClient = line.speaker === 'client';
  return (
    <div className={`flex gap-2 mb-2 ${isClient ? '' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          isClient
            ? 'bg-white border border-stone-200 text-stone-800'
            : 'bg-blue-50 border border-blue-100 text-blue-900'
        }`}
      >
        <div className="text-xs font-medium mb-0.5 opacity-70">
          {line.speaker_name || SPEAKER_LABELS[line.speaker] || line.speaker}
        </div>
        <div className="text-sm whitespace-pre-wrap">{line.text}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Solution card
// ---------------------------------------------------------------------------

function SolutionCard({
  solution,
  onRated,
}: {
  solution: CaseSolution;
  onRated: () => void;
}) {
  return (
    <div
      className={`bg-white border rounded-lg p-5 ${
        solution.is_etalon
          ? 'border-amber-300 shadow-sm'
          : 'border-stone-200'
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {solution.top_position && (
          <span className="text-lg">{TOP_MEDALS[solution.top_position]}</span>
        )}
        {solution.is_etalon && (
          <span className="px-2 py-0.5 text-xs rounded-full border bg-amber-50 text-amber-800 border-amber-200">
            Эталон TOP-{solution.top_position}
          </span>
        )}
        {solution.is_author_solution && (
          <span className="px-2 py-0.5 text-xs rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
            От автора кейса
          </span>
        )}
        <div className="ml-auto text-sm text-stone-500">
          ★ {solution.avg_rating.toFixed(1)} ({solution.ratings_count})
        </div>
      </div>

      <div className="prose prose-stone max-w-none mb-3">
        <p className="text-stone-700 whitespace-pre-wrap">{solution.text_ru}</p>
      </div>

      {solution.solution_dialogue && solution.solution_dialogue.length > 0 && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 mb-3">
          <div className="text-xs font-medium text-stone-500 mb-1">Диалог:</div>
          {solution.solution_dialogue.map((line, idx) => (
            <DialogueLineView key={idx} line={line} />
          ))}
        </div>
      )}

      <div className="text-xs text-stone-400 mb-2">{formatDate(solution.created_at)}</div>

      <div className="pt-2 border-t border-stone-100">
        <RatingControl
          targetType="solution"
          targetId={solution.id}
          onRated={onRated}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rating control (5 stars)
// ---------------------------------------------------------------------------

function RatingControl({
  targetType,
  targetId,
  onRated,
}: {
  targetType: 'scenario' | 'solution';
  targetId: string;
  onRated: () => void;
}) {
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRate = async (stars: number) => {
    setError(null);
    setSubmitting(true);
    try {
      await caseStudioApi.rate({
        target_type: targetType,
        target_id: targetId,
        stars,
        comment: comment || null,
      });
      setChosen(stars);
      setShowComment(false);
      onRated();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err?.response?.data?.detail || err?.message || 'Ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-stone-500">
          {targetType === 'scenario' ? 'Оценить кейс:' : 'Оценить решение:'}
        </span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              disabled={submitting}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => handleRate(star)}
              className={`text-xl transition-transform hover:scale-110 ${
                star <= (hover || chosen || 0) ? 'text-amber-400' : 'text-stone-300'
              }`}
              aria-label={`${star} звёзд`}
            >
              ★
            </button>
          ))}
        </div>
        {chosen && (
          <span className="text-xs text-emerald-700">Спасибо за оценку! +5 XP</span>
        )}
        {!showComment && !chosen && (
          <button
            onClick={() => setShowComment(true)}
            className="text-xs text-stone-500 hover:text-stone-800 underline ml-2"
          >
            + Комментарий
          </button>
        )}
      </div>
      {showComment && !chosen && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Опционально: комментарий к оценке…"
          rows={2}
          className="w-full mt-2 border border-stone-300 rounded px-3 py-2 text-sm"
        />
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Solution form
// ---------------------------------------------------------------------------

function SolutionForm({
  scenarioId,
  onAdded,
}: {
  scenarioId: string;
  onAdded: () => void;
}) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (text.trim().length < 20) {
      setError('Минимум 20 символов');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await caseStudioApi.addSolution(scenarioId, { text_ru: text });
      setText('');
      onAdded();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err?.response?.data?.detail || err?.message || 'Ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5">
      <h3 className="text-stone-800 font-medium mb-3">Предложить своё решение</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Опиши свой подход к этой ситуации (минимум 20 символов)…"
        rows={6}
        className="w-full border border-stone-300 rounded px-3 py-2 text-sm mb-2"
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-stone-500">+20 XP за предложение</span>
        <button
          onClick={handleSubmit}
          disabled={submitting || text.trim().length < 20}
          className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 disabled:opacity-50"
        >
          {submitting ? 'Отправляю…' : 'Предложить решение'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
