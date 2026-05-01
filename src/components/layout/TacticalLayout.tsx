/**
 * TacticalLayout — единая Tactical-оболочка для всех страниц приложения.
 *
 * Структура (top → bottom):
 *  - StatusBar         (логотип-дропдаун с разделами + лого/имя/выход + язык + тема)
 *  - tactical bg       (radial-gradient + grid)
 *  - .tactical-content (контент страницы; Tailwind-классы переопределяются стилями)
 *
 * Заменяет старый Layout (красный сайдбар) для всего, что внутри ProtectedRoute.
 */
import type { ReactNode } from 'react';
import { StatusBar } from '../tactical/StatusBar';
import { FloatingScreenshotButton } from '../FloatingScreenshotButton';
import '../../styles/tactical-design.css';

const FONT_LINK_ID = 'tactical-fonts';

function injectFonts() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(FONT_LINK_ID)) return;
  const l = document.createElement('link');
  l.id = FONT_LINK_ID;
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap';
  document.head.appendChild(l);
}

interface TacticalLayoutProps {
  children: ReactNode;
  /** Если true — без StatusBar (для презентационных режимов вроде fullscreen-карты) */
  hideStatusBar?: boolean;
  /** Если true — без внутренних отступов (для fullscreen-страниц как Tactical-карта) */
  fullscreen?: boolean;
}

export function TacticalLayout({ children, hideStatusBar, fullscreen }: TacticalLayoutProps) {
  injectFonts();
  return (
    <div className="tactical-root">
      {!hideStatusBar && <StatusBar />}
      <main className={fullscreen ? 'tactical-fullscreen' : 'tactical-page'}>
        {children}
      </main>
      <FloatingScreenshotButton />
    </div>
  );
}
