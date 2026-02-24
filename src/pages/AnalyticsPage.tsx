import { useState, useEffect, useRef, useCallback } from 'react';
import { analyticsApi } from '../api/analytics';
import { useT } from '../stores/langStore';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface OverviewData {
  users?: { total?: number; active?: number; by_role?: Record<string, number> };
  courses?: { total?: number; published?: number; avg_completion_rate?: number };
  tasks?: { total?: number; completed?: number; overdue?: number; completion_rate?: number };
  learning?: { total_enrolled?: number; total_completed?: number; avg_progress?: number };
  products?: { total?: number; with_tests?: number; avg_test_score?: number };
  // Legacy flat fields (backward compat)
  total_users?: number;
  total_courses?: number;
  total_tasks?: number;
  total_products?: number;
}

interface LearningMetrics {
  total_enrolled?: number;
  total_completed?: number;
  avg_completion_rate?: number;
  completion_rate?: number;
  average_score?: number;
  active_learners?: number;
  courses_completed?: number;
  by_territory?: TerritoryItem[];
  by_course?: CourseItem[];
  time_stats?: { avg_time_per_lesson?: number; total_learning_hours?: number };
  difficult_steps?: DifficultStep[];
}

interface TerritoryItem {
  territory: string;
  enrolled: number;
  completed: number;
  avg_score: number;
}

interface CourseItem {
  course_id: string;
  title: string;
  enrolled: number;
  completed: number;
  avg_score: number;
}

interface DifficultStep {
  content_item_id: string;
  title: string;
  difficulty_level: number;
  path?: string;
}

interface CategoryBreakdown {
  name: string;
  count: number;
}

interface ProductStats {
  total_products?: number;
  products_with_tests?: number;
  products_with_hpv?: number;
  average_test_score?: number;
  tests_completed?: number;
  test_stats?: { total_attempts?: number; pass_rate?: number; avg_score?: number };
  categories_breakdown?: CategoryBreakdown[];
  by_product?: ProductItem[];
  popular_products?: ProductItem[];
  difficult_products?: ProductItem[];
}

interface ProductItem {
  product_id: string;
  name: string;
  attempts: number;
  pass_rate: number;
  avg_score: number;
}

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  employee_id: string;
  role: string;
  region?: string;
  tasks_completed: number;
}

// ---------------------------------------------------------------------------
// Static fallback categories
// ---------------------------------------------------------------------------

const FALLBACK_CATEGORIES: CategoryBreakdown[] = [
  { name: 'Молочные', count: 6 },
  { name: 'Соки', count: 6 },
  { name: 'Кондитерские', count: 5 },
  { name: 'Бакалея', count: 5 },
  { name: 'Консервы', count: 4 },
  { name: 'Детское', count: 3 },
  { name: 'Напитки', count: 1 },
];

const BAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-indigo-500',
];

