import { useState, useEffect } from 'react';
import { tasksApi, type Task, type KanbanBoard, type TaskStats } from '../api/tasks';
import { useAuthStore } from '../stores/authStore';
import { useT, useLangStore } from '../stores/langStore';

const MANAGER_ROLES = ['supervisor', 'admin', 'commercial_dir', 'regional_manager', 'superadmin'];

const COLUMNS = [
  { key: 'todo', labelKey: 'tasks.columns.todo', color: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-500', dot: 'bg-slate-400' },
  { key: 'in_progress', labelKey: 'tasks.columns.in_progress', color: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500', dot: 'bg-blue-400' },
  { key: 'review', labelKey: 'tasks.columns.review', color: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500', dot: 'bg-amber-400' },
  { key: 'done', labelKey: 'tasks.columns.done', color: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-500', dot: 'bg-emerald-400' },
] as const;

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  urgent: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '!!!' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '!!' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '!' },
  low: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', icon: '-' },
};

const PRIORITY_LABEL_KEYS: Record<string, string> = {
  urgent: 'tasks.priority.urgent',
  high: 'tasks.priority.high',
  medium: 'tasks.priority.medium',
  low: 'tasks.priority.low',
};

function TaskCard({ task, onStatusChange }: { task: Task; onStatusChange: (id: string, status: string) => void }) {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const style = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition-all duration-200 group">
      {/* Priority + Title */}
      <div className="flex items-start gap-2 mb-2">
        <span className={`flex-shrink-0 mt-0.5 text-[10px] px-1.5 py-0.5 rounded font-bold border ${style.bg} ${style.text} ${style.border}`}>
          {t(PRIORITY_LABEL_KEYS[task.priority]) || task.priority}
        </span>
        <h4 className="font-medium text-sm text-gray-900 leading-snug flex-1 group-hover:text-blue-700 transition-colors">
          {task.title}
        </h4>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-400 mb-3 line-clamp-2 pl-0.5">{task.description}</p>
      )}

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-2 text-gray-400">
          {task.due_date && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {new Date(task.due_date).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {task.task_type && task.task_type !== 'other' && (
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{task.task_type}</span>
          )}
        </div>

        {/* Progress bar */}
        {task.progress > 0 && task.progress < 100 && (
          <div className="flex items-center gap-1.5">
            <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${task.progress}%` }} />
            </div>
            <span className="text-[10px] text-gray-400 font-medium">{task.progress}%</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5 pt-2 border-t border-gray-50">
        {task.status !== 'in_progress' && task.status !== 'done' && (
          <button
            onClick={() => onStatusChange(task.id, 'in_progress')}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {t('tasks.actions.toWork')}
          </button>
        )}
        {task.status === 'in_progress' && (
          <button
            onClick={() => onStatusChange(task.id, 'review')}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors font-medium"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            {t('tasks.actions.toReview')}
          </button>
        )}
        {task.status !== 'done' && (
          <button
            onClick={() => onStatusChange(task.id, 'done')}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {t('tasks.actions.done')}
          </button>
        )}
        {task.status === 'done' && (
          <button
            onClick={() => onStatusChange(task.id, 'todo')}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path d="M3 12a9 9 0 109-9" /><polyline points="3 3 3 9 9 9" transform="translate(0, -3)" />
            </svg>
            {t('tasks.actions.return')}
          </button>
        )}
      </div>
    </div>
  );
}

export function TasksPage() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const isManager = MANAGER_ROLES.includes(user?.role || '');
  const [scope, setScope] = useState<'my' | 'all'>('my');
  const [board, setBoard] = useState<KanbanBoard>({ todo: [], in_progress: [], review: [], done: [] });
  const [stats, setStats] = useState<TaskStats>({ total: 0, todo: 0, in_progress: 0, done: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create task modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [kanbanRes, statsRes] = await Promise.all([
        tasksApi.getKanban(undefined, scope),
        tasksApi.getStats(scope),
      ]);
      setBoard(kanbanRes.data);
      setStats(statsRes.data);
    } catch {
      setError(t('tasks.errors.loadFailed'));
      setBoard({ todo: [], in_progress: [], review: [], done: [] });
      setStats({ total: 0, todo: 0, in_progress: 0, done: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [scope]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await tasksApi.update(taskId, { status: newStatus } as Partial<Task>);
      await loadData();
    } catch {
      setError(t('tasks.errors.updateFailed'));
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await tasksApi.create({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        priority: newPriority,
        status: 'todo',
      } as Partial<Task>);
      setNewTitle('');
      setNewDesc('');
      setNewPriority('medium');
      setShowCreate(false);
      await loadData();
    } catch {
      setError(t('tasks.errors.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('tasks.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('tasks.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Scope toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setScope('my')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                scope === 'my'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('tasks.scope.my')}
            </button>
            {isManager && (
              <button
                onClick={() => setScope('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  scope === 'all'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('tasks.scope.all')}
              </button>
            )}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('tasks.newTask')}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('tasks.stats.total'), value: stats.total, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'text-gray-700', bg: 'bg-gray-50' },
          { label: t('tasks.stats.todo'), value: stats.todo, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: t('tasks.stats.inProgress'), value: stats.in_progress, icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: t('tasks.stats.done'), value: stats.done, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path d={s.icon} />
                </svg>
              </div>
              <div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{t('tasks.create.title')}</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('tasks.create.nameLabel')}</label>
                <input
                  type="text"
                  placeholder={t('tasks.create.namePlaceholder')}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('tasks.create.descLabel')}</label>
                <textarea
                  placeholder={t('tasks.create.descPlaceholder')}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('tasks.create.priorityLabel')}</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high', 'urgent'] as const).map((p) => {
                    const s = PRIORITY_STYLES[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewPriority(p)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                          newPriority === p
                            ? `${s.bg} ${s.text} ${s.border} ring-2 ring-offset-1 ring-blue-300`
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {t(PRIORITY_LABEL_KEYS[p])}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-colors"
              >
                {t('tasks.create.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm transition-all"
              >
                {creating ? t('tasks.create.creating') : t('tasks.create.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-5 w-6 bg-gray-200 rounded-full" />
              </div>
              {[1, 2].map((j) => (
                <div key={j} className="bg-white rounded-xl p-4 space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-3 w-2/3 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="text-red-600 text-sm flex-1">{error}</p>
            <button onClick={loadData} className="text-red-600 hover:text-red-800 text-sm font-medium underline">{t('tasks.retry')}</button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const tasks = board[col.key as keyof KanbanBoard] || [];
            return (
              <div key={col.key} className={`${col.color} rounded-xl border ${col.border} p-4 min-h-[250px]`}>
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <h3 className="font-semibold text-sm text-gray-700">{t(col.labelKey)}</h3>
                  </div>
                  <span className={`${col.badge} text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold`}>
                    {tasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-10">
                      <svg className="mx-auto w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-gray-400 text-xs">{t('tasks.empty')}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
