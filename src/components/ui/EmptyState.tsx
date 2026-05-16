/**
 * EmptyState — состояние «пусто».
 *
 * Правило copy (см. _docs/codex/13_content_voice.md §2):
 *   Не «Нет данных», а «что произошло + что сделать».
 *   ✅ «Пока нет заявок. Подайте первую — кнопка справа сверху.»
 *   ❌ «Заявок нет.»
 *
 * См. _docs/codex/02_components.md#emptystate.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Иконка-иллюстрация (Lucide или svg). По умолчанию ничего. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Primary CTA — кнопка действия */
  cta?: ReactNode;
  /** Secondary CTA — обычно текстовая ссылка */
  secondaryAction?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  cta,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'min-h-[240px] px-6 py-8',
        'rounded-lg border border-dashed border-border-default',
        'bg-bg-muted/30',
        className,
      )}
      role="status"
    >
      {icon && (
        <div className="mb-4 text-fg-subtle" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-fg-default mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-fg-muted max-w-md mb-4">{description}</p>
      )}
      {cta && <div className="flex flex-col items-center gap-2">{cta}</div>}
      {secondaryAction && (
        <div className="mt-3 text-sm text-fg-muted">{secondaryAction}</div>
      )}
    </div>
  );
}
