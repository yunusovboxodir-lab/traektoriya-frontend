import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { shelfApi, type ShelfAnalysis } from '../../api/shelf';
import { useT, useLangStore } from '../../stores/langStore';

function scoreColor(score: number): string {
  if (score >= 80) return 'text-[var(--success)]';
  if (score >= 50) return 'text-[var(--warning)]';
  return 'text-[var(--danger)]';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-[var(--success-bg)] ring-[var(--success)]/30';
  if (score >= 50) return 'bg-[var(--warning-bg)] ring-[var(--warning)]/30';
  return 'bg-[var(--danger-bg)] ring-[var(--danger)]/30';
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
      <div className="rounded-[var(--radius-lg)] p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 rounded bg-[var(--bg-elevated)]" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--bg-elevated)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] overflow-hidden">
      {/* Header — token-based, без яркого gradient */}
      <div className="px-5 py-3 sm:px-6 border-b border-[var(--border)] flex items-center justify-between">
        <h2
          className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider"
          style={{ color: 'var(--color-tp)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
          {t('dashboard.shelfScan.title')}
        </h2>
        <Link
          to="/planogram"
          className="text-xs font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-tp)' }}
        >
          {t('dashboard.shelfScan.viewAll')} &rarr;
        </Link>
      </div>

      <div className="px-5 py-4 sm:px-6">
        {analyses.length === 0 ? (
          <div className="text-center py-6">
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: 'var(--color-tp-bg)' }}
            >
              <svg className="h-6 w-6" style={{ color: 'var(--color-tp)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.shelfScan.empty')}</p>
            <Link
              to="/planogram"
              className="mt-2 inline-block text-sm font-medium hover:opacity-80"
              style={{ color: 'var(--color-tp)' }}
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
                className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-[var(--bg-elevated)]"
              >
                {/* Score circle */}
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ring-1 ${scoreBg(a.score)}`}>
                  <span className={`text-xl font-bold ${scoreColor(a.score)}`}>{a.score}</span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {a.category
                      ? t(`planogram.categoryLabels.${a.category}`)
                      : t('dashboard.shelfScan.analysis')}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {relativeTime(a.created_at, lang)}
                    </span>
                    {a.tasks_generated > 0 && (
                      <span className="text-xs" style={{ color: 'var(--warning)' }}>
                        {a.tasks_generated} {t('dashboard.shelfScan.tasksGen')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <svg className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
