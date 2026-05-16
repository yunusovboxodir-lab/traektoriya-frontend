/**
 * Modal / Dialog — модальное окно платформы.
 *
 * Построен на @radix-ui/react-dialog → focus trap, ESC закрывает,
 * aria-labelledby обязателен, клавиатурная навигация — всё бесплатно.
 *
 * Composition:
 *   <Modal open={...} onOpenChange={...}>
 *     <ModalContent maxWidth="md">
 *       <ModalHeader>
 *         <ModalTitle>...</ModalTitle>
 *         <ModalDescription>...</ModalDescription>
 *       </ModalHeader>
 *       <ModalBody>...</ModalBody>
 *       <ModalFooter>
 *         <Button variant="ghost">Отмена</Button>
 *         <Button variant="primary">OK</Button>
 *       </ModalFooter>
 *     </ModalContent>
 *   </Modal>
 *
 * См. _docs/codex/02_components.md#modal--dialog.
 */
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl';

const MAX_WIDTH: Record<ModalMaxWidth, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[720px]',
  xl: 'max-w-[960px]',
};

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Modal({ open, onOpenChange, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  );
}

interface ModalContentProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: ModalMaxWidth;
  /** Показывать кнопку × в правом верхнем углу */
  showCloseButton?: boolean;
}

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ maxWidth = 'md', showCloseButton = true, className, children, ...rest }, ref) => (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-[4px]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        )}
      />
      <Dialog.Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-[calc(100vw-2rem)]',
          MAX_WIDTH[maxWidth],
          'rounded-lg border border-border-default bg-bg-surface-raised',
          'shadow-4 p-6',
          'flex flex-col gap-4 max-h-[calc(100dvh-2rem)] overflow-auto',
          'duration-base ease-standard',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
          'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          className,
        )}
        {...rest}
      >
        {children}
        {showCloseButton && (
          <Dialog.Close
            aria-label="Закрыть"
            className={cn(
              'absolute right-3 top-3 inline-flex items-center justify-center',
              'h-8 w-8 rounded-md text-fg-muted',
              'hover:bg-bg-muted hover:text-fg-default',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
              'transition-colors duration-base',
            )}
          >
            <X size={16} aria-hidden="true" />
          </Dialog.Close>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  ),
);
ModalContent.displayName = 'ModalContent';

interface ModalSlotProps extends HTMLAttributes<HTMLDivElement> {}

export function ModalHeader({ className, children, ...rest }: ModalSlotProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...rest}>
      {children}
    </div>
  );
}

export function ModalBody({ className, children, ...rest }: ModalSlotProps) {
  return (
    <div className={cn('flex flex-col gap-3 text-sm text-fg-default', className)} {...rest}>
      {children}
    </div>
  );
}

export function ModalFooter({ className, children, ...rest }: ModalSlotProps) {
  return (
    <div className={cn('flex items-center gap-2 justify-end mt-2', className)} {...rest}>
      {children}
    </div>
  );
}

// Radix Title/Description обязательны для aria-labelledby и aria-describedby
export const ModalTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...rest }, ref) => (
  <Dialog.Title
    ref={ref}
    className={cn('text-lg font-semibold text-fg-default', className)}
    {...rest}
  >
    {children}
  </Dialog.Title>
));
ModalTitle.displayName = 'ModalTitle';

export const ModalDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...rest }, ref) => (
  <Dialog.Description
    ref={ref}
    className={cn('text-sm text-fg-muted', className)}
    {...rest}
  >
    {children}
  </Dialog.Description>
));
ModalDescription.displayName = 'ModalDescription';

// Trigger — для случаев, когда модалка управляется не через open/onOpenChange,
// а через Dialog.Trigger (нативный pattern Radix)
export const ModalTrigger = Dialog.Trigger;
export const ModalClose = Dialog.Close;
