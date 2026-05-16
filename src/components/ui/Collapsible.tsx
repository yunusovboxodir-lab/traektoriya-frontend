/**
 * Collapsible — раскрывающаяся секция.
 *
 * Закрывает паттерн «слишком много фильтров/деталей над контентом»
 * из TRJ-043 progressive disclosure. Использовать для вторичных фильтров,
 * расширенных опций, дополнительных секций — всего что не относится к
 * первичному 5-second-test пути.
 *
 * Состояние — controlled (через `open` + `onOpenChange`) или uncontrolled
 * (через `defaultOpen`). Trigger всегда `<button>` с aria-expanded.
 *
 * Использование:
 *   <Collapsible defaultOpen={false} label="Дополнительные фильтры">
 *     <FilterSelect ... />
 *     <FilterSelect ... />
 *   </Collapsible>
 *
 * Кастомный trigger — через `trigger` prop:
 *   <Collapsible trigger={({open}) => <CustomBtn open={open}/>}>...</Collapsible>
 *
 * См. _docs/codex/02_components.md#collapsible.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleProps {
  /** Текст триггера (используется если не задан кастомный trigger) */
  label?: string;
  /** Кастомный рендер триггера */
  trigger?: (state: { open: boolean }) => ReactNode;
  /** Стартовое состояние (для uncontrolled) */
  defaultOpen?: boolean;
  /** Controlled state */
  open?: boolean;
  /** Controlled callback */
  onOpenChange?: (open: boolean) => void;
  /** Содержимое */
  children: ReactNode;
  className?: string;
}

export function Collapsible({
  label,
  trigger,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
  className,
}: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const toggle = () => {
    const next = !isOpen;
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {trigger ? (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          className="text-left"
        >
          {trigger({ open: isOpen })}
        </button>
      ) : (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          className={cn(
            'flex items-center gap-2 text-sm font-medium text-fg-default',
            'hover:text-bg-accent transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
            'rounded px-1 py-0.5 -mx-1',
            'self-start',
          )}
        >
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={cn(
              'transition-transform duration-base ease-standard',
              isOpen && 'rotate-180',
            )}
          />
          <span>{label}</span>
        </button>
      )}
      {isOpen && (
        <div className="animate-in fade-in-0 slide-in-from-top-1 duration-base">
          {children}
        </div>
      )}
    </div>
  );
}
