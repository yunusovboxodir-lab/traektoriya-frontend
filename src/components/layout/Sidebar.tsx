import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useScopeStore } from '../../stores/scopeStore';
import { useLangStore, useT } from '../../stores/langStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  pageKey: string;
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

// ---------------------------------------------------------------------------
// Role badge helpers
// ---------------------------------------------------------------------------

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-purple-600',
  commercial_dir: 'bg-blue-600',
  regional_manager: 'bg-teal-600',
  admin: 'bg-green-600',
  supervisor: 'bg-orange-500',
  sales_rep: 'bg-gray-500',
};

function getRoleBadgeClass(role: string): string {
  return ROLE_COLORS[role] ?? 'bg-gray-500';
}

// ---------------------------------------------------------------------------
// SVG Icons (inline, no external libraries)
// ---------------------------------------------------------------------------

function IconHome() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05" />
      <path d="M12 22.08V12" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCheckSquare() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconAI() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1.27c.34-.6.99-1 1.73-1a2 2 0 1 1 0 4c-.74 0-1.39-.4-1.73-1H21a7 7 0 0 1-7 7v1.27c.6.34 1 .99 1 1.73a2 2 0 1 1-4 0c0-.74.4-1.39 1-1.73V23a7 7 0 0 1-7-7H3.73c-.34.6-.99 1-1.73 1a2 2 0 1 1 0-4c.74 0 1.39.4 1.73 1H5a7 7 0 0 1 7-7V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconDatabase() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconMessageCircle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconScissors() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 flex-shrink-0">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

// Role hierarchy for admin checks
const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 5,
  commercial_dir: 4,
  regional_manager: 4,
  admin: 3,
  supervisor: 2,
  sales_rep: 1,
};

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

// Label keys map to i18n: nav.dashboard, nav.learning, etc.
const NAV_ITEMS_DEF = [
  { labelKey: 'nav.dashboard', path: '/dashboard', icon: <IconHome />, pageKey: 'dashboard' },
  { labelKey: 'nav.learning', path: '/learning', icon: <IconBook />, pageKey: 'learning' },
  { labelKey: 'nav.products', path: '/products', icon: <IconBox />, pageKey: 'products' },
  { labelKey: 'nav.tasks', path: '/tasks', icon: <IconClipboard />, pageKey: 'tasks' },
  { labelKey: 'nav.team', path: '/team', icon: <IconUsers />, pageKey: 'team' },
  { labelKey: 'nav.assessments', path: '/assessments', icon: <IconCheckSquare />, pageKey: 'assessments' },
  { labelKey: 'nav.generation', path: '/generation', icon: <IconAI />, pageKey: 'generation' },
  { labelKey: 'nav.knowledgeBase', path: '/knowledge-base', icon: <IconDatabase />, pageKey: 'knowledge-base' },
  { labelKey: 'nav.goals', path: '/goals', icon: <IconTrophy />, pageKey: 'goals' },
  { labelKey: 'nav.kpi', path: '/kpi', icon: <IconTarget />, pageKey: 'kpi' },
  { labelKey: 'nav.chat', path: '/chat', icon: <IconMessageCircle />, pageKey: 'chat' },
  { labelKey: 'nav.planogram', path: '/planogram', icon: <IconCamera />, pageKey: 'planogram' },
  { labelKey: 'nav.analytics', path: '/analytics', icon: <IconChart />, pageKey: 'analytics' },
  { labelKey: 'nav.reports', path: '/reports', icon: <IconScissors />, pageKey: 'reports' },
] as const;

const ADMIN_NAV_DEF = {
  labelKey: 'nav.adminRoles', path: '/admin/roles', icon: <IconShield />, pageKey: 'admin-roles',
} as const;

// ---------------------------------------------------------------------------
// Sidebar Component
// ---------------------------------------------------------------------------

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isPageAllowed = useScopeStore((s) => s.isPageAllowed);

  const userRole = user?.role || 'sales_rep';
  const isAdmin = (ROLE_HIERARCHY[userRole] ?? 0) >= 3;

  // Resolve translated labels for nav items
  const NAV_ITEMS: NavItem[] = NAV_ITEMS_DEF.map((item) => ({
    label: t(item.labelKey),
    path: item.path,
    icon: item.icon,
    pageKey: item.pageKey,
  }));
  const ADMIN_NAV_ITEM: NavItem = {
    label: t(ADMIN_NAV_DEF.labelKey),
    path: ADMIN_NAV_DEF.path,
    icon: ADMIN_NAV_DEF.icon,
    pageKey: ADMIN_NAV_DEF.pageKey,
  };

  // Filter nav items by role scopes + add admin item
  const visibleItems = NAV_ITEMS.filter((item) => isPageAllowed(item.pageKey));
  const allNavItems = isAdmin ? [...visibleItems, ADMIN_NAV_ITEM] : visibleItems;

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleNavClick = useCallback(
    (path: string) => {
      navigate(path);
      onCloseMobile();
    },
    [navigate, onCloseMobile],
  );

  const isActive = useCallback(
    (path: string) => location.pathname === path || location.pathname.startsWith(path + '/'),
    [location.pathname],
  );

  // Close mobile sidebar on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileOpen) {
        onCloseMobile();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileOpen, onCloseMobile]);

  // ---- Sidebar content (shared between desktop and mobile) ----
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-white truncate">
              Traektoriya
            </span>
          )}
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className={`px-4 py-4 border-b border-gray-700 flex-shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <div
              className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-semibold"
              title={user.full_name}
            >
              {user.full_name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.full_name}
              </p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium text-white ${getRoleBadgeClass(user.role)}`}
              >
                {t(`roles.${user.role}`)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {allNavItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => handleNavClick(item.path)}
              title={collapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 rounded-lg text-sm font-medium
                transition-colors duration-150 outline-none
                ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'}
                ${
                  active
                    ? 'bg-gray-800 text-white border-l-[3px] border-blue-500'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white border-l-[3px] border-transparent'
                }
              `}
            >
              {item.icon}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom section: language toggle + collapse toggle + logout */}
      <div className="mt-auto border-t border-gray-700 p-2 flex-shrink-0 space-y-1">
        {/* Language toggle */}
        <button
          type="button"
          onClick={() => setLang(lang === 'ru' ? 'uz' : 'ru')}
          className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors duration-150 ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'}`}
          title={t('common.language')}
        >
          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold flex-shrink-0">
            {lang === 'ru' ? 'RU' : 'UZ'}
          </span>
          {!collapsed && (
            <span className="flex items-center gap-2">
              <span className={lang === 'ru' ? 'text-white font-semibold' : 'text-gray-500'}>RU</span>
              <span className="text-gray-600">/</span>
              <span className={lang === 'uz' ? 'text-white font-semibold' : 'text-gray-500'}>UZ</span>
            </span>
          )}
        </button>

        {/* Collapse toggle (desktop only, hidden on mobile overlay) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors duration-150"
          title={collapsed ? t('nav.expand') : t('nav.collapse')}
        >
          {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
          {!collapsed && <span>{t('nav.collapse')}</span>}
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? t('nav.logout') : undefined}
          className={`
            w-full flex items-center gap-3 rounded-lg text-sm font-medium
            text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-colors duration-150
            ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'}
          `}
        >
          <IconLogout />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ---- Desktop sidebar ---- */}
      <aside
        className={`
          hidden lg:flex flex-col fixed inset-y-0 left-0 z-30
          bg-gray-900 text-white
          transition-[width] duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-64'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* ---- Mobile overlay ---- */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          {/* Sidebar panel */}
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
