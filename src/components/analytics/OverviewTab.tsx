import { useT } from '../../stores/langStore';
import type {
  OverviewData, LearningMetrics, ProductStats,
  LeaderboardEntry, CategoryBreakdown,
} from './types';
import {
  SectionTitle, StatCard, DonutChart,
  HorizontalBarChart, MetricBar, MetricValue,
} from './charts';
import type { StatCardDef } from './charts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Суперадмин',
  commercial_dir: 'Комм. директор',
  admin: 'Админ',
  regional_manager: 'Рег. менеджер',
  supervisor: 'Супервайзер',
  sales_rep: 'Торговый пред.',
};

// ---------------------------------------------------------------------------
// Helpers to read overview data (nested or flat)
// ---------------------------------------------------------------------------
function ov(data: OverviewData | null, path: string): number {
  if (!data) return 0;
  const parts = path.split('.');
  let cur: unknown = data;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      cur = undefined;
      break;
    }
  }
  if (typeof cur === 'number') return cur;
  const flatKey = parts.join('_');
  const flat = (data as Record<string, unknown>)[flatKey];
  if (typeof flat === 'number') return flat;
  return 0;
}

// ---------------------------------------------------------------------------
// OverviewTab
// ---------------------------------------------------------------------------

interface Props {
  overview: OverviewData | null;
  learning: LearningMetrics | null;
  productStats: ProductStats | null;
  leaderboard: LeaderboardEntry[];
}

