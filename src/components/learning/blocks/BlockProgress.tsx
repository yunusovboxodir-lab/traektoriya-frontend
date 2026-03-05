interface BlockProgressProps {
  title: string;
  subtitle?: string;
  current: number;
  total: number;
  accent: string;
}

export function BlockProgressBar({ title, subtitle, current, total, accent }: BlockProgressProps) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div
      className="sticky top-0 z-50 px-5 pt-3.5 pb-3"
      style={{ background: `linear-gradient(135deg, ${accent}, #a855f7)` }}
    >
      <div className="text-white text-sm font-semibold">{title}</div>
      {subtitle && <div className="text-white/70 text-[10px] mt-0.5">{subtitle}</div>}
      <div className="mt-2.5 h-1 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface BlockBottomBarProps {
  current: number;
  total: number;
  canAdvance: boolean;
  isLast: boolean;
  onNext: () => void;
  accent: string;
}

export function BlockBottomBar({ current, total, canAdvance, isLast, onNext, accent }: BlockBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="max-w-[420px] mx-auto flex items-center gap-3 px-4 py-2.5">
        <span className="text-xs text-gray-400 whitespace-nowrap tabular-nums">
          {current + 1} / {total}
        </span>
        <button
          onClick={onNext}
          disabled={!canAdvance}
          className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40"
          style={{
            background: canAdvance
              ? `linear-gradient(135deg, ${accent}, #a855f7)`
              : '#d1d5db',
          }}
        >
          {isLast ? 'Завершить ✓' : 'Далее \u2192'}
        </button>
      </div>
    </div>
  );
}