const PERIOD_OPTIONS = [
  { value: 'week', labelKey: 'analytics.periodWeek' },
  { value: 'month', labelKey: 'analytics.periodMonth' },
  { value: 'quarter', labelKey: 'analytics.periodQuarter' },
  { value: 'all', labelKey: 'analytics.periodAll' },
] as const;

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
  // Try nested first (users.total, courses.total, etc.)
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
  // Try flat fallback (total_users, total_courses, etc.)
  const flatKey = parts.join('_');
  const flat = (data as Record<string, unknown>)[flatKey];
  if (typeof flat === 'number') return flat;
  return 0;
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function AnalyticsPage() {
  const t = useT();
  const [period, setPeriod] = useState<string>('all');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [learning, setLearning] = useState<LearningMetrics | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async (p: string) => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, learningRes, productsRes, leaderboardRes] =
        await Promise.allSettled([
          analyticsApi.getOverview({ period: p }),
          analyticsApi.getLearningMetrics(),
          analyticsApi.getProductStats(),
          analyticsApi.getLeaderboard({ period: p }),
        ]);

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data);
      if (learningRes.status === 'fulfilled') setLearning(learningRes.value.data);
      if (productsRes.status === 'fulfilled') setProductStats(productsRes.value.data);
      if (leaderboardRes.status === 'fulfilled')
        setLeaderboard(leaderboardRes.value.data?.leaders ?? []);

      if (
        overviewRes.status === 'rejected' &&
        learningRes.status === 'rejected' &&
        productsRes.status === 'rejected'
      ) {
        setError(t('analytics.loadError'));
      }
    } catch {
      setError(t('analytics.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData(period);
  }, [period, loadData]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await analyticsApi.exportAnalytics('overview');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${period}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setExporting(false);
    }
  };

  // -- Loading (skeleton) --
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-6">
          <div className="h-7 w-40 bg-gray-200 rounded-md mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded-md" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"
            >
              <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3" />
              <div className="h-7 w-16 bg-gray-200 rounded-md mb-2" />
              <div className="h-4 w-24 bg-gray-100 rounded-md" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
          <div className="h-5 w-48 bg-gray-200 rounded-md mb-4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="h-4 w-28 bg-gray-100 rounded-md mb-2" />
                <div className="h-6 w-16 bg-gray-200 rounded-md mb-2" />
                <div className="h-2 w-full bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="h-5 w-40 bg-gray-200 rounded-md mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex justify-center">
              <div className="h-48 w-48 bg-gray-100 rounded-full" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-24 bg-gray-100 rounded-md" />
                  <div className="h-6 flex-1 bg-gray-100 rounded-md" />
                  <div className="h-4 w-6 bg-gray-100 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -- Error (full) --
  if (error && !overview && !learning && !productStats) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => loadData(period)}
            className="text-red-600 underline text-sm mt-1"
          >
            {t('analytics.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  // -- Stat cards --
  const statCards: StatCardDef[] = [
    {
      label: t('analytics.users'),
      value: ov(overview, 'users.total') || '---',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
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
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
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
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
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
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <path d="M3.27 6.96L12 12.01l8.73-5.05" />
          <path d="M12 22.08V12" />
        </svg>
      ),
    },
  ];

  // Categories for the bar chart
  const categories: CategoryBreakdown[] =
    productStats?.categories_breakdown && productStats.categories_breakdown.length > 0
      ? productStats.categories_breakdown
      : FALLBACK_CATEGORIES;

  // Product details
  const byProduct = productStats?.by_product ?? [];
  const popularProducts = productStats?.popular_products ?? byProduct.slice(0, 10);

  // Learning details
  const byTerritory = learning?.by_territory ?? [];
  const byCourse = learning?.by_course ?? [];

  return (
    <div>
      {/* Page header with period filter + export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {t('analytics.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('analytics.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period filter */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  period === opt.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('analytics.export')}
          </button>
        </div>
      </div>

      {/* ── Overview stat cards ── */}
      <SectionTitle title={t('analytics.overview')} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((card) => (
          <StatCard key={card.label} card={card} />
        ))}
      </div>

      {/* ── Leaderboard ── */}
      {leaderboard.length > 0 && (
        <>
          <SectionTitle title={t('analytics.leaderboard')} />
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-4 text-gray-500 font-medium w-8">#</th>
                    <th className="text-left py-2 pr-4 text-gray-500 font-medium">{t('analytics.name')}</th>
                    <th className="text-left py-2 pr-4 text-gray-500 font-medium hidden sm:table-cell">{t('analytics.role')}</th>
                    <th className="text-left py-2 pr-4 text-gray-500 font-medium hidden md:table-cell">{t('analytics.region')}</th>
                    <th className="text-right py-2 text-gray-500 font-medium">{t('analytics.tasksCompleted')}</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr key={entry.user_id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 pr-4">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-700' :
                          idx === 1 ? 'bg-gray-100 text-gray-600' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'text-gray-400'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {entry.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 truncate max-w-[150px]">{entry.full_name}</div>
                            <div className="text-xs text-gray-400">{entry.employee_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 hidden sm:table-cell">
                        <span className="text-xs text-gray-500">{ROLE_LABELS[entry.role] ?? entry.role}</span>
                      </td>
                      <td className="py-2.5 pr-4 hidden md:table-cell">
                        <span className="text-xs text-gray-500">{entry.region ?? '—'}</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
                          {entry.tasks_completed}
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path d="M9 12l2 2 4-4" />
                          </svg>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Learning metrics ── */}
      {learning && (
        <>
          <SectionTitle title={t('analytics.learningMetrics')} />
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-10">
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

            {/* Time stats */}
            {learning.time_stats && (
              <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-gray-100">
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

            {/* By territory */}
            {byTerritory.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
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

            {/* By course */}
            {byCourse.length > 0 && (
              <div className="pt-4 mt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {t('analytics.byCourse')}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-gray-500 font-medium">{t('analytics.courseName')}</th>
                        <th className="text-right py-2 text-gray-500 font-medium">{t('analytics.enrolled')}</th>
                        <th className="text-right py-2 text-gray-500 font-medium">{t('analytics.completed')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byCourse.map((c) => (
                        <tr key={c.course_id} className="border-b border-gray-50 last:border-0">
                          <td className="py-2 text-gray-900 truncate max-w-[200px]">{c.title}</td>
                          <td className="py-2 text-right text-gray-600">{c.enrolled}</td>
                          <td className="py-2 text-right text-gray-600">{c.completed}</td>
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

      {/* ── Product knowledge ── */}
      {productStats && (
        <>
          <SectionTitle title={t('analytics.productKnowledge')} />
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-10">
            {/* Top row: metric cards */}
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

            {/* Divider */}
            <div className="border-t border-gray-100 mb-8" />

            {/* Charts: donut + categories bar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  {t('analytics.hpvCoverage')}
                </h3>
                <DonutChart
                  total={productStats.total_products ?? 0}
                  filled={productStats.products_with_hpv ?? productStats.products_with_tests ?? 0}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  {t('analytics.categories')}
                </h3>
                <HorizontalBarChart categories={categories} />
              </div>
            </div>

            {/* Product detail table */}
            {popularProducts.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {t('analytics.productDetails')}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-gray-500 font-medium">{t('analytics.productName')}</th>
                        <th className="text-right py-2 text-gray-500 font-medium">{t('analytics.attempts')}</th>
                        <th className="text-right py-2 text-gray-500 font-medium">{t('analytics.passRate')}</th>
                        <th className="text-right py-2 text-gray-500 font-medium">{t('analytics.avgScore')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {popularProducts.map((p) => (
                        <tr key={p.product_id} className="border-b border-gray-50 last:border-0">
                          <td className="py-2 text-gray-900 truncate max-w-[200px]">{p.name}</td>
                          <td className="py-2 text-right text-gray-600">{p.attempts}</td>
                          <td className="py-2 text-right">
                            <span className={`font-medium ${
                              p.pass_rate >= 80 ? 'text-emerald-600' :
                              p.pass_rate >= 50 ? 'text-amber-600' :
                              'text-red-600'
                            }`}>
                              {p.pass_rate}%
                            </span>
                          </td>
                          <td className="py-2 text-right text-gray-600">{p.avg_score}%</td>
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section title with divider
// ---------------------------------------------------------------------------

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap">
        {title}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card (no hardcoded trends)
// ---------------------------------------------------------------------------

interface StatCardDef {
  label: string;
  value: number | string;
  gradientFrom: string;
  gradientTo: string;
  bgLight: string;
  textColor: string;
  icon: React.ReactNode;
}

function StatCard({ card }: { card: StatCardDef }) {
  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradientFrom} ${card.gradientTo}`}
      />
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${card.bgLight} flex items-center justify-center ${card.textColor}`}
        >
          {card.icon}
        </div>
      </div>
      <div className={`text-xl sm:text-2xl font-bold ${card.textColor} tracking-tight`}>
        {card.value}
      </div>
      <div className="text-sm text-gray-500 mt-0.5">{card.label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut chart (pure SVG)
// ---------------------------------------------------------------------------

function DonutChart({ total, filled }: { total: number; filled: number }) {
  const t = useT();
  const mounted = useRef(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      requestAnimationFrame(() => setAnimated(true));
    }
  }, []);

  const safeTotal = Math.max(total, 1);
  const pct = Math.min(filled / safeTotal, 1);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - pct * circumference;

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="16" />
        <circle
          cx="90" cy="90" r={radius} fill="none" stroke="#8b5cf6" strokeWidth="16"
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{Math.round(pct * 100)}%</span>
        <span className="text-xs text-gray-500">{t('analytics.hpv')}</span>
      </div>
      <p className="mt-3 text-sm text-gray-600">
        {t('analytics.hpvOf', { filled, total })}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal bar chart
// ---------------------------------------------------------------------------

function HorizontalBarChart({ categories }: { categories: CategoryBreakdown[] }) {
  const maxValue = Math.max(...categories.map((c) => c.count), 1);

  return (
    <div className="space-y-3">
      {categories.map((cat, i) => {
        const widthPct = (cat.count / maxValue) * 100;
        const barColor = BAR_COLORS[i % BAR_COLORS.length];
        return (
          <div key={cat.name} className="flex items-center gap-3">
            <span className="text-xs sm:text-sm text-gray-600 w-20 sm:w-28 text-right shrink-0 truncate">
              {cat.name}
            </span>
            <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden">
              <div
                className={`h-full rounded-md ${barColor} transition-all duration-700 ease-out`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700 w-6 text-right shrink-0">
              {cat.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric components
// ---------------------------------------------------------------------------

function MetricBar({
  label, value, max, suffix, color,
}: {
  label: string; value: number; max: number; suffix?: string; color: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900 mb-2">
        {typeof value === 'number' ? Math.round(value) : value}
        {suffix}
      </p>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MetricValue({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
