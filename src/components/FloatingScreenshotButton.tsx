import { useRef, useCallback, useState } from 'react';
import { useT } from '../stores/langStore';
import { reportsApi } from '../api/reports';

type Phase = 'idle' | 'capturing' | 'preview' | 'sending' | 'sent' | 'error';

/**
 * Floating screenshot button — always visible in the bottom-right corner.
 * Flow: click → capture viewport → show preview modal → user adds comment → send to admin.
 */
export function FloatingScreenshotButton() {
  const t = useT();
  const [phase, setPhase] = useState<Phase>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [comment, setComment] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);

  /* ------------------------------------------------------------------ */
  /*  Step 1 — capture the viewport                                     */
  /* ------------------------------------------------------------------ */
  const captureScreenshot = useCallback(async () => {
    if (phase !== 'idle') return;
    setPhase('capturing');

    try {
      const html2canvas = (await import('html2canvas')).default;

      // Hide trigger button during capture
      if (buttonRef.current) buttonRef.current.style.display = 'none';

      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        scale: window.devicePixelRatio || 1,
        ignoreElements: (el) => el.getAttribute('data-screenshot-ignore') === 'true',
      });

      // Restore button
      if (buttonRef.current) buttonRef.current.style.display = '';

      // Generate preview URL and blob
      const dataUrl = canvas.toDataURL('image/png');
      setPreviewUrl(dataUrl);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png'),
      );
      setScreenshotBlob(blob);
      setPhase('preview');
    } catch (err) {
      console.error('Screenshot capture failed:', err);
      if (buttonRef.current) buttonRef.current.style.display = '';
      setPhase('idle');
    }
  }, [phase]);

  /* ------------------------------------------------------------------ */
  /*  Step 2 — send to admin via Reports API                            */
  /* ------------------------------------------------------------------ */
  const sendToAdmin = useCallback(async () => {
    if (!screenshotBlob || !comment.trim()) return;
    setPhase('sending');

    try {
      await reportsApi.submit({
        screenshot: screenshotBlob,
        comment: comment.trim(),
        currentRoute: window.location.pathname,
        screenName: document.title,
      });
      setPhase('sent');
      // Auto-close after 2s
      setTimeout(() => {
        resetState();
      }, 2000);
    } catch (err) {
      console.error('Failed to send screenshot report:', err);
      setPhase('error');
    }
  }, [screenshotBlob, comment]);

  /* ------------------------------------------------------------------ */
  /*  Reset helper                                                       */
  /* ------------------------------------------------------------------ */
  const resetState = useCallback(() => {
    setPhase('idle');
    setPreviewUrl(null);
    setScreenshotBlob(null);
    setComment('');
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <>
      {/* ---------- Trigger button ---------- */}
      <button
        ref={buttonRef}
        onClick={captureScreenshot}
        disabled={phase !== 'idle'}
        data-screenshot-ignore="true"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gray-700 hover:bg-gray-800
                   text-white rounded-full shadow-lg hover:shadow-xl
                   transition-all duration-200 flex items-center justify-center
                   disabled:opacity-50 disabled:cursor-wait
                   print:hidden"
        aria-label={t('screenshot.button') || 'Скриншот'}
        title={t('screenshot.title') || 'Скриншот экрана'}
      >
        {phase === 'capturing' ? (
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60 30" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="w-5 h-5">
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
        )}
      </button>

      {/* ---------- Preview Modal ---------- */}
      {(phase === 'preview' || phase === 'sending' || phase === 'sent' || phase === 'error') && (
        <div
          data-screenshot-ignore="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget && phase !== 'sending') resetState();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">
                {phase === 'sent'
                  ? (t('screenshot.sent') || '✅ Отправлено!')
                  : (t('screenshot.preview') || 'Превью скриншота')}
              </h3>
              {phase !== 'sending' && phase !== 'sent' && (
                <button onClick={resetState} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
                  ✕
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              {/* Screenshot preview */}
              {previewUrl && (
                <div className="border rounded-lg overflow-hidden bg-gray-100 max-h-60 overflow-y-auto">
                  <img src={previewUrl} alt="Screenshot preview" className="w-full" />
                </div>
              )}

              {/* Sent success */}
              {phase === 'sent' && (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-green-600 font-medium">
                    {t('screenshot.sent') || 'Отправлено!'}
                  </p>
                </div>
              )}

              {/* Error state */}
              {phase === 'error' && (
                <div className="text-center py-2">
                  <p className="text-red-500 text-sm">
                    {t('screenshot.error') || 'Ошибка отправки'}
                  </p>
                </div>
              )}

              {/* Comment textarea (not shown after sent) */}
              {(phase === 'preview' || phase === 'sending' || phase === 'error') && (
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('screenshot.commentPlaceholder') || 'Опишите проблему или предложение...'}
                  disabled={phase === 'sending'}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none h-20
                             focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                             disabled:bg-gray-50 disabled:text-gray-400
                             placeholder:text-gray-400"
                  autoFocus
                />
              )}
            </div>

            {/* Footer buttons (not shown after sent) */}
            {phase !== 'sent' && (
              <div className="flex gap-2 px-4 pb-4">
                <button
                  onClick={resetState}
                  disabled={phase === 'sending'}
                  className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-300
                             text-gray-600 hover:bg-gray-50 transition-colors
                             disabled:opacity-50"
                >
                  {t('screenshot.cancel') || 'Отмена'}
                </button>
                <button
                  onClick={sendToAdmin}
                  disabled={phase === 'sending' || !comment.trim()}
                  className="flex-1 px-4 py-2 text-sm rounded-lg font-medium text-white
                             bg-blue-600 hover:bg-blue-700 transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                >
                  {phase === 'sending' ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
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
