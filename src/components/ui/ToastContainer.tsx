import { useToastStore, type ToastType } from '../../stores/toastStore';

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-300 text-green-800',
  error: 'bg-red-50 border-red-300 text-red-800',
  info: 'bg-blue-50 border-blue-300 text-blue-800',
  warning: 'bg-amber-50 border-amber-300 text-amber-800',
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-slide-in ${STYLES[t.type]}`}
          role="alert"
        >
          <span className="text-base flex-shrink-0 mt-0.5">{ICONS[t.type]}</span>
          <p className="text-sm font-medium flex-1">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Закрыть"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
