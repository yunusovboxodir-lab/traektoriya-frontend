/**
 * Select — выпадающий список одиночного выбора.
 *
 * Построен на @radix-ui/react-select → клавиатура, typeahead, screen readers.
 * Sizes:  sm (32px) | md (40px) | lg (48px) — как у Input.
 * States: default | focus | error | disabled.
 *
 * Тап-зоны: пункты списка ≥44px на mobile (<640px), 36px на desktop.
 * Использовать внутри <FormField> — id/error/aria-* пробрасываются автоматически:
 *
 *   <FormField label={t('org.region')} required errorText={errors.region}>
 *     <Select value={regionId} onValueChange={setRegionId} options={regionOptions} />
 *   </FormField>
 *
 * ⚠️ Radix не допускает option со значением '' — для «пустого» выбора
 * используйте placeholder (value=undefined) или sentinel-значение.
 *
 * См. _docs/codex/02a_components_forms.md.
 */
import { forwardRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InputSize } from './Input';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  /** Текст-заглушка, пока значение не выбрано */
  placeholder?: string;
  size?: InputSize;
  disabled?: boolean;
  /** Состояние ошибки — красная рамка, для FormField */
  error?: boolean;
  name?: string;
  id?: string;
  required?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

const SIZE_CLASSES: Record<InputSize, string> = {
  sm: 'h-8 px-2.5 text-sm',
  md: 'h-10 px-3 text-base',  // text-base = 16px → iOS не зумит
  lg: 'h-12 px-3.5 text-base',
};

const ICON_SIZE: Record<InputSize, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder,
      size = 'md',
      disabled = false,
      error = false,
      name,
      id,
      required,
      className,
      ...aria
    },
    ref,
  ) => (
    <SelectPrimitive.Root
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
      required={required}
    >
      <SelectPrimitive.Trigger
        ref={ref}
        id={id}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md border',
          'bg-bg-surface text-fg-default text-left',
          'transition-colors duration-base',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas',
          error
            ? 'border-status-danger-fg focus-visible:ring-status-danger-fg'
            : 'border-border-default focus-visible:ring-border-focus',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-muted',
          'data-[placeholder]:text-fg-subtle',
          SIZE_CLASSES[size],
          className,
        )}
        {...aria}
      >
        <span className="truncate">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown
            size={ICON_SIZE[size]}
            className="shrink-0 text-fg-subtle"
            aria-hidden="true"
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            'z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md',
            'border border-border-default bg-bg-surface-raised text-fg-default',
            'shadow-3',
          )}
        >
          <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center text-fg-subtle">
            <ChevronUp size={14} aria-hidden="true" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={cn(
                  'relative flex cursor-pointer select-none items-center gap-2',
                  'rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                  // тап-зоны ≥44px на mobile, компактнее на desktop
                  'min-h-11 sm:min-h-9',
                  'transition-colors duration-fast text-fg-default',
                  'focus:bg-bg-muted data-[highlighted]:bg-bg-muted',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check size={16} aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center text-fg-subtle">
            <ChevronDown size={14} aria-hidden="true" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  ),
);
Select.displayName = 'Select';
