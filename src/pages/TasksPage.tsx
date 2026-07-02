import { useState, useEffect } from 'react';
import { tasksApi, type Task, type KanbanBoard, type TaskStats, type DailyNormResponse } from '../api/tasks';
import { usersApi, type UserListItem } from '../api/users';
import { api } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { FormField, Select } from '@/components/ui';
import { TacticalShell } from '../components/tactical/shell';
import { useT, useLangStore } from '../stores/langStore';
import { pickTaskI18n } from '../utils/pickLang';
import { formatDateShort, formatDateLong } from '../utils/formatDate';

const MANAGER_ROLES = ['supervisor', 'admin', 'commercial_dir', 'regional_manager', 'superadmin'];

const COLUMNS = [
  { key: 'todo', labelKey: 'tasks.columns.todo', color: 'bg-bg-muted', border: 'border-border-default', badge: 'bg-bg-muted0', dot: 'bg-fg-subtle' },
  { key: 'in_progress', labelKey: 'tasks.columns.in_progress', color: 'bg-status-info-bg', border: 'border-status-info-fg', badge: 'bg-status-info-fg', dot: 'bg-status-info-fg' },
  { key: 'review', labelKey: 'tasks.columns.review', color: 'bg-status-warning-bg', border: 'border-status-warning-fg', badge: 'bg-status-warning-bg0', dot: 'bg-status-warning-fg' },
  { key: 'done', labelKey: 'tasks.columns.done', color: 'bg-status-success-bg', border: 'border-status-success-fg', badge: 'bg-status-success-fg', dot: 'bg-status-success-fg' },
] as const;

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  urgent: { bg: 'bg-status-danger-bg', text: 'text-status-danger-fg', border: 'border-status-danger-fg', icon: '!!!' },
  high: { bg: 'bg-status-warning-bg', text: 'text-status-warning-fg', border: 'border-status-warning-fg', icon: '!!' },
  medium: { bg: 'bg-status-info-bg', text: 'text-status-info-fg', border: 'border-status-info-fg', icon: '!' },
  low: { bg: 'bg-bg-muted', text: 'text-fg-subtle', border: 'border-border-default', icon: '-' },
};

const PRIORITY_LABEL_KEYS: Record<string, string> = {
  urgent: 'tasks.priority.urgent',
  high: 'tasks.priority.high',
  medium: 'tasks.priority.medium',
  low: 'tasks.priority.low',
};

const SOURCE_STYLES: Record<string, { bg: string; text: string; labelKey: string }> = {
  shelfscan_ai: { bg: 'bg-bg-muted', text: 'text-role-manager', labelKey: 'tasks.source.shelfscanAi' },
  shelfscan: { bg: 'bg-bg-muted', text: 'text-role-manager', labelKey: 'tasks.source.shelfscan' },
  learning_module: { bg: 'bg-bg-muted', text: 'text-role-sales', labelKey: 'tasks.source.learning' },
  crm: { bg: 'bg-bg-muted', text: 'text-role-supervisor', labelKey: 'tasks.source.crm' },
  manual: { bg: 'bg-bg-muted', text: 'text-fg-muted', labelKey: 'tasks.source.manual' },
  field_task: { bg: 'bg-bg-muted', text: 'text-role-sales', labelKey: 'tasks.source.fieldTask' },
};

