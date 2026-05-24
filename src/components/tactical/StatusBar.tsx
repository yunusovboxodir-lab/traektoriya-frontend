/**
 * StatusBar — верхняя горизонтальная полоса.
 * Структура из Tactical Dashboard.html (handoff 2026-05-01).
 *
 * Логотип TRAEKTORIYA — это кнопка-дропдаун: внутри список разделов навигации,
 * имя пользователя и кнопка выхода. Сайдбар-навигация Layout убрана (карта
 * fullscreen, /learning теперь использует FullscreenProtectedRoute).
 *
 * Переключатель языка перемещён в левый угол statusbar (перед логотипом).
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, BookOpen, Package, ClipboardList, Users, Target as TargetIcon,
  Sparkles, Trophy, LayoutGrid, Calendar, BarChart3, GraduationCap,
  Languages, ShoppingCart, Globe, Settings,
  Lock, LogOut, ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { useLangStore, useT } from '../../stores/langStore';
import { useAuthStore } from '../../stores/authStore';
import { useScopeStore } from '../../stores/scopeStore';

const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 5,
  commercial_dir: 4,
  admin: 3,
  regional_manager: 2,
  supervisor: 2,
  sales_rep: 1,
};

// TRJ-048 (2026-05-18): эмодзи в navigation заменены на Lucide-иконки
// (Кодекс v2.1 §00 anti-pattern #8 — эмодзи запрещены в системном UI).
// Прежнее решение «иконки разделов вместо военных кодов» (UX-аудит 2026-05-03)
// сохранено по сути — иконки остаются, просто теперь они векторные/стилизуемые
// через токены вместо растровых эмодзи (разные на iOS/Android, не масштабируются,
// ломают screen-reader-нарратив, не наследуют currentColor).
interface NavItemDef {
  icon: LucideIcon;
  labelKey: string;
  path: string;
  pageKey: string;
}

const NAV_ITEMS_DEF: readonly NavItemDef[] = [
  { icon: Home,           labelKey: 'nav.home',         path: '/dashboard',     pageKey: 'dashboard' },
  { icon: BookOpen,       labelKey: 'nav.learning',     path: '/learning',      pageKey: 'learning' },
  { icon: Package,        labelKey: 'nav.products',     path: '/products',      pageKey: 'products' },
  { icon: ClipboardList,  labelKey: 'nav.tasks',        path: '/tasks',         pageKey: 'tasks' },
  { icon: Users,          labelKey: 'nav.team',         path: '/team',          pageKey: 'team' },
  { icon: TargetIcon,     labelKey: 'nav.competencies', path: '/competencies',  pageKey: 'competencies' },
  { icon: Sparkles,       labelKey: 'nav.aiStudio',     path: '/ai-studio',     pageKey: 'ai-studio' },
  { icon: Trophy,         labelKey: 'nav.goals',        path: '/goals',         pageKey: 'goals' },
  { icon: LayoutGrid,     labelKey: 'nav.planogram',    path: '/planogram',     pageKey: 'planogram' },
  { icon: Calendar,       labelKey: 'nav.offline',      path: '/activities',    pageKey: 'offline' },
  { icon: BarChart3,      labelKey: 'nav.analytics',    path: '/analytics',     pageKey: 'analytics' },
  { icon: GraduationCap,  labelKey: 'nav.trainingPlan', path: '/training-plan', pageKey: 'training_plan' },
];

// QW-6 (Sprint 0, 2026-05-16): добавлены ShelfCorrections и TranslationReview —
// раньше доступны только по прямому URL (висячие маршруты, см. UI/UX-аудит S7).
// Привязаны к admin-секции, т.к. это инструменты для admin/superadmin.
const ADMIN_NAV_ITEMS_DEF: readonly NavItemDef[] = [
  { icon: Languages,     labelKey: 'nav.dictionaryUZ',      path: '/dictionary-uz',      pageKey: 'dictionary-uz' },
  { icon: ShoppingCart,  labelKey: 'nav.shelfCorrections',  path: '/shelf-corrections',  pageKey: 'admin-roles' },
  { icon: Globe,         labelKey: 'nav.translationReview', path: '/translation-review', pageKey: 'admin-roles' },
  { icon: Settings,      labelKey: 'nav.settings',          path: '/admin/roles',        pageKey: 'admin-roles' },
];

const FROZEN_PAGES = ['analytics', 'goals'];
const ADMIN_ONLY_PAGES = ['ai-studio'];

export function StatusBar() {
  const [now, setNow] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isPageAllowed = useScopeStore((s) => s.isPageAllowed);
  const brandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Закрытие по Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && menuOpen) setMenuOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const userRole = user?.role || 'sales_rep';
  const isAdmin = (ROLE_HIERARCHY[userRole] ?? 0) >= 3;
  const isSuperOrAdmin = userRole === 'superadmin' || userRole === 'admin';

  // Фильтруем разделы по scope-правилам
  const visibleItems = NAV_ITEMS_DEF.filter((item) => {
    if (!isPageAllowed(item.pageKey)) return false;
    if (ADMIN_ONLY_PAGES.includes(item.pageKey) && !isSuperOrAdmin) return false;
    if (FROZEN_PAGES.includes(item.pageKey) && !isAdmin) return false;
    return true;
  });
  const allItems = isAdmin
    ? [...visibleItems, ...ADMIN_NAV_ITEMS_DEF]
    : visibleItems;

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  // currentMod (КОМАНДНЫЙ ЦЕНТР / TACTICAL TABLE и т.д.) убран UX-аудит 2026-05-03 —
  // декоративный, без функции. Контекст текущего раздела даётся самим контентом
  // страницы и активным item в дропдауне меню (с галочкой/маркером).

  const handleNav = (path: string, frozen: boolean) => {
    if (frozen) return;
    setMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="statusbar">
      {/* СЛЕВА: лого TRAEKTORIYA + дропдаун меню (☰) */}
      <div className="brand-wrap" ref={brandRef}>
        <button
          className={'brand' + (menuOpen ? ' brand-open' : '')}
          aria-label="Меню"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <img src="/tactical/traektoriya-logo.jpg" alt="Traektoriya" className="brand-logo" />
          <div className="brand-text">
            <div className="brand-name">TRAEKTORIYA</div>
            <div className="brand-tag">{lang === 'uz' ? 'noldan ekspertgacha' : 'с нуля до эксперта'}</div>
          </div>
          <ChevronDown size={14} className="brand-caret" aria-hidden="true" />
        </button>

        {menuOpen && (
          <>
            <div className="nav-scrim" onClick={() => setMenuOpen(false)} />
            <div className="nav-menu" role="menu">
              {/* Имя пользователя под логотипом — внутри дропдауна */}
              {user && (
                <div className="nav-section">
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-0)', textTransform: 'none', textShadow: 'none', marginBottom: 2 }}>
                    {user.full_name}
                  </div>
                  <div>{t(`roles.${user.role}`)}</div>
                </div>
              )}
              {!user && (
                <div className="nav-section">{lang === 'uz' ? 'BOʻLIMLAR' : 'РАЗДЕЛЫ'}</div>
              )}

              {allItems.map((item) => {
                const frozen = FROZEN_PAGES.includes(item.pageKey);
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    className={'nav-item' + (active ? ' on' : '')}
                    role="menuitem"
                    disabled={frozen}
                    onClick={() => handleNav(item.path, frozen)}
                    style={frozen ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                  >
                    <span className="nav-code" aria-hidden="true">
                      <Icon size={16} strokeWidth={1.75} />
                    </span>
                    <span className="nav-label">
                      <span className="nav-label-main" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {t(item.labelKey)}
                        {frozen && <Lock size={10} aria-label={lang === 'uz' ? 'Bloklangan' : 'Заблокировано'} style={{ opacity: 0.7 }} />}
                      </span>
                    </span>
                    {active && <span className="nav-on-dot" aria-hidden="true" />}
                  </button>
                );
              })}

              {/* Кнопка выхода */}
              <button
                className="nav-item"
                role="menuitem"
                onClick={handleLogout}
                style={{ borderTop: '1px solid var(--line-soft)', marginTop: 6 }}
              >
                <span className="nav-code" style={{ color: 'oklch(0.70 0.15 28)' }} aria-hidden="true">
                  <LogOut size={16} strokeWidth={1.75} />
                </span>
                <span className="nav-label">
                  <span className="nav-label-main" style={{ color: 'oklch(0.85 0.12 28)' }}>{t('nav.logout')}</span>
                </span>
              </button>

              <div className="nav-foot">
                <span>v3.1</span>
                <span>{time}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="sb-spacer" />

      {/* СПРАВА: переключатель языка (theme-toggle убран — full dark) */}
      <div className="lang-toggle" role="group" aria-label="Язык">
        <button
          className={'lang-opt' + (lang === 'ru' ? ' on' : '')}
          onClick={() => setLang('ru')}
        >РУ</button>
        <button
          className={'lang-opt' + (lang === 'uz' ? ' on' : '')}
          onClick={() => setLang('uz')}
        >UZ</button>
      </div>
    </div>
  );
}
