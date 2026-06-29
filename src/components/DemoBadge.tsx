/**
 * DemoBadge — маленькая метка «демо» для блоков с демонстрационными
 * (не реальными) данными. Аудит 2026-06-28: на главной/обучении ряд
 * показателей захардкожен (ранг, серия, время, рейтинг, лента друзей,
 * бонус квеста). Решение владельца: цифры оставить, но честно пометить.
 *
 * Использует легаси-CSS-вары (определены глобально в index.css) → работает
 * и в тактическом тёмном слое, и в обычных страницах, и в светлой теме.
 */
import type { CSSProperties } from 'react';
import { useLangStore } from '../stores/langStore';

interface DemoBadgeProps {
  className?: string;
  style?: CSSProperties;
}

export function DemoBadge({ className, style }: DemoBadgeProps) {
  const lang = useLangStore((s) => s.lang);
  return (
    <span
      className={className}
      title={lang === 'uz' ? "Namoyish uchun ma'lumotlar" : 'Демонстрационные данные'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        lineHeight: 1,
        padding: '2px 6px',
        borderRadius: 999,
        color: 'var(--text-muted)',
        border: '1px solid var(--border-strong, var(--border))',
        background: 'transparent',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {lang === 'uz' ? 'demo' : 'демо'}
    </span>
  );
}