function TaskCard({ task, onStatusChange, onCardClick, isManager }: { task: Task; onStatusChange: (id: string, status: string) => void; onCardClick: (task: Task) => void; isManager: boolean }) {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const style = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;

  return (
    <div className="bg-bg-surface rounded-xl shadow-sm border border-border-default p-4 hover:shadow-md hover:border-border-strong transition-all duration-200 group cursor-pointer" onClick={() => onCardClick(task)}>
      {/* Priority + Title */}
      <div className="flex items-start gap-2 mb-2">
        <span className={`flex-shrink-0 mt-0.5 text-[10px] px-1.5 py-0.5 rounded font-bold border ${style.bg} ${style.text} ${style.border}`}>
          {t(PRIORITY_LABEL_KEYS[task.priority]) || task.priority}
        </span>
        <h4 className="font-medium text-sm text-fg-default leading-snug flex-1 group-hover:text-bg-accent transition-colors">
          {pickTaskI18n(task, lang, 'title')}
        </h4>
      </div>

      {/* Creator + Source */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {task.creator_name && (
          <span className="text-[10px] text-fg-subtle flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {task.creator_role || task.creator_name}
          </span>
        )}
        {task.assignee_name && (
          <span className="text-[10px] text-fg-subtle flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {task.assignee_name}
          </span>
        )}
        {(() => {
          const sourceKey = (task.source || task.extra_data?.source) as string | undefined;
          if (!sourceKey) return null;
          const sourceStyle = SOURCE_STYLES[sourceKey];
          if (!sourceStyle) return null;
          return (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sourceStyle.bg} ${sourceStyle.text}`}>
              {t(sourceStyle.labelKey) || sourceStyle.labelKey}
            </span>
          );
        })()}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-fg-subtle mb-3 line-clamp-2 pl-0.5">{pickTaskI18n(task, lang, 'description')}</p>
      )}

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-2 text-fg-subtle">
          {task.due_date && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDateShort(task.due_date, lang)}
            </span>
          )}
          {task.task_type && task.task_type !== 'other' && (
            <span className="bg-bg-muted px-1.5 py-0.5 rounded text-[10px]">{t(`tasks.type.${task.task_type}`) || task.task_type}</span>
          )}
        </div>

        {/* Progress bar */}
        {task.progress > 0 && task.progress < 100 && (
          <div className="flex items-center gap-1.5">
            <div className="w-14 h-1.5 bg-bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-bg-accent rounded-full transition-all duration-500" style={{ width: `${task.progress}%` }} />
            </div>
            <span className="text-[10px] text-fg-subtle font-medium">{task.progress}%</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5 pt-2 border-t border-border-default" onClick={(e) => e.stopPropagation()}>
        {task.status !== 'in_progress' && task.status !== 'done' && (
          <button
            onClick={() => onStatusChange(task.id, 'in_progress')}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-status-info-bg text-status-info-fg rounded-lg hover:opacity-80 transition-colors font-medium"
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
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-status-warning-bg text-status-warning-fg rounded-lg hover:bg-status-warning-bg transition-colors font-medium"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            {t('tasks.actions.toReview')}
          </button>
        )}
        {/* Полевое задание с ревью СВ: ученик доводит до review, в done переводит только СВ */}
        {task.status !== 'done' && !(task.extra_data?.requires_sv_review === true && !isManager) && (
          <button
            onClick={() => onStatusChange(task.id, 'done')}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-status-success-bg text-status-success-fg rounded-lg hover:bg-status-success-bg transition-colors font-medium"
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
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-bg-muted text-fg-subtle rounded-lg hover:bg-bg-surface-raised transition-colors font-medium"
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

function TaskDetailModal({ task, onClose, onStatusChange }: {
  task: Task;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const style = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
  const sourceKey = (task.source || task.extra_data?.source) as string;
  const sourceStyle = SOURCE_STYLES[sourceKey];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-surface rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-bg-surface border-b border-border-default px-6 py-4 flex items-start justify-between rounded-t-2xl">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${style.bg} ${style.text} ${style.border}`}>
                {t(PRIORITY_LABEL_KEYS[task.priority]) || task.priority}
              </span>
              {task.task_type && task.task_type !== 'other' && (
                <span className="bg-bg-muted px-1.5 py-0.5 rounded text-[10px] text-fg-muted">{t(`tasks.type.${task.task_type}`) || task.task_type}</span>
              )}
              {sourceStyle && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sourceStyle.bg} ${sourceStyle.text}`}>
                  {t(sourceStyle.labelKey) || sourceStyle.labelKey}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-fg-default">{pickTaskI18n(task, lang, 'title')}</h2>
          </div>
          <button onClick={onClose} className="text-fg-subtle hover:text-fg-default transition-colors mt-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Creator & Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-muted rounded-xl p-3">
              <div className="text-[10px] text-fg-subtle uppercase font-medium mb-1">Поставил</div>
              <div className="text-sm font-medium text-fg-default">{task.creator_name || '\u2014'}</div>
              {task.creator_role && <div className="text-xs text-fg-subtle">{task.creator_role}</div>}
            </div>
            <div className="bg-bg-muted rounded-xl p-3">
              <div className="text-[10px] text-fg-subtle uppercase font-medium mb-1">Исполнитель</div>
              <div className="text-sm font-medium text-fg-default">{task.assignee_name || '\u2014'}</div>
              {task.assignee_role && <div className="text-xs text-fg-subtle">{task.assignee_role}</div>}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <div className="text-[10px] text-fg-subtle uppercase font-medium mb-1">Описание</div>
              <p className="text-sm text-fg-muted leading-relaxed whitespace-pre-wrap">{pickTaskI18n(task, lang, 'description')}</p>
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {task.due_date && (
              <div>
                <div className="text-[10px] text-fg-subtle uppercase font-medium mb-0.5">Срок</div>
                <div className="text-fg-muted">{formatDateLong(task.due_date, lang)}</div>
              </div>
            )}
            {task.estimated_time && (
              <div>
                <div className="text-[10px] text-fg-subtle uppercase font-medium mb-0.5">Время</div>
                <div className="text-fg-muted">{task.estimated_time} мин</div>
              </div>
            )}
            {task.started_at && (
              <div>
                <div className="text-[10px] text-fg-subtle uppercase font-medium mb-0.5">Начата</div>
                <div className="text-fg-muted">{formatDateShort(task.started_at, lang)}</div>
              </div>
            )}
            {task.completed_at && (
              <div>
                <div className="text-[10px] text-fg-subtle uppercase font-medium mb-0.5">Завершена</div>
                <div className="text-fg-muted">{formatDateShort(task.completed_at, lang)}</div>
              </div>
            )}
          </div>

          {/* Progress */}
          {task.progress > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-fg-subtle">Прогресс</span>
                <span className="font-medium text-fg-muted">{task.progress}%</span>
              </div>
              <div className="w-full h-2 bg-bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-bg-accent rounded-full transition-all" style={{ width: `${task.progress}%` }} />
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <div className="text-[10px] text-fg-subtle uppercase font-medium mb-1">Теги</div>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.filter(tag => tag !== 'demo-seed').map((tag, i) => (
                  <span key={i} className="bg-status-info-bg text-status-info-fg text-[10px] px-2 py-0.5 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Extra data (KPI bonus etc.) */}
          {task.extra_data?.kpi_bonus != null && (
            <div className="bg-status-success-bg border border-status-success-fg rounded-xl p-3">
              <div className="text-xs font-medium text-status-success-fg">KPI бонус: +{String(task.extra_data.kpi_bonus)}%</div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-bg-surface border-t border-border-default px-6 py-4 flex gap-2 rounded-b-2xl">
          {task.status !== 'in_progress' && task.status !== 'done' && (
            <button
              onClick={() => { onStatusChange(task.id, 'in_progress'); onClose(); }}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm px-3 py-2.5 bg-status-info-bg text-status-info-fg rounded-xl hover:opacity-80 transition-colors font-medium"
            >
              {t('tasks.actions.toWork')}
            </button>
          )}
          {task.status === 'in_progress' && (
            <button
              onClick={() => { onStatusChange(task.id, 'review'); onClose(); }}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm px-3 py-2.5 bg-status-warning-bg text-status-warning-fg rounded-xl hover:bg-status-warning-bg transition-colors font-medium"
            >
              {t('tasks.actions.toReview')}
            </button>
          )}
          {task.status !== 'done' && (
            <button
              onClick={() => { onStatusChange(task.id, 'done'); onClose(); }}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm px-3 py-2.5 bg-status-success-bg text-status-success-fg rounded-xl hover:bg-status-success-bg transition-colors font-medium"
            >
              {t('tasks.actions.done')}
            </button>
          )}
          {task.status === 'done' && (
            <button
              onClick={() => { onStatusChange(task.id, 'todo'); onClose(); }}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm px-3 py-2.5 bg-bg-muted text-fg-subtle rounded-xl hover:bg-bg-surface-raised transition-colors font-medium"
            >
              {t('tasks.actions.return')}
            </button>
          )}
        </div>
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
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [subordinates, setSubordinates] = useState<UserListItem[]>([]);
  const [creating, setCreating] = useState(false);

  // Generate tasks
  const [generating, setGenerating] = useState<'learning' | 'practical' | null>(null);
  const [genResult, setGenResult] = useState<string | null>(null);

  // Daily norm
  const [norm, setNorm] = useState<DailyNormResponse | null>(null);

  // Task detail modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const promises: Promise<unknown>[] = [
        tasksApi.getKanban(undefined, scope),
        tasksApi.getStats(scope),
      ];
      if (isManager) promises.push(tasksApi.getDailyNorm());

      const results = await Promise.all(promises);
      setBoard((results[0] as { data: KanbanBoard }).data);
      setStats((results[1] as { data: TaskStats }).data);
      if (isManager && results[2]) {
        setNorm((results[2] as { data: DailyNormResponse }).data);
      }
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

  // Загружаем список подчинённых (только для руководителей).
  // /api/v1/users доступен только superadmin/commercial_dir/admin — у supervisor
  // тихий 403 (гейт бэка), поэтому для supervisor берём подчинённых из
  // /api/v1/supervisor/my-team (эндпоинт мобильного экрана «Моя команда»,
  // доступен роли supervisor+) и мапим agents[] в формат UserListItem.
  useEffect(() => {
    if (!isManager) return;
    if (user?.role === 'supervisor') {
      api.get<{ agents: Array<{ id: string; name: string; employee_id: string; role: string | null }> }>('/api/v1/supervisor/my-team')
        .then((res) => {
          const mapped: UserListItem[] = (res.data?.agents ?? []).map((a) => ({
            id: a.id,
            employee_id: a.employee_id,
            email: null,
            full_name: a.name,
            role: a.role || 'sales_rep',
            position: null,
            department: null,
            region: null,
            city: null,
            is_active: true,
            avatar_url: null,
            created_at: null,
            last_login: null,
            total_active_minutes: 0,
          }));
          setSubordinates(mapped);
        })
        .catch(() => setSubordinates([]));
      return;
    }
    usersApi.list({ role: 'sales_rep', is_active: true, limit: 200 })
      .then((res) => setSubordinates(res.data?.items ?? []))
      .catch(() => setSubordinates([]));
  }, [isManager, user?.role]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await tasksApi.update(taskId, { status: newStatus } as Partial<Task>);
      await loadData();
    } catch {
      setError(t('tasks.errors.updateFailed'));
    }
  };

  const handleGenerate = async (type: 'learning' | 'practical') => {
    setGenerating(type);
    setGenResult(null);
    try {
      const res = type === 'learning'
        ? await tasksApi.generateLearning({ scope: isManager ? 'my_team' : 'my', due_days: 7, max_per_user: 3 })
        : await tasksApi.generatePractical({ due_days: 1, max_per_user: 1 });
      const data = res.data;
      if (data.total_created > 0) {
        setGenResult(t(
          type === 'learning' ? 'tasks.generate.successLearning' : 'tasks.generate.successPractical',
          { count: data.total_created, users: data.users_with_tasks }
        ));
        await loadData();
      } else {
        setGenResult(t(type === 'learning' ? 'tasks.generate.noNewLearning' : 'tasks.generate.noNewPractical'));
      }
    } catch {
      setGenResult(t('tasks.generate.error'));
    } finally {
      setGenerating(null);
      setTimeout(() => setGenResult(null), 5000);
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
        ...(newAssigneeId ? { assignee_id: newAssigneeId } : {}),
      } as Partial<Task>);
      setNewTitle('');
      setNewDesc('');
      setNewPriority('medium');
      setNewAssigneeId('');
      setShowCreate(false);
      await loadData();
    } catch {
      setError(t('tasks.errors.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <TacticalShell title={t('tasks.title')} subtitle={t('tasks.subtitle')}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 mb-6">
        <div className="flex items-center gap-3">
          {/* Scope toggle */}
          <div className="flex bg-bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setScope('my')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                scope === 'my'
                  ? 'bg-bg-accent text-fg-on-accent shadow-sm'
                  : 'text-fg-subtle hover:text-fg-default'
              }`}
            >
              {t('tasks.scope.my')}
            </button>
            {isManager && (
              <button
                onClick={() => setScope('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  scope === 'all'
                    ? 'bg-bg-accent text-fg-on-accent shadow-sm'
                    : 'text-fg-subtle hover:text-fg-default'
                }`}
              >
                {t('tasks.scope.all')}
              </button>
            )}
          </div>
          {/* Генерация обучения — только руководитель (бэк generate-learning требует supervisor+;
              у ТП кнопка давала 403. Аудит 2026-06-28). */}
          {isManager && (
          <button
            onClick={() => handleGenerate('learning')}
            disabled={!!generating}
            className="inline-flex items-center gap-1.5 bg-role-sales text-bg-canvas px-3 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-xs font-medium"
            title={t('tasks.generate.tooltipLearning')}
          >
            {generating === 'learning' ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            )}
            {t('tasks.generate.learning')}
          </button>
          )}
          {/* Generate practical tasks */}
          {isManager && (
            <button
              onClick={() => handleGenerate('practical')}
              disabled={!!generating}
              className="inline-flex items-center gap-1.5 bg-status-warning-fg text-bg-canvas px-3 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-xs font-medium"
              title={t('tasks.generate.tooltipPractical')}
            >
              {generating === 'practical' ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              )}
              {t('tasks.generate.practical')}
            </button>
          )}
          {/* Создание задач — функция руководителя. ТП задачи исполняет, не создаёт
              (баг видимости: кнопка была видна всем). PO 2026-06-28. */}
          {isManager && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-bg-accent text-fg-on-accent px-4 py-2.5 rounded-xl hover:bg-bg-accent-hover transition-all shadow-sm hover:shadow-md text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t('tasks.newTask')}
            </button>
          )}
        </div>
      </div>

      {/* Generation result toast */}
      {genResult && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-in ${
          genResult.includes('❌') || genResult === t('tasks.generate.error')
            ? 'bg-status-danger-bg text-status-danger-fg border border-border-default'
            : genResult.includes(t('tasks.generate.noNewLearning')) || genResult.includes(t('tasks.generate.noNewPractical'))
              ? 'bg-status-warning-bg text-status-warning-fg border border-status-warning-fg'
              : 'bg-status-success-bg text-status-success-fg border border-status-success-fg'
        }`}>
          <span>{genResult}</span>
          <button onClick={() => setGenResult(null)} className="ml-auto text-current opacity-50 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Daily norm indicator */}
      {isManager && norm && norm.is_manager && norm.total_subordinates !== undefined && norm.total_subordinates > 0 && (
        <div className={`mb-4 px-4 py-3 rounded-xl border flex items-center gap-3 ${
          norm.all_met
            ? 'bg-status-success-bg border-status-success-fg'
            : 'bg-status-warning-bg border-status-warning-fg'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            norm.all_met ? 'bg-status-success-fg text-bg-canvas' : 'bg-status-warning-fg text-bg-canvas'
          }`}>
            {norm.norm_met_count}/{norm.norm_total}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-fg-default">
              {norm.all_met ? t('tasks.norm.allMet') : t('tasks.norm.notMet')}
            </div>
            <div className="text-xs text-fg-subtle">
              {t('tasks.norm.description', { met: norm.norm_met_count ?? 0, total: norm.norm_total ?? 0 })}
            </div>
          </div>
          {/* Mini progress bar */}
          <div className="w-24 h-2 bg-bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${norm.all_met ? 'bg-status-success-bg0' : 'bg-status-warning-bg0'}`}
              style={{ width: `${norm.norm_total ? ((norm.norm_met_count ?? 0) / norm.norm_total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: t('tasks.stats.total'), value: stats.total, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'text-fg-muted', bg: 'bg-bg-muted' },
          { label: t('tasks.stats.todo'), value: stats.todo, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-fg-muted', bg: 'bg-bg-muted' },
          { label: t('tasks.stats.inProgress'), value: stats.in_progress, icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'text-status-info-fg', bg: 'bg-status-info-bg' },
          { label: t('tasks.stats.done'), value: stats.done, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-status-success-fg', bg: 'bg-status-success-bg' },
        ].map((s) => (
          <div key={s.label} className="bg-bg-surface rounded-xl border border-border-default p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path d={s.icon} />
                </svg>
              </div>
              <div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-fg-subtle">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-fg-default">{t('tasks.create.title')}</h3>
              <button onClick={() => setShowCreate(false)} className="text-fg-subtle hover:text-fg-default transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg-muted mb-1.5">{t('tasks.create.nameLabel')}</label>
                <input
                  type="text"
                  placeholder={t('tasks.create.namePlaceholder')}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-border-strong rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fg-muted mb-1.5">{t('tasks.create.descLabel')}</label>
                <textarea
                  placeholder={t('tasks.create.descPlaceholder')}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full border border-border-strong rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent resize-none"
                />
              </div>
              {/* Исполнитель (только для руководителей, поле опционально).
                  Radix Select не допускает value='' → sentinel 'none' = без исполнителя. */}
              {isManager && subordinates.length > 0 && (
                <FormField label={t('tasks.create.assigneeLabel') || 'Исполнитель'}>
                  <Select
                    value={newAssigneeId || 'none'}
                    onValueChange={(v) => setNewAssigneeId(v === 'none' ? '' : v)}
                    options={[
                      { value: 'none', label: t('tasks.create.assigneePlaceholder') || 'Без исполнителя' },
                      ...subordinates.map((u) => ({ value: u.id, label: u.full_name || u.employee_id })),
                    ]}
                  />
                </FormField>
              )}
              <div>
                <label className="block text-sm font-medium text-fg-muted mb-1.5">{t('tasks.create.priorityLabel')}</label>
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
                            ? `${s.bg} ${s.text} ${s.border} ring-2 ring-offset-1 ring-border-accent`
                            : 'bg-bg-muted text-fg-subtle border-border-default hover:bg-bg-surface-raised'
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
                onClick={() => { setShowCreate(false); setNewAssigneeId(''); }}
                className="px-4 py-2.5 text-sm text-fg-muted hover:text-fg-default font-medium rounded-xl hover:bg-bg-surface-raised transition-colors"
              >
                {t('tasks.create.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
                className="bg-bg-accent text-fg-on-accent px-5 py-2.5 rounded-xl hover:bg-bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm transition-all"
              >
                {creating ? t('tasks.create.creating') : t('tasks.create.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-bg-muted rounded-xl p-4 space-y-3 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-bg-muted rounded" />
                <div className="h-5 w-6 bg-bg-muted rounded-full" />
              </div>
              {[1, 2].map((j) => (
                <div key={j} className="bg-bg-surface rounded-xl p-4 space-y-2">
                  <div className="h-4 w-full bg-bg-muted rounded" />
                  <div className="h-3 w-2/3 bg-bg-muted rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-status-danger-bg border border-border-default rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-status-danger-fg flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="text-status-danger-fg text-sm flex-1">{error}</p>
            <button onClick={loadData} className="text-status-danger-fg hover:opacity-80 text-sm font-medium underline">{t('tasks.retry')}</button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {COLUMNS.map((col) => {
            const tasks = board[col.key as keyof KanbanBoard] || [];
            return (
              <div key={col.key} className={`${col.color} rounded-xl border ${col.border} p-4 min-h-[250px]`}>
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <h3 className="font-semibold text-sm text-fg-muted">{t(col.labelKey)}</h3>
                  </div>
                  <span className={`${col.badge} text-bg-canvas text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold`}>
                    {tasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onCardClick={setSelectedTask} isManager={isManager} />
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-10">
                      <svg className="mx-auto w-8 h-8 text-fg-subtle mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-fg-subtle text-xs">{t('tasks.empty')}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </TacticalShell>
  );
}
