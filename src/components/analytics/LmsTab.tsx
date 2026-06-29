import { useState } from 'react';
import { useT } from '../../stores/langStore';
import type { LmsDashboard } from './types';
import { SectionTitle, LmsMetricCard, HorizontalBarChart } from './charts';

// ---------------------------------------------------------------------------
// LmsTab — AI L&D analytics
// ---------------------------------------------------------------------------

interface Props {
  dashboard: LmsDashboard | null;
  track: string;
  onTrackChange: (t: string) => void;
}

export function LmsTab({ dashboard, track, onTrackChange }: Props) {
  const t = useT();
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const m = dashboard?.metrics;
  const tracks = dashboard?.available_tracks ?? [];

  return (
    <div>
      {/* Track selector */}
      {tracks.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>{t('analytics.lms.trackLabel')}:</span>
          <button
            onClick={() => onTrackChange('')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
            style={!track
              ? { background: 'var(--info)', color: 'var(--text-inverse)' }
              : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
            }
          >
            {t('analytics.lms.trackAll')}
          </button>
          {tracks.map((tr) => (
            <button
              key={tr.id}
              onClick={() => onTrackChange(tr.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={track === tr.id
                ? { background: 'var(--info)', color: 'var(--text-inverse)' }
                : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
              }
            >
              {tr.roles}
            </button>
          ))}
        </div>
      )}

      {/* Metric cards */}
      <SectionTitle title={t('analytics.lms.metricsTitle')} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <LmsMetricCard
          label={t('analytics.lms.quizAccuracy')}
          value={m?.quiz_accuracy ?? 0}
          suffix="%"
          target={75}
          color="blue"
          desc={t('analytics.lms.quizAccuracyDesc')}
        />
        <LmsMetricCard
          label={t('analytics.lms.reflectionRate')}
          value={m?.reflection_rate ?? 0}
          suffix="%"
          target={40}
          color="emerald"
          desc={t('analytics.lms.reflectionRateDesc')}
        />
        <LmsMetricCard
          label={t('analytics.lms.avgScore')}
          value={m?.avg_quiz_score ?? 0}
          suffix="%"
          target={70}
          color="amber"
          desc={t('analytics.lms.avgScoreDesc')}
        />
        <LmsMetricCard
          label={t('analytics.lms.clustersWeek')}
          value={m?.clusters_this_week ?? 0}
          suffix=""
          target={3}
          color="purple"
          desc={t('analytics.lms.clustersWeekDesc')}
        />
      </div>

      {/* Pain clusters */}
      {(dashboard?.pain_clusters?.length ?? 0) > 0 && (
        <>
          <SectionTitle title={t('analytics.lms.topPainClusters')} />
          <div className="space-y-3 mb-10">
            {dashboard!.pain_clusters!.map((cluster) => (
              <div
                key={cluster.id}
                className="rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cluster.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{cluster.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                          {cluster.affected_users} {t('analytics.lms.people')}
                        </span>
                        {cluster.has_draft && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
                            {t('analytics.lms.aiDraft')}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full" style={
                          cluster.status === 'new'
                            ? { background: 'var(--warning-bg)', color: 'var(--warning)' }
                            : cluster.status === 'reviewed'
                            ? { background: 'var(--info-bg)', color: 'var(--info)' }
                            : { background: 'var(--success-bg)', color: 'var(--success)' }
                        }>
                          {cluster.status === 'new' ? t('analytics.lms.statusNew') :
                           cluster.status === 'reviewed' ? t('analytics.lms.statusReviewed') :
                           t('analytics.lms.statusPublished')}
                        </span>
                      </div>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {cluster.count} {t('analytics.lms.mentions')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {cluster.trend_vs_prev_week != null && (
                      <span className="text-sm font-medium" style={{
                        color: cluster.trend_vs_prev_week > 0 ? 'var(--danger)' :
                               cluster.trend_vs_prev_week < 0 ? 'var(--success)' :
                               'var(--text-muted)',
                      }}>
                        {cluster.trend_vs_prev_week > 0 ? '+' : ''}
                        {Math.round(cluster.trend_vs_prev_week)}%
                      </span>
                    )}
                    {cluster.top_quotes.length > 0 && (
                      <button
                        onClick={() => setExpandedCluster(
                          expandedCluster === cluster.id ? null : cluster.id
                        )}
                        className="text-xs"
                        style={{ color: 'var(--info)' }}
                      >
                        {expandedCluster === cluster.id ? t('analytics.lms.hide') : t('analytics.lms.quotes')}
                      </button>
                    )}
                  </div>
                </div>
                {expandedCluster === cluster.id && cluster.top_quotes.length > 0 && (
                  <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
                    {cluster.top_quotes.map((q, i) => (
                      <p key={i} className="text-sm italic pl-4 border-l-2 border-zinc-500" style={{ color: 'var(--text-secondary)' }}>
                        &laquo;{q}&raquo;
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Category distribution */}
      {(dashboard?.category_distribution?.length ?? 0) > 0 && (
        <>
          <SectionTitle title={t('analytics.lms.categoryDist')} />
          <div className="rounded-xl p-6 shadow-sm mb-10" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <HorizontalBarChart
              categories={dashboard!.category_distribution!.map((c) => ({
                name: `${c.icon} ${c.label}`,
                count: c.count,
              }))}
            />
          </div>
        </>
      )}

      {/* Recent reflections */}
      {(dashboard?.reflections?.length ?? 0) > 0 && (
        <>
          <SectionTitle title={`${t('analytics.lms.recentReflections')}${
            track === 'field_sales' ? ' ' + t('analytics.lms.trackFieldSalesShort') :
            track === 'sales_management' ? ' ' + t('analytics.lms.trackSalesMgmtShort') : ''
          }`} />
          <div className="rounded-xl shadow-sm mb-10" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {dashboard!.reflections!.map((r, i) => (
              <div key={i} className="p-4 flex gap-3" style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
                  {r.user_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.user_name}</span>
                    {r.category_label && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                        {r.category_label}
                      </span>
                    )}
                    {r.created_at && (
                      <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                        {new Date(r.created_at).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!dashboard?.pain_clusters?.length && !dashboard?.reflections?.length && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3" style={{ color: 'var(--text-muted)' }}>—</div>
          <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{t('analytics.lms.emptyTitle')}</h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
            {t('analytics.lms.emptyDesc')}
          </p>
        </div>
      )}
    </div>
  );
}
