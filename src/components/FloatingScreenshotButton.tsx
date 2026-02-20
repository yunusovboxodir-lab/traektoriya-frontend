import { useRef, useCallback, useState } from 'react';
import { useT } from '../stores/langStore';

/**
 * Floating screenshot button — always visible in the bottom-right corner.
 * Captures the current viewport as a PNG and downloads it.
 * Uses dynamic import of html2canvas to keep the main bundle small.
 */
export function FloatingScreenshotButton() {
  const t = useT();
  const [capturing, setCapturing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const captureScreenshot = useCallback(async () => {
    if (capturing) return;
    setCapturing(true);

    try {
      // Dynamic import — html2canvas is ~60KB, loaded only on first click
      const html2canvas = (await import('html2canvas')).default;

      // Hide the button during capture so it doesn't appear in the screenshot
      if (buttonRef.current) {
        buttonRef.current.style.display = 'none';
      }

      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        scale: window.devicePixelRatio || 1,
        ignoreElements: (el) => el.getAttribute('data-screenshot-ignore') === 'true',
      });

      // Restore button
      if (buttonRef.current) {
        buttonRef.current.style.display = '';
      }

      // Download the screenshot as PNG
      const link = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `traektoriya-${ts}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Screenshot capture failed:', err);
      // Restore button on error
      if (buttonRef.current) {
        buttonRef.current.style.display = '';
      }
    } finally {
      setCapturing(false);
    }
  }, [capturing]);

  return (
    <button
      ref={buttonRef}
      onClick={captureScreenshot}
      disabled={capturing}
      data-screenshot-ignore="true"
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gray-700 hover:bg-gray-800
                 text-white rounded-full shadow-lg hover:shadow-xl
                 transition-all duration-200 flex items-center justify-center
                 disabled:opacity-50 disabled:cursor-wait
                 print:hidden"
      aria-label={t('screenshot.button') || 'Скриншот'}
      title={t('screenshot.title') || 'Скриншот экрана'}
    >
      {capturing ? (
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
  );
}
