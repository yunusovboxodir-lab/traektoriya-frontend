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
          <span className="text-xs text-gray-500 mr-1">{t('analytics.lms.trackLabel')}:</span>
          <button
            onClick={() => onTrackChange('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !track
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('analytics.lms.trackAll')}
          </button>
          {tracks.map((tr) => (
            <button
              key={tr.id}
              onClick={() => onTrackChange(tr.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                track === tr.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
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
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cluster.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{cluster.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {cluster.affected_users} {t('analytics.lms.people')}
                        </span>
                        {cluster.has_draft && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {t('analytics.lms.aiDraft')}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          cluster.status === 'new' ? 'bg-yellow-100 text-yellow-700' :
                          cluster.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {cluster.status === 'new' ? t('analytics.lms.statusNew') :
                           cluster.status === 'reviewed' ? t('analytics.lms.statusReviewed') :
                           t('analytics.lms.statusPublished')}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {cluster.count} {t('analytics.lms.mentions')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {cluster.trend_vs_prev_week != null && (
                      <span className={`text-sm font-medium ${
                        cluster.trend_vs_prev_week > 0 ? 'text-red-600' :
                        cluster.trend_vs_prev_week < 0 ? 'text-green-600' :
                        'text-gray-400'
                      }`}>
                        {cluster.trend_vs_prev_week > 0 ? '+' : ''}
                        {Math.round(cluster.trend_vs_prev_week)}%
                      </span>
                    )}
                    {cluster.top_quotes.length > 0 && (
                      <button
                        onClick={() => setExpandedCluster(
                          expandedCluster === cluster.id ? null : cluster.id
                        )}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {expandedCluster === cluster.id ? t('analytics.lms.hide') : t('analytics.lms.quotes')}
                      </button>
                    )}
                  </div>
                </div>
                {expandedCluster === cluster.id && cluster.top_quotes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    {cluster.top_quotes.map((q, i) => (
                      <p key={i} className="text-sm text-gray-600 italic pl-4 border-l-2 border-gray-200">
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-10">
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-10 divide-y divide-gray-100">
            {dashboard!.reflections!.map((r, i) => (
              <div key={i} className="p-4 flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {r.user_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{r.user_name}</span>
                    {r.category_label && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {r.category_label}
                      </span>
                    )}
                    {r.created_at && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(r.created_at).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{r.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!dashboard?.pain_clusters?.length && !dashboard?.reflections?.length && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">{t('analytics.lms.emptyTitle')}</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {t('analytics.lms.emptyDesc')}
          </p>
        </div>
      )}
    </div>
  );
}
