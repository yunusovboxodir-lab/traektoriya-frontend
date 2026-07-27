/**
 * AxisBars — горизонтальные шкалы осей компетенций выбранной роли/разреза.
 * В одобренном прототипе это и есть «шкалы радара» (несмотря на название —
 * визуально горизонтальные полосы, не SVG-паутина).
 */
import { useT } from '../../../stores/langStore';
import type { Lang } from '../../../stores/langStore';
import { fmt1, PULSE_GOAL_PCT, type DisplayAxis } from './helpers';

interface AxisBarsProps {
  axes: DisplayAxis[];
  roleColorVar: string;
  lang: Lang;
}

export function AxisBars({ axes, roleColorVar, lang }: AxisBarsProps) {
  const t = useT();

  if (axes.length === 0) {
    return (
      <p className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>
        {t('analytics.pulseDash.axesEmpty')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {axes.map((axis) => {
        const label = lang === 'uz' && axis.nameUz ? axis.nameUz : axis.name;
        const clamped = Math.max(axis.pct, 0);
        const shown = clamped < 3 ? 0 : clamped;
        return (
          <div key={axis.key} className="flex items-center gap-3 sm:gap-4">
            <div
              className="w-[110px] sm:w-[220px] shrink-0 text-xs sm:text-sm font-medium truncate"
              style={{ color: 'var(--text-primary)' }}
              title={label}
            >
              {label}
              <small
                className="hidden sm:block text-xs font-normal mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                {t('analytics.pulseDash.coursesOf', {
                  done: axis.coursesCompleted,
                  total: axis.coursesTotal,
                })}
              </small>
            </div>
            <div
              className="relative flex-1 min-w-[100px] h-9 rounded-lg overflow-hidden"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              {shown > 0 ? (
                <div
                  className="h-full flex items-center justify-end pr-2 text-xs font-semibold"
                  style={{
                    width: `${shown}%`,
                    background: roleColorVar,
                    color: 'var(--bg-primary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {fmt1(axis.pct)}%
                </div>
              ) : (
                <span
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium"
                  style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {fmt1(axis.pct)}%
                </span>
              )}
              <div
                className="absolute top-0 bottom-0 border-l border-dashed"
                style={{ left: `${PULSE_GOAL_PCT}%`, borderColor: 'var(--border-strong)' }}
              >
                <span
                  className="hidden sm:inline-block absolute top-1 left-1.5 text-xs whitespace-nowrap"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t('analytics.pulseDash.goalLabel', { goal: PULSE_GOAL_PCT })}
                </span>
              </div>
            </div>
            <div
              className="w-[56px] sm:w-[72px] text-right text-xs sm:text-sm font-semibold shrink-0"
              style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
            >
              {fmt1(axis.pct)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
