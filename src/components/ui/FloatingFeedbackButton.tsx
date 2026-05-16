/**
 * FloatingFeedbackButton — глобальная кнопка «💬 Дать feedback» (TRJ-037).
 *
 * Размещается в TacticalLayout, видна на любой странице платформы.
 *
 * Поведение:
 *   1. Floating button (bottom-right на desktop, bottom-center на mobile)
 *   2. Click → Modal с radio-выбором (Bug / Idea / Question) + textarea
 *   3. Submit → POST /api/v1/feedback (mock: silent-fail если endpoint ещё нет)
 *   4. Toast «Спасибо за отзыв» + auto-close модалки через 1.5с
 *
 * Backend endpoint /api/v1/feedback — параллельная задача. До его готовности
 * фронт отправляет данные, при 404 происходит silent-fail.
 *
 * См. _docs/codex/02_components.md, traektoriya-pain-research.md TRJ-037.
 */
import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from './Modal';
import { Button } from './Button';
import { toast } from './Toast';
import { cn } from '@/lib/utils';

type FeedbackKind = 'bug' | 'idea' | 'question';

const KIND_LABELS: Record<FeedbackKind, { label: string; description: string }> = {
  bug: {
    label: 'Баг',
    description: 'Что-то не работает или работает не так, как ожидаешь',
  },
  idea: {
    label: 'Идея',
    description: 'Предложение улучшения или новая функциональность',
  },
  question: {
    label: 'Вопрос',
    description: 'Не понял как что-то работает или нужна помощь',
  },
};

export function FloatingFeedbackButton() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>('idea');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;

    setSubmitting(true);
    const payload = {
      kind,
      message: message.trim(),
      url: window.location.pathname + window.location.search,
      user_agent: navigator.userAgent,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      ts: new Date().toISOString(),
    };

    // eslint-disable-next-line no-console
    console.log('[Feedback]', payload);

    // POST с silent-fail — endpoint /api/v1/feedback в backend параллельная задача.
    fetch('/api/v1/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      /* silent: endpoint может ещё не существовать, это норма для Phase 1' */
    });

    toast.success('Спасибо! Отправили команде Traektoriya.');

    setTimeout(() => {
      setOpen(false);
      setMessage('');
      setKind('idea');
      setSubmitting(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating button: bottom-right на desktop (sm+), bottom-center на mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Дать обратную связь"
        className={cn(
          'fixed z-40',
          'bottom-4 left-1/2 -translate-x-1/2',
          'sm:bottom-6 sm:right-6 sm:left-auto sm:translate-x-0',
          'inline-flex items-center gap-2',
          'h-12 px-4 rounded-full',
          'bg-bg-accent text-fg-on-accent',
          'shadow-3 hover:shadow-4',
          'transition-all duration-base ease-standard',
          'hover:bg-bg-accent-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
          'font-medium text-sm',
        )}
      >
        <MessageSquarePlus size={18} aria-hidden="true" />
        <span className="hidden sm:inline">Отзыв</span>
      </button>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent maxWidth="md">
          <ModalHeader>
            <ModalTitle>Дать обратную связь</ModalTitle>
            <ModalDescription>
              Что-то не так или есть идея? Напиши команде Traektoriya — каждый отзыв читается.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleSubmit}>
            <ModalBody>
              {/* Kind selector */}
              <fieldset className="grid grid-cols-3 gap-2">
                <legend className="sr-only">Тип обращения</legend>
                {(Object.entries(KIND_LABELS) as [FeedbackKind, typeof KIND_LABELS[FeedbackKind]][]).map(
                  ([value, info]) => (
                    <label
                      key={value}
                      className={cn(
                        'flex flex-col items-start gap-1 p-3 rounded-md border cursor-pointer',
                        'transition-colors duration-fast',
                        kind === value
                          ? 'bg-bg-accent/10 border-border-accent text-fg-default'
                          : 'border-border-default text-fg-muted hover:border-border-strong',
                      )}
                    >
                      <input
                        type="radio"
                        name="feedback-kind"
                        value={value}
                        checked={kind === value}
                        onChange={() => setKind(value)}
                        className="sr-only"
                      />
                      <span className="font-medium text-sm">{info.label}</span>
                      <span className="text-xs text-fg-subtle leading-snug">{info.description}</span>
                    </label>
                  ),
                )}
              </fieldset>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="feedback-message" className="text-sm font-medium text-fg-default">
                  Расскажи подробнее
                  <span className="ml-0.5 text-status-danger-fg" aria-label="обязательное поле">*</span>
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                  placeholder={
                    kind === 'bug'
                      ? 'Например: «На странице План обучения календарь не открывается на мобильном»'
                      : kind === 'idea'
                        ? 'Например: «Хорошо бы напоминания о визите приходили в Telegram»'
                        : 'Например: «Как назначить курс сразу всей команде?»'
                  }
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-sm',
                    'bg-bg-surface border border-border-default text-fg-default',
                    'placeholder:text-fg-subtle',
                    'focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus',
                    'transition-colors duration-base',
                  )}
                />
                <p className="text-xs text-fg-muted">
                  Мы добавим текущую страницу и тип устройства автоматически — тебе не нужно их указывать.
                </p>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Отмена
              </Button>
              <Button type="submit" variant="primary" loading={submitting} disabled={!message.trim()}>
                Отправить
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
