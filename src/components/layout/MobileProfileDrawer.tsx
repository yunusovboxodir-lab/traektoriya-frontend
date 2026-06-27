/**
 * MobileProfileDrawer — выезжающее снизу окно с профилем + вторичными
 * разделами навигации (Команда / Компетенции / Аналитика / Цели / и т.д.)
 * + кнопкой выхода.
 *
 * Открывается из MobileBottomNav при клике на 4-й таб «Профиль».
 * Заменяет на mobile dropdown-меню в StatusBar.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useScopeStore } from '../../stores/scopeStore';
import { useT } from '../../stores/langStore';

interface Props {
  onClose: () => void;
}

interface DrawerLink {
  icon: string;
  labelKey: string;
  path: string;
  pageKey: string;
  /** На каких ролях прятать (доп. фильтр поверх scope) */
  hideForRoles?: string[];
}

const SECONDARY_LINKS: DrawerLink[] = [
  { icon: '👥', labelKey: 'nav.team',         path: '/team',          pageKey: 'team' },
  { icon: '🎯', labelKey: 'nav.competencies', path: '/competencies',  pageKey: 'competencies' },
  { icon: '📊', labelKey: 'nav.analytics',    path: '/analytics',     pageKey: 'analytics' },
  { icon: '🎓', labelKey: 'nav.trainingPlan', path: '/training-plan', pageKey: 'training_plan' },
  { icon: '🏆', labelKey: 'nav.goals',        path: '/goals',         pageKey: 'goals' },
  { icon: '📦', labelKey: 'nav.products',     path: '/products',      pageKey: 'products' },
  // Планограмма убрана из мобильного меню (PO 2026-06-25): заморожена, без frozen-стиля
  // на мобайле прячем у всех; на десктопе админ видит её серой с замком (StatusBar).
  { icon: '✨', labelKey: 'nav.aiStudio',     path: '/ai-studio',     pageKey: 'ai-studio' },
  // Обратная связь (репорты со скринами) — только админ (pageKey admin-roles), → вкладка reports.
  { icon: '🗣️', labelKey: 'nav.feedback',     path: '/analytics?tab=reports', pageKey: 'admin-roles' },
  // План обучения (training_plan) фильтруется политикой scopeStore — только Админ/Ком.дир/РМ.
];

export function MobileProfileDrawer({ onClose }: Props) {
  const navigate = useNavigate();
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isPageAllowed = useScopeStore((s) => s.isPageAllowed);

  // Закрытие по Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    // Блокируем скролл боди пока drawer открыт
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleNav = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  // Фильтруем ссылки по scope
  const visibleLinks = SECONDARY_LINKS.filter(
    (l) => isPageAllowed(l.pageKey)
       && !(l.hideForRoles && user?.role && l.hideForRoles.includes(user.role)),
  );

  const userName = user?.full_name || '—';
  const userRole = user?.role ? t(`roles.${user.role}`) : '';

  return (
    <>
      {/* Затемнение */}
      <div
        className="fixed inset-0 z-40 transition-opacity"
        style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Profile menu"
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto md:hidden"
        style={{
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-strong)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Drag-handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: 'var(--border-strong)',
            }}
          />
        </div>

        {/* User card */}
        <div className="px-5 pt-2 pb-4">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-rm-bg)',
                color: 'var(--color-rm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 16,
                  color: 'var(--text-primary)',
                }}
                className="truncate"
              >
                {userName}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {userRole}
              </div>
            </div>
          </div>
        </div>

        {/* Разделитель */}
        <div style={{ height: 1, background: 'var(--border)' }} />

        {/* Список ссылок */}
        <div className="py-2">
          {visibleLinks.length === 0 ? (
            <div className="px-5 py-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              {t('nav.noSections') || 'Нет доступных разделов'}
            </div>
          ) : (
            visibleLinks.map((link) => (
              <button
                key={link.path}
                type="button"
                onClick={() => handleNav(link.path)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
                style={{ minHeight: 48 }}
              >
                <span style={{ fontSize: 20, width: 28, textAlign: 'center' }} aria-hidden="true">
                  {link.icon}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 15,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    flex: 1,
                  }}
                >
                  {t(link.labelKey)}
                </span>
                <span style={{ color: 'var(--text-muted)' }} aria-hidden="true">›</span>
              </button>
            ))
          )}
        </div>

        {/* Разделитель */}
        <div style={{ height: 1, background: 'var(--border)' }} />

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-5 py-4 text-left"
          style={{ minHeight: 56, color: 'var(--danger)' }}
        >
          <span style={{ fontSize: 20, width: 28, textAlign: 'center' }} aria-hidden="true">⎋</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600 }}>
            {t('nav.logout')}
          </span>
        </button>
      </div>
    </>
  );
}
