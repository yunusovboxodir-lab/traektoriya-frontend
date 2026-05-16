/**
 * AIFeedbackBar — однокликовый feedback под каждым AI-ответом.
 *
 * 3 действия:
 * - 👍 ThumbsUp: положительная оценка
 * - 👎 ThumbsDown: отрицательная
 * - 🚩 Flag: «неточно/неуместно» — опционально с текстовым полем
 *
 * При накоплении threshold (3+ flag на один и тот же ответ) backend должен
 * отправить уведомление в Telegram админу (см. TRJ-033).
 *
 * См. _docs/codex/03_patterns_ai.md §4 и TRJ-033.
 */
import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FeedbackType = 'up' | 'down' | 'flag';

interface AIFeedbackBarProps {
  /** ID ответа AI для трекинга фидбэка на сервере */
  responseId: string;
  /** Callback — реализация шлёт в backend */
  onFeedback: (type: FeedbackType, comment?: string) => Promise<void> | void;
  /** Подпись над кнопками. По умолчанию «Оцените ответ» */
  label?: string;
  className?: string;
}

export function AIFeedbackBar({
  responseId,
  onFeedback,
  label = 'Оцените ответ:',
  className,
}: AIFeedbackBarProps) {
  const [submitted, setSubmitted] = useState<FeedbackType | null>(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const handle = async (type: FeedbackType) => {
    if (busy || submitted) return;
    if (type === 'flag') {
      setShowCommentBox(true);
      return;
    }
    setBusy(true);
    try {
      await onFeedback(type);
      setSubmitted(type);
    } finally {
      setBusy(false);
    }
  };

  const submitFlag = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onFeedback('flag', comment.trim() || undefined);
      setSubmitted('flag');
      setShowCommentBox(false);
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <p className={cn('text-xs text-fg-muted', className)} role="status">
        Спасибо за отзыв
      </p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)} data-response-id={responseId}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-fg-muted">{label}</span>
        <button
          type="button"
          onClick={() => handle('up')}
          disabled={busy}
          aria-label="Полезный ответ"
          className={cn(
            'inline-flex items-center justify-center rounded-full',
            'min-w-[32px] min-h-[32px] p-1.5',
            'text-fg-muted hover:text-status-success-fg',
            'hover:bg-status-success-bg transition-colors duration-base',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <ThumbsUp size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => handle('down')}
          disabled={busy}
          aria-label="Бесполезный ответ"
          className={cn(
            'inline-flex items-center justify-center rounded-full',
            'min-w-[32px] min-h-[32px] p-1.5',
            'text-fg-muted hover:text-status-warning-fg',
            'hover:bg-status-warning-bg transition-colors duration-base',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <ThumbsDown size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => handle('flag')}
          disabled={busy}
          aria-label="Сообщить о неточности"
          className={cn(
            'inline-flex items-center justify-center rounded-full',
            'min-w-[32px] min-h-[32px] p-1.5',
            'text-fg-muted hover:text-status-danger-fg',
            'hover:bg-status-danger-bg transition-colors duration-base',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <Flag size={16} aria-hidden="true" />
        </button>
      </div>

      {showCommentBox && (
        <div className="flex flex-col gap-2 mt-1 p-3 rounded-md bg-bg-surface border border-border-default">
          <label htmlFor={`flag-${responseId}`} className="text-xs text-fg-muted">
            Что не так с ответом? (опционально)
          </label>
          <textarea
            id={`flag-${responseId}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className={cn(
              'w-full text-sm rounded-md px-2 py-1.5',
              'bg-bg-canvas border border-border-default',
              'focus:outline-none focus:border-border-focus',
              'text-fg-default',
            )}
            placeholder="Кратко опишите проблему"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowCommentBox(false);
                setComment('');
              }}
              className="px-3 py-1 text-xs text-fg-muted hover:text-fg-default"
              disabled={busy}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={submitFlag}
              disabled={busy}
              className={cn(
                'px-3 py-1 text-xs rounded-md',
                'bg-status-danger-fg text-bg-canvas',
                'hover:opacity-90 disabled:opacity-50',
                'transition-opacity duration-base',
              )}
            >
              Отправить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
