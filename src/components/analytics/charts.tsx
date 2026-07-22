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
  /** Декоративный градиент-полоска убран (dataviz-ревизия 2026-07-12); поля опциональны для старых вызовов. */
  gradientFrom?: string;
  gradientTo?: string;
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

/* Радужный цикл BAR_COLORS убран (dataviz-ревизия 2026-07-12): один показатель
   по категориям = одна последовательная краска, а не категориальная палитра.
   Идентичность несут подписи строк, не цвет. */
export const BAR_COLOR = 'var(--info)';

// ---------------------------------------------------------------------------
// Section title with divider
// ---------------------------------------------------------------------------

export function SectionTitle({ title }: { title: React.ReactNode }) {
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
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
          style={{ background: iconBg, color: iconColor }}
        >
          {card.icon}
        </div>
      </div>
      {/* Значение — чернилами, не цветом серии: цвет несёт иконка-чип (dataviz-ревизия 2026-07-12) */}
      <div className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
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
          cx="90" cy="90" r={radius} fill="none" stroke={BAR_COLOR} strokeWidth="16"
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
        return (
          <div key={`${cat.name}-${i}`} className="flex items-center gap-3">
            <span className="text-xs sm:text-sm w-20 sm:w-28 text-right shrink-0 truncate" style={{ color: 'var(--text-secondary)' }}>
              {cat.name}
            </span>
            <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <div
                className="h-full rounded transition-all duration-700 ease-out"
                style={{ width: `${widthPct}%`, background: BAR_COLOR }}
              />
            </div>
            {/* w-10: трёхзначные значения не обрезались (раньше w-6) */}
            <span className="text-sm font-semibold w-10 text-right shrink-0" style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
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
  label, value, max, suffix,
}: {
  label: string; value: number; max: number; suffix?: string;
  /** color-проп убран: все метры одного вида красятся одной краской (BAR_COLOR) */
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {typeof value === 'number' ? Math.round(value) : value}
        {suffix}
      </p>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: BAR_COLOR }}
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
  label, value, suffix, target, desc,
}: {
  label: string; value: number; suffix: string; target: number; desc: string;
  /** color-проп убран (dataviz-ревизия 2026-07-12): значение чернилами,
      прогресс к цели одной краской, статус «достигнуто» — зелёным семантически. */
  color?: string;
}) {
  const achieved = value >= target;

  return (
    <div className="relative overflow-hidden rounded-xl p-5 shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {typeof value === 'number' ? Math.round(value) : value}
        </span>
        {suffix && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{suffix}</span>}
      </div>
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{desc}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min((value / target) * 100, 100)}%`, background: achieved ? 'var(--success)' : BAR_COLOR }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color: achieved ? 'var(--success)' : 'var(--text-muted)' }}>
          {achieved ? 'OK' : `/${target}${suffix}`}
        </span>
      </div>
    </div>
  );
}
