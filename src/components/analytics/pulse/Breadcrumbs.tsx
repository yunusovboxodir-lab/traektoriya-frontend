/**
 * Breadcrumbs — хлебные крошки drill-down: Компания › Город › Дилер › Команда › Сотрудник.
 * Клик на любом уровне возвращает на него (сбрасывает более глубокие уровни).
 */
import type { ReactNode } from 'react';

export interface Crumb {
  key: string;
  label: ReactNode;
  onSelect?: () => void;
}

export function Breadcrumbs({ items, accentColorVar }: { items: Crumb[]; accentColorVar: string }) {
  return (
    <nav
      className="flex items-center gap-1 flex-wrap text-sm py-3 border-b"
      style={{ borderColor: 'var(--border)' }}
      aria-label="breadcrumb"
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={item.key} className="flex items-center gap-1">
            {idx > 0 && (
              <span aria-hidden="true" className="px-0.5" style={{ color: 'var(--text-muted)' }}>
                {'›'}
              </span>
            )}
            {isLast || !item.onSelect ? (
              <span className="px-1 py-1" style={{ color: 'var(--text-secondary)' }}>
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={item.onSelect}
                className="px-2 py-1 rounded-md font-medium min-h-[32px]"
                style={{ color: accentColorVar }}
              >
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
