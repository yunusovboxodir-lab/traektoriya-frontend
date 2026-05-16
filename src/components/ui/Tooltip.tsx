/**
 * Tooltip — подсказка при hover/focus.
 *
 * Построен на @radix-ui/react-tooltip → aria-describedby, collision-aware.
 *
 * ⚠️ ВАЖНО (anti-pattern из codex/02_components.md и 11_accessibility.md):
 * Tooltip НЕ должен быть единственным носителем критической информации.
 * Touch-устройства не имеют hover → информация будет недоступна.
 * Если информация критична — продублировать рядом видимым текстом.
 *
 * Composition:
 *   <TooltipProvider>  // обычно один на корень приложения
 *     <Tooltip>
 *       <TooltipTrigger asChild><Button>...</Button></TooltipTrigger>
 *       <TooltipContent>Подсказка</TooltipContent>
 *     </Tooltip>
 *   </TooltipProvider>
 *
 * См. _docs/codex/02_components.md#tooltip.
 */
import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...rest }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 max-w-[240px] overflow-hidden rounded-md',
        'border border-border-default bg-bg-surface-raised',
        'px-3 py-1.5 text-xs text-fg-default',
        'shadow-2',
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2',
        className,
      )}
      {...rest}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = 'TooltipContent';
