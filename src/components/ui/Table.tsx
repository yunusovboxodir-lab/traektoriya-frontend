/**
 * Table — табличные данные с автоматическим card-fallback на mobile.
 *
 * Архитектура composition (как у shadcn):
 *   <Table>
 *     <TableHeader>
 *       <TableRow>
 *         <TableHead>Имя</TableHead>
 *         <TableHead>Роль</TableHead>
 *       </TableRow>
 *     </TableHeader>
 *     <TableBody>
 *       <TableRow>
 *         <TableCell>Akmal</TableCell>
 *         <TableCell>РМ</TableCell>
 *       </TableRow>
 *     </TableBody>
 *   </Table>
 *
 * Mobile (<768px): автоматический card-view через CSS — каждая <tr> становится
 * вертикальной карточкой с label:value парами. Заголовки превращаются в
 * data-label атрибуты через @media-query (см. Table.css ниже).
 *
 * См. _docs/codex/02_components.md#table.
 */
import { forwardRef } from 'react';
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** Минимальная ширина для горизонтального скролла на широких таблицах. По умолчанию auto */
  minWidth?: string;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, minWidth, style, ...rest }, ref) => (
    <div className="w-full overflow-auto rounded-lg border border-border-default">
      <table
        ref={ref}
        className={cn(
          'w-full caption-bottom text-sm text-fg-default',
          'border-collapse',
          className,
        )}
        style={{ minWidth, ...style }}
        {...rest}
      />
    </div>
  ),
);
Table.displayName = 'Table';

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...rest }, ref) => (
  <thead
    ref={ref}
    className={cn('bg-bg-muted [&_tr]:border-b [&_tr]:border-border-default', className)}
    {...rest}
  />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...rest }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...rest}
  />
));
TableBody.displayName = 'TableBody';

export const TableFooter = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...rest }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'bg-bg-muted/50 border-t border-border-default font-medium',
      '[&>tr]:last:border-b-0',
      className,
    )}
    {...rest}
  />
));
TableFooter.displayName = 'TableFooter';

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Делает строку кликабельной (hover-эффект + cursor-pointer) */
  interactive?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, interactive, ...rest }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border-default transition-colors duration-fast',
        interactive && 'hover:bg-bg-muted/50 cursor-pointer',
        'data-[state=selected]:bg-bg-muted',
        className,
      )}
      {...rest}
    />
  ),
);
TableRow.displayName = 'TableRow';

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Приоритет колонки на mobile (high → видна всегда, low → скрывается первой) */
  priority?: 'high' | 'medium' | 'low';
}

const PRIORITY_CLASSES: Record<NonNullable<TableHeadProps['priority']>, string> = {
  high: '',
  medium: 'max-md:hidden lg:table-cell',
  low: 'max-lg:hidden',
};

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, priority = 'high', ...rest }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-semibold',
        'text-xs uppercase tracking-wider text-fg-muted',
        'whitespace-nowrap',
        priority !== 'high' && PRIORITY_CLASSES[priority],
        className,
      )}
      {...rest}
    />
  ),
);
TableHead.displayName = 'TableHead';

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  priority?: 'high' | 'medium' | 'low';
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, priority = 'high', ...rest }, ref) => (
    <td
      ref={ref}
      className={cn(
        'px-4 py-3 align-middle text-sm',
        priority !== 'high' && PRIORITY_CLASSES[priority],
        className,
      )}
      {...rest}
    />
  ),
);
TableCell.displayName = 'TableCell';

export function TableCaption({
  className,
  ...rest
}: HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      className={cn('mt-4 text-sm text-fg-muted text-center', className)}
      {...rest}
    />
  );
}
