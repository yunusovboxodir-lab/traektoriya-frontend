import { useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

// ---------------------------------------------------------------------------
// LocalStorage key for sidebar collapse state
// ---------------------------------------------------------------------------

const SIDEBAR_COLLAPSED_KEY = 'traektoriya_sidebar_collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
  } catch {
    // Silently ignore storage errors (e.g. private browsing)
  }
}

// ---------------------------------------------------------------------------
// Hamburger icon
// ---------------------------------------------------------------------------

function IconMenu() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-6 h-6">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Layout Component
// ---------------------------------------------------------------------------

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist collapse state
  const handleToggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsed(next);
      return next;
    });
  }, []);

  const handleCloseMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const handleOpenMobile = useCallback(() => {
    setMobileOpen(true);
  }, []);

  // Close mobile sidebar on window resize to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024 && mobileOpen) {
        setMobileOpen(false);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={handleCloseMobile}
      />

      {/* Mobile top header */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center h-14 px-4 bg-white border-b border-gray-200 lg:hidden">
        <button
          type="button"
          onClick={handleOpenMobile}
          className="p-1.5 -ml-1.5 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="Открыть меню"
        >
          <IconMenu />
        </button>
        <span className="ml-3 text-lg font-semibold text-gray-900">
          Traektoriya
        </span>
      </header>

      {/* Main content area */}
      <main
        className={`
          transition-[margin-left] duration-300 ease-in-out
          pt-14 lg:pt-0
          ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}
        `}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
