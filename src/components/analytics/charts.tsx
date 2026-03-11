import { useState, useEffect, useRef } from 'react';
import { useT } from '../../stores/langStore';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface CategoryBreakdown {
  name: string;
  count: number;
}

export interface StatCardDef {
  label: string;
  value: number | string;
  gradientFrom: string;
  gradientTo: string;
  bgLight: string;
  textColor: string;
  icon: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BAR_COLORS = [
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
// Section title with divider
// ---------------------------------------------------------------------------

export function SectionTitle({ title }: { title: string }) {
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
// Stat card
// ---------------------------------------------------------------------------

export function StatCard({ card }: { card: StatCardDef }) {
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

export function DonutChart({ total, filled }: { total: number; filled: number }) {
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

export function HorizontalBarChart({ categories }: { categories: CategoryBreakdown[] }) {
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

export function MetricBar({
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

export function MetricValue({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LMS Metric Card
// ---------------------------------------------------------------------------

export function LmsMetricCard({
  label, value, suffix, target, color, desc,
}: {
  label: string; value: number; suffix: string; target: number; color: string; desc: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; bar: string; gradient: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', bar: 'bg-amber-500', gradient: 'from-amber-500 to-amber-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', bar: 'bg-purple-500', gradient: 'from-purple-500 to-purple-600' },
  };
  const c = colorMap[color] || colorMap.blue;
  const achieved = value >= target;

  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.gradient}`} />
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-1 mb-1">
        <span className={`text-2xl font-bold ${c.text}`}>
          {typeof value === 'number' ? Math.round(value) : value}
        </span>
        {suffix && <span className={`text-sm ${c.text}`}>{suffix}</span>}
      </div>
      <p className="text-xs text-gray-400 mb-2">{desc}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${c.bar} transition-all duration-500`}
            style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${achieved ? 'text-emerald-600' : 'text-gray-400'}`}>
          {achieved ? 'OK' : `/${target}${suffix}`}
        </span>
      </div>
    </div>
  );
}
