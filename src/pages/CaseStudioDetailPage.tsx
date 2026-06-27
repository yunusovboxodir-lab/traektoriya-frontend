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
import { useLangStore } from '../stores/langStore';
import { pickLang } from '../utils/pickLang';
import type {
  CaseScenarioDetail,
  CaseSolution,
  DialogueLine,
} from '../types/caseStudio';
import { SkeletonCard } from '@/components/ui';

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
  const lang = useLangStore((s) => s.lang);
  const [scenario, setScenario] = useState<CaseScenarioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Assign-tasks modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['regional_manager', 'commercial_dir']);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueInDays, setDueInDays] = useState(7);
  const [assigning, setAssigning] = useState(false);

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

  if (loading) return <div className="max-w-4xl mx-auto p-6"><SkeletonCard withAvatar lines={5} /></div>;
  if (error) return <div className="max-w-4xl mx-auto p-6 text-red-600">Ошибка: {error}</div>;
  if (!scenario) return <div className="max-w-4xl mx-auto p-6">Кейс не найден</div>;

  const isAuthor = user && scenario.author_id === user.id;
  const canManage = user && ['admin', 'superadmin', 'trainer'].includes(user.role);
  const canAssignTasks =
    user && ['supervisor', 'regional_manager', 'commercial_dir', 'admin', 'superadmin', 'trainer'].includes(user.role);

  const handleAssignTasks = async () => {
    if (selectedRoles.length === 0 || !scenario) return;
    setAssigning(true);
    try {
      const res = await caseStudioApi.assignTasks(scenario.id, {
        mode: 'by_roles',
        roles: selectedRoles,
        priority,
        due_in_days: dueInDays,
      });
      const { created, assignee_count, skipped_quota } = res.data;
      const skipMsg = skipped_quota > 0
        ? `\nПропущено ${skipped_quota} сотрудников — у них уже ≥3 активных задач.`
        : '';
      alert(
        `Создано задач: ${created} (для ${assignee_count} сотрудников).\n` +
        `TG-уведомления отправлены автоматически.${skipMsg}`,
      );
      setShowAssignModal(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'не удалось создать задачи';
      alert(`Ошибка: ${msg}`);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => navigate('/case-studio')}
        className="text-sm mb-4"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
      >
        ← К списку кейсов
      </button>

      <div className="rounded-lg p-6 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
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
                  : { background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
              }
            >
              {scenario.category.icon ? `${scenario.category.icon} ` : ''}
              {scenario.category.label_ru}
            </span>
          )}
          <span className="px-2 py-0.5 text-xs rounded-full border" style={{ background: 'var(--info-bg)', color: 'var(--info)', borderColor: 'var(--info)' }}>
            Для роли: {ROLE_LABELS[scenario.target_role] || scenario.target_role}
          </span>
          {scenario.status === 'draft' && (
            <span className="px-2 py-0.5 text-xs rounded-full border" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
              Черновик
            </span>
          )}
          {scenario.status === 'archived' && (
            <span className="px-2 py-0.5 text-xs rounded-full border" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'var(--warning)' }}>
              В архиве
            </span>
          )}
        </div>

        <div
          role="heading"
          aria-level={1}
          className="text-2xl font-semibold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          {pickLang(scenario, lang, 'title')}
        </div>
        <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          {formatDate(scenario.created_at)} ·{' '}
          {scenario.ratings_count > 0 && <>★ {scenario.ratings_count} оценок · </>}
          {scenario.views_count} просмотров
        </div>

        <div className="prose max-w-none mb-4">
          <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{lang === 'uz' ? 'Vaziyat' : 'Ситуация'}</h3>
          <p className="whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{pickLang(scenario, lang, 'situation')}</p>
        </div>

        {scenario.original_dialogue && scenario.original_dialogue.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{lang === 'uz' ? 'Dialog' : 'Диалог'}</h3>
            <div className="rounded-lg p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
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
              className="px-3 py-1.5 text-sm rounded"
              style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
            >
              {lang === 'uz' ? 'Arxivlash' : 'Архивировать'}
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>{lang === 'uz' ? 'Keysni o\'chirish' : 'Удалить кейс'}
            </button>
          </div>
        )}

        {canAssignTasks && scenario.status === 'published' && (
          <div className="mt-3">
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>{lang === 'uz' ? 'Komandaga vazifa qo\'yish' : 'Поставить задачу команде'}
            </button>
          </div>
        )}

        {showAssignModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => !assigning && setShowAssignModal(false)}
          >
            <div
              className="rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Поставить задачу команде</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Каждый получит задачу «Изучи кейс» в Kanban + TG-уведомление.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Кому?</label>
                  <div className="space-y-1.5">
                    {[
                      { role: 'sales_rep', label: 'Торговые представители (ТП)' },
                      { role: 'supervisor', label: 'Супервайзеры (СВ)' },
                      { role: 'regional_manager', label: 'Региональные менеджеры (РМ)' },
                      { role: 'commercial_dir', label: 'Коммерческие директора (КД)' },
                    ].map((r) => (
                      <label key={r.role} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(r.role)}
                          onChange={() =>
                            setSelectedRoles((prev) =>
                              prev.includes(r.role) ? prev.filter((x) => x !== r.role) : [...prev, r.role],
                            )
                          }
                        />
                        <span>{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Срок (дней)</label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={dueInDays}
                      onChange={(e) => setDueInDays(Math.max(1, Math.min(90, +e.target.value || 7)))}
                      className="w-full rounded-lg px-2 py-1.5 text-sm"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Приоритет</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                      className="w-full rounded-lg px-2 py-1.5 text-sm"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', colorScheme: 'dark light' }}
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowAssignModal(false)}
                  disabled={assigning}
                  className="px-4 py-2 text-sm rounded-lg disabled:opacity-50"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  Отмена
                </button>
                <button
                  onClick={handleAssignTasks}
                  disabled={assigning || selectedRoles.length === 0}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {assigning ? 'Создаю…' : 'Создать задачи'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rating for scenario */}
        {scenario.status === 'published' && (
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
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
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Решения ({scenario.solutions.length})
          </h2>

          <div className="space-y-4 mb-6">
            {scenario.solutions.map((sol) => (
              <SolutionCard key={sol.id} solution={sol} onRated={reload} />
            ))}
            {scenario.solutions.length === 0 && (
              <div className="rounded-lg p-6 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
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
        className="max-w-[80%] rounded-lg px-3 py-2"
        style={
          isClient
            ? { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
            : { background: 'var(--info-bg)', border: '1px solid var(--info)', color: 'var(--text-primary)' }
        }
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
  const lang = useLangStore((s) => s.lang);
  return (
    <div
      className="rounded-lg p-5"
      style={{
        background: 'var(--bg-card)',
        border: solution.is_etalon ? '1px solid var(--warning)' : '1px solid var(--border)',
        boxShadow: solution.is_etalon ? '0 0 0 1px rgba(200,168,75,0.15)' : undefined,
      }}
    >
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {solution.top_position && (
          <span className="font-bold" style={{
            color: solution.top_position === 1 ? '#C8A84B' : solution.top_position === 2 ? '#9CA3AF' : '#A0764A',
          }}>{solution.top_position}</span>
        )}
        {solution.is_etalon && (
          <span className="px-2 py-0.5 text-xs rounded-full border" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'var(--warning)' }}>
            Эталон TOP-{solution.top_position}
          </span>
        )}
        {solution.is_author_solution && (
          <span className="px-2 py-0.5 text-xs rounded-full border" style={{ background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success)' }}>
            От автора кейса
          </span>
        )}
        <div className="ml-auto text-sm" style={{ color: 'var(--text-muted)' }}>
          ★ {solution.avg_rating.toFixed(1)} ({solution.ratings_count})
        </div>
      </div>

      <div className="prose max-w-none mb-3">
        <p className="whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{pickLang(solution, lang, 'text')}</p>
      </div>

      {solution.solution_dialogue && solution.solution_dialogue.length > 0 && (
        <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Диалог:</div>
          {solution.solution_dialogue.map((line, idx) => (
            <DialogueLineView key={idx} line={line} />
          ))}
        </div>
      )}

      <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{formatDate(solution.created_at)}</div>

      <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
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
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
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
              className="text-xl transition-transform hover:scale-110"
              style={{ color: star <= (hover || chosen || 0) ? '#FBBF24' : 'var(--text-muted)' }}
              aria-label={`${star} звёзд`}
            >
              ★
            </button>
          ))}
        </div>
        {chosen && (
          <span className="text-xs" style={{ color: 'var(--success)' }}>Спасибо за оценку! +5 XP</span>
        )}
        {!showComment && !chosen && (
          <button
            onClick={() => setShowComment(true)}
            className="text-xs underline ml-2"
            style={{ color: 'var(--text-muted)' }}
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
          className="w-full mt-2 rounded px-3 py-2 text-sm"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
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
  const lang = useLangStore((s) => s.lang);
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
    <div className="rounded-lg p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{lang === 'uz' ? 'O\'z yechimingni taklif et' : 'Предложить своё решение'}</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Опиши свой подход к этой ситуации (минимум 20 символов)…"
        rows={6}
        className="w-full rounded px-3 py-2 text-sm mb-2"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+20 XP за предложение</span>
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
