/**
 * Skeleton — заместитель контента на время загрузки.
 *
 * Правила (см. _docs/codex/12_performance.md §Скелетоны и 02_components.md):
 *   - Skeleton для контента, который грузится >300ms.
 *   - Spinner только для коротких inline-операций (Button loading state).
 *   - Не показывать <300ms — мигание раздражает.
 *
 * Variants:
 *   - SkeletonLine   (одна полоса текста — кастомизируемая ширина)
 *   - SkeletonAvatar (круг для аватара)
 *   - SkeletonCard   (карточка с header + body)
 *   - SkeletonTableRow (строка таблицы с N ячейками)
 *
 * Уважает prefers-reduced-motion (анимация отключается).
 */
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/**
 * Базовый строительный блок — серая прямоугольная полоса с pulse-анимацией.
 * Размер задаётся через width/height классов Tailwind или style prop.
 */
export function Skeleton({ className, ...rest }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-bg-muted rounded-md',
        'motion-safe:animate-pulse',
        className,
      )}
      aria-hidden="true"
      {...rest}
    />
  );
}

interface SkeletonLineProps {
  /** Tailwind ширина: '1/2', '3/4', 'full' и т.п. По умолчанию full */
  width?: 'full' | '1/2' | '1/3' | '2/3' | '3/4' | '1/4';
  /** Высота 'sm' (12px) | 'md' (16px) | 'lg' (20px) | 'xl' (24px) */
  height?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const HEIGHT_MAP = {
  sm: 'h-3',
  md: 'h-4',
  lg: 'h-5',
  xl: 'h-6',
};

const WIDTH_MAP = {
  full: 'w-full',
  '1/2': 'w-1/2',
  '1/3': 'w-1/3',
  '2/3': 'w-2/3',
  '3/4': 'w-3/4',
  '1/4': 'w-1/4',
};

export function SkeletonLine({ width = 'full', height = 'md', className }: SkeletonLineProps) {
  return <Skeleton className={cn(WIDTH_MAP[width], HEIGHT_MAP[height], className)} />;
}

interface SkeletonAvatarProps {
  /** Tailwind размер: 'sm' (32px) | 'md' (40px) | 'lg' (48px) | 'xl' (64px) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AVATAR_SIZE = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export function SkeletonAvatar({ size = 'md', className }: SkeletonAvatarProps) {
  return <Skeleton className={cn('rounded-full', AVATAR_SIZE[size], className)} />;
}

interface SkeletonCardProps {
  /** Сколько строк текста показать в body. По умолчанию 3 */
  lines?: number;
  /** Включить аватар + 2 строки в header */
  withAvatar?: boolean;
  className?: string;
}

export function SkeletonCard({ lines = 3, withAvatar = false, className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border-default bg-bg-surface p-6',
        'flex flex-col gap-4',
        className,
      )}
      aria-busy="true"
    >
      {withAvatar ? (
        <div className="flex items-center gap-3">
          <SkeletonAvatar size="md" />
          <div className="flex flex-col gap-2 flex-1">
            <SkeletonLine width="1/2" height="md" />
            <SkeletonLine width="1/3" height="sm" />
          </div>
        </div>
      ) : (
        <SkeletonLine width="1/2" height="lg" />
      )}
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine
            key={i}
            width={i === lines - 1 ? '2/3' : 'full'}
            height="md"
          />
        ))}
      </div>
    </div>
  );
}

interface SkeletonTableRowProps {
  /** Количество ячеек в строке. По умолчанию 4 */
  cells?: number;
  className?: string;
}

export function SkeletonTableRow({ cells = 4, className }: SkeletonTableRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3 border-b border-border-default',
        className,
      )}
      aria-busy="true"
    >
      {Array.from({ length: cells }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === 0 ? '1/4' : i === cells - 1 ? '1/4' : 'full'}
          height="md"
          className="flex-1"
        />
      ))}
    </div>
  );
}
