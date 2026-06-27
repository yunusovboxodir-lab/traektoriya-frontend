import { useRef, useCallback, useState } from 'react';
import { Camera } from 'lucide-react';
import { useT, useLangStore } from '../stores/langStore';
import { reportsApi } from '../api/reports';

type Phase = 'idle' | 'capturing' | 'preview' | 'sending' | 'sent' | 'error';
type Kind = 'bug' | 'idea' | 'question';

/**
 * FloatingScreenshotButton — единая кнопка обратной связи «Сообщить».
 *
 * Поток: клик → снимок экрана (html2canvas) → превью → тип (баг/идея/вопрос) + коммент
 * → отправка админу (POST /reports/screenshot → БД screenshot_reports + MinIO).
 * Админ разбирает в Аналитика → Репорты (статусы new/reviewed/resolved).
 *
 * P0 (2026-06-23): заменил иконку-ножницы на камеру + подпись, добавил адаптив под
 * мобайл (над нижней навигацией), токены темы, селектор типа обращения.
 */
const KINDS: { id: Kind; ru: string; uz: string; tag: string }[] = [
  { id: 'bug', ru: 'Баг', uz: 'Xato', tag: 'Баг' },
  { id: 'idea', ru: 'Идея', uz: "G'oya", tag: 'Идея' },
  { id: 'question', ru: 'Вопрос', uz: 'Savol', tag: 'Вопрос' },
];

