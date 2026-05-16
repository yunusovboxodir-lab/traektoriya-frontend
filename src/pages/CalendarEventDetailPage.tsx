/**
 * Module 15: Calendar Event Detail — детали события + действия.
 *
 * Маршрут: /training-plan/calendar/:eventId
 * Доступ: все аутентифицированные (просмотр), действия — только trainer/admin/cd.
 *
 * Действия (для admin/trainer):
 *  - Завершить (если planned/confirmed/in_progress) — модалка с PRE/POST/участников
 *  - Перенести (если planned/confirmed) — модалка с new_start_date + причина
 *  - Изменить статус (cancelled / confirmed)
 *
 * Показывает:
 *  - Шапка (title, type, role, статус, готовность, бейджи)
 *  - Метаданные (даты, локация, регион, длительность, неделя)
 *  - Программа (если привязана)
 *  - Компетенции
 *  - Заметки
 *  - Если completed — фактические данные (PRE/POST/рост/участники)
 *  - Если есть rescheduled_to_event_id — ссылка на новое событие
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trainingPlanApi } from '../api/trainingPlan';
import { useAuthStore } from '../stores/authStore';
import type { CalendarEvent, EventStatus, EventType } from '../types/trainingPlan';
import { SkeletonCard } from '@/components/ui';

const ROLE_LABELS: Record<string, string> = {
  sales_rep: 'ТП',
  supervisor: 'СВ',
  regional_manager: 'РМ',
  commercial_dir: 'КД',
  all: 'Все',
};

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  offline_training: '🎓 Офлайн-тренинг',
  online_block: '💻 Онлайн-блок',
  pulse_check: '📊 Pulse-срез',
  attestation: '📋 Аттестация',
  championship: '🏆 Кубок / соревнование',
  field_trip: '✈️ Командировка',
};

const STATUS_LABELS: Record<EventStatus, string> = {
  planned: 'Запланировано',
  confirmed: 'Подтверждено',
  in_progress: 'Идёт сейчас',
  completed: 'Завершено',
  cancelled: 'Отменено',
  rescheduled: 'Перенесено',
};

const STATUS_BADGE_CLASS: Record<EventStatus, string> = {
  planned: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-stone-100 text-stone-700 border-stone-300',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  rescheduled: 'bg-orange-50 text-orange-700 border-orange-200',
};

const READINESS_LABELS: Record<string, string> = {
  ready: '✅ Готов',
  created: '🔨 Черновик',
  template: '✍️ Шаблон',
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

function formatPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${(v * 100).toFixed(0)}%`;
}

export function CalendarEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const canManage = user && ['superadmin', 'admin', 'commercial_dir', 'trainer'].includes(user.role);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    trainingPlanApi
      .getEvent(eventId)
      .then((res) => setEvent(res.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [eventId, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const handleCancel = async () => {
    if (!event) return;
    if (!confirm('Отменить событие?')) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await trainingPlanApi.updateEvent(event.id, { status: 'cancelled' });
      reload();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setActionError(err?.response?.data?.detail || err?.message || 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!event) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await trainingPlanApi.updateEvent(event.id, { status: 'confirmed' });
      reload();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setActionError(err?.response?.data?.detail || err?.message || 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <SkeletonCard withAvatar lines={3} />
      </div>
    );
  }
  if (error) {
    return <div className="max-w-4xl mx-auto p-6 text-red-600">Ошибка: {error}</div>;
  }
  if (!event) {
    return <div className="max-w-4xl mx-auto p-6">Событие не найдено</div>;
  }

  const canComplete = canManage && ['planned', 'confirmed', 'in_progress'].includes(event.status);
  const canReschedule = canManage && ['planned', 'confirmed'].includes(event.status);
  const canCancel = canManage && ['planned', 'confirmed'].includes(event.status);
  const canConfirm = canManage && event.status === 'planned';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => navigate('/training-plan')}
        className="text-sm text-stone-600 hover:text-stone-900 mb-4"
      >
        ← К плану обучения
      </button>

      {/* Header card */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`px-2 py-0.5 text-xs rounded-full border ${STATUS_BADGE_CLASS[event.status]}`}>
            {STATUS_LABELS[event.status]}
          </span>
          <span className="px-2 py-0.5 text-xs rounded-full border bg-stone-50 text-stone-700 border-stone-200">
            {EVENT_TYPE_LABELS[event.event_type]}
          </span>
          <span className="px-2 py-0.5 text-xs rounded-full border bg-blue-50 text-blue-700 border-blue-200">
            {ROLE_LABELS[event.target_role] || event.target_role}
          </span>
          {event.readiness && (
            <span className="px-2 py-0.5 text-xs rounded-full border bg-amber-50 text-amber-800 border-amber-200">
              {READINESS_LABELS[event.readiness] || event.readiness}
            </span>
          )}
          <span className="text-xs font-mono text-stone-600 ml-auto">{event.event_code}</span>
        </div>

        <h1 className="text-2xl font-serif text-stone-800 mb-3">{event.title_ru}</h1>
        {event.title_uz && (
          <p className="text-stone-700 italic mb-3">{event.title_uz}</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Stat label="Дата начала" value={formatDate(event.start_date)} />
          <Stat label="Дата окончания" value={event.end_date ? formatDate(event.end_date) : '—'} />
          <Stat label="Длительность" value={event.duration_minutes ? `${event.duration_minutes} мин` : '—'} />
          <Stat
            label={event.week_number ? `Неделя ${event.week_number}` : 'Неделя'}
            value={event.half_of_month === 'first' ? '1-я пол.' : event.half_of_month === 'second' ? '2-я пол.' : '—'}
          />
        </div>

        {(event.location || event.target_region) && (
          <div className="text-sm text-stone-700 space-y-1">
            {event.location && (
              <div>
                <span className="font-medium">Локация:</span> {event.location}
              </div>
            )}
            {event.target_region && (
              <div>
                <span className="font-medium">Регион:</span> {event.target_region}
              </div>
            )}
          </div>
        )}

        {event.competencies && event.competencies.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-stone-600 mb-1">Компетенции:</div>
            <div className="flex gap-1 flex-wrap">
              {event.competencies.map((c) => (
                <span
                  key={c}
                  className="px-2 py-0.5 text-xs rounded-full border bg-stone-50 text-stone-700 border-stone-200"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {event.notes && (
          <div className="mt-4 p-3 bg-stone-50 rounded text-sm text-stone-700">
            <span className="font-medium">Заметки:</span> {event.notes}
          </div>
        )}
      </div>

      {/* Completed facts */}
      {event.status === 'completed' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 mb-6">
          <h2 className="font-medium text-emerald-900 mb-3">Результаты проведения</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat
              label="Участников"
              value={event.actual_participants_count?.toString() || '—'}
              dark
            />
            <Stat label="PRE" value={formatPct(event.pre_avg_score)} dark />
            <Stat label="POST" value={formatPct(event.post_avg_score)} dark />
            <Stat
              label="Рост"
              value={event.growth_pct !== null ? `+${event.growth_pct.toFixed(0)} п.п.` : '—'}
              highlight
              dark
            />
          </div>
        </div>
      )}

      {/* Rescheduled to */}
      {event.status === 'rescheduled' && event.rescheduled_to_event_id && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-orange-900">
            Событие перенесено.{' '}
            <button
              onClick={() => navigate(`/training-plan/calendar/${event.rescheduled_to_event_id}`)}
              className="underline font-medium"
            >
              Открыть новое событие →
            </button>
          </p>
        </div>
      )}

      {/* Actions */}
      {canManage && (
        <div className="bg-white border border-stone-200 rounded-lg p-5 mb-6">
          <h2 className="font-medium text-stone-800 mb-3">Действия</h2>
          {actionError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-3">
              {actionError}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {canComplete && (
              <button
                onClick={() => setShowCompleteModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50"
              >
                Завершить (PRE/POST)
              </button>
            )}
            {canConfirm && (
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Подтвердить готовность
              </button>
            )}
            {canReschedule && (
              <button
                onClick={() => setShowRescheduleModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 disabled:opacity-50"
              >
                Перенести
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Отменить
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCompleteModal && event && (
        <CompleteModal
          event={event}
          onClose={() => setShowCompleteModal(false)}
          onCompleted={() => {
            setShowCompleteModal(false);
            reload();
          }}
        />
      )}
      {showRescheduleModal && event && (
        <RescheduleModal
          event={event}
          onClose={() => setShowRescheduleModal(false)}
          onRescheduled={(newEventId) => {
            setShowRescheduleModal(false);
            navigate(`/training-plan/calendar/${newEventId}`);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat helper
// ---------------------------------------------------------------------------

function Stat({
  label,
  value,
  highlight,
  dark,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  dark?: boolean;
}) {
  const labelClass = dark ? 'text-emerald-900/70' : 'text-stone-600';
  const valueClass = highlight
    ? dark
      ? 'text-emerald-900 text-lg'
      : 'text-emerald-700 text-lg'
    : dark
      ? 'text-emerald-900'
      : 'text-stone-800';
  return (
    <div className={`rounded p-3 ${dark ? 'bg-white/60' : 'bg-stone-50 border border-stone-200'}`}>
      <div className={`text-xs ${labelClass} mb-1`}>{label}</div>
      <div className={`font-medium ${valueClass}`}>{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Complete modal
// ---------------------------------------------------------------------------

function CompleteModal({
  event,
  onClose,
  onCompleted,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [participantsCount, setParticipantsCount] = useState<number | ''>('');
  const [preInput, setPreInput] = useState('');
  const [postInput, setPostInput] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsePct = (v: string): number | null => {
    if (!v.trim()) return null;
    const n = parseFloat(v);
    if (Number.isNaN(n)) return null;
    return n > 1 ? n / 100 : n;
  };

  const pre = parsePct(preInput);
  const post = parsePct(postInput);
  const growth = pre !== null && post !== null ? (post - pre) * 100 : null;

  const handleSubmit = async () => {
    setError(null);
    if (typeof participantsCount !== 'number') {
      setError('Укажи количество участников');
      return;
    }
    setSubmitting(true);
    try {
      await trainingPlanApi.completeEvent(event.id, {
        actual_participants_count: participantsCount,
        pre_avg_score: pre,
        post_avg_score: post,
        notes: notes.trim() || null,
      });
      onCompleted();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err?.response?.data?.detail || err?.message || 'Ошибка');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-medium text-stone-800 mb-2">Завершить событие</h3>
        <p className="text-sm text-stone-600 mb-4">{event.title_ru}</p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Количество участников
            </label>
            <input
              type="number"
              value={participantsCount}
              onChange={(e) =>
                setParticipantsCount(e.target.value ? parseInt(e.target.value, 10) : '')
              }
              min={0}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                PRE средний (%)
              </label>
              <input
                type="text"
                value={preInput}
                onChange={(e) => setPreInput(e.target.value)}
                placeholder="52"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                POST средний (%)
              </label>
              <input
                type="text"
                value={postInput}
                onChange={(e) => setPostInput(e.target.value)}
                placeholder="78"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          {growth !== null && (
            <div className="text-sm text-emerald-700">
              Рост: {growth >= 0 ? '+' : ''}
              {growth.toFixed(0)} п.п.
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Заметки (опц.)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
              placeholder="Что обсуждали, какие выводы..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50"
            >
              {submitting ? 'Сохраняю…' : 'Завершить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reschedule modal
// ---------------------------------------------------------------------------

function RescheduleModal({
  event,
  onClose,
  onRescheduled,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onRescheduled: (newEventId: string) => void;
}) {
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!newStartDate) {
      setError('Укажи новую дату начала');
      return;
    }
    setSubmitting(true);
    try {
      const res = await trainingPlanApi.rescheduleEvent(event.id, {
        new_start_date: newStartDate,
        new_end_date: newEndDate || null,
        reason: reason.trim() || null,
      });
      onRescheduled(res.data.id);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err?.response?.data?.detail || err?.message || 'Ошибка');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-medium text-stone-800 mb-2">Перенести событие</h3>
        <p className="text-sm text-stone-600 mb-4">
          {event.title_ru} ({formatDate(event.start_date)})
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Новая дата начала
              </label>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Новая дата окончания
              </label>
              <input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Причина переноса (опц.)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
              placeholder="Почему переносим..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50"
            >
              {submitting ? 'Переношу…' : 'Перенести'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
