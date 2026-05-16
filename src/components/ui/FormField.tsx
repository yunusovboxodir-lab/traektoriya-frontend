/**
 * FormField — обёртка вокруг связки <Label> + <Input>/<Select>/<Textarea> + helper/error text.
 *
 * **Единственный** способ собрать form-поле в платформе. Гарантирует:
 *   - <label htmlFor=...> + <input id=...> связь (a11y)
 *   - aria-describedby для helper/error
 *   - корректную семантику обязательности
 *
 * См. _docs/codex/02_components.md#input--label--formfield + 11_accessibility.md.
 */
import { useId, cloneElement, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Label } from './Label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  /** Лейбл поля */
  label: string;
  /** Обязательное поле (звёздочка + aria-required) */
  required?: boolean;
  /** Helper text под полем (серый) */
  helperText?: string;
  /** Error text под полем (красный, заменяет helper) */
  errorText?: string;
  /** Дочерний элемент — единственный input/select/textarea/Radix компонент */
  children: ReactNode;
  /** id поля — если не указан, генерируется автоматически через useId */
  htmlFor?: string;
  className?: string;
}

export function FormField({
  label,
  required = false,
  helperText,
  errorText,
  children,
  htmlFor,
  className,
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;
  const hasError = Boolean(errorText);

  // Проброс id + aria-describedby + aria-invalid + error в child input (если он принимает props)
  let enhancedChild: ReactNode = children;
  if (isValidElement(children)) {
    const childProps: Record<string, unknown> = {
      id: fieldId,
      'aria-required': required || undefined,
      'aria-invalid': hasError || undefined,
      'aria-describedby': hasError ? errorId : helperText ? helperId : undefined,
    };
    // Передаём error в Input если он его принимает
    if ((children as ReactElement<{ error?: boolean }>).props.error === undefined) {
      childProps.error = hasError;
    }
    enhancedChild = cloneElement(children as ReactElement<Record<string, unknown>>, childProps);
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      {enhancedChild}
      {hasError ? (
        <p id={errorId} className="text-xs text-status-danger-fg" role="alert">
          {errorText}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-fg-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
