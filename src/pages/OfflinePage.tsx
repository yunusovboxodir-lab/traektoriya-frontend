import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useT } from '../stores/langStore';
import { toast } from '@/components/ui';
import { offlineApi } from '../api/offline';
import { offlineProgramsApi } from '../api/offlinePrograms';
import { teamApi } from '../api/team';
import type { OfflineSession, OfflineTestResult, OfflineGameResult } from '../api/offline';
import type { Region, Dealer } from '../api/team';
import type { Program } from '../types/offlineProgram';
import { PageHeader, EmptyState, Button } from '@/components/ui';
import { Users, Plus, KeyRound, FileText, Presentation, ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 5,
  commercial_dir: 4,
  admin: 3,
  regional_manager: 2,
  supervisor: 2,
  sales_rep: 1,
};

const STATUS_FLOW = ['draft', 'active', 'pre_open', 'pre_closed', 'post_open', 'completed'] as const;

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  active: 'Активна',
  pre_open: 'PRE-тест открыт',
  pre_closed: 'PRE-тест закрыт',
  post_open: 'POST-тест открыт',
  completed: 'Завершена',
};

const PROGRAM_COLORS: Record<string, string> = {
  DSPM: 'bg-status-info-bg text-status-info-fg',
  '7 Qadam': 'bg-status-success-bg text-status-success-fg',
  '7Qadam': 'bg-status-success-bg text-status-success-fg',
  Custom: 'bg-bg-muted text-fg-default',
};

// ---------------------------------------------------------------------------
// Sub-views
// ---------------------------------------------------------------------------

type View = 'list' | 'detail' | 'join';

// ---------------------------------------------------------------------------
// Create Session Modal
// ---------------------------------------------------------------------------

function CreateSessionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [program, setProgram] = useState('DSPM');
  const [regionId, setRegionId] = useState('');
  const [dealerId, setDealerId] = useState('');
  const [date, setDate] = useState('');
  const [presentationUrl, setPresentationUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);

  // Список программ-шаблонов из БД (loading on mount)
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  // Справочники регионов и дилеров
  const [regions, setRegions] = useState<Region[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loadingDealers, setLoadingDealers] = useState(false);

  // Загружаем программы и регионы при открытии модалки
  useEffect(() => {
    offlineProgramsApi.list()
      .then((res) => {
        const items = (res.data?.programs as Program[] | undefined) ?? [];
        setPrograms(items);
        // Авто-выбор первой программы (храним code — по нему бэкенд привязывает program_id)
        if (items.length > 0 && items[0].code) {
          setProgram(items[0].code);
        }
      })
      .catch(() => setPrograms([]))
      .finally(() => setLoadingPrograms(false));

    teamApi.getRegions()
      .then((res) => setRegions(res.data?.items ?? []))
      .catch(() => setRegions([]));
  }, []);

  // При смене региона — подгружаем дилеров этого региона и сбрасываем выбор дилера
  useEffect(() => {
    setDealerId('');
    setDealers([]);
    if (!regionId) return;
    setLoadingDealers(true);
    teamApi.getDealers(regionId)
      .then((res) => setDealers(res.data?.items ?? []))
      .catch(() => setDealers([]))
      .finally(() => setLoadingDealers(false));
  }, [regionId]);

  const selectedRegion = regions.find((r) => r.id === regionId);
  const selectedDealer = dealers.find((d) => d.id === dealerId);

  // Найдём выбранную программу по code (для описания и красивого названия)
  const selectedProgram = programs.find((p) => p.code === program);
  // Человекочитаемое название для авто-имени сессии (для fallback-строк — сама строка)
  const programLabel = selectedProgram?.title ?? program;

  // Сборка строки региона: "Навои — Алишер" (дилер опционален)
  const buildRegionString = () => {
    const parts = [selectedRegion?.name, selectedDealer?.name].filter(Boolean);
    return parts.join(' — ');
  };

  // Автогенерация названия: "{Программа} — {Дилер}, {dd.mm.yyyy}"
  const buildTitle = () => {
    const head = selectedDealer?.name
      ? `${programLabel} — ${selectedDealer.name}`
      : selectedRegion?.name
        ? `${programLabel} — ${selectedRegion.name}`
        : programLabel;
    const tail = date ? `, ${new Date(date).toLocaleDateString('ru-RU')}` : '';
    return `${head}${tail}`;
  };

  // Создание сессии. launch=true → сразу открыть проектор в новой вкладке.
  const submit = async (launch: boolean) => {
    if (!program) return;
    setSaving(true);
    try {
      const res = await offlineApi.createSession({
        title: buildTitle(),
        program,
        region: buildRegionString() || undefined,
        scheduled_date: date || undefined,
        presentation_url: presentationUrl.trim() || undefined,
      });
      toast.success('Сессия создана');
      if (launch && res.data?.id) {
        window.open(`/activities/sessions/${res.data.id}/present`, '_blank', 'noreferrer');
      }
      onCreated();
      onClose();
    } catch {
      toast.error('Ошибка создания сессии');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-bg-surface rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-1">Создать сессию</h2>
        <p className="text-xs text-fg-subtle mb-4">Выберите программу, регион/дилера и дату — название создастся автоматически.</p>
        <form onSubmit={(e) => { e.preventDefault(); submit(true); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fg-muted mb-1">
              Программа
              {!loadingPrograms && programs.length === 0 && (
                <span className="ml-2 text-xs text-status-warning-fg">(шаблоны не загрузились — fallback на список)</span>
              )}
            </label>
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              disabled={loadingPrograms}
              className="w-full border border-border-strong rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-border-focus focus:border-border-focus disabled:bg-bg-muted"
            >
              {loadingPrograms ? (
                <option>Загрузка программ...</option>
              ) : programs.length > 0 ? (
                <>
                  {programs.map((p) => (
                    <option key={p.id} value={p.code}>
                      {p.icon ? `${p.icon} ` : ''}{p.title} ({p.num_questions} вопр., {p.duration_minutes} мин)
                    </option>
                  ))}
                  <option value="Custom">Custom (без шаблона)</option>
                </>
              ) : (
                <>
                  <option value="DSPM">DSPM</option>
                  <option value="7 Qadam">7 Qadam</option>
                  <option value="ADKAR">ADKAR</option>
                  <option value="Custom">Custom</option>
                </>
              )}
            </select>
            {selectedProgram?.description && (
              <p className="mt-1 text-xs text-fg-subtle">{selectedProgram.description}</p>
            )}
          </div>
          {/* Регион */}
          <div>
            <label className="block text-sm font-medium text-fg-muted mb-1">Регион</label>
            <select
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className="w-full border border-border-strong rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-border-focus focus:border-border-focus"
            >
              <option value="">— Выберите регион —</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Дилер (зависит от региона) */}
          <div>
            <label className="block text-sm font-medium text-fg-muted mb-1">Дилер</label>
            <select
              value={dealerId}
              onChange={(e) => setDealerId(e.target.value)}
              disabled={!regionId || loadingDealers}
              className="w-full border border-border-strong rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-border-focus focus:border-border-focus disabled:bg-bg-muted disabled:text-fg-subtle"
            >
              <option value="">
                {!regionId
                  ? 'Сначала выберите регион'
                  : loadingDealers
                    ? 'Загрузка дилеров...'
                    : dealers.length === 0
                      ? 'В этом регионе нет дилеров'
                      : '— Выберите дилера —'}
              </option>
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Дата */}
          <div>
            <label className="block text-sm font-medium text-fg-muted mb-1">Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-border-strong rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-border-focus focus:border-border-focus"
            />
          </div>

          {/* Предпросмотр автоназвания */}
          <div className="bg-bg-muted border border-border-default rounded-lg px-3 py-2">
            <p className="text-xs text-fg-subtle mb-0.5">Название (создастся автоматически):</p>
            <p className="text-sm font-medium text-fg-default break-words">{buildTitle()}</p>
          </div>

          {/* Расширенные параметры */}
          <div className="border-t border-border-default pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1 text-xs text-fg-subtle hover:text-fg-default"
            >
              <ChevronDown size={14} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              Расширенные параметры
            </button>
            {showAdvanced && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-fg-muted mb-1">Ссылка на внешнюю презентацию</label>
                <input
                  type="url"
                  value={presentationUrl}
                  onChange={(e) => setPresentationUrl(e.target.value)}
                  className="w-full border border-border-strong rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-border-focus focus:border-border-focus"
                  placeholder="https://docs.google.com/presentation/..."
                />
                <p className="mt-1 text-xs text-fg-subtle">
                  Нужна только если хотите показать внешние слайды (Google Slides) вместо встроенных слайдов программы.
                </p>
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-fg-muted hover:text-fg-default">
              Отмена
            </button>
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={saving || !program}
              className="px-4 py-2 text-sm bg-bg-surface border border-border-strong text-fg-muted rounded-lg hover:bg-bg-muted disabled:opacity-50"
            >
              {saving ? 'Создание...' : 'Создать'}
            </button>
            <button
              type="submit"
              disabled={saving || !program}
              className="px-4 py-2 text-sm bg-bg-accent text-fg-on-accent rounded-lg hover:bg-bg-accent-hover disabled:opacity-50"
            >
              {saving ? 'Создание...' : 'Создать и запустить →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session Card
// ---------------------------------------------------------------------------

function SessionCard({ session, onClick }: { session: OfflineSession; onClick: () => void }) {
  const t = useT();
  const programClass = PROGRAM_COLORS[session.program] || 'bg-bg-muted text-fg-default';
  const handleProjector = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/activities/sessions/${session.id}/present`, '_blank', 'noreferrer');
  };
  return (
    <div className="bg-bg-surface rounded-xl border border-border-default p-4 hover:shadow-md transition-shadow">
      <button type="button" onClick={onClick} className="w-full text-left">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-fg-default text-sm">{session.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${programClass}`}>{session.program}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-fg-subtle mb-2">
          {session.region && <span>{session.region}</span>}
          {session.scheduled_date && (
            <span>{new Date(session.scheduled_date).toLocaleDateString('ru-RU')}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs px-2 py-0.5 rounded bg-bg-muted text-fg-muted">
            {STATUS_LABELS[session.status] || session.status}
          </span>
          <span className="text-xs text-fg-subtle">{session.participant_count} уч.</span>
        </div>
      </button>
      <div className="mt-3">
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Presentation size={16} />}
          onClick={handleProjector}
          className="w-full"
        >
          {t('offline.actions.runProjector')}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session Detail View
// ---------------------------------------------------------------------------

function SessionDetail({
  sessionId,
  isAdmin,
  onBack,
}: {
  sessionId: string;
  isAdmin: boolean;
  onBack: () => void;
}) {
  const [session, setSession] = useState<(OfflineSession & { test_results: OfflineTestResult[]; game_results: OfflineGameResult[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await offlineApi.getSession(sessionId);
      setSession(res.data);
    } catch {
      toast.error('Ошибка загрузки сессии');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await offlineApi.updateStatus(sessionId, newStatus);
      toast.success(`Статус изменён: ${STATUS_LABELS[newStatus] || newStatus}`);
      loadSession();
    } catch {
      toast.error('Ошибка изменения статуса');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bg-accent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-20 text-fg-subtle">
        Сессия не найдена
        <button onClick={onBack} className="block mx-auto mt-4 text-bg-accent hover:underline text-sm">
          Назад
        </button>
      </div>
    );
  }

  // Определяем соседние статусы для кнопок перехода
  const currentIdx = STATUS_FLOW.indexOf(session.status as typeof STATUS_FLOW[number]);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;
  const prevStatus = currentIdx > 0 ? STATUS_FLOW[currentIdx - 1] : null;

  // Сопоставляем PRE и POST результаты по user_id
  const userMap = new Map<string, { pre?: OfflineTestResult; post?: OfflineTestResult }>();
  for (const tr of session.test_results) {
    const entry = userMap.get(tr.user_id) || {};
    if (tr.test_type === 'pre') entry.pre = tr;
    else if (tr.test_type === 'post') entry.post = tr;
    userMap.set(tr.user_id, entry);
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="text-fg-subtle hover:text-fg-default transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-fg-default truncate">{session.title}</h2>
        </div>
        <a
          href={`/activities/sessions/${session.id}/present`}
          target="_blank"
          rel="noreferrer"
          className="flex-shrink-0 px-4 py-2 text-sm bg-fg-default hover:opacity-90 text-bg-surface rounded-lg font-semibold transition-colors"
        >
          🖥 Запустить на проекторе
        </a>
      </div>

      {/* Код доступа */}
      <div className="bg-status-info-bg border border-border-default rounded-xl p-6 text-center">
        <p className="text-sm text-status-info-fg mb-1">Код доступа</p>
        <p className="text-4xl font-bold tracking-widest text-status-info-fg">{session.access_code}</p>
      </div>

      {/* Status bar */}
      <div className="bg-bg-surface rounded-xl border border-border-default p-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STATUS_FLOW.map((st, idx) => {
            const isCurrent = session.status === st;
            const isPast = currentIdx >= 0 && idx < currentIdx;
            return (
              <div key={st} className="flex items-center gap-1 flex-shrink-0">
                {idx > 0 && <div className={`w-6 h-0.5 ${isPast || isCurrent ? 'bg-bg-accent' : 'bg-border-strong'}`} />}
                <div
                  className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                    isCurrent
                      ? 'bg-bg-accent text-fg-on-accent'
                      : isPast
                        ? 'bg-status-info-bg text-status-info-fg'
                        : 'bg-bg-muted text-fg-subtle'
                  }`}
                >
                  {STATUS_LABELS[st]}
                </div>
              </div>
            );
          })}
        </div>
        {isAdmin && (nextStatus || prevStatus) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {prevStatus && (
              <button
                onClick={() => handleStatusChange(prevStatus)}
                className="px-4 py-2 text-sm bg-bg-surface border border-border-strong text-fg-muted rounded-lg hover:bg-bg-muted"
                title="Если случайно перешёл слишком далеко — можно вернуть на предыдущий статус"
              >
                ← Вернуть в: {STATUS_LABELS[prevStatus]}
              </button>
            )}
            {nextStatus && (
              <button
                onClick={() => handleStatusChange(nextStatus)}
                className="px-4 py-2 text-sm bg-bg-accent text-fg-on-accent rounded-lg hover:bg-bg-accent-hover"
              >
                Перевести в: {STATUS_LABELS[nextStatus]} →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Presentation iframe */}
      {session.presentation_url && (
        <div className="bg-bg-surface rounded-xl border border-border-default overflow-hidden">
          <div className="p-3 border-b border-border-default">
            <h3 className="text-sm font-medium text-fg-muted">Презентация</h3>
          </div>
          <iframe
            src={session.presentation_url}
            className="w-full h-[400px]"
            title="Презентация"
            allowFullScreen
          />
        </div>
      )}

      {/* Participants table */}
      {userMap.size > 0 && (
        <div className="bg-bg-surface rounded-xl border border-border-default overflow-hidden">
          <div className="p-3 border-b border-border-default">
            <h3 className="text-sm font-medium text-fg-muted">Участники — результаты тестов</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-muted text-fg-muted text-xs">
                  <th className="text-left px-4 py-2">Участник</th>
                  <th className="text-center px-4 py-2">PRE %</th>
                  <th className="text-center px-4 py-2">POST %</th>
                  <th className="text-center px-4 py-2">Рост</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(userMap.entries()).map(([userId, data]) => {
                  const growth = data.pre && data.post ? data.post.percentage - data.pre.percentage : null;
                  const growthColor = growth !== null ? (growth > 0 ? 'text-status-success-fg' : growth < 0 ? 'text-status-danger-fg' : 'text-fg-subtle') : '';
                  return (
                    <tr key={userId} className="border-t border-border-default">
                      <td className="px-4 py-2 text-fg-default">{data.pre?.user_name || data.post?.user_name || userId.slice(0, 8)}</td>
                      <td className="px-4 py-2 text-center">{data.pre ? `${Math.round(data.pre.percentage)}%` : '—'}</td>
                      <td className="px-4 py-2 text-center">{data.post ? `${Math.round(data.post.percentage)}%` : '—'}</td>
                      <td className={`px-4 py-2 text-center font-medium ${growthColor}`}>
                        {growth !== null ? `${growth > 0 ? '+' : ''}${Math.round(growth)}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Game results */}
      {session.game_results.length > 0 && (
        <div className="bg-bg-surface rounded-xl border border-border-default overflow-hidden">
          <div className="p-3 border-b border-border-default">
            <h3 className="text-sm font-medium text-fg-muted">Игровые результаты</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-muted text-fg-muted text-xs">
                  <th className="text-left px-4 py-2">Команда</th>
                  <th className="text-center px-4 py-2">Участники</th>
                  <th className="text-center px-4 py-2">Очки</th>
                  <th className="text-center px-4 py-2">Место</th>
                </tr>
              </thead>
              <tbody>
                {session.game_results
                  .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
                  .map((gr) => (
                    <tr key={gr.id} className="border-t border-border-default">
                      <td className="px-4 py-2 text-fg-default font-medium">{gr.team_name}</td>
                      <td className="px-4 py-2 text-center text-fg-muted">{gr.member_ids.length}</td>
                      <td className="px-4 py-2 text-center">{gr.total_score}/{gr.max_score}</td>
                      <td className="px-4 py-2 text-center">{gr.rank ?? '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export function OfflinePage() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role || 'sales_rep';
  const isAdmin = (ROLE_HIERARCHY[userRole] ?? 0) >= 3;

  const [view, setView] = useState<View>('list');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Sessions list state
  const [sessions, setSessions] = useState<OfflineSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Join by code state
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = programFilter !== 'all' ? { program: programFilter } : undefined;
      const res = await offlineApi.getSessions(params);
      setSessions(res.data.sessions || []);
    } catch {
      toast.error('Ошибка загрузки сессий');
    } finally {
      setLoading(false);
    }
  }, [programFilter]);

  useEffect(() => {
    if (view === 'list') {
      loadSessions();
    }
  }, [view, loadSessions]);

  const handleJoin = async () => {
    if (joinCode.length < 4) return;
    setJoining(true);
    try {
      await offlineApi.joinSession(joinCode.trim());
      toast.success('Вы присоединились к сессии');
      setJoinCode('');
      setView('list');
      loadSessions();
    } catch {
      toast.error('Неверный код или сессия неактивна');
    } finally {
      setJoining(false);
    }
  };

  const openSession = (id: string) => {
    setSelectedSessionId(id);
    setView('detail');
  };

  // ---- List View ----
  if (view === 'list') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <PageHeader
          title={t('offline.title')}
          subtitle={`${sessions.length} ${sessions.length === 1 ? 'сессия' : sessions.length < 5 ? 'сессии' : 'сессий'}${
            isAdmin ? ' · ' + t('offline.subtitleAdmin') : ''
          }`}
          actions={
            isAdmin ? (
              <>
                <Button
                  variant="secondary"
                  leftIcon={<FileText size={16} />}
                  onClick={() => { window.location.href = '/activities/programs'; }}
                >
                  {t('offline.actions.programs')}
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Plus size={16} />}
                  onClick={() => setShowCreateModal(true)}
                >
                  {t('offline.actions.createSession')}
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                leftIcon={<KeyRound size={16} />}
                onClick={() => setView('join')}
              >
                {t('offline.actions.enterCode')}
              </Button>
            )
          }
        />

        {/* Filters */}
        <div className="flex gap-2">
          {['all', 'DSPM', '7 Qadam'].map((p) => (
            <button
              key={p}
              onClick={() => setProgramFilter(p)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                programFilter === p
                  ? 'bg-bg-accent text-fg-on-accent'
                  : 'bg-bg-muted text-fg-muted hover:text-fg-default'
              }`}
            >
              {p === 'all' ? 'Все' : p}
            </button>
          ))}
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bg-accent" />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title={t('offline.empty.title')}
            description={isAdmin
              ? t('offline.empty.descAdmin')
              : t('offline.empty.descUser')}
            cta={isAdmin ? (
              <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
                {t('offline.empty.ctaCreate')}
              </Button>
            ) : (
              <Button leftIcon={<KeyRound size={16} />} onClick={() => setView('join')}>
                {t('offline.empty.ctaJoin')}
              </Button>
            )}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} onClick={() => openSession(s.id)} />
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <CreateSessionModal onClose={() => setShowCreateModal(false)} onCreated={loadSessions} />
        )}
      </div>
    );
  }

  // ---- Join View ----
  if (view === 'join') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <button onClick={() => setView('list')} className="text-bg-accent hover:underline text-sm">
          &larr; Назад к списку
        </button>
        <h2 className="text-xl font-semibold text-fg-default">Введите код сессии</h2>
        <p className="text-sm text-fg-subtle">Код вам сообщит тренер в начале занятия</p>
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={8}
          placeholder="XXXXXX"
          className="w-full text-center text-3xl tracking-[0.3em] font-mono border border-border-strong rounded-xl px-4 py-4 focus:ring-2 focus:ring-border-focus focus:border-border-focus"
        />
        <button
          onClick={handleJoin}
          disabled={joinCode.length < 4 || joining}
          className="w-full px-4 py-3 bg-bg-accent text-fg-on-accent rounded-xl hover:bg-bg-accent-hover disabled:opacity-50 font-medium"
        >
          {joining ? 'Подключение...' : 'Присоединиться'}
        </button>
      </div>
    );
  }

  // ---- Detail View ----
  if (view === 'detail' && selectedSessionId) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <SessionDetail
          sessionId={selectedSessionId}
          isAdmin={isAdmin}
          onBack={() => {
            setView('list');
            setSelectedSessionId(null);
          }}
        />
      </div>
    );
  }

  return null;
}
