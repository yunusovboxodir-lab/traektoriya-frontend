import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../stores/toastStore';
import { offlineApi } from '../api/offline';
import { offlineProgramsApi } from '../api/offlinePrograms';
import type { OfflineSession, OfflineTestResult, OfflineGameResult } from '../api/offline';
import type { Program } from '../types/offlineProgram';
import { PageHeader, EmptyState, Button } from '@/components/ui';
import { Users, Plus, KeyRound, FileText } from 'lucide-react';

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
  DSPM: 'bg-blue-100 text-blue-800',
  '7 Qadam': 'bg-green-100 text-green-800',
  '7Qadam': 'bg-green-100 text-green-800',
  Custom: 'bg-gray-100 text-gray-800',
};

// ---------------------------------------------------------------------------
// Sub-views
// ---------------------------------------------------------------------------

type View = 'list' | 'detail' | 'join';

// ---------------------------------------------------------------------------
// Create Session Modal
// ---------------------------------------------------------------------------

function CreateSessionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [program, setProgram] = useState('DSPM');
  const [region, setRegion] = useState('');
  const [date, setDate] = useState('');
  const [presentationUrl, setPresentationUrl] = useState('');
  const [saving, setSaving] = useState(false);
  // Список программ-шаблонов из БД (loading on mount)
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  // Маппинг "DSPM" → code "dspm" (как делает бэкенд для автопривязки)
  const programNameToCode = (name: string) => name.toLowerCase().replace(/\s+/g, '');

  // Загружаем доступные программы при открытии модалки
  useEffect(() => {
    offlineProgramsApi.list()
      .then((res) => {
        const items = (res.data?.programs as Program[] | undefined) ?? [];
        setPrograms(items);
        // Авто-выбор первой программы если есть
        if (items.length > 0 && items[0].title) {
          setProgram(items[0].title);
        }
      })
      .catch(() => setPrograms([]))
      .finally(() => setLoadingPrograms(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await offlineApi.createSession({
        title: title.trim(),
        program,
        region: region.trim() || undefined,
        scheduled_date: date || undefined,
        presentation_url: presentationUrl.trim() || undefined,
      });
      toast.success('Сессия создана');
      onCreated();
      onClose();
    } catch {
      toast.error('Ошибка создания сессии');
    } finally {
      setSaving(false);
    }
  };

  // Найдём выбранную программу для показа описания/деталей
  const selectedProgram = programs.find((p) => p.title === program || programNameToCode(program) === p.code);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Создать сессию</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Тренинг DSPM — Навои"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Программа
              {!loadingPrograms && programs.length === 0 && (
                <span className="ml-2 text-xs text-amber-600">(шаблоны не загрузились — fallback на список)</span>
              )}
            </label>
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              disabled={loadingPrograms}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            >
              {loadingPrograms ? (
                <option>Загрузка программ...</option>
              ) : programs.length > 0 ? (
                <>
                  {programs.map((p) => (
                    <option key={p.id} value={p.title}>
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
              <p className="mt-1 text-xs text-gray-500">{selectedProgram.description}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Регион</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Навои"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на презентацию</label>
            <input
              type="url"
              value={presentationUrl}
              onChange={(e) => setPresentationUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://docs.google.com/presentation/..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Создание...' : 'Создать'}
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
  const programClass = PROGRAM_COLORS[session.program] || 'bg-gray-100 text-gray-800';
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <button type="button" onClick={onClick} className="w-full text-left">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">{session.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${programClass}`}>{session.program}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
          {session.region && <span>{session.region}</span>}
          {session.scheduled_date && (
            <span>{new Date(session.scheduled_date).toLocaleDateString('ru-RU')}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
            {STATUS_LABELS[session.status] || session.status}
          </span>
          <span className="text-xs text-gray-500">{session.participant_count} уч.</span>
        </div>
      </button>
      <a
        href={`/activities/sessions/${session.id}/present`}
        target="_blank"
        rel="noreferrer"
        className="mt-3 block text-center text-xs px-3 py-2 bg-stone-100 hover:bg-stone-800 hover:text-white rounded-lg font-semibold text-stone-700 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        🖥 Запустить на проекторе
      </a>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-20 text-gray-500">
        Сессия не найдена
        <button onClick={onBack} className="block mx-auto mt-4 text-blue-600 hover:underline text-sm">
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
          <button onClick={onBack} className="text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-900 truncate">{session.title}</h2>
        </div>
        <a
          href={`/activities/sessions/${session.id}/present`}
          target="_blank"
          rel="noreferrer"
          className="flex-shrink-0 px-4 py-2 text-sm bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-semibold transition-colors"
        >
          🖥 Запустить на проекторе
        </a>
      </div>

      {/* Код доступа */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
        <p className="text-sm text-blue-600 mb-1">Код доступа</p>
        <p className="text-4xl font-bold tracking-widest text-blue-800">{session.access_code}</p>
      </div>

      {/* Status bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STATUS_FLOW.map((st, idx) => {
            const isCurrent = session.status === st;
            const isPast = currentIdx >= 0 && idx < currentIdx;
            return (
              <div key={st} className="flex items-center gap-1 flex-shrink-0">
                {idx > 0 && <div className={`w-6 h-0.5 ${isPast || isCurrent ? 'bg-blue-500' : 'bg-gray-300'}`} />}
                <div
                  className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isPast
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
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
                className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                title="Если случайно перешёл слишком далеко — можно вернуть на предыдущий статус"
              >
                ← Вернуть в: {STATUS_LABELS[prevStatus]}
              </button>
            )}
            {nextStatus && (
              <button
                onClick={() => handleStatusChange(nextStatus)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Перевести в: {STATUS_LABELS[nextStatus]} →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Presentation iframe */}
      {session.presentation_url && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Презентация</h3>
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Участники — результаты тестов</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs">
                  <th className="text-left px-4 py-2">Участник</th>
                  <th className="text-center px-4 py-2">PRE %</th>
                  <th className="text-center px-4 py-2">POST %</th>
                  <th className="text-center px-4 py-2">Рост</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(userMap.entries()).map(([userId, data]) => {
                  const growth = data.pre && data.post ? data.post.percentage - data.pre.percentage : null;
                  const growthColor = growth !== null ? (growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-500') : '';
                  return (
                    <tr key={userId} className="border-t border-gray-100">
                      <td className="px-4 py-2 text-gray-900">{data.pre?.user_name || data.post?.user_name || userId.slice(0, 8)}</td>
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Игровые результаты</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs">
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
                    <tr key={gr.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 text-gray-900 font-medium">{gr.team_name}</td>
                      <td className="px-4 py-2 text-center text-gray-600">{gr.member_ids.length}</td>
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
          title="Офлайн активности"
          subtitle={`${sessions.length} ${sessions.length === 1 ? 'сессия' : sessions.length < 5 ? 'сессии' : 'сессий'}${
            isAdmin ? ' · управление программами и шаблонами' : ''
          }`}
          actions={
            isAdmin ? (
              <>
                <Button
                  variant="secondary"
                  leftIcon={<FileText size={16} />}
                  onClick={() => { window.location.href = '/activities/programs'; }}
                >
                  Программы
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Plus size={16} />}
                  onClick={() => setShowCreateModal(true)}
                >
                  Создать сессию
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                leftIcon={<KeyRound size={16} />}
                onClick={() => setView('join')}
              >
                Ввести код
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
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p === 'all' ? 'Все' : p}
            </button>
          ))}
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title="Пока нет офлайн-сессий"
            description={isAdmin
              ? 'Запустите тренинг или семинар — создайте первую сессию, пригласите участников по коду доступа.'
              : 'Чтобы присоединиться к тренингу, введите код доступа, который выдаст тренер в начале занятия.'}
            cta={isAdmin ? (
              <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
                Создать сессию
              </Button>
            ) : (
              <Button leftIcon={<KeyRound size={16} />} onClick={() => setView('join')}>
                Ввести код доступа
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
        <button onClick={() => setView('list')} className="text-blue-600 hover:underline text-sm">
          &larr; Назад к списку
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Введите код сессии</h2>
        <p className="text-sm text-gray-500">Код вам сообщит тренер в начале занятия</p>
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={8}
          placeholder="XXXXXX"
          className="w-full text-center text-3xl tracking-[0.3em] font-mono border border-gray-300 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleJoin}
          disabled={joinCode.length < 4 || joining}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium"
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
