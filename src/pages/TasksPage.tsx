import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { tasksApi, type Task, type KanbanBoard, type TaskStats } from '../api/tasks';

const COLUMNS = [
  { key: 'todo', label: 'К выполнению', color: 'bg-gray-100', badge: 'bg-gray-500' },
  { key: 'in_progress', label: 'В работе', color: 'bg-blue-50', badge: 'bg-blue-500' },
  { key: 'review', label: 'На проверке', color: 'bg-yellow-50', badge: 'bg-yellow-500' },
  { key: 'done', label: 'Выполнено', color: 'bg-green-50', badge: 'bg-green-500' },
] as const;

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-600 bg-red-50 border-red-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  medium: 'text-blue-600 bg-blue-50 border-blue-200',
  low: 'text-gray-500 bg-gray-50 border-gray-200',
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Срочно',
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

function TaskCard({ task, onStatusChange }: { task: Task; onStatusChange: (id: string, status: string) => void }) {
  const priorityClass = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm text-gray-900 leading-tight flex-1">{task.title}</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${priorityClass}`}>
          {PRIORITY_LABELS[task.priority] || task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {task.due_date && (
            <span className="text-gray-400">
              {new Date(task.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {task.task_type !== 'other' && (
            <span className="text-gray-400">{task.task_type}</span>
          )}
        </div>

        {task.progress > 0 && task.progress < 100 && (
          <div className="flex items-center gap-1">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${task.progress}%` }} />
            </div>
            <span className="text-gray-400">{task.progress}%</span>
          </div>
        )}
      </div>

      {/* Quick status change buttons */}
      <div className="flex gap-1 mt-3 pt-2 border-t">
        {task.status !== 'in_progress' && task.status !== 'done' && (
          <button
            onClick={() => onStatusChange(task.id, 'in_progress')}
            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
          >
            В работу
          </button>
        )}
        {task.status !== 'done' && (
          <button
            onClick={() => onStatusChange(task.id, 'done')}
            className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
          >
            Готово
          </button>
        )}
        {task.status === 'done' && (
          <button
            onClick={() => onStatusChange(task.id, 'todo')}
            className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
          >
            Вернуть
          </button>
        )}
      </div>
    </div>
  );
}

export function TasksPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

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
        tasksApi.getKanban(),
        tasksApi.getStats(),
      ]);
      setBoard(kanbanRes.data);
      setStats(statsRes.data);
    } catch (e: any) {
      console.error('Tasks load error:', e);
      setError('Не удалось загрузить задачи');
      // Fallback: empty board
      setBoard({ todo: [], in_progress: [], review: [], done: [] });
      setStats({ total: 0, todo: 0, in_progress: 0, done: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await tasksApi.update(taskId, { status: newStatus } as Partial<Task>);
      await loadData();
    } catch (e) {
      console.error('Status update error:', e);
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
    } catch (e) {
      console.error('Create task error:', e);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800">Задачи</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.full_name || 'Пользователь'}</span>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-700">Выйти</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-500">Всего задач</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-gray-600">{stats.todo}</div>
            <div className="text-sm text-gray-500">К выполнению</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
            <div className="text-sm text-gray-500">В работе</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{stats.done}</div>
            <div className="text-sm text-gray-500">Выполнено</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Kanban-доска</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Новая задача
          </button>
        </div>

        {/* Create Task Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">Новая задача</h3>
              <input
                type="text"
                placeholder="Название задачи"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <textarea
                placeholder="Описание (необязательно)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Низкий приоритет</option>
                <option value="medium">Средний приоритет</option>
                <option value="high">Высокий приоритет</option>
                <option value="urgent">Срочно</option>
              </select>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || creating}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={loadData} className="text-red-600 underline text-sm mt-1">Попробовать снова</button>
          </div>
        )}

        {/* Kanban Board */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const tasks = board[col.key as keyof KanbanBoard] || [];
              return (
                <div key={col.key} className={`${col.color} rounded-xl p-4 min-h-[200px]`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm text-gray-700">{col.label}</h3>
                    <span className={`${col.badge} text-white text-xs px-2 py-0.5 rounded-full`}>
                      {tasks.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                    ))}
                    {tasks.length === 0 && (
                      <p className="text-center text-gray-400 text-sm py-8">Нет задач</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
