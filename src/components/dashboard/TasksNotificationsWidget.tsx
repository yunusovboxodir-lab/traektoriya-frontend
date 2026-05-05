/**
 * TasksNotificationsWidget (2026-05-05) — отдельный блок «Висящие задачи».
 *
 * По запросу PO — после Pulse идёт отдельная карточка с уведомлениями
 * именно про задачи (не общие nudges).
 *
 * Структура:
 *  - Stats строка: всего / просрочено / сегодня / завтра
 *  - Список топ-5 ближайших задач с due_date
 *  - Цветовое кодирование срочности
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tasksApi, type Task } from '../../api/tasks';
import { useAuthStore } from '../../stores/authStore';
import { useLangStore } from '../../stores/langStore';

type Urgency = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'later';

const URGENCY_META: Record<Urgency, { label: string; color: string; bg: string; icon: string }> = {
  overdue:  { label: 'Просрочено', color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  icon: '🔥' },
  today:    { label: 'Сегодня',    color: '#FB923C', bg: 'rgba(251,146,60,0.12)', icon: '⚠️' },
  tomorrow: { label: 'Завтра',     color: '#FBBF24', bg: 'rgba(251,191,36,0.10)', icon: '📌' },
  soon:     { label: 'На неделе',  color: '#60A5FA', bg: 'rgba(96,165,250,0.08)', icon: '📋' },
  later:    { label: 'Позже',      color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.04)', icon: '🗓' },
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'СРОЧНО',
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

function getUrgency(dueDate: string | null): Urgency {
  if (!dueDate) return 'later';
  const due = new Date(dueDate);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 0) return 'overdue';
  if (days < 1) return 'today';
  if (days < 2) return 'tomorrow';
  if (days < 7) return 'soon';
  return 'later';
}

function formatDue(dueDate: string | null, lang: string): string {
  if (!dueDate) return '—';
  const due = new Date(dueDate);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < -1) return `просрочено на ${Math.ceil(Math.abs(days))} дн.`;
  if (days < 0) return 'просрочено';
  if (days < 1) return 'сегодня';
  if (days < 2) return 'завтра';
  if (days < 7) return `через ${Math.ceil(days)} дн.`;
  return due.toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', { day: 'numeric', month: 'short' });
}

function taskTypeIcon(type: string): string {
  const map: Record<string, string> = {
    learning: '📚',
    photo_report: '📸',
    visit: '🏪',
    merchandising: '🛒',
    meeting: '🤝',
    cup_verification: '🏆',
    other: '📋',
  };
  return map[type] || '📋';
}

export function TasksNotificationsWidget() {
  const user = useAuthStore((s) => s.user);
  const lang = useLangStore((s) => s.lang);
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(false);
    // Берём open-задачи (todo + in_progress) на меня
    tasksApi.getAll({ status: 'todo', assignee_id: String(user.id) })
      .then((res) => {
        const items = res.data.items || [];
        // Сортируем по due_date asc (просроченные первыми)
        const sorted = [...items].sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
        setTasks(sorted);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Статистика
  const stats = {
    total: tasks.length,
    overdue: tasks.filter((task) => getUrgency(task.due_date) === 'overdue').length,
    today: tasks.filter((task) => getUrgency(task.due_date) === 'today').length,
    tomorrow: tasks.filter((task) => getUrgency(task.due_date) === 'tomorrow').length,
  };

  if (loading) {
    return (
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'rgba(17,36,61,0.5)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-12 rounded-lg bg-white/5" />
          {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-lg bg-white/5" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'rgba(17,36,61,0.5)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <p className="text-sm text-white/55">Не удалось загрузить задачи</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div
        className="rounded-2xl border p-8 text-center"
        style={{ background: 'rgba(17,36,61,0.5)', borderColor: 'rgba(74,222,128,0.2)' }}
      >
        <div className="text-4xl mb-2">🎉</div>
        <p className="text-base text-emerald-300 font-semibold mb-1">Все задачи выполнены!</p>
        <p className="text-xs text-white/45">Висящих задач нет — отличная работа</p>
        <Link
          to="/tasks"
          className="inline-block mt-3 text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          Открыть Канбан →
        </Link>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #11243d 0%, rgba(17,36,61,0.6) 100%)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {/* Hero — статистика */}
      <div
        className="px-5 py-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          background: stats.overdue > 0
            ? 'linear-gradient(135deg, rgba(239,68,68,0.10), rgba(17,36,61,0.4))'
            : 'linear-gradient(135deg, rgba(96,165,250,0.06), rgba(17,36,61,0.4))',
        }}
      >
        <StatTile label="Всего висит" value={stats.total} color="#fff" />
        <StatTile label="Просрочено" value={stats.overdue} color={stats.overdue > 0 ? '#EF4444' : 'rgba(255,255,255,0.4)'} icon="🔥" />
        <StatTile label="Сегодня" value={stats.today} color={stats.today > 0 ? '#FB923C' : 'rgba(255,255,255,0.4)'} icon="⚠️" />
        <StatTile label="Завтра" value={stats.tomorrow} color={stats.tomorrow > 0 ? '#FBBF24' : 'rgba(255,255,255,0.4)'} icon="📌" />
      </div>

      {/* Список топ-5 */}
      <div className="px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <div
            className="text-[10px] uppercase tracking-widest font-bold text-white/50"
            style={{ fontFamily: "'Unbounded',sans-serif" }}
          >
            🔔 Ближайшие задачи
          </div>
          <Link
            to="/tasks"
            className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
          >
            все ({stats.total}) →
          </Link>
        </div>
        <div className="space-y-2">
          {tasks.slice(0, 5).map((task) => {
            const urgency = getUrgency(task.due_date);
            const meta = URGENCY_META[urgency];
            const dueText = formatDue(task.due_date, lang);
            const isUrgent = urgency === 'overdue' || urgency === 'today';

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => navigate(`/tasks?focus=${task.id}`)}
                className="w-full text-left grid items-center gap-3 px-3.5 py-3 rounded-lg border transition-all hover:translate-x-0.5"
                style={{
                  background: meta.bg,
                  borderColor: meta.color + '30',
                  gridTemplateColumns: '32px 1fr auto',
                }}
              >
                <span className="text-xl text-center" title={task.task_type}>
                  {taskTypeIcon(task.task_type)}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white/90 truncate flex items-center gap-2">
                    {isUrgent && <span style={{ fontSize: 12 }}>{meta.icon}</span>}
                    {task.title}
                    {task.priority === 'urgent' && (
                      <span
                        className="inline-block px-1.5 py-0.5 text-[9px] rounded font-bold"
                        style={{ background: '#EF4444', color: '#fff' }}
                      >
                        {PRIORITY_LABEL.urgent}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <div className="text-xs text-white/45 truncate mt-0.5">
                      {task.description}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div
                    className="text-xs font-bold uppercase"
                    style={{ color: meta.color, fontFamily: "'Unbounded',sans-serif" }}
                  >
                    {dueText}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">
                    {task.creator_name || (lang === 'uz' ? 'Tizim' : 'Система')}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {tasks.length > 5 && (
          <Link
            to="/tasks"
            className="mt-3 block text-center text-xs text-white/55 hover:text-white/85 transition-colors"
          >
            Ещё {tasks.length - 5} задач{tasks.length - 5 > 1 ? '' : 'а'}
          </Link>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, color, icon }: { label: string; value: number; color: string; icon?: string }) {
  return (
    <div className="flex flex-col">
      <div className="text-[10px] uppercase tracking-widest text-white/45 mb-1" style={{ fontFamily: "'Unbounded',sans-serif" }}>
        {icon && <span className="mr-1">{icon}</span>}
        {label}
      </div>
      <div
        className="text-2xl font-bold"
        style={{ color, fontFamily: "'Unbounded',sans-serif" }}
      >
        {value}
      </div>
    </div>
  );
}
