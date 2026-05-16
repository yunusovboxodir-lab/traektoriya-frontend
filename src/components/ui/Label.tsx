/**
 * Label — текстовый лейбл для form-полей.
 *
 * Используется внутри <FormField> вместе с <Input>, <Select>, <Textarea>.
 *
 * См. _docs/codex/02_components.md#input--label--formfield.
 */
import { forwardRef } from 'react';
import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Показать звёздочку обязательности */
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required = false, className, children, ...rest }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-medium text-fg-default select-none', className)}
      {...rest}
    >
      {children}
      {required && (
        <span
          className="ml-0.5 text-status-danger-fg"
          aria-label="обязательное поле"
        >
          *
        </span>
      )}
    </label>
  ),
);
Label.displayName = 'Label';
