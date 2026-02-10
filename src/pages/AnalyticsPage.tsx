import { useState, useEffect } from 'react';
import { analyticsApi } from '../api/analytics';

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

interface ProductStats {
  total_products?: number;
  products_with_hpv?: number;
  average_test_score?: number;
  tests_completed?: number;
  [key: string]: unknown;
}

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

      // If all three failed, show an error
      if (
        overviewRes.status === 'rejected' &&
        learningRes.status === 'rejected' &&
        productsRes.status === 'rejected'
      ) {
        setError('Не удалось загрузить аналитику');
      }
    } catch (e: any) {
      console.error('Analytics load error:', e);
      setError('Не удалось загрузить аналитику');
    } finally {
      setLoading(false);
    }
  };

  // -- Loading --
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
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

  const statCards = [
    {
      label: 'Пользователи',
      value: overview?.total_users ?? '---',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
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
      color: 'text-green-600',
      bg: 'bg-green-50',
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
      color: 'text-amber-600',
      bg: 'bg-amber-50',
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
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <path d="M3.27 6.96L12 12.01l8.73-5.05" />
          <path d="M12 22.08V12" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Аналитика</h1>
        <p className="text-sm text-gray-500 mt-1">
          Общая статистика платформы
        </p>
      </div>

      {/* Overview stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Learning metrics */}
      {learning && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Метрики обучения
          </h2>
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
      )}

      {/* Product knowledge */}
      {productStats && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Знание товаров
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric components
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
