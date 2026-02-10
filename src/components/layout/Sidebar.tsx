import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
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
  admin: 'bg-green-600',
  supervisor: 'bg-orange-500',
  sales_rep: 'bg-gray-500',
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Суперадмин',
  commercial_dir: 'Ком. директор',
  admin: 'Админ',
  supervisor: 'Супервайзер',
  sales_rep: 'Продавец',
};

function getRoleBadgeClass(role: string): string {
  return ROLE_COLORS[role] ?? 'bg-gray-500';
}

function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
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

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

const NAV_ITEMS: NavItem[] = [
  { label: 'Главная', path: '/dashboard', icon: <IconHome /> },
  { label: 'Обучение', path: '/learning', icon: <IconBook /> },
  { label: 'Товары', path: '/products', icon: <IconBox /> },
  { label: 'Задачи', path: '/tasks', icon: <IconClipboard /> },
  { label: 'Команда', path: '/team', icon: <IconUsers /> },
  { label: 'Оценка', path: '/assessments', icon: <IconCheckSquare /> },
  { label: 'AI Генерация', path: '/generation', icon: <IconAI /> },
  { label: 'База знаний', path: '/knowledge-base', icon: <IconDatabase /> },
  { label: 'Планограмма', path: '/planogram', icon: <IconCamera /> },
  { label: 'Аналитика', path: '/analytics', icon: <IconChart /> },
];

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

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

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
                {getRoleLabel(user.role)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
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

      {/* Bottom section: collapse toggle + logout */}
      <div className="mt-auto border-t border-gray-700 p-2 flex-shrink-0 space-y-1">
        {/* Collapse toggle (desktop only, hidden on mobile overlay) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors duration-150"
          title={collapsed ? 'Развернуть' : 'Свернуть'}
        >
          {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
          {!collapsed && <span>Свернуть</span>}
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Выйти' : undefined}
          className={`
            w-full flex items-center gap-3 rounded-lg text-sm font-medium
            text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-colors duration-150
            ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'}
          `}
        >
          <IconLogout />
          {!collapsed && <span>Выйти</span>}
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
