/**
 * AIBadge — обязательный маркер AI-сгенерированного / AI-assisted контента.
 *
 * Используется в админских интерфейсах (AI Studio, генерация уроков, ShelfScan):
 * - generated: контент целиком от AI, до human review
 * - assisted: AI-сгенерированный + отредактированный человеком
 *
 * В public UI (для рядовых ТП/СВ) badge **убирается** после approve —
 * мы не создаём negative bias.
 *
 * См. _docs/codex/03_patterns_ai.md §1, §5 и TRJ-031.
 */
import { Sparkles, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AIBadgeVariant = 'generated' | 'assisted';
export type AIBadgeSize = 'sm' | 'md';

interface AIBadgeProps {
  variant?: AIBadgeVariant;
  size?: AIBadgeSize;
  className?: string;
}

const LABELS_RU: Record<AIBadgeVariant, string> = {
  generated: 'AI-generated',
  assisted: 'AI-assisted',
};

export function AIBadge({ variant = 'generated', size = 'md', className }: AIBadgeProps) {
  const Icon = variant === 'generated' ? Sparkles : UserCheck;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full',
        'bg-status-info-bg text-status-info-fg',
        'border border-status-info-fg/30',
        'font-medium',
        sizeClasses,
        className,
      )}
      role="status"
      aria-label={LABELS_RU[variant]}
    >
      <Icon size={iconSize} aria-hidden="true" />
      <span>{LABELS_RU[variant]}</span>
    </span>
  );
}
