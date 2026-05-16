/**
 * Badge / Chip — короткая метка статуса или роли.
 *
 * Variants: neutral | success | warning | danger | info | role.<role>
 * Sizes:    sm (20px) | md (24px)
 *
 * Для ролей: variant='role' + role='sales' | 'supervisor' | 'manager' | 'dir' | 'admin' | 'superadmin'.
 * Цвета берутся из --color-role-* (R4 решено 2026-05-16: золото = бренд, не роль).
 *
 * См. _docs/codex/02_components.md#badge--chip.
 */
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'role';

export type BadgeSize = 'sm' | 'md';

export type Role =
  | 'sales'
  | 'supervisor'
  | 'manager'
  | 'dir'
  | 'admin'
  | 'superadmin';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Только для variant='role' — определяет цвет */
  role?: Role;
  /** Опциональная иконка слева */
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<Exclude<BadgeVariant, 'role'>, string> = {
  neutral: 'bg-bg-muted text-fg-muted border-border-default',
  success: 'bg-status-success-bg text-status-success-fg border-status-success-fg/30',
  warning: 'bg-status-warning-bg text-status-warning-fg border-status-warning-fg/30',
  danger:  'bg-status-danger-bg text-status-danger-fg border-status-danger-fg/30',
  info:    'bg-status-info-bg text-status-info-fg border-status-info-fg/30',
};

// Цвета ролей (R4) — текст на полупрозрачном фоне из того же hue
const ROLE_CLASSES: Record<Role, string> = {
  sales:      'bg-role-sales/15 text-role-sales border-role-sales/30',
  supervisor: 'bg-role-supervisor/15 text-role-supervisor border-role-supervisor/30',
  manager:    'bg-role-manager/15 text-role-manager border-role-manager/30',
  dir:        'bg-role-dir/15 text-role-dir border-role-dir/30',
  admin:      'bg-role-admin/15 text-role-admin border-role-admin/30',
  superadmin: 'bg-role-superadmin/30 text-fg-default border-role-superadmin/40',
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'h-5 px-2 text-xs gap-1',     // 20px
  md: 'h-6 px-2.5 text-xs gap-1.5', // 24px
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'neutral', size = 'md', role, icon, className, children, ...rest }, ref) => {
    const variantClasses =
      variant === 'role' && role
        ? ROLE_CLASSES[role]
        : VARIANT_CLASSES[variant === 'role' ? 'neutral' : variant];

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border font-medium',
          'select-none whitespace-nowrap',
          variantClasses,
          SIZE_CLASSES[size],
          className,
        )}
        {...rest}
      >
        {icon}
        {children}
      </span>
    );
  },
);
Badge.displayName = 'Badge';
