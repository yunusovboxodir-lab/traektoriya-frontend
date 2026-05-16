/**
 * DropdownMenu — выпадающее меню действий.
 *
 * Построен на @radix-ui/react-dropdown-menu → arrow-keys, Esc, focus-trap.
 *
 * Composition:
 *   <DropdownMenu>
 *     <DropdownMenuTrigger asChild>
 *       <Button>Действия</Button>
 *     </DropdownMenuTrigger>
 *     <DropdownMenuContent>
 *       <DropdownMenuItem onSelect={...}>Редактировать</DropdownMenuItem>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuItem destructive onSelect={...}>Удалить</DropdownMenuItem>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 *
 * См. _docs/codex/02_components.md#dropdownmenu.
 */
import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;
export const DropdownMenuPortal = DropdownPrimitive.Portal;
export const DropdownMenuSub = DropdownPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownPrimitive.RadioGroup;

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = 4, ...rest }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[12rem] overflow-hidden rounded-md',
        'border border-border-default bg-bg-surface-raised text-fg-default',
        'shadow-3 p-1',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
        className,
      )}
      {...rest}
    />
  </DropdownPrimitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

interface DropdownMenuItemProps
  extends ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> {
  /** destructive — красный текст для опасных действий (Удалить, Архивировать) */
  destructive?: boolean;
  /** inset — для visual alignment с items, имеющими иконку слева */
  inset?: boolean;
}

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownPrimitive.Item>,
  DropdownMenuItemProps
>(({ className, destructive, inset, ...rest }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2',
      'rounded-sm px-2 py-1.5 text-sm outline-none',
      'transition-colors duration-fast',
      destructive
        ? 'text-status-danger-fg focus:bg-status-danger-bg'
        : 'text-fg-default focus:bg-bg-muted',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className,
    )}
    {...rest}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof DropdownPrimitive.Label>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>
>(({ className, ...rest }, ref) => (
  <DropdownPrimitive.Label
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-xs font-semibold uppercase tracking-wider',
      'text-fg-subtle',
      className,
    )}
    {...rest}
  />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(({ className, ...rest }, ref) => (
  <DropdownPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border-default', className)}
    {...rest}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export const DropdownMenuCheckboxItem = forwardRef<
  ElementRef<typeof DropdownPrimitive.CheckboxItem>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.CheckboxItem>
>(({ className, children, checked, ...rest }, ref) => (
  <DropdownPrimitive.CheckboxItem
    ref={ref}
    checked={checked}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2',
      'rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
      'transition-colors duration-fast text-fg-default focus:bg-bg-muted',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...rest}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

export const DropdownMenuRadioItem = forwardRef<
  ElementRef<typeof DropdownPrimitive.RadioItem>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.RadioItem>
>(({ className, children, ...rest }, ref) => (
  <DropdownPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center',
      'rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
      'transition-colors duration-fast text-fg-default focus:bg-bg-muted',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...rest}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

// Shortcut hint — для отображения keyboard shortcut в конце item
export function DropdownMenuShortcut({
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'ml-auto text-xs tracking-widest text-fg-subtle font-mono',
        className,
      )}
      {...rest}
    />
  );
}

// Re-export for sub-menus
export const DropdownMenuSubTrigger = forwardRef<
  ElementRef<typeof DropdownPrimitive.SubTrigger>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.SubTrigger>
>(({ className, children, ...rest }, ref) => (
  <DropdownPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
      'outline-none focus:bg-bg-muted data-[state=open]:bg-bg-muted',
      className,
    )}
    {...rest}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

export const DropdownMenuSubContent = forwardRef<
  ElementRef<typeof DropdownPrimitive.SubContent>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.SubContent>
>(({ className, ...rest }, ref) => (
  <DropdownPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-50 min-w-[8rem] overflow-hidden rounded-md',
      'border border-border-default bg-bg-surface-raised text-fg-default',
      'shadow-3 p-1',
      className,
    )}
    {...rest}
  />
));
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';
