/**
 * Switch — тумблер вкл/выкл (мгновенное применение, в отличие от Checkbox).
 *
 * Построен на @radix-ui/react-switch → Space/Enter, role="switch".
 * Sizes: sm (36×20) | md (44×24).
 *
 * С label рендерится кликабельная связка с тап-зоной ≥44px на mobile.
 * Без label — aria-label обязателен!
 *
 *   <Switch checked={active} onCheckedChange={toggle} aria-label="Активен" />
 *
 * См. _docs/codex/02a_components_forms.md.
 */
import { forwardRef, useId } from 'react';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export type SwitchSize = 'sm' | 'md';

interface SwitchProps
  extends ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  size?: SwitchSize;
  /** Текст рядом с тумблером — кликабельный, даёт тап-зону ≥44px */
  label?: string;
}

const TRACK_CLASSES: Record<SwitchSize, string> = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
};

const THUMB_CLASSES: Record<SwitchSize, string> = {
  sm: 'h-4 w-4 data-[state=checked]:translate-x-4',
  md: 'h-5 w-5 data-[state=checked]:translate-x-5',
};

export const Switch = forwardRef<
  ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ size = 'md', label, className, id, ...rest }, ref) => {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  const track = (
    <SwitchPrimitive.Root
      ref={ref}
      id={switchId}
      className={cn(
        'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent',
        'transition-colors duration-base',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas',
        'data-[state=unchecked]:bg-bg-muted data-[state=unchecked]:border-border-default',
        'data-[state=checked]:bg-bg-accent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        TRACK_CLASSES[size],
        !label && className,
      )}
      {...rest}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block rounded-full bg-bg-surface-raised shadow-1 ring-0',
          'transition-transform duration-base',
          'data-[state=unchecked]:translate-x-0.5',
          THUMB_CLASSES[size],
        )}
      />
    </SwitchPrimitive.Root>
  );

  if (!label) return track;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        // тап-зона ≥44px на mobile, компактнее на desktop
        'min-h-11 sm:min-h-9',
        className,
      )}
    >
      {track}
      <label
        htmlFor={switchId}
        className="cursor-pointer select-none text-sm text-fg-default peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      >
        {label}
      </label>
    </div>
  );
});
Switch.displayName = 'Switch';
