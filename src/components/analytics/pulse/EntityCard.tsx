/**
 * EntityCard — кликуемая карточка города/дилера/команды/РМ на уровне drill-down.
 * Показывает большой пульс, статус и топ-5 мини-полос по осям компетенций.
 */
import { useT } from '../../../stores/langStore';
import type { Lang } from '../../../stores/langStore';
import {
  fmt1, pulseStatusColorVar, pulseStatusKey, type DisplayAxis,
} from './helpers';

interface EntityCardProps {
  title: string;
  subtitle: string;
  pulse: number;
  axes: DisplayAxis[];
  lang: Lang;
  onSelect: () => void;
}

export function EntityCard({ title, subtitle, pulse, axes, lang, onSelect }: EntityCardProps) {
  const t = useT();
  const statusKey = pulseStatusKey(pulse);
  const statusColor = pulseStatusColorVar(statusKey);
  const miniAxes = axes.slice(0, 5);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="text-left rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[44px]"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {title}
          </div>
          <div className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className="text-xl font-bold leading-none"
            style={{ color: statusColor, fontVariantNumeric: 'tabular-nums' }}
          >
            {fmt1(pulse)}
          </div>
          <div className="text-xs font-semibold mt-1" style={{ color: statusColor }}>
            {t(`analytics.pulseDash.statusLabel.${statusKey}`)}
          </div>
        </div>
      </div>

      {miniAxes.length > 0 ? (
        <div className="flex flex-col gap-2 mt-auto">
          {miniAxes.map((axis) => {
            const axisStatus = pulseStatusColorVar(pulseStatusKey(axis.pct));
            const label = lang === 'uz' && axis.nameUz ? axis.nameUz : axis.name;
            return (
              <div key={axis.key} className="flex items-center gap-2">
                <span
                  className="flex-1 text-xs truncate"
                  style={{ color: 'var(--text-secondary)' }}
                  title={label}
                >
                  {label}
                </span>
                <span className="w-[72px] h-1.5 rounded-sm overflow-hidden shrink-0" style={{ background: 'var(--bg-elevated)' }}>
                  <span
                    className="block h-full rounded-sm"
                    style={{ width: `${Math.max(axis.pct, 1.5)}%`, background: axisStatus }}
                  />
                </span>
                <span
                  className="w-8 text-right text-xs shrink-0"
                  style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {fmt1(axis.pct)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs mt-auto" style={{ color: 'var(--text-muted)' }}>
          {t('analytics.pulseDash.axesEmpty')}
        </p>
      )}

      <div
        className="mt-4 pt-3 text-xs text-center"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        {t('analytics.pulseDash.cardHint')}
      </div>
    </button>
  );
}
