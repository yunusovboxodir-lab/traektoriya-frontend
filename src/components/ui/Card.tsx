/**
 * Card — базовая карточка платформы.
 *
 * Composition: <Card> { <CardHeader />, <CardBody />, <CardFooter /> }
 *
 * Density: comfortable (default) для рядовых ролей; compact для админ-таблиц.
 *
 * См. _docs/codex/02_components.md#card.
 */
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type CardDensity = 'comfortable' | 'compact';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  density?: CardDensity;
  /** Усиленная тень для модалок/выделенных карточек */
  raised?: boolean;
  /** Интерактивная карточка (hover-эффект) */
  interactive?: boolean;
}

const DENSITY_PADDING: Record<CardDensity, string> = {
  comfortable: 'p-6',
  compact: 'p-4',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ density = 'comfortable', raised = false, interactive = false, className, children, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-bg-surface text-fg-default',
        'border-border-default',
        raised ? 'shadow-3' : 'shadow-2',
        interactive && 'transition-colors duration-base hover:border-border-strong cursor-pointer',
        DENSITY_PADDING[density],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  ),
);
Card.displayName = 'Card';

type CardSlotProps = HTMLAttributes<HTMLDivElement>;

export const CardHeader = forwardRef<HTMLDivElement, CardSlotProps>(
  ({ className, children, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1.5 pb-4 mb-4 border-b border-border-default', className)}
      {...rest}
    >
      {children}
    </div>
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardBody = forwardRef<HTMLDivElement, CardSlotProps>(
  ({ className, children, ...rest }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-3', className)} {...rest}>
      {children}
    </div>
  ),
);
CardBody.displayName = 'CardBody';

export const CardFooter = forwardRef<HTMLDivElement, CardSlotProps>(
  ({ className, children, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-2 pt-4 mt-4 border-t border-border-default', className)}
      {...rest}
    >
      {children}
    </div>
  ),
);
CardFooter.displayName = 'CardFooter';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Уровень заголовка карточки — по умолчанию h3 (см. 11_accessibility — иерархия) */
  as?: 'h2' | 'h3' | 'h4';
}

export function CardTitle({ as: Tag = 'h3', className, children, ...rest }: CardTitleProps) {
  return (
    <Tag className={cn('text-lg font-semibold text-fg-default', className)} {...rest}>
      {children}
    </Tag>
  );
}

type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export function CardDescription({ className, children, ...rest }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-fg-muted', className)} {...rest}>
      {children}
    </p>
  );
}
