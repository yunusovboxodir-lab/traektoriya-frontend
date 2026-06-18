import type { ReactNode } from 'react';

/**
 * BlockCard — единая оболочка для всех блоков урока (источник истины).
 *
 * Все блоки рендерятся через неё → меняем здесь = меняется весь плеер уроков.
 * Цвета/тень/радиус — ТОЛЬКО из дизайн-токенов (tokens.css), не хардкод.
 * accent/accentSoft — роль-акцент (напр. ТП-фиолетовый) для бейджа-лейбла.
 *
 * Стандарт блока урока: _docs/codex/03_patterns_learning.md
 */
interface BlockCardProps {
  /** Роль-акцент (цвет текста бейджа) */
  accent?: string;
  /** Мягкий фон бейджа (роль-акцент, прозрачный) */
  accentSoft?: string;
  /** Текст/иконка бейджа-лейбла над карточкой (опционально) */
  label?: ReactNode;
  /** Доп. классы для контентной карточки */
  className?: string;
  children: ReactNode;
}

export function BlockCard({ accent, accentSoft, label, className = '', children }: BlockCardProps) {
  return (
    <div className="animate-slideUp">
      {label && (
        <div
          className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl mx-4 mt-3.5 mb-1.5"
          style={{ color: accent, background: accentSoft }}
        >
          {label}
        </div>
      )}
      <div
        className={`bg-bg-surface mx-3 rounded-2xl p-5 shadow-2 border border-border-default text-fg-default ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
