import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { shelfApi, type ShelfAnalysis } from '../../api/shelf';
import { useT, useLangStore } from '../../stores/langStore';

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-50 ring-green-200';
  if (score >= 50) return 'bg-amber-50 ring-amber-200';
  return 'bg-red-50 ring-red-200';
}

function relativeTime(dateStr: string, lang: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === 'uz' ? 'hozirgina' : 'только что';
  if (mins < 60) return lang === 'uz' ? `${mins} daq oldin` : `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === 'uz' ? `${hours} soat oldin` : `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return lang === 'uz' ? `${days} kun oldin` : `${days} дн назад`;
}

export function ShelfScanHistoryWidget() {
  const [analyses, setAnalyses] = useState<ShelfAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useT();
  const lang = useLangStore((s) => s.lang);

  useEffect(() => {
    shelfApi
      .list({ limit: 3 })
      .then((res) => {
        const items = res.data?.items ?? (Array.isArray(res.data) ? res.data : []);
        setAnalyses(items.slice(0, 3));
      })
      .catch(() => setAnalyses([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            {t('dashboard.shelfScan.title')}
          </h2>
          <Link
            to="/planogram"
            className="text-xs font-medium text-purple-200 hover:text-white transition-colors"
          >
            {t('dashboard.shelfScan.viewAll')} &rarr;
          </Link>
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6">
        {analyses.length === 0 ? (
          <div className="text-center py-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
              <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">{t('dashboard.shelfScan.empty')}</p>
            <Link
              to="/planogram"
              className="mt-2 inline-block text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              {t('dashboard.shelfScan.startScan')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((a) => (
              <Link
                key={a.id}
                to="/planogram"
                className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-gray-50"
              >
                {/* Score circle */}
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ring-1 ${scoreBg(a.score)}`}>
                  <span className={`text-xl font-bold ${scoreColor(a.score)}`}>{a.score}</span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {a.category
                      ? t(`planogram.categoryLabels.${a.category}`)
                      : t('dashboard.shelfScan.analysis')}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">
                      {relativeTime(a.created_at, lang)}
                    </span>
                    {a.tasks_generated > 0 && (
                      <span className="text-xs text-amber-600">
                        {a.tasks_generated} {t('dashboard.shelfScan.tasksGen')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <svg className="h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
