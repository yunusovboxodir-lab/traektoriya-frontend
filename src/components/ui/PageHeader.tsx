/**
 * PageHeader — единственный носитель <h1> на странице.
 *
 * После удаления глобального CSS-форса на тег h1 (Sprint 0 QW-1) — каждая
 * страница ОБЯЗАНА использовать <PageHeader> для главного заголовка, чтобы
 * иметь консистентный размер 36-48px и правильную семантику.
 *
 * Composition:
 *   breadcrumbs (опц.) + title (обязателен) + subtitle (опц.) + actions (опц.)
 *
 * Sticky на скролле — через prop sticky (опционально).
 *
 * См. _docs/codex/02_components.md#pageheader и _docs/codex/01_foundations.md §7.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  /** Главный заголовок страницы (h1). Только один на странице. */
  title: string;
  /** Подзаголовок под title */
  subtitle?: string;
  /** Breadcrumbs slot — обычно <nav> с <a> элементами */
  breadcrumbs?: ReactNode;
  /** Actions slot (правый верх) — максимум 3 кнопки */
  actions?: ReactNode;
  /** Прилипает к верху при скролле */
  sticky?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  sticky = false,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 pb-6 mb-6 border-b border-border-default',
        sticky && 'sticky top-0 z-20 bg-bg-canvas/95 backdrop-blur-sm',
        className,
      )}
    >
      {breadcrumbs && (
        <nav aria-label="Breadcrumbs" className="text-sm text-fg-muted">
          {breadcrumbs}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          {/*
            font-display только если используется (Manrope/Unbounded ещё в проде).
            font-semibold + tracking-tight чтобы заголовок был выразительным,
            но не «forced 48px» как было до Sprint 0 QW-1.
          */}
          <h1
            className={cn(
              'text-3xl sm:text-4xl font-semibold tracking-tight',
              'text-fg-default leading-tight',
              'font-display',
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-fg-muted leading-relaxed">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>
        )}
      </div>
    </header>
  );
}
