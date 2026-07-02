/**
 * Checkbox — флажок одиночного выбора.
 *
 * Построен на @radix-ui/react-checkbox → Space/Enter, screen readers,
 * поддержка indeterminate (checked="indeterminate").
 *
 * С label рендерится кликабельная связка <label> + box с тап-зоной ≥44px
 * на mobile. Без label — только box (aria-label обязателен!).
 *
 *   <Checkbox checked={agree} onCheckedChange={setAgree} label={t('form.agree')} />
 *
 * См. _docs/codex/02a_components_forms.md.
 */
import { forwardRef, useId } from 'react';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps
  extends ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  /** Текст рядом с боксом — кликабельный, даёт тап-зону ≥44px */
  label?: string;
  /** Состояние ошибки — красная рамка, для FormField */
  error?: boolean;
}

export const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ label, error = false, className, id, ...rest }, ref) => {
  const generatedId = useId();
  const boxId = id ?? generatedId;

  const box = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={boxId}
      className={cn(
        'peer h-5 w-5 shrink-0 rounded-sm border bg-bg-surface',
        'transition-colors duration-base',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas',
        error
          ? 'border-status-danger-fg focus-visible:ring-status-danger-fg'
          : 'border-border-default focus-visible:ring-border-focus',
        'data-[state=checked]:bg-bg-accent data-[state=checked]:border-bg-accent data-[state=checked]:text-fg-on-accent',
        'data-[state=indeterminate]:bg-bg-accent data-[state=indeterminate]:border-bg-accent data-[state=indeterminate]:text-fg-on-accent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        !label && className,
      )}
      {...rest}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {rest.checked === 'indeterminate' ? (
          <Minus size={14} strokeWidth={3} aria-hidden="true" />
        ) : (
          <Check size={14} strokeWidth={3} aria-hidden="true" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label) return box;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        // тап-зона ≥44px на mobile, компактнее на desktop
        'min-h-11 sm:min-h-9',
        className,
      )}
    >
      {box}
      <label
        htmlFor={boxId}
        className="cursor-pointer select-none text-sm text-fg-default peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      >
        {label}
      </label>
    </div>
  );
});
Checkbox.displayName = 'Checkbox';
