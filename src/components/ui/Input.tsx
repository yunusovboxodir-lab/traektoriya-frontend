/**
 * Input — базовый текстовый input.
 *
 * Sizes:    sm (32px) | md (40px) | lg (48px)
 * States:   default | focus | error | disabled | readonly
 *
 * font-size 16px (text-base) — критично, иначе iOS зумит при фокусе на mobile.
 *
 * Использовать в связке с <Label> и <FormField> для семантики и a11y.
 *
 * См. _docs/codex/02_components.md#input--label--formfield.
 */
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: InputSize;
  /** Состояние ошибки — красная рамка, для FormField */
  error?: boolean;
}

const SIZE_CLASSES: Record<InputSize, string> = {
  sm: 'h-8 px-2.5 text-sm',
  md: 'h-10 px-3 text-base',  // text-base = 16px → iOS не зумит
  lg: 'h-12 px-3.5 text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ inputSize = 'md', error = false, className, type = 'text', ...rest }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'block w-full rounded-md border bg-bg-surface text-fg-default',
        'placeholder:text-fg-subtle',
        'transition-colors duration-base',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-canvas',
        error
          ? 'border-status-danger-fg focus:ring-status-danger-fg focus:border-status-danger-fg'
          : 'border-border-default focus:ring-border-focus focus:border-border-focus',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-muted',
        'read-only:bg-bg-muted/50',
        SIZE_CLASSES[inputSize],
        className,
      )}
      {...rest}
    />
  ),
);
Input.displayName = 'Input';
