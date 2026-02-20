import { useState, useEffect, useCallback } from 'react';
import { reportsApi, type ScreenshotReport } from '../api/reports';
import { api } from '../api/client';
import { useT } from '../stores/langStore';

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
};

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const labels: Record<string, string> = {
    new: t('reports.statusNew'),
    reviewed: t('reports.statusReviewed'),
    resolved: t('reports.statusResolved'),
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
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
  t,
}: {
  report: ScreenshotReport;
  onClose: () => void;
  onUpdate: (id: string, data: { status?: string; admin_comment?: string }) => void;
  t: (k: string) => string;
}) {
  const [adminComment, setAdminComment] = useState(report.admin_comment || '');
  const [apiData, setApiData] = useState<Record<string, unknown> | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  // Load current API data based on context
  useEffect(() => {
    const ctx = report.context_data;
    if (!ctx) return;

    setApiLoading(true);
    let endpoint = '';

    if (ctx.course_id) {
      endpoint = `/api/v1/learning/courses/${ctx.course_id}`;
    } else if (ctx.product_id) {
      endpoint = `/api/v1/products/${ctx.product_id}`;
    } else if (ctx.section_id) {
      endpoint = `/api/v1/learning/sections/${ctx.section_id}/courses`;
    }

    if (endpoint) {
      api.get(endpoint)
        .then((r) => setApiData(r.data as Record<string, unknown>))
        .catch(() => setApiData(null))
        .finally(() => setApiLoading(false));
    } else {
      setApiLoading(false);
    }
  }, [report.context_data]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
         onClick={onClose}>
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">{t('reports.title')}</h2>
            <p className="text-sm text-gray-500">
              {report.user_name || 'N/A'} &middot; {report.user_role || ''} &middot;{' '}
              {new Date(report.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={report.status} t={t} />
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content: Screenshot vs Current Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Left: Screenshot */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('reports.screenshot')} ({t('reports.atMoment')})</h3>
            {report.screenshot_url ? (
              <img
                src={report.screenshot_url}
                alt="Screenshot"
                className="w-full rounded-lg border shadow-sm"
              />
            ) : (
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                {t('reports.noScreenshot')}
              </div>
            )}
          </div>

          {/* Right: Current API data */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('reports.currentData')}</h3>
            {apiLoading ? (
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : apiData ? (
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                  {JSON.stringify(apiData, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
                {report.context_data ? (
                  <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                    {JSON.stringify(report.context_data, null, 2)}
                  </pre>
                ) : (
                  <p>{t('reports.noContext')}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comment from RM */}
        <div className="px-6 pb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">{t('reports.comment')}</h3>
          <p className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
            {report.comment}
          </p>
          {report.screen_name && (
            <p className="text-xs text-gray-400 mt-2">
              {t('reports.context')}: {report.screen_name}
              {report.current_route && ` (${report.current_route})`}
            </p>
          )}
        </div>

        {/* Admin actions */}
        <div className="px-6 pb-6 border-t pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">{t('reports.adminComment')}</h3>
          <textarea
            value={adminComment}
            onChange={(e) => setAdminComment(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm resize-none"
            rows={3}
            placeholder={t('reports.adminCommentPlaceholder')}
          />
          <div className="flex gap-3 mt-3">
            {report.status === 'new' && (
              <button
                onClick={() => onUpdate(report.id, { status: 'reviewed', admin_comment: adminComment || undefined })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                {t('reports.markReviewed')}
              </button>
            )}
            {report.status !== 'resolved' && (
              <button
                onClick={() => onUpdate(report.id, { status: 'resolved', admin_comment: adminComment || undefined })}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                {t('reports.markResolved')}
              </button>
            )}
            {adminComment !== (report.admin_comment || '') && (
              <button
                onClick={() => onUpdate(report.id, { admin_comment: adminComment })}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
              >
                {t('reports.saveComment')}
              </button>
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

export function ReportsPage() {
  const t = useT();
  const [reports, setReports] = useState<ScreenshotReport[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(0);
  const [selectedReport, setSelectedReport] = useState<ScreenshotReport | null>(null);
  const pageSize = 20;

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { skip: page * pageSize, limit: pageSize };
      if (filterStatus) params.status = filterStatus;
      const res = await reportsApi.list(params as Parameters<typeof reportsApi.list>[0]);
      setReports(res.data.items);
      setTotal(res.data.total);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const handleUpdate = async (id: string, data: { status?: string; admin_comment?: string }) => {
    try {
      const res = await reportsApi.updateStatus(id, data);
      // Update in list
      setReports((prev) => prev.map((r) => (r.id === id ? res.data : r)));
      // Update selected
      if (selectedReport?.id === id) setSelectedReport(res.data);
    } catch {
      // ignore
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('reports.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{t('reports.status')}:</span>
          {['', 'new', 'reviewed', 'resolved'].map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(0); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s === '' ? t('reports.all') : s === 'new' ? t('reports.statusNew') : s === 'reviewed' ? t('reports.statusReviewed') : t('reports.statusResolved')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{t('reports.noReports')}</div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">{t('reports.date')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('reports.author')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('reports.screenshot')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('reports.comment')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('reports.context')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('reports.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedReport(r)}
                >
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}<br />
                    {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.user_name || 'N/A'}</div>
                    <div className="text-xs text-gray-400">{r.user_role}</div>
                  </td>
                  <td className="px-4 py-3">
                    {r.screenshot_url ? (
                      <img src={r.screenshot_url} alt="" className="w-16 h-10 object-cover rounded border" />
                    ) : (
                      <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">—</div>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">{r.comment}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.screen_name || r.current_route || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} t={t} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`px-3 py-1 rounded text-sm ${
                page === i ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedReport && (
        <ReportDetail
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdate={handleUpdate}
          t={t}
        />
      )}
    </div>
  );
}
