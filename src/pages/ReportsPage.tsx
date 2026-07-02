import { useState, useEffect, useCallback } from 'react';
import { reportsApi, type ScreenshotReport, type ReportType } from '../api/reports';
import { api } from '../api/client';
import { useT } from '../stores/langStore';
import { PageHeader, EmptyState, RowActions, Button, toast } from '@/components/ui';
import { FileText, Eye, Check, Trash2, ListPlus } from 'lucide-react';

// ---------------------------------------------------------------------------
// Бейджи: статус и тип обращения (на дизайн-токенах)
// ---------------------------------------------------------------------------

const STATUS_TOKENS: Record<string, string> = {
  new: 'bg-status-warning-bg text-status-warning-fg',
  reviewed: 'bg-status-info-bg text-status-info-fg',
  resolved: 'bg-status-success-bg text-status-success-fg',
};

const TYPE_META: Record<ReportType, { icon: string; label: string; cls: string }> = {
  bug: { icon: '🐞', label: 'Баг', cls: 'bg-status-danger-bg text-status-danger-fg' },
  idea: { icon: '💡', label: 'Идея', cls: 'bg-status-warning-bg text-status-warning-fg' },
  question: { icon: '❓', label: 'Вопрос', cls: 'bg-status-info-bg text-status-info-fg' },
};

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const labels: Record<string, string> = {
    new: t('reports.statusNew'),
    reviewed: t('reports.statusReviewed'),
    resolved: t('reports.statusResolved'),
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_TOKENS[status] || 'bg-bg-canvas text-fg-muted'}`}>
      {labels[status] || status}
    </span>
  );
}

function TypeBadge({ type }: { type: ReportType }) {
  const m = TYPE_META[type] || TYPE_META.bug;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${m.cls}`}>
      {m.icon} {m.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Report detail modal
// ---------------------------------------------------------------------------

function ReportDetail({
  report,
  onClose,
  onUpdate,
  onCreateTask,
  t,
}: {
  report: ScreenshotReport;
  onClose: () => void;
  onUpdate: (id: string, data: { status?: string; admin_comment?: string }) => void;
  onCreateTask: (id: string) => void;
  t: (k: string) => string;
}) {
  const [adminComment, setAdminComment] = useState(report.admin_comment || '');
  const [apiData, setApiData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const ctx = report.context_data;
    let endpoint = '';
    if (ctx?.course_id) endpoint = `/api/v1/learning/courses/${ctx.course_id}`;
    else if (ctx?.product_id) endpoint = `/api/v1/products/${ctx.product_id}`;
    else if (ctx?.section_id) endpoint = `/api/v1/learning/sections/${ctx.section_id}/courses`;
    if (!endpoint) return;

    let cancelled = false;
    api.get(endpoint)
      .then((r) => { if (!cancelled) setApiData(r.data as Record<string, unknown>); })
      .catch(() => { /* оставляем context_data как fallback */ });
    return () => { cancelled = true; };
  }, [report.context_data]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
         onClick={onClose}>
      <div className="bg-bg-surface text-fg-default border border-border-default rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-4"
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default">
          <div>
            <h2 className="text-lg font-semibold">{t('reports.title')}</h2>
            <p className="text-sm text-fg-muted">
              {report.user_name || 'N/A'} &middot; {report.user_role ? t(`roles.${report.user_role}`) : ''} &middot;{' '}
              {new Date(report.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TypeBadge type={report.report_type} />
            <StatusBadge status={report.status} t={t} />
            <button onClick={onClose} className="p-2 hover:bg-bg-canvas rounded-lg text-fg-muted">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content: Screenshot vs Current Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          <div>
            <h3 className="text-sm font-medium text-fg-muted mb-2">{t('reports.screenshot')} ({t('reports.atMoment')})</h3>
            {report.screenshot_url ? (
              <img src={report.screenshot_url} alt="Screenshot" className="w-full rounded-lg border border-border-default shadow-1" />
            ) : (
              <div className="h-64 bg-bg-canvas rounded-lg flex items-center justify-center text-fg-subtle">
                {t('reports.noScreenshot')}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-fg-muted mb-2">{t('reports.currentData')}</h3>
            <div className="bg-bg-canvas rounded-lg p-4 max-h-96 overflow-auto text-fg-default">
              {apiData ? (
                <pre className="text-xs whitespace-pre-wrap break-words font-mono">{JSON.stringify(apiData, null, 2)}</pre>
              ) : report.context_data ? (
                <pre className="text-xs whitespace-pre-wrap break-words font-mono">{JSON.stringify(report.context_data, null, 2)}</pre>
              ) : (
                <p className="text-sm text-fg-muted">{t('reports.noContext')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Comment from RM */}
        <div className="px-6 pb-4">
          <h3 className="text-sm font-medium text-fg-muted mb-1">{t('reports.comment')}</h3>
          <p className="bg-status-warning-bg/30 border border-border-default rounded-lg p-3 text-sm text-fg-default">
            {report.comment}
          </p>
          {report.screen_name && (
            <p className="text-xs text-fg-subtle mt-2">
              {t('reports.context')}: {report.screen_name}
              {report.current_route && ` (${report.current_route})`}
            </p>
          )}
        </div>

        {/* Admin actions */}
        <div className="px-6 pb-6 border-t border-border-default pt-4">
          <h3 className="text-sm font-medium text-fg-muted mb-2">{t('reports.adminComment')}</h3>
          <textarea
            value={adminComment}
            onChange={(e) => setAdminComment(e.target.value)}
            className="w-full bg-bg-canvas border border-border-default rounded-lg p-3 text-sm text-fg-default resize-none focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus"
            rows={3}
            placeholder={t('reports.adminCommentPlaceholder')}
          />
          <div className="flex flex-wrap gap-3 mt-3">
            <Button variant="primary" size="sm" leftIcon={<ListPlus size={14} />} onClick={() => onCreateTask(report.id)}>
              Создать задачу
            </Button>
            {report.status === 'new' && (
              <Button variant="secondary" size="sm" onClick={() => onUpdate(report.id, { status: 'reviewed', admin_comment: adminComment || undefined })}>
                {t('reports.markReviewed')}
              </Button>
            )}
            {report.status !== 'resolved' && (
              <Button variant="secondary" size="sm" onClick={() => onUpdate(report.id, { status: 'resolved', admin_comment: adminComment || undefined })}>
                {t('reports.markResolved')}
              </Button>
            )}
            {adminComment !== (report.admin_comment || '') && (
              <Button variant="ghost" size="sm" onClick={() => onUpdate(report.id, { admin_comment: adminComment })}>
                {t('reports.saveComment')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reports Page
// ---------------------------------------------------------------------------

const TYPE_FILTERS: { value: '' | ReportType; label: string }[] = [
  { value: '', label: 'Все типы' },
  { value: 'bug', label: '🐞 Баг' },
  { value: 'idea', label: '💡 Идея' },
  { value: 'question', label: '❓ Вопрос' },
];

export function ReportsPage() {
  const t = useT();
  const [reports, setReports] = useState<ScreenshotReport[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState<'' | ReportType>('');
  const [page, setPage] = useState(0);
  const [selectedReport, setSelectedReport] = useState<ScreenshotReport | null>(null);
  const pageSize = 20;

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { skip: page * pageSize, limit: pageSize };
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.report_type = filterType;
      const res = await reportsApi.list(params as Parameters<typeof reportsApi.list>[0]);
      setReports(res.data.items);
      setTotal(res.data.total);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const handleUpdate = async (id: string, data: { status?: string; admin_comment?: string }) => {
    try {
      const res = await reportsApi.updateStatus(id, data);
      setReports((prev) => prev.map((r) => (r.id === id ? res.data : r)));
      if (selectedReport?.id === id) setSelectedReport(res.data);
    } catch {
      toast.error('Не удалось обновить репорт');
    }
  };

  const handleCreateTask = async (id: string) => {
    try {
      const res = await reportsApi.createTask(id);
      toast.success(`Задача создана (${res.data.task_id.slice(0, 8)})`);
      // репорт стал reviewed — обновим локально
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'reviewed' } : r)));
      if (selectedReport?.id === id) setSelectedReport({ ...selectedReport, status: 'reviewed' });
    } catch {
      toast.error('Не удалось создать задачу');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить этот репорт безвозвратно?')) return;
    try {
      await reportsApi.delete(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      setTotal((n) => Math.max(0, n - 1));
      if (selectedReport?.id === id) setSelectedReport(null);
      toast.success('Репорт удалён');
    } catch {
      toast.error('Не удалось удалить репорт');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 max-w-7xl mx-auto text-fg-default">
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              {['', 'new', 'reviewed', 'resolved'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setFilterStatus(s); setPage(0); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterStatus === s ? 'bg-bg-accent text-fg-on-accent' : 'bg-bg-canvas text-fg-muted hover:bg-bg-surface'
                  }`}
                >
                  {s === '' ? t('reports.all') : s === 'new' ? t('reports.statusNew') : s === 'reviewed' ? t('reports.statusReviewed') : t('reports.statusResolved')}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {TYPE_FILTERS.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => { setFilterType(tf.value); setPage(0); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterType === tf.value ? 'bg-bg-accent text-fg-on-accent' : 'bg-bg-canvas text-fg-muted hover:bg-bg-surface'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-border-accent" />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState icon={<FileText size={48} />} title={t('reports.empty.title')} description={t('reports.empty.desc')} />
      ) : (
        <div className="bg-bg-surface rounded-xl border border-border-default shadow-1 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-canvas text-left">
                <th className="px-4 py-3 font-medium text-fg-muted w-28"></th>
                <th className="px-4 py-3 font-medium text-fg-muted">{t('reports.date')}</th>
                <th className="px-4 py-3 font-medium text-fg-muted">{t('reports.author')}</th>
                <th className="px-4 py-3 font-medium text-fg-muted">Тип</th>
                <th className="px-4 py-3 font-medium text-fg-muted">{t('reports.screenshot')}</th>
                <th className="px-4 py-3 font-medium text-fg-muted">{t('reports.comment')}</th>
                <th className="px-4 py-3 font-medium text-fg-muted">{t('reports.status')}</th>
                <th className="px-4 py-3 font-medium text-fg-muted w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-bg-canvas cursor-pointer transition-colors" onClick={() => setSelectedReport(r)}>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Button variant="secondary" size="sm" leftIcon={<Eye size={14} />} onClick={() => setSelectedReport(r)}>
                      {t('common.actions.open')}
                    </Button>
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-muted whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}<br />
                    {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.user_name || 'N/A'}</div>
                    <div className="text-xs text-fg-subtle">{r.user_role ? t(`roles.${r.user_role}`) : ''}</div>
                  </td>
                  <td className="px-4 py-3"><TypeBadge type={r.report_type} /></td>
                  <td className="px-4 py-3">
                    {r.screenshot_url ? (
                      <img src={r.screenshot_url} alt="" className="w-16 h-10 object-cover rounded border border-border-default" />
                    ) : (
                      <div className="w-16 h-10 bg-bg-canvas rounded flex items-center justify-center text-fg-subtle text-xs">—</div>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">{r.comment}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} t={t} /></td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      label={t('reports.rowActions.label')}
                      items={[
                        {
                          label: 'Создать задачу',
                          icon: <ListPlus size={14} />,
                          onSelect: () => handleCreateTask(r.id),
                        },
                        ...(r.status !== 'reviewed' && r.status !== 'resolved'
                          ? [{ label: t('common.actions.markReviewed'), icon: <Check size={14} />, onSelect: () => handleUpdate(r.id, { status: 'reviewed' }) }]
                          : []),
                        { separator: true },
                        {
                          label: t('common.actions.delete'),
                          icon: <Trash2 size={14} />,
                          destructive: true,
                          onSelect: () => handleDelete(r.id),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`px-3 py-1 rounded text-sm ${page === i ? 'bg-bg-accent text-fg-on-accent' : 'bg-bg-canvas text-fg-muted hover:bg-bg-surface'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {selectedReport && (
        <ReportDetail
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdate={handleUpdate}
          onCreateTask={handleCreateTask}
          t={t}
        />
      )}
    </div>
  );
}
