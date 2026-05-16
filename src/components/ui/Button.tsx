/**
 * Button — базовая кнопка платформы.
 *
 * Variants: primary | secondary | ghost | danger | link
 * Sizes:    sm (32px) | md (40px) | lg (48px)
 * States:   default | hover | active | focus | disabled | loading
 *
 * Touch target: md+ фактически ≥44×44 для полевых сценариев.
 * Иконка-only кнопка ОБЯЗАНА иметь aria-label.
 *
 * См. _docs/codex/02_components.md#button.
 */
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Иконка слева от текста (компонент из lucide-react) */
  leftIcon?: ReactNode;
  /** Иконка справа от текста */
  rightIcon?: ReactNode;
  /** Если кнопка иконочная (только иконка) — рендерится квадратной */
  iconOnly?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-bg-accent text-fg-on-accent border border-transparent ' +
    'hover:bg-bg-accent-hover ' +
    'focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas',
  secondary:
    'bg-transparent text-fg-default border border-border-default ' +
    'hover:bg-bg-surface hover:border-border-strong ' +
    'focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas',
  ghost:
    'bg-transparent text-fg-default border border-transparent ' +
    'hover:bg-bg-surface ' +
    'focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas',
  danger:
    'bg-status-danger-fg text-bg-canvas border border-transparent ' +
    'hover:opacity-90 ' +
    'focus-visible:ring-2 focus-visible:ring-status-danger-fg focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas',
  link:
    'bg-transparent text-bg-accent border-none underline-offset-4 ' +
    'hover:underline ' +
    'focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',   // 32px
  md: 'h-10 px-4 text-sm gap-2',    // 40px
  lg: 'h-12 px-5 text-base gap-2',  // 48px
};

const ICON_ONLY_SIZE: Record<ButtonSize, string> = {
  sm: 'w-8',  // 32×32
  md: 'w-10', // 40×40 (≥44 с учётом padding/click area)
  lg: 'w-12', // 48×48
};

const ICON_SIZE: Record<ButtonSize, number> = {
  sm: 14,
  md: 16,
  lg: 20,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      iconOnly = false,
      disabled,
      children,
      className,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          // Layout + base
          'inline-flex items-center justify-center rounded-md font-semibold',
          'transition-colors duration-base ease-standard',
          'focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
          'select-none',
          // Variant
          VARIANT_CLASSES[variant],
          // Size
          SIZE_CLASSES[size],
          iconOnly && ICON_ONLY_SIZE[size],
          iconOnly && 'px-0',
          className,
        )}
        {...rest}
      >
        {loading && (
          <Loader2
            size={ICON_SIZE[size]}
            className="animate-spin"
            aria-hidden="true"
          />
        )}
        {!loading && leftIcon}
        {!iconOnly && children}
        {!loading && rightIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';
