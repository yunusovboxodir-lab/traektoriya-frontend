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
  /** Legacy Tailwind classes — kept for TS compat but overridden by accentColor/accentBg */
  bgLight?: string;
  textColor?: string;
  /** CSS-var token for icon color (e.g. 'var(--info)') */
  accentColor?: string;
  /** CSS-var token for icon background (e.g. 'var(--info-bg)') */
  accentBg?: string;
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
      <h2 className="text-base font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, var(--border), transparent)' }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

export function StatCard({ card }: { card: StatCardDef }) {
  const iconBg = card.accentBg ?? undefined;
  const iconColor = card.accentColor ?? undefined;
  return (
    <div className="relative overflow-hidden rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradientFrom} ${card.gradientTo}`}
      />
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
          style={{ background: iconBg, color: iconColor }}
        >
          {card.icon}
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: iconColor }}>
        {card.value}
      </div>
      <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{card.label}</div>
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
        <circle cx="90" cy="90" r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth="16" />
        <circle
          cx="90" cy="90" r={radius} fill="none" stroke="#8b5cf6" strokeWidth="16"
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{Math.round(pct * 100)}%</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('analytics.hpv')}</span>
      </div>
      <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
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
            <span className="text-xs sm:text-sm w-20 sm:w-28 text-right shrink-0 truncate" style={{ color: 'var(--text-secondary)' }}>
              {cat.name}
            </span>
            <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <div
                className={`h-full rounded-md ${barColor} transition-all duration-700 ease-out`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="text-sm font-semibold w-6 text-right shrink-0" style={{ color: 'var(--text-secondary)' }}>
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
      <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        {typeof value === 'number' ? Math.round(value) : value}
        {suffix}
      </p>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
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
      <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
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
  const colorMap: Record<string, { accentColor: string; bar: string; gradient: string }> = {
    blue:    { accentColor: 'var(--info)',     bar: 'bg-blue-500',    gradient: 'from-blue-500 to-blue-600' },
    emerald: { accentColor: 'var(--success)',  bar: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600' },
    amber:   { accentColor: 'var(--warning)',  bar: 'bg-amber-500',   gradient: 'from-amber-500 to-amber-600' },
    purple:  { accentColor: 'var(--color-tp)', bar: 'bg-purple-500',  gradient: 'from-purple-500 to-purple-600' },
  };
  const c = colorMap[color] || colorMap.blue;
  const achieved = value >= target;

  return (
    <div className="relative overflow-hidden rounded-xl p-5 shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.gradient}`} />
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-bold" style={{ color: c.accentColor }}>
          {typeof value === 'number' ? Math.round(value) : value}
        </span>
        {suffix && <span className="text-sm" style={{ color: c.accentColor }}>{suffix}</span>}
      </div>
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{desc}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
          <div
            className={`h-full rounded-full ${c.bar} transition-all duration-500`}
            style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color: achieved ? 'var(--success)' : 'var(--text-muted)' }}>
          {achieved ? 'OK' : `/${target}${suffix}`}
        </span>
      </div>
    </div>
  );
}
