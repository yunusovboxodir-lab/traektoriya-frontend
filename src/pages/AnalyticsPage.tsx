import { useState, useEffect, useRef } from 'react';
import { analyticsApi } from '../api/analytics';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface OverviewData {
  total_users?: number;
  total_courses?: number;
  total_tasks?: number;
  total_products?: number;
  [key: string]: unknown;
}

interface LearningMetrics {
  completion_rate?: number;
  average_score?: number;
  active_learners?: number;
  courses_completed?: number;
  [key: string]: unknown;
}

interface CategoryBreakdown {
  name: string;
  count: number;
}

interface ProductStats {
  total_products?: number;
  products_with_hpv?: number;
  average_test_score?: number;
  tests_completed?: number;
  categories_breakdown?: CategoryBreakdown[];
  [key: string]: unknown;
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

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [learning, setLearning] = useState<LearningMetrics | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, learningRes, productsRes] = await Promise.allSettled([
        analyticsApi.getOverview(),
        analyticsApi.getLearningMetrics(),
        analyticsApi.getProductStats(),
      ]);

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data);
      if (learningRes.status === 'fulfilled') setLearning(learningRes.value.data);
      if (productsRes.status === 'fulfilled') setProductStats(productsRes.value.data);

      if (
        overviewRes.status === 'rejected' &&
        learningRes.status === 'rejected' &&
        productsRes.status === 'rejected'
      ) {
        setError('Не удалось загрузить аналитику');
      }
    } catch {
      setError('Не удалось загрузить аналитику');
    } finally {
      setLoading(false);
    }
  };

  // -- Loading (skeleton) --
  if (loading) {
    return (
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-7 w-40 bg-gray-200 rounded-md mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded-md" />
        </div>

        {/* Stat cards skeleton */}
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

        {/* Learning metrics skeleton */}
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

        {/* Product section skeleton */}
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
            onClick={loadData}
            className="text-red-600 underline text-sm mt-1"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  // -- Stat cards definition --
  const statCards: StatCardDef[] = [
    {
      label: 'Пользователи',
      value: overview?.total_users ?? '---',
      trend: '+12%',
      trendUp: true,
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
      label: 'Курсы',
      value: overview?.total_courses ?? '---',
      trend: '+3',
      trendUp: true,
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
      label: 'Задачи',
      value: overview?.total_tasks ?? '---',
      trend: '+8',
      trendUp: true,
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
      label: 'Товары',
      value: overview?.total_products ?? '---',
      trend: '+5',
      trendUp: true,
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

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Аналитика
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Общая статистика платформы
        </p>
      </div>

      {/* ── Overview stat cards ── */}
      <SectionTitle title="Обзор" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((card) => (
          <StatCard key={card.label} card={card} />
        ))}
      </div>

      {/* ── Learning metrics ── */}
      {learning && (
        <>
          <SectionTitle title="Метрики обучения" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricBar
                label="Завершаемость"
                value={learning.completion_rate ?? 0}
                max={100}
                suffix="%"
                color="bg-blue-500"
              />
              <MetricBar
                label="Средний балл"
                value={learning.average_score ?? 0}
                max={100}
                suffix="%"
                color="bg-green-500"
              />
              <MetricValue
                label="Активных учащихся"
                value={learning.active_learners ?? 0}
              />
              <MetricValue
                label="Курсов завершено"
                value={learning.courses_completed ?? 0}
              />
            </div>
          </div>
        </>
      )}

      {/* ── Product knowledge ── */}
      {productStats && (
        <>
          <SectionTitle title="Знание товаров" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-10">
            {/* Top row: simple metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricValue
                label="Всего товаров"
                value={productStats.total_products ?? 0}
              />
              <MetricValue
                label="Товаров с ХПВ"
                value={productStats.products_with_hpv ?? 0}
              />
              <MetricBar
                label="Средний балл теста"
                value={productStats.average_test_score ?? 0}
                max={100}
                suffix="%"
                color="bg-purple-500"
              />
              <MetricValue
                label="Тестов пройдено"
                value={productStats.tests_completed ?? 0}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 mb-8" />

            {/* Charts row: donut + bar chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Donut chart */}
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Покрытие ХПВ
                </h3>
                <DonutChart
                  total={productStats.total_products ?? 0}
                  filled={productStats.products_with_hpv ?? 0}
                />
              </div>

              {/* Horizontal bar chart */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Категории товаров
                </h3>
                <HorizontalBarChart categories={categories} />
              </div>
            </div>
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
// Stat card (enhanced)
// ---------------------------------------------------------------------------

interface StatCardDef {
  label: string;
  value: number | string;
  trend: string;
  trendUp: boolean;
  gradientFrom: string;
  gradientTo: string;
  bgLight: string;
  textColor: string;
  icon: React.ReactNode;
}

function StatCard({ card }: { card: StatCardDef }) {
  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Subtle gradient accent at top */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradientFrom} ${card.gradientTo}`}
      />
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${card.bgLight} flex items-center justify-center ${card.textColor}`}
        >
          {card.icon}
        </div>
        {/* Trend badge */}
        <span
          className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
            card.trendUp
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {card.trendUp ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path d="M19 9l-7 7-7-7" />
            </svg>
          )}
          {card.trend}
        </span>
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
  const mounted = useRef(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      // Trigger animation on next frame
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
        {/* Background circle */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="16"
        />
        {/* Filled arc */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">
          {Math.round(pct * 100)}%
        </span>
        <span className="text-xs text-gray-500">ХПВ</span>
      </div>
      {/* Bottom label */}
      <p className="mt-3 text-sm text-gray-600">
        Товаров с ХПВ:{' '}
        <span className="font-semibold text-gray-900">{filled}</span> из{' '}
        <span className="font-semibold text-gray-900">{total}</span>
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
// Metric components (kept from original, unchanged)
// ---------------------------------------------------------------------------

function MetricBar({
  label,
  value,
  max,
  suffix,
  color,
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  color: string;
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

function MetricValue({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
