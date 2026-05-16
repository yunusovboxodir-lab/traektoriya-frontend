/**
 * Tabs — табы платформы.
 *
 * Построен на @radix-ui/react-tabs → arrow-keys, role="tablist"/"tab"/"tabpanel".
 *
 * Composition:
 *   <Tabs value={tab} onValueChange={setTab}>
 *     <TabsList>
 *       <TabsTrigger value="calendar">Календарь</TabsTrigger>
 *       <TabsTrigger value="requests">Заявки</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="calendar">...</TabsContent>
 *     <TabsContent value="requests">...</TabsContent>
 *   </Tabs>
 *
 * См. _docs/codex/02_components.md#tabs.
 */
import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...rest }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1 border-b border-border-default',
      className,
    )}
    {...rest}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...rest }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap',
      'px-4 py-2.5 -mb-px text-sm font-medium',
      'border-b-2 border-transparent text-fg-muted',
      'hover:text-fg-default transition-colors duration-base',
      'focus-visible:outline-none focus-visible:text-fg-default',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'data-[state=active]:border-border-accent data-[state=active]:text-fg-default',
      className,
    )}
    {...rest}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...rest }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'pt-6',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
      className,
    )}
    {...rest}
  />
));
TabsContent.displayName = 'TabsContent';
