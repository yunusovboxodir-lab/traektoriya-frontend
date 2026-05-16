import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn() — стандартный shadcn/ui helper для безопасного объединения Tailwind-классов.
 * Используется во всех компонентах из `src/components/ui/`.
 *
 * Пример:
 *   <button className={cn('bg-bg-surface text-fg-default', isActive && 'bg-bg-accent')} />
 *
 * См. _docs/codex/02_components.md и 14_ai_assistant_rules.md.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
