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
 *
 * 2026-06-27: theme-aware — все хардкодные тёмные цвета заменены на CSS-токены.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tasksApi, type Task } from '../../api/tasks';
import { useAuthStore } from '../../stores/authStore';
import { useLangStore } from '../../stores/langStore';

type Urgency = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'later';

// bg/color для статусных полос — зелёный/красный/янтарь/синий оставляем,
// нейтральный "later" переключаем на токены.
const URGENCY_META: Record<Urgency, { label: string; color: string; bg: string; icon: string }> = {
  overdue:  { label: 'Просрочено', color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  icon: '!' },
  today:    { label: 'Сегодня',    color: '#FB923C', bg: 'rgba(251,146,60,0.12)', icon: '!' },
  tomorrow: { label: 'Завтра',     color: '#FBBF24', bg: 'rgba(251,191,36,0.10)', icon: '*' },
  soon:     { label: 'На неделе',  color: '#60A5FA', bg: 'rgba(96,165,250,0.08)', icon: '-' },
  // color/bg для "later" берутся из токенов в рантайме (см. getUrgencyStyle)
  later:    { label: 'Позже',      color: '',        bg: '',                       icon: '-' },
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

/** Возвращает {color, bg} с учётом токенов для urgency=later */
function getUrgencyStyle(urgency: Urgency): { color: string; bg: string } {
  if (urgency === 'later') {
    return {
      color: 'var(--text-muted)',
      bg: 'var(--bg-overlay)',
    };
  }
  return { color: URGENCY_META[urgency].color, bg: URGENCY_META[urgency].bg };
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

// SVG иконки для типов задач (Heroicons-style, inline)
function TaskTypeIconSvg({ type }: { type: string }) {
  switch (type) {
    case 'learning':
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
          <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
        </svg>
      );
    case 'photo_report':
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
          <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      );
    case 'visit':
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
        </svg>
      );
    case 'merchandising':
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
          <path d="M16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
      );
    case 'meeting':
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
      );
    case 'cup_verification':
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
          <path fillRule="evenodd" d="M10 1a9 9 0 100 18A9 9 0 0010 1zm0 7a1 1 0 011 1v2.586l1.707 1.707a1 1 0 01-1.414 1.414l-2-2A1 1 0 019 12V9a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      );
  }
}

// Иконка-заглушка для urgency (SVG вместо эмодзи)
function UrgencyIconSvg({ urgency }: { urgency: Urgency }) {
  if (urgency === 'overdue' || urgency === 'today') {
    return (
      <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12" style={{ display: 'inline', verticalAlign: 'middle' }}>
        <path fillRule="evenodd" d="M8.257 3.099c.366-.756 1.42-.756 1.786 0l5.58 11.514c.33.682-.214 1.462-.893 1.462H1.27c-.68 0-1.223-.78-.893-1.462L8.257 3.1zM8 6a.905.905 0 00-.9.995l.35 3.507a.552.552 0 001.1 0l.35-3.507A.905.905 0 008 6zm.002 6a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
      </svg>
    );
  }
  return null;
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
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-12 rounded-lg" style={{ background: 'var(--bg-overlay)' }} />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg" style={{ background: 'var(--bg-overlay)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Не удалось загрузить задачи</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div
        className="rounded-2xl border p-8 text-center"
        style={{ background: 'var(--bg-card)', borderColor: 'rgba(74,222,128,0.2)' }}
      >
        {/* Иконка «галочка» вместо эмодзи */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4ADE80"
          strokeWidth="2"
          width="40"
          height="40"
          style={{ margin: '0 auto 8px' }}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-base font-semibold mb-1" style={{ color: 'var(--success)' }}>Все задачи выполнены!</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Висящих задач нет — отличная работа</p>
        <Link
          to="/tasks"
          className="inline-block mt-3 text-xs transition-colors"
          style={{ color: '#FBBF24' }}
        >
          Открыть Канбан →
        </Link>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      {/* Hero — статистика */}
      <div
        className="px-5 py-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b"
        style={{
          borderColor: 'var(--border)',
          background: stats.overdue > 0
            ? 'linear-gradient(135deg, rgba(239,68,68,0.10), var(--bg-surface))'
            : 'linear-gradient(135deg, rgba(96,165,250,0.06), var(--bg-surface))',
        }}
      >
        <StatTile label="Всего висит" value={stats.total} color="var(--text-primary)" />
        <StatTile label="Просрочено" value={stats.overdue} color={stats.overdue > 0 ? '#EF4444' : 'var(--text-muted)'} />
        <StatTile label="Сегодня"    value={stats.today}   color={stats.today   > 0 ? '#FB923C' : 'var(--text-muted)'} />
        <StatTile label="Завтра"     value={stats.tomorrow} color={stats.tomorrow > 0 ? '#FBBF24' : 'var(--text-muted)'} />
      </div>

      {/* Список топ-5 */}
      <div className="px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <div
            className="text-[10px] uppercase tracking-widest font-bold"
            style={{ color: 'var(--text-muted)', fontFamily: "'Unbounded',sans-serif" }}
          >
            {/* Колокол-иконка */}
            <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12" style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }}>
              <path d="M8 16a2 2 0 002-2H6a2 2 0 002 2zm.995-14.901A1 1 0 108 1.01 1 1 0 008 1c-.072 0-.142.007-.211.02A6.002 6.002 0 002 7c0 .21-.007.419-.024.625l-.895 5.373A1 1 0 002.07 14h11.86a1 1 0 00.989-1.002l-.895-5.373A8.012 8.012 0 008.995 1.1z" />
            </svg>
            Ближайшие задачи
          </div>
          <Link
            to="/tasks"
            className="text-[11px] transition-colors"
            style={{ color: '#FBBF24' }}
          >
            все ({stats.total}) →
          </Link>
        </div>
        <div className="space-y-2">
          {tasks.slice(0, 5).map((task) => {
            const urgency = getUrgency(task.due_date);
            const meta = URGENCY_META[urgency];
            const { color, bg } = getUrgencyStyle(urgency);
            const dueText = formatDue(task.due_date, lang);
            const isUrgent = urgency === 'overdue' || urgency === 'today';

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => navigate(`/tasks?focus=${task.id}`)}
                className="w-full text-left grid items-center gap-3 px-3.5 py-3 rounded-lg border transition-all hover:translate-x-0.5"
                style={{
                  background: bg,
                  borderColor: (urgency === 'later' ? 'var(--border)' : meta.color + '30'),
                  gridTemplateColumns: '32px 1fr auto',
                }}
              >
                {/* Иконка типа задачи */}
                <span
                  className="flex items-center justify-center"
                  style={{ color: color }}
                  title={task.task_type}
                >
                  <TaskTypeIconSvg type={task.task_type} />
                </span>
                <div className="min-w-0">
                  <div
                    className="text-sm font-medium truncate flex items-center gap-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {isUrgent && (
                      <span style={{ color: meta.color }}>
                        <UrgencyIconSvg urgency={urgency} />
                      </span>
                    )}
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
                    <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {task.description}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div
                    className="text-xs font-bold uppercase"
                    style={{ color, fontFamily: "'Unbounded',sans-serif" }}
                  >
                    {dueText}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
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
            className="mt-3 block text-center text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Ещё {tasks.length - 5} задач{tasks.length - 5 > 1 ? '' : 'а'}
          </Link>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col">
      <div
        className="text-[10px] uppercase tracking-widest mb-1"
        style={{ color: 'var(--text-muted)', fontFamily: "'Unbounded',sans-serif" }}
      >
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
