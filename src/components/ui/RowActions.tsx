/**
 * RowActions — стандартное меню действий для строки таблицы / карточки списка.
 *
 * Закрывает паттерн «row-level affordance» — раньше каждая страница рисовала
 * свой кебаб с разным набором стилей, иконок, иногда вовсе без подсказок.
 * Теперь — единый Trigger (MoreHorizontal, aria-label обязателен) и список
 * items с явной семантикой (destructive, separator, icon).
 *
 * Использование:
 *   <RowActions
 *     label="Действия с пользователем"
 *     items={[
 *       { label: 'Редактировать', icon: <Pencil size={14}/>, onSelect: () => ... },
 *       { label: 'Деактивировать', icon: <UserX size={14}/>, onSelect: () => ... },
 *       { separator: true },
 *       { label: 'Удалить', icon: <Trash2 size={14}/>, destructive: true, onSelect: () => ... },
 *     ]}
 *   />
 *
 * См. _docs/codex/02_components.md#rowactions.
 */
import type { ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from './Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu';
import { cn } from '@/lib/utils';

export interface RowActionItem {
  /** Текст пункта */
  label?: string;
  /** Иконка слева (lucide компонент, рекомендуемый размер 14) */
  icon?: ReactNode;
  /** Деструктивное действие — красный текст */
  destructive?: boolean;
  /** Отключённый пункт */
  disabled?: boolean;
  /** Обработчик клика */
  onSelect?: () => void;
  /** Разделитель — если true, label/icon игнорируются */
  separator?: boolean;
}

interface RowActionsProps {
  /** Список пунктов меню */
  items: RowActionItem[];
  /** aria-label для триггера (обязателен — иконочная кнопка) */
  label: string;
  /** Размер триггера */
  size?: 'sm' | 'md';
  /** Дополнительный класс на trigger */
  className?: string;
  /** Сторона выпадения (по умолчанию end → меню от правого края строки) */
  align?: 'start' | 'center' | 'end';
}

export function RowActions({
  items,
  label,
  size = 'sm',
  className,
  align = 'end',
}: RowActionsProps) {
  if (items.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          iconOnly
          aria-label={label}
          className={cn('shrink-0', className)}
        >
          <MoreHorizontal size={size === 'sm' ? 14 : 16} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {items.map((item, idx) => {
          if (item.separator) {
            return <DropdownMenuSeparator key={`sep-${idx}`} />;
          }
          return (
            <DropdownMenuItem
              key={`item-${idx}-${item.label}`}
              destructive={item.destructive}
              disabled={item.disabled}
              onSelect={() => item.onSelect?.()}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