export function FloatingScreenshotButton() {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const [phase, setPhase] = useState<Phase>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [comment, setComment] = useState('');
  const [kind, setKind] = useState<Kind>('bug');
  const buttonRef = useRef<HTMLButtonElement>(null);

  /* ------------------------------------------------------------------ */
  /*  Step 1 — снимок viewport                                          */
  /* ------------------------------------------------------------------ */
  const captureScreenshot = useCallback(async () => {
    if (phase !== 'idle') return;
    setPhase('capturing');

    try {
      // html2canvas-pro: drop-in форк с поддержкой oklch/color-mix
      // (обычный html2canvas падает на oklch-цветах дизайн-системы → захват не работал).
      const html2canvas = (await import('html2canvas-pro')).default;
      if (buttonRef.current) buttonRef.current.style.display = 'none';

      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: false,        // кросс-доменные картинки без CORS — пропускаем, не «портим» canvas
        logging: false,
        imageTimeout: 2500,        // не виснуть на медленных/недоступных картинках
        backgroundColor: '#0b1220',
        scale: Math.min(window.devicePixelRatio || 1, 2),
        ignoreElements: (el) => el.getAttribute('data-screenshot-ignore') === 'true',
      });

      if (buttonRef.current) buttonRef.current.style.display = '';

      const dataUrl = canvas.toDataURL('image/png');
      setPreviewUrl(dataUrl);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png'),
      );
      setScreenshotBlob(blob);
      setPhase('preview');
    } catch (err) {
      // Захват экрана может упасть на «капризной» странице (tainted canvas от
      // кросс-доменных картинок и т.п.). НЕ блокируем обратную связь — открываем
      // форму без скриншота, чтобы пользователь всё равно мог сообщить.
      console.error('Screenshot capture failed (открываю форму без скрина):', err);
      if (buttonRef.current) buttonRef.current.style.display = '';
      setPreviewUrl(null);
      setScreenshotBlob(null);
      setPhase('preview');
    }
  }, [phase]);

  /* ------------------------------------------------------------------ */
  /*  Step 2 — отправка админу                                          */
  /* ------------------------------------------------------------------ */
  const sendToAdmin = useCallback(async () => {
    if (!comment.trim()) return;  // скриншот опционален — главное коммент
    setPhase('sending');

    try {
      await reportsApi.submit({
        screenshot: screenshotBlob,  // может быть null — бэк примет без файла
        comment: comment.trim(),
        reportType: kind,
        currentRoute: window.location.pathname,
        screenName: document.title,
      });
      setPhase('sent');
      setTimeout(() => resetState(), 2000);
    } catch (err) {
      console.error('Failed to send screenshot report:', err);
      setPhase('error');
    }
  }, [screenshotBlob, comment, kind]);

  const resetState = useCallback(() => {
    setPhase('idle');
    setPreviewUrl(null);
    setScreenshotBlob(null);
    setComment('');
    setKind('bug');
  }, []);

  const label = lang === 'uz' ? 'Xabar berish' : 'Сообщить';

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <>
      {/* ---------- Триггер: пилюля «Сообщить», адаптив под мобайл ---------- */}
      <button
        ref={buttonRef}
        onClick={captureScreenshot}
        disabled={phase !== 'idle'}
        data-screenshot-ignore="true"
        className="fixed z-50 bottom-20 right-4 sm:bottom-6 sm:right-6
                   inline-flex items-center gap-2 h-12 px-3 sm:px-4 rounded-full
                   bg-bg-accent text-fg-on-accent shadow-3 hover:shadow-4 hover:bg-bg-accent-hover
                   transition-all duration-base ease-standard
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus
                   disabled:opacity-60 disabled:cursor-wait font-medium text-sm print:hidden"
        aria-label={label}
        title={label}
      >
        {phase === 'capturing' ? (
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60 30" />
          </svg>
        ) : (
          <Camera size={18} aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{label}</span>
      </button>

      {/* ---------- Превью + форма ---------- */}
      {(phase === 'preview' || phase === 'sending' || phase === 'sent' || phase === 'error') && (
        <div
          data-screenshot-ignore="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && phase !== 'sending') resetState();
          }}
        >
          <div className="bg-bg-surface border border-border-default rounded-2xl shadow-4 w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-default">
              <h3 className="text-sm font-semibold text-fg-default">
                {phase === 'sent'
                  ? (t('screenshot.sent') || 'Отправлено!')
                  : (lang === 'uz' ? 'Xabar berish' : 'Сообщить о проблеме или идее')}
              </h3>
              {phase !== 'sending' && phase !== 'sent' && (
                <button
                  onClick={resetState}
                  className="text-fg-muted hover:text-fg-default text-lg leading-none"
                  aria-label={t('screenshot.cancel') || 'Отмена'}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              {previewUrl ? (
                <div className="border border-border-default rounded-lg overflow-hidden bg-bg-canvas max-h-52 overflow-y-auto">
                  <img src={previewUrl} alt="Screenshot preview" className="w-full" />
                </div>
              ) : (phase === 'preview' || phase === 'sending' || phase === 'error') && (
                <div className="border border-border-default rounded-lg bg-bg-canvas p-3 text-xs text-fg-muted">
                  {lang === 'uz'
                    ? 'Skrinshotni biriktirib boʻlmadi — muammoni matn bilan tasvirlang.'
                    : '📷 Скриншот не приложился — опишите проблему текстом, мы всё равно получим.'}
                </div>
              )}

              {phase === 'sent' && (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-status-success-fg font-medium">
                    {t('screenshot.sent') || 'Отправлено админу!'}
                  </p>
                </div>
              )}

              {phase === 'error' && (
                <p className="text-center text-status-danger-fg text-sm py-1">
                  {t('screenshot.error') || 'Ошибка отправки'}
                </p>
              )}

              {(phase === 'preview' || phase === 'sending' || phase === 'error') && (
                <>
                  {/* Тип обращения */}
                  <div className="grid grid-cols-3 gap-2">
                    {KINDS.map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => setKind(k.id)}
                        disabled={phase === 'sending'}
                        className={`px-2 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          kind === k.id
                            ? 'bg-bg-accent/10 border-border-accent text-fg-default'
                            : 'border-border-default text-fg-muted hover:border-border-strong'
                        }`}
                      >
                        {lang === 'uz' ? k.uz : k.ru}
                      </button>
                    ))}
                  </div>

                  {/* Коммент */}
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('screenshot.commentPlaceholder') || 'Опишите проблему или предложение...'}
                    disabled={phase === 'sending'}
                    className="w-full rounded-lg px-3 py-2 text-sm resize-none h-20
                               bg-bg-canvas border border-border-default text-fg-default
                               placeholder:text-fg-subtle
                               focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus
                               disabled:opacity-60"
                    autoFocus
                  />
                </>
              )}
            </div>

            {/* Footer */}
            {phase !== 'sent' && (
              <div className="flex gap-2 px-4 pb-4">
                <button
                  onClick={resetState}
                  disabled={phase === 'sending'}
                  className="flex-1 px-4 py-2 text-sm rounded-lg border border-border-default
                             text-fg-muted hover:bg-bg-canvas transition-colors disabled:opacity-50"
                >
                  {t('screenshot.cancel') || 'Отмена'}
                </button>
                <button
                  onClick={sendToAdmin}
                  disabled={phase === 'sending' || !comment.trim()}
                  className="flex-1 px-4 py-2 text-sm rounded-lg font-medium
                             bg-bg-accent text-fg-on-accent hover:bg-bg-accent-hover transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                >
                  {phase === 'sending' ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60 30" />
                      </svg>
                      {t('screenshot.sending') || 'Отправка...'}
                    </>
                  ) : (
                    <>📤 {t('screenshot.sendToAdmin') || 'Отправить админу'}</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
