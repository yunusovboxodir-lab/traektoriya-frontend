import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { analyticsApi } from '../api/analytics';
import { useT } from '../stores/langStore';
import { useAuthStore } from '../stores/authStore';
import { OverviewTab } from '../components/analytics/OverviewTab';
import { LmsTab } from '../components/analytics/LmsTab';
import { EffectivenessTab } from '../components/analytics/EffectivenessTab';
import { ReportsPage } from './ReportsPage';
import type {
  OverviewData, LearningMetrics, ProductStats,
  LeaderboardEntry, LmsDashboard, InsightItem,
} from '../components/analytics/types';

type AnalyticsTabId = 'overview' | 'lms' | 'effectiveness' | 'reports';

const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 5,
  commercial_dir: 4,
  regional_manager: 2,
  admin: 3,
  supervisor: 2,
  sales_rep: 1,
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PERIOD_OPTIONS = [
  { value: 'week', labelKey: 'analytics.periodWeek' },
  { value: 'month', labelKey: 'analytics.periodMonth' },
  { value: 'quarter', labelKey: 'analytics.periodQuarter' },
  { value: 'all', labelKey: 'analytics.periodAll' },
] as const;

// TAB_OPTIONS is built dynamically in component to support role-based visibility

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function AnalyticsPage() {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role || 'sales_rep';
  const isAdminPlus = (ROLE_HIERARCHY[userRole] ?? 0) >= 3;

  // Build tabs with optional Reports tab for admin+
  const tabOptions: { id: AnalyticsTabId; labelKey: string }[] = [
    { id: 'overview', labelKey: 'analytics.tabOverview' },
    { id: 'lms', labelKey: 'analytics.tabLms' },
    { id: 'effectiveness', labelKey: 'analytics.tabEffectiveness' },
    ...(isAdminPlus ? [{ id: 'reports' as const, labelKey: 'analytics.tabReports' }] : []),
  ];

  const tabFromUrl = searchParams.get('tab') as AnalyticsTabId | null;
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>(
    tabFromUrl && tabOptions.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'overview',
  );
  const [period, setPeriod] = useState<string>('all');

  // Sync URL → state on mount / URL change
  useEffect(() => {
    const urlTab = searchParams.get('tab') as AnalyticsTabId | null;
    if (urlTab && tabOptions.some((t) => t.id === urlTab)) {
      setActiveTab(urlTab);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (tab: AnalyticsTabId) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  // Overview data (depends on period only)
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [learning, setLearning] = useState<LearningMetrics | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // LMS data (depends on track only)
  const [lmsDashboard, setLmsDashboard] = useState<LmsDashboard | null>(null);
  const [lmsInsights, setLmsInsights] = useState<InsightItem[]>([]);
  const [lmsTrack, setLmsTrack] = useState<string>('');

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingLms, setLoadingLms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMenu, setExportMenu] = useState(false);

  // --- Load overview data (period-dependent) ---
  const loadOverviewData = useCallback(async (p: string) => {
    try {
      setLoadingOverview(true);
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
      setLoadingOverview(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Load LMS data (track-dependent) ---
  const loadLmsData = useCallback(async (track?: string) => {
    try {
      setLoadingLms(true);

      const trackParam = track ? { track } : undefined;
      const [lmsRes, insightsRes] = await Promise.allSettled([
        analyticsApi.getLmsDashboard(trackParam),
        analyticsApi.getLmsInsights(),
      ]);

      if (lmsRes.status === 'fulfilled') setLmsDashboard(lmsRes.value.data);
      if (insightsRes.status === 'fulfilled') setLmsInsights(insightsRes.value.data ?? []);
    } catch {
      // LMS errors are non-critical
    } finally {
      setLoadingLms(false);
    }
  }, []);

  // --- Effects: separate dependencies ---
  useEffect(() => {
    loadOverviewData(period);
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadLmsData(lmsTrack || undefined);
  }, [lmsTrack]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async (type: 'kpi' | 'tasks' | 'overview') => {
    setExportMenu(false);
    try {
      setExporting(true);
      const res = await analyticsApi.exportAnalytics(type);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `traektoriya_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setExporting(false);
    }
  };

  const loading = loadingOverview && loadingLms;

  // -- Loading skeleton --
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-6">
          <div className="h-7 w-40 bg-gray-200 rounded-md mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded-md" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
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
            onClick={() => loadOverviewData(period)}
            className="text-red-600 underline text-sm mt-1"
          >
            {t('analytics.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

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
          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenu((v) => !v)}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? t('analytics.exporting') : t('analytics.export')}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {exportMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                {([
                  { type: 'kpi' as const, icon: '📊', labelKey: 'analytics.exportKpi' },
                  { type: 'tasks' as const, icon: '📋', labelKey: 'analytics.exportTasks' },
                  { type: 'overview' as const, icon: '📈', labelKey: 'analytics.exportOverview' },
                ] as const).map(({ type, icon, labelKey }) => (
                  <button
                    key={type}
                    onClick={() => handleExport(type)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span>{icon}</span>
                    {t(labelKey)}
                    <span className="ml-auto text-gray-400 text-[10px]">.xlsx</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-8 w-fit">
        {tabOptions.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* TAB: Overview */}
      {activeTab === 'overview' && (
        <OverviewTab
          overview={overview}
          learning={learning}
          productStats={productStats}
          leaderboard={leaderboard}
        />
      )}

      {/* TAB: AI L&D */}
      {activeTab === 'lms' && (
        <LmsTab
          dashboard={lmsDashboard}
          track={lmsTrack}
          onTrackChange={setLmsTrack}
        />
      )}

      {/* TAB: Effectiveness */}
      {activeTab === 'effectiveness' && (
        <EffectivenessTab
          insights={lmsInsights}
          dashboard={lmsDashboard}
          track={lmsTrack}
        />
      )}

      {/* TAB: Reports (admin+) */}
      {activeTab === 'reports' && isAdminPlus && <ReportsPage />}
    </div>
  );
}
