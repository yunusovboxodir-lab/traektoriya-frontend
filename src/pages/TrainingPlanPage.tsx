/**
 * Module 15: Smart Training Plan — главная страница.
 *
 * Три вкладки:
 *  - Календарь: события 2026-2027 (план + факт)
 *  - Заявки: свои + ожидающие моего решения
 *  - Командировки: история выездов тренера
 *
 * Доступ:
 *  - Все аутентифицированные видят календарь
 *  - sales_rep — только свои события
 *  - supervisor / regional_manager — могут подать заявку
 *  - commercial_dir / admin / superadmin — управляют событиями и утверждают
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingPlanApi } from '../api/trainingPlan';
import { useAuthStore } from '../stores/authStore';
import type {
  CalendarEvent,
  EventStatus,
  EventType,
  FieldTripReport,
  TargetRole,
  TrainingRequest,
} from '../types/trainingPlan';

type Tab = 'calendar' | 'requests' | 'field-trips';

const ROLE_LABELS: Record<string, string> = {
  sales_rep: 'ТП',
  supervisor: 'СВ',
  regional_manager: 'РМ',
  commercial_dir: 'КД',
  all: 'Все',
};

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  offline_training: 'Офлайн-тренинг',
  online_block: 'Онлайн-блок',
  pulse_check: 'Pulse-срез',
  attestation: 'Аттестация',
  championship: 'Кубок',
  field_trip: 'Командировка',
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

export function TrainingPlanPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('calendar');

  const canManage = user && ['superadmin', 'admin', 'commercial_dir'].includes(user.role);
  const canRequest = user && ['supervisor', 'regional_manager', 'commercial_dir'].includes(user.role);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif text-stone-800">Умный план обучения</h1>
          <p className="text-stone-500 mt-1">
            Календарь 2026-2027, заявки на тренинги, командировки
          </p>
        </div>
        <div className="flex gap-2">
          {canRequest && (
            <button
              onClick={() => navigate('/training-plan/requests/new')}
              className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700"
            >
              Подать заявку
            </button>
          )}
          {canManage && (
            <button
              onClick={() => navigate('/training-plan/calendar/new')}
              className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50"
            >
              Создать событие
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200 mb-6 flex gap-6">
        {(
          [
            { key: 'calendar' as Tab, label: 'Календарь' },
            { key: 'requests' as Tab, label: 'Заявки' },
            { key: 'field-trips' as Tab, label: 'Командировки' },
          ]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 -mb-px text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-stone-800 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'calendar' && <CalendarTab />}
      {tab === 'requests' && <RequestsTab canApprove={!!canManage} />}
      {tab === 'field-trips' && <FieldTripsTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar tab
// ---------------------------------------------------------------------------

function CalendarTab() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<TargetRole | ''>('');
  const [filterStatus, setFilterStatus] = useState<EventStatus | ''>('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    trainingPlanApi
      .listEvents({
        target_role: filterRole || undefined,
        status: filterStatus || undefined,
        limit: 200,
      })
      .then((res) => {
        if (!cancelled) {
          setEvents(res.data || []);
          setError(null);
        }
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filterRole, filterStatus]);

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const month = e.start_date.slice(0, 7); // YYYY-MM
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as TargetRole | '')}
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Все роли</option>
          <option value="sales_rep">ТП</option>
          <option value="supervisor">СВ</option>
          <option value="regional_manager">РМ</option>
          <option value="commercial_dir">КД</option>
          <option value="all">Общие</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as EventStatus | '')}
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Все статусы</option>
          <option value="planned">Запланировано</option>
          <option value="confirmed">Подтверждено</option>
          <option value="completed">Завершено</option>
          <option value="cancelled">Отменено</option>
          <option value="rescheduled">Перенесено</option>
        </select>
        <div className="ml-auto text-sm text-stone-500 self-center">
          Всего: <b>{events.length}</b>
        </div>
      </div>

      {loading && <div className="text-stone-500">Загрузка…</div>}
      {error && <div className="text-red-600">Ошибка: {error}</div>}

      <div className="space-y-6">
        {grouped.map(([month, list]) => (
          <div key={month}>
            <h2 className="text-lg font-serif text-stone-700 mb-3">
              {new Date(month + '-01').toLocaleDateString('ru-RU', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            <div className="grid gap-3">
              {list.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        ))}
        {!loading && !grouped.length && (
          <div className="text-stone-500 text-center py-12">Событий не найдено</div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  return (
    <div className="border border-stone-200 rounded-lg p-4 bg-white hover:border-stone-300 transition-colors">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs px-2 py-0.5 rounded border ${STATUS_BADGE_CLASS[event.status]}`}
            >
              {STATUS_LABELS[event.status]}
            </span>
            <span className="text-xs text-stone-500">
              {EVENT_TYPE_LABELS[event.event_type]}
            </span>
            <span className="text-xs text-stone-500">·</span>
            <span className="text-xs font-medium text-stone-700">
              {ROLE_LABELS[event.target_role] ?? event.target_role}
            </span>
          </div>
          <h3 className="font-medium text-stone-900">{event.title_ru}</h3>
          <div className="text-sm text-stone-600 mt-1">
            {formatDate(event.start_date)}
            {event.end_date && event.end_date !== event.start_date
              ? ` – ${formatDate(event.end_date)}`
              : ''}
            {event.location ? ` · ${event.location}` : ''}
            {event.target_region ? ` · ${event.target_region}` : ''}
            {event.duration_minutes ? ` · ${event.duration_minutes} мин` : ''}
          </div>
          {event.competencies?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {event.competencies.map((c) => (
                <span
                  key={c}
                  className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {event.status === 'completed' &&
          event.pre_avg_score !== null &&
          event.post_avg_score !== null && (
            <div className="text-right text-sm">
              <div className="text-stone-500">PRE → POST</div>
              <div className="font-medium">
                {formatPct(event.pre_avg_score)} → {formatPct(event.post_avg_score)}
              </div>
              {event.growth_pct !== null && (
                <div className="text-emerald-600 font-medium">
                  +{event.growth_pct.toFixed(0)} п.п.
                </div>
              )}
              {event.actual_participants_count !== null && (
                <div className="text-stone-500 mt-1">
                  Участников: {event.actual_participants_count}
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Requests tab
// ---------------------------------------------------------------------------

function RequestsTab({ canApprove }: { canApprove: boolean }) {
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const reload = async () => {
    setLoading(true);
    try {
      const res = await trainingPlanApi.listRequests({
        status: filter === 'all' ? undefined : filter,
        limit: 100,
      });
      setRequests(res.data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [filter]);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-sm rounded-lg border ${
              filter === f
                ? 'bg-stone-800 text-white border-stone-800'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
          >
            {{ all: 'Все', pending: 'Ожидают', approved: 'Утверждены', rejected: 'Отклонены' }[f]}
          </button>
        ))}
      </div>

      {loading && <div className="text-stone-500">Загрузка…</div>}
      {error && <div className="text-red-600">Ошибка: {error}</div>}

      <div className="space-y-3">
        {requests.map((r) => (
          <RequestCard key={r.id} request={r} onChange={reload} canApprove={canApprove} />
        ))}
        {!loading && !requests.length && (
          <div className="text-stone-500 text-center py-8">Заявок нет</div>
        )}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  onChange,
  canApprove,
}: {
  request: TrainingRequest;
  onChange: () => void;
  canApprove: boolean;
}) {
  const [busy, setBusy] = useState(false);

  const decide = async (decision: 'approved' | 'rejected') => {
    if (busy) return;
    const comment = window.prompt(
      decision === 'approved' ? 'Комментарий к утверждению (опц.)' : 'Причина отклонения',
      '',
    );
    if (decision === 'rejected' && !comment) return;
    setBusy(true);
    try {
      const fn = decision === 'approved' ? trainingPlanApi.approveRequest : trainingPlanApi.rejectRequest;
      await fn(request.id, { decision, comment });
      onChange();
    } catch (e) {
      alert(`Ошибка: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-stone-200 rounded-lg p-4 bg-white">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded border bg-stone-50 text-stone-700">
              {STATUS_LABELS[request.status as EventStatus] ?? request.status}
            </span>
            <span className="text-xs text-stone-500">
              {ROLE_LABELS[request.requester_role] ?? request.requester_role}
            </span>
            {request.urgency !== 'normal' && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                {request.urgency.toUpperCase()}
              </span>
            )}
          </div>
          <h3 className="font-medium text-stone-900">
            {request.custom_topic ?? request.program_id ?? 'Тренинг'}
          </h3>
          <div className="text-sm text-stone-600 mt-1">
            Цель: {ROLE_LABELS[request.target_role] ?? request.target_role}
            {request.target_region ? ` · ${request.target_region}` : ''}
          </div>
          <p className="text-sm text-stone-700 mt-2">{request.reason}</p>

          {request.pulse_snapshot && (
            <div className="mt-3 p-2 bg-stone-50 rounded text-xs text-stone-700">
              <span className="font-medium">Pulse-снимок: </span>
              своё {formatPct(request.pulse_snapshot.self_pulse)}, команда{' '}
              {formatPct(request.pulse_snapshot.team_avg_pulse)}
              {request.pulse_snapshot.team_size != null
                ? ` (${request.pulse_snapshot.team_size} чел.)`
                : ''}
              {request.pulse_snapshot.override_used && (
                <span className="ml-2 text-red-700">override</span>
              )}
            </div>
          )}
        </div>
        {canApprove && request.status === 'pending' && (
          <div className="flex flex-col gap-2">
            <button
              disabled={busy}
              onClick={() => decide('approved')}
              className="px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
            >
              Утвердить
            </button>
            <button
              disabled={busy}
              onClick={() => decide('rejected')}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Отклонить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field trips tab
// ---------------------------------------------------------------------------

function FieldTripsTab() {
  const [trips, setTrips] = useState<FieldTripReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trainingPlanApi
      .listFieldTrips({ limit: 100 })
      .then((res) => {
        setTrips(res.data || []);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-stone-500">Загрузка…</div>;
  if (error) return <div className="text-red-600">Ошибка: {error}</div>;

  return (
    <div className="space-y-3">
      {trips.map((t) => (
        <div key={t.id} className="border border-stone-200 rounded-lg p-4 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-stone-900">{t.cities.join(' · ')}</h3>
              <div className="text-sm text-stone-600 mt-1">
                {formatDate(t.start_date)} – {formatDate(t.end_date)}
              </div>
            </div>
            {t.pre_avg !== null && t.post_avg !== null && (
              <div className="text-right text-sm">
                <div className="text-stone-500">PRE → POST</div>
                <div className="font-medium">
                  {formatPct(t.pre_avg)} → {formatPct(t.post_avg)}
                </div>
              </div>
            )}
          </div>
          {t.narrative && <p className="text-sm text-stone-700 mt-2">{t.narrative}</p>}
          {t.next_steps && (
            <div className="mt-2 p-2 bg-stone-50 rounded text-sm text-stone-700">
              <span className="font-medium">Следующие шаги: </span>
              {t.next_steps}
            </div>
          )}
        </div>
      ))}
      {!trips.length && (
        <div className="text-stone-500 text-center py-8">Командировок нет</div>
      )}
    </div>
  );
}