export function OverviewTab({ overview, learning, productStats, leaderboard }: Props) {
  const t = useT();

  const statCards: StatCardDef[] = [
    {
      label: t('analytics.users'),
      value: ov(overview, 'users.total') || '---',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-600',
      accentColor: 'var(--info)',
      accentBg: 'var(--info-bg)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
    {
      label: t('analytics.courses'),
      value: ov(overview, 'courses.total') || '---',
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-emerald-600',
      accentColor: 'var(--success)',
      accentBg: 'var(--success-bg)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" />
        </svg>
      ),
    },
    {
      label: t('analytics.tasks'),
      value: ov(overview, 'tasks.total') || '---',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-amber-600',
      accentColor: 'var(--warning)',
      accentBg: 'var(--warning-bg)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: t('analytics.products'),
      value: ov(overview, 'products.total') || '---',
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-purple-600',
      accentColor: 'var(--color-tp)',
      accentBg: 'var(--color-tp-bg)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <path d="M3.27 6.96L12 12.01l8.73-5.05" />
          <path d="M12 22.08V12" />
        </svg>
      ),
    },
  ];

  // Только реальные данные с бэкенда; без данных — блок «Категории» не рендерится.
  const categories: CategoryBreakdown[] =
    productStats?.categories_breakdown && productStats.categories_breakdown.length > 0
      ? productStats.categories_breakdown
      : [];

  const byProduct = productStats?.by_product ?? [];
  const popularProducts = productStats?.popular_products ?? byProduct.slice(0, 10);
  const byTerritory = learning?.by_territory ?? [];
  const byCourse = learning?.by_course ?? [];

  // «Нет активности» — когда нет ни прохождений курсов, ни закрытых задач.
  // Раньше пустые метрики (0) читались как «сломано»; показываем честную плашку.
  const noActivity =
    ov(overview, 'learning.total_completed') === 0 &&
    ov(overview, 'tasks.completed') === 0;

  return (
    <>
      {/* Stat cards */}
      <SectionTitle title={t('analytics.overview')} />
      {noActivity && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm flex items-start gap-2"
          style={{
            background: 'var(--info-bg)',
            border: '1px solid var(--info)',
            color: 'var(--text-secondary)',
          }}
        >
          <span aria-hidden="true">ℹ️</span>
          <span>
            Метрики активности (прохождения курсов, оценки, закрытые задачи) пока пустые —
            они наполнятся по мере работы сотрудников на платформе. Это не ошибка раздела.
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((card) => (
          <StatCard key={card.label} card={card} />
        ))}
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <>
          <SectionTitle title={t('analytics.leaderboard')} />
          <div className="rounded-xl shadow-sm mb-10 overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left py-2 pr-4 font-medium w-8" style={{ color: 'var(--text-muted)' }}>#</th>
                  <th className="text-left py-2 pr-4 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.name')}</th>
                  <th className="text-left py-2 pr-4 font-medium hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>{t('analytics.role')}</th>
                  <th className="text-left py-2 pr-4 font-medium hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>{t('analytics.region')}</th>
                  <th className="text-right py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.tasksCompleted')}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => (
                  <tr key={entry.user_id} className="last:border-0" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-2.5 pr-4">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                        style={
                          idx === 0 ? { background: 'rgba(251,191,36,0.15)', color: 'var(--warning)' } :
                          idx === 1 ? { background: 'var(--bg-overlay)', color: 'var(--text-muted)' } :
                          idx === 2 ? { background: 'rgba(251,146,60,0.15)', color: '#FB923C' } :
                          { color: 'var(--text-muted)' }
                        }
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
                          {entry.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium truncate max-w-[150px]" style={{ color: 'var(--text-primary)' }}>{entry.full_name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{entry.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 hidden sm:table-cell">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{ROLE_LABELS[entry.role] ?? entry.role}</span>
                    </td>
                    <td className="py-2.5 pr-4 hidden md:table-cell">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{entry.region ?? '—'}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {entry.tasks_completed}
                        <svg className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path d="M9 12l2 2 4-4" />
                        </svg>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Learning metrics */}
      {learning && (
        <>
          <SectionTitle title={t('analytics.learningMetrics')} />
          <div className="rounded-xl p-6 shadow-sm mb-10" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <MetricBar
                label={t('analytics.completion')}
                value={learning.completion_rate ?? learning.avg_completion_rate ?? 0}
                max={100}
                suffix="%"
                color="bg-blue-500"
              />
              <MetricBar
                label={t('analytics.avgScore')}
                value={learning.average_score ?? 0}
                max={100}
                suffix="%"
                color="bg-green-500"
              />
              <MetricValue
                label={t('analytics.activeLearners')}
                value={learning.active_learners ?? learning.total_enrolled ?? 0}
              />
              <MetricValue
                label={t('analytics.coursesCompleted')}
                value={learning.courses_completed ?? learning.total_completed ?? 0}
              />
            </div>

            {learning.time_stats && (
              <div className="grid grid-cols-2 gap-4 mb-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <MetricValue
                  label={t('analytics.avgLessonTime')}
                  value={`${learning.time_stats.avg_time_per_lesson ?? 0} ${t('analytics.min')}`}
                />
                <MetricValue
                  label={t('analytics.totalHours')}
                  value={`${learning.time_stats.total_learning_hours ?? 0} ${t('analytics.hours')}`}
                />
              </div>
            )}

            {byTerritory.length > 0 && (
              <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {t('analytics.byTerritory')}
                </h3>
                <HorizontalBarChart
                  categories={byTerritory.map((tr) => ({
                    name: tr.territory || '—',
                    count: tr.enrolled,
                  }))}
                />
              </div>
            )}

            {byCourse.length > 0 && (
              <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {t('analytics.byCourse')}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th className="text-left py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.courseName')}</th>
                        <th className="text-right py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.enrolled')}</th>
                        <th className="text-right py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.completed')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byCourse.map((c) => (
                        <tr key={c.course_id} className="last:border-0" style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="py-2 truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{c.title}</td>
                          <td className="py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{c.enrolled}</td>
                          <td className="py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{c.completed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Product knowledge */}
      {productStats && (
        <>
          <SectionTitle title={t('analytics.productKnowledge')} />
          <div className="rounded-xl p-6 shadow-sm mb-10" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricValue
                label={t('analytics.totalProducts')}
                value={productStats.total_products ?? 0}
              />
              <MetricValue
                label={t('analytics.productsWithHpv')}
                value={productStats.products_with_hpv ?? productStats.products_with_tests ?? 0}
              />
              <MetricBar
                label={t('analytics.avgTestScore')}
                value={productStats.average_test_score ?? productStats.test_stats?.avg_score ?? 0}
                max={100}
                suffix="%"
                color="bg-purple-500"
              />
              <MetricValue
                label={t('analytics.testsCompleted')}
                value={productStats.tests_completed ?? productStats.test_stats?.total_attempts ?? 0}
              />
            </div>
            <div className="mb-8" style={{ borderTop: '1px solid var(--border)' }} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {t('analytics.hpvCoverage')}
                </h3>
                <DonutChart
                  total={productStats.total_products ?? 0}
                  filled={productStats.products_with_hpv ?? productStats.products_with_tests ?? 0}
                />
              </div>
              {categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {t('analytics.categories')}
                  </h3>
                  <HorizontalBarChart categories={categories} />
                </div>
              )}
            </div>

            {popularProducts.length > 0 && (
              <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {t('analytics.productDetails')}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th className="text-left py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.productName')}</th>
                        <th className="text-right py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.attempts')}</th>
                        <th className="text-right py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.passRate')}</th>
                        <th className="text-right py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.avgScore')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {popularProducts.map((p) => (
                        <tr key={p.product_id} className="last:border-0" style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="py-2 truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{p.name}</td>
                          <td className="py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{p.attempts}</td>
                          <td className="py-2 text-right">
                            <span className="font-medium" style={{
                              color: p.pass_rate >= 80 ? 'var(--success)' :
                                     p.pass_rate >= 50 ? 'var(--warning)' :
                                     'var(--danger)',
                            }}>
                              {p.pass_rate}%
                            </span>
                          </td>
                          <td className="py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{p.avg_score}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
