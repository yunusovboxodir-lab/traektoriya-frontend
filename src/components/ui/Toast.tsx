/**
 * Toast — system-уведомления (transient, исчезают через N секунд).
 *
 * Построен на Sonner (https://sonner.emilkowal.ski).
 *
 * Использование:
 *   1. Один раз в корне приложения (App.tsx или main.tsx):
 *      <ToastContainer />
 *
 *   2. Везде:
 *      import { toast } from '@/components/ui';
 *      toast.success('Сохранено');
 *      toast.error('Не удалось отправить отчёт. Попробуйте позже.');
 *      toast.warning('Слабый сигнал — изменения сохранены локально.');
 *      toast.info('Назначен новый курс.');
 *
 * Длительности (см. 02_components.md#toast):
 *   - info/success: 4s
 *   - warning: 7s
 *   - error: 10s
 *
 * a11y:
 *   - info/success → role="status" (aria-live="polite")
 *   - warning/error → role="alert" (aria-live="assertive")
 *   Sonner это делает сам.
 *
 * ⚠️ Toast НЕ должен быть единственным носителем критической информации
 * (см. anti-pattern в 02_components.md). Дублировать в Notification Center
 * или persistent в UI.
 */
import { Toaster, toast as sonnerToast } from 'sonner';

interface ToastContainerProps {
  /** Mobile: top-center, Desktop: top-right (см. 02_components.md#toast). По умолчанию top-right. */
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

export function ToastContainer({ position = 'top-right' }: ToastContainerProps = {}) {
  return (
    <Toaster
      position={position}
      visibleToasts={3} // max 3 visible, остальные в очереди
      richColors
      closeButton
      toastOptions={{
        // Длительности по умолчанию могут быть переопределены при вызове toast.x()
        duration: 4000,
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-bg-surface-raised group-[.toaster]:text-fg-default group-[.toaster]:border-border-default group-[.toaster]:shadow-3',
          description: 'group-[.toast]:text-fg-muted',
          actionButton:
            'group-[.toast]:bg-bg-accent group-[.toast]:text-fg-on-accent',
          cancelButton:
            'group-[.toast]:bg-bg-muted group-[.toast]:text-fg-muted',
        },
      }}
    />
  );
}

/**
 * Обёртка над Sonner toast() с разумными дефолтами для durations.
 * Импортировать как `import { toast } from '@/components/ui';`
 */
export const toast = {
  success: (message: string, options?: Parameters<typeof sonnerToast.success>[1]) =>
    sonnerToast.success(message, { duration: 4000, ...options }),

  error: (message: string, options?: Parameters<typeof sonnerToast.error>[1]) =>
    sonnerToast.error(message, { duration: 10000, ...options }),

  warning: (message: string, options?: Parameters<typeof sonnerToast.warning>[1]) =>
    sonnerToast.warning(message, { duration: 7000, ...options }),

  info: (message: string, options?: Parameters<typeof sonnerToast.info>[1]) =>
    sonnerToast.info(message, { duration: 4000, ...options }),

  // Прямой доступ к raw Sonner для loading/promise-toast и кастомных
  loading: sonnerToast.loading,
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast,
};
