/**
 * ConfidenceIndicator — обязательный индикатор уверенности AI-ответа.
 *
 * 3 уровня:
 * - verified: ответ из эталонной базы (RAG hit с высоким score)
 * - likely: RAG нашёл частичное совпадение, AI достроил
 * - speculative: чисто generative, без источников → с disclaimer
 *
 * См. _docs/codex/03_patterns_ai.md §2 и TRJ-032.
 */
import { ShieldCheck, ShieldQuestion, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfidenceLevel = 'verified' | 'likely' | 'speculative';

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  className?: string;
  showDisclaimer?: boolean;
}

const CONFIG: Record<
  ConfidenceLevel,
  {
    label: string;
    disclaimer: string | null;
    Icon: typeof ShieldCheck;
    bgClass: string;
    fgClass: string;
    borderClass: string;
  }
> = {
  verified: {
    label: 'Verified',
    disclaimer: null,
    Icon: ShieldCheck,
    bgClass: 'bg-status-success-bg',
    fgClass: 'text-status-success-fg',
    borderClass: 'border-status-success-fg/30',
  },
  likely: {
    label: 'Likely',
    disclaimer: 'Ответ основан на похожих материалах. Проверьте источники.',
    Icon: ShieldQuestion,
    bgClass: 'bg-status-warning-bg',
    fgClass: 'text-status-warning-fg',
    borderClass: 'border-status-warning-fg/30',
  },
  speculative: {
    label: 'Speculative',
    disclaimer: 'AI сгенерировал ответ без проверенных источников. Не используйте без проверки.',
    Icon: AlertTriangle,
    bgClass: 'bg-status-danger-bg',
    fgClass: 'text-status-danger-fg',
    borderClass: 'border-status-danger-fg/30',
  },
};

export function ConfidenceIndicator({
  level,
  className,
  showDisclaimer = true,
}: ConfidenceIndicatorProps) {
  const cfg = CONFIG[level];
  const { Icon } = cfg;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
          'text-xs font-medium border w-fit',
          cfg.bgClass,
          cfg.fgClass,
          cfg.borderClass,
        )}
        role="status"
        aria-label={`AI confidence: ${cfg.label}`}
      >
        <Icon size={14} aria-hidden="true" />
        {cfg.label}
      </span>
      {showDisclaimer && cfg.disclaimer && (
        <p className={cn('text-xs italic', cfg.fgClass)}>{cfg.disclaimer}</p>
      )}
    </div>
  );
}
