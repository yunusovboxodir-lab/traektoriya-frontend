/**
 * MobileBottomNav — глобальная нижняя навигация для mobile (≤768px).
 *
 * 4 фиксированных таба: Главная / Обучение / Задачи / Профиль.
 * 4-й таб открывает MobileProfileDrawer со вторичными разделами
 * (Команда, Компетенции, Аналитика, Цели, и т.д.).
 *
 * Подключается на уровне App.tsx внутри ProtectedRoute / Fullscreen-Route.
 * На desktop возвращает null — всё разворачивается через StatusBar dropdown.
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useScopeStore } from '../../stores/scopeStore';
import { useT } from '../../stores/langStore';
import { MobileProfileDrawer } from './MobileProfileDrawer';

interface NavTab {
  icon: string;
  labelKey: string;
  path?: string;
  pageKey?: string;
  /** Если true — открывает drawer вместо navigate */
  isDrawer?: boolean;
}

const TABS: NavTab[] = [
  { icon: '🏠', labelKey: 'nav.home',     path: '/dashboard', pageKey: 'dashboard' },
  { icon: '📚', labelKey: 'nav.learning', path: '/learning',  pageKey: 'learning' },
  { icon: '📋', labelKey: 'nav.tasks',    path: '/tasks',     pageKey: 'tasks' },
  { icon: '👤', labelKey: 'nav.profile',  isDrawer: true },
];

export function MobileBottomNav() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();
  const isPageAllowed = useScopeStore((s) => s.isPageAllowed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!isMobile) return null;

  const isActive = (tab: NavTab) => {
    if (tab.isDrawer) return drawerOpen;
    if (!tab.path) return false;
    return location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
  };

  const handleClick = (tab: NavTab) => {
    if (tab.isDrawer) {
      setDrawerOpen(true);
      return;
    }
    if (tab.path) navigate(tab.path);
  };

  return (
    <>
      {/* Bottom-nav сам — fixed внизу экрана */}
      <nav
        role="navigation"
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        style={{
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="grid grid-cols-4 max-w-md mx-auto">
          {TABS.map((tab) => {
            // Скрыть таб если у роли нет доступа (drawer всегда виден)
            if (tab.pageKey && !isPageAllowed(tab.pageKey)) return null;
            const active = isActive(tab);
            return (
              <button
                key={tab.labelKey}
                type="button"
                onClick={() => handleClick(tab)}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center justify-center gap-0.5 py-2 px-2 transition-colors"
                style={{
                  color: active ? 'var(--color-rm)' : 'var(--text-muted)',
                  minHeight: 56,
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true">
                  {tab.icon}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 700 : 500,
                    letterSpacing: '0.04em',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {t(tab.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Профильный drawer — выезжает снизу при клике на 4-й таб */}
      {drawerOpen && (
        <MobileProfileDrawer onClose={() => setDrawerOpen(false)} />
      )}
    </>
  );
}
