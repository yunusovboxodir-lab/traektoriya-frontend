/**
 * Tactical UI Shell — переиспользуемые компоненты для унификации страниц.
 *
 * Module 18 (UI Unification, Sprint 1).
 * Все компоненты в одном файле для компактности и единого импорта.
 *
 * Использование:
 *   import { TacticalShell, TacticalPanel, TacticalButton, TacticalStat,
 *            TacticalBadge, TacticalCard } from '@/components/tactical/shell';
 */
import type { CSSProperties, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { StatusBar } from '../StatusBar';

// ---------------------------------------------------------------------------
// TacticalShell — обёртка страницы (StatusBar + content)
// ---------------------------------------------------------------------------

export interface TacticalShellProps {
  children: ReactNode;
  /** Заголовок страницы (показывается в title-row под StatusBar) */
  title?: string;
  /** Подзаголовок (опц.) */
  subtitle?: string;
  /** Кнопки/контролы справа от заголовка */
  toolbar?: ReactNode;
  /** Метаданные справа от title (счётчики и т.п.) */
  meta?: ReactNode;
}

export function TacticalShell({ children, title, subtitle, toolbar, meta }: TacticalShellProps) {
  return (
    <div className="tactical-root">
      <StatusBar />
      {(title || toolbar) && (
        <div className="title-row">
          {title && (
            <div>
              <h1>{title}</h1>
              {subtitle && (
                <div style={{
                  fontSize: 13,
                  color: 'var(--text-2)',
                  marginTop: 2,
                  letterSpacing: '0.04em',
                }}>{subtitle}</div>
              )}
            </div>
          )}
          {toolbar && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {toolbar}
            </div>
          )}
          {meta && <div className="title-meta">{meta}</div>}
        </div>
      )}
      <div style={{ padding: '8px 32px 32px' }}>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TacticalPanel — glass-panel блок с заголовком
// ---------------------------------------------------------------------------

export interface TacticalPanelProps {
  children: ReactNode;
  /** Префикс (моноспейс, перед title): «UID-08842», «01», «B-2024» и т.п. */
  label?: string;
  /** Основной заголовок панели */
  title?: string;
  /** Маленький код справа (моноспейс) */
  code?: string;
  /** Стиль панели */
  variant?: 'default' | 'bordered' | 'highlighted';
  /** Padding override (px) */
  padding?: number;
  className?: string;
  style?: CSSProperties;
}

export function TacticalPanel({
  children, label, title, code,
  variant = 'default', padding, className = '', style,
}: TacticalPanelProps) {
  const variantStyle: CSSProperties = variant === 'highlighted'
    ? { boxShadow: '0 0 0 2px var(--brass)' }
    : variant === 'bordered'
      ? { borderWidth: 2, borderColor: 'var(--line-strong)' }
      : {};

  return (
    <div
      className={`glass-panel ${className}`}
      style={{ padding: padding ?? undefined, ...variantStyle, ...style }}
    >
      {(label || title || code) && (
        <div className="panel-header">
          {label && <span className="panel-label">{label}</span>}
          {code && <span className="panel-code">{code}</span>}
        </div>
      )}
      {title && (
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--text-0)',
          marginBottom: 12,
          fontFamily: "'Cinzel', serif",
          letterSpacing: '0.02em',
        }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TacticalButton — кнопка
// ---------------------------------------------------------------------------

export interface TacticalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function TacticalButton({
  variant = 'primary',
  size = 'md',
  children,
  style,
  ...props
}: TacticalButtonProps) {
  const sizeStyle: CSSProperties = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '10px 22px', fontSize: 14 },
  }[size];

  const variantStyle: CSSProperties = {
    primary: {
      background: 'var(--brass)',
      color: 'var(--text-inverse)',
      border: '1px solid var(--brass-deep)',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--brass)',
      border: '1px solid var(--brass)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-1)',
      border: '1px solid var(--line)',
    },
    danger: {
      background: 'oklch(0.45 0.20 28)',
      color: 'white',
      border: '1px solid oklch(0.55 0.20 28)',
    },
  }[variant];

  return (
    <button
      {...props}
      style={{
        ...sizeStyle,
        ...variantStyle,
        borderRadius: 4,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// TacticalInput
// ---------------------------------------------------------------------------

export interface TacticalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function TacticalInput({ label, hint, error, style, ...props }: TacticalInputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{
          fontSize: 11,
          color: 'var(--text-2)',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>{label}</label>
      )}
      <input
        {...props}
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${error ? 'oklch(0.55 0.20 28)' : 'var(--line)'}`,
          borderRadius: 3,
          padding: '8px 12px',
          color: 'var(--text-0)',
          fontFamily: 'inherit',
          fontSize: 13,
          outline: 'none',
          ...style,
        }}
      />
      {(hint || error) && (
        <div style={{
          fontSize: 11,
          color: error ? 'oklch(0.65 0.18 28)' : 'var(--text-2)',
        }}>
          {error || hint}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TacticalSelect
// ---------------------------------------------------------------------------

export interface TacticalSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function TacticalSelect({ label, options, style, ...props }: TacticalSelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{
          fontSize: 11,
          color: 'var(--text-2)',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>{label}</label>
      )}
      <select
        {...props}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--line)',
          borderRadius: 3,
          padding: '8px 12px',
          color: 'var(--text-0)',
          fontFamily: 'inherit',
          fontSize: 13,
          outline: 'none',
          cursor: 'pointer',
          ...style,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TacticalStat — Карточка статистики
// ---------------------------------------------------------------------------

export interface TacticalStatProps {
  label: string;
  value: string | number;
  /** Subtext под value */
  hint?: string;
  /** Тренд: '+15%', '-3 п.п.' */
  trend?: { value: string; positive: boolean };
  highlight?: boolean;
  /** Цветовой акцент value/icon (DESIGN_INSTRUCTIONS §7) */
  accent?: 'rm' | 'success' | 'warning' | 'danger' | 'info' | 'tp' | 'sv';
  icon?: ReactNode;
  onClick?: () => void;
}

const ACCENT_COLOR: Record<NonNullable<TacticalStatProps['accent']>, string> = {
  rm:      'var(--color-rm)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger:  'var(--danger)',
  info:    'var(--info)',
  tp:      'var(--color-tp)',
  sv:      'var(--color-sv)',
};

export function TacticalStat({
  label, value, hint, trend, highlight, accent, icon, onClick,
}: TacticalStatProps) {
  const accentColor = accent ? ACCENT_COLOR[accent] : null;
  return (
    <div
      onClick={onClick}
      className="glass-panel"
      style={{
        padding: 16,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        ...(highlight ? { borderColor: 'var(--color-rm)', boxShadow: '0 0 12px rgba(200,168,75,0.2)' } : {}),
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{
          fontSize: 10,
          color: 'var(--text-2)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>{label}</span>
        {icon && <div style={{ color: accentColor ?? 'var(--color-rm)' }}>{icon}</div>}
      </div>
      <div style={{
        fontSize: 28,
        fontWeight: 700,
        color: accentColor ?? (highlight ? 'var(--color-rm)' : 'var(--text-0)'),
        fontFamily: 'var(--font-display)',
        lineHeight: 1.1,
      }}>
        {value}
      </div>
      {(hint || trend) && (
        <div style={{
          fontSize: 11,
          marginTop: 6,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}>
          {hint && <span style={{ color: 'var(--text-2)' }}>{hint}</span>}
          {trend && (
            <span style={{
              color: trend.positive ? 'var(--success)' : 'var(--danger)',
              fontWeight: 600,
            }}>
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TacticalBadge — статус-бейдж
// ---------------------------------------------------------------------------

export type BadgeVariant =
  | 'default' | 'info' | 'success' | 'warning' | 'danger' | 'brass';

const BADGE_COLORS: Record<BadgeVariant, { bg: string; fg: string; border: string }> = {
  default: { bg: 'var(--bg-elevated)',           fg: 'var(--text-1)', border: 'var(--line)' },
  info:    { bg: 'oklch(0.30 0.10 240 / 0.4)', fg: 'oklch(0.85 0.10 240)', border: 'oklch(0.45 0.10 240 / 0.5)' },
  success: { bg: 'oklch(0.28 0.10 145 / 0.4)', fg: 'oklch(0.85 0.13 145)', border: 'oklch(0.45 0.10 145 / 0.5)' },
  warning: { bg: 'oklch(0.30 0.12 80 / 0.4)',  fg: 'oklch(0.85 0.13 80)',  border: 'oklch(0.55 0.12 80 / 0.5)' },
  danger:  { bg: 'oklch(0.30 0.12 28 / 0.4)',  fg: 'oklch(0.80 0.15 28)',  border: 'oklch(0.50 0.15 28 / 0.5)' },
  brass:   { bg: 'oklch(0.30 0.10 80 / 0.5)',  fg: 'var(--brass)',         border: 'var(--brass-deep)' },
};

export interface TacticalBadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  size?: 'sm' | 'md';
}

export function TacticalBadge({ variant = 'default', children, size = 'sm' }: TacticalBadgeProps) {
  const c = BADGE_COLORS[variant];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'sm' ? '2px 8px' : '4px 10px',
      background: c.bg,
      color: c.fg,
      border: `1px solid ${c.border}`,
      borderRadius: 3,
      fontSize: size === 'sm' ? 10 : 11,
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      fontWeight: 600,
      lineHeight: 1.2,
    }}>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// TacticalCard — карточка (для списков)
// ---------------------------------------------------------------------------

export interface TacticalCardProps {
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function TacticalCard({ children, onClick, selected, className = '', style }: TacticalCardProps) {
  return (
    <div
      onClick={onClick}
      className={`glass-panel ${className}`}
      style={{
        padding: 16,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        ...(selected ? {
          borderColor: 'var(--brass)',
          boxShadow: '0 0 16px oklch(0.80 0.12 82 / 0.25)',
        } : {}),
        ...style,
      }}
      onMouseEnter={onClick ? (e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--brass-light)';
      } : undefined}
      onMouseLeave={onClick && !selected ? (e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '';
      } : undefined}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TacticalGrid — responsive grid (для карточек)
// ---------------------------------------------------------------------------

export interface TacticalGridProps {
  children: ReactNode;
  /** min ширина каждой ячейки (px) */
  minColWidth?: number;
  gap?: number;
}

export function TacticalGrid({ children, minColWidth = 280, gap = 14 }: TacticalGridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${minColWidth}px, 1fr))`,
      gap,
    }}>
      {children}
    </div>
  );
}
