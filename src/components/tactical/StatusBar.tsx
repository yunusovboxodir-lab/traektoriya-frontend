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
import { useLangStore, useT } from '../../stores/langStore';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useScopeStore } from '../../stores/scopeStore';
import {
  visibleDesktopItems,
  isAdminRole,
  isSuperOrAdminRole,
} from '../../config/navigation';
import { PowerBadge } from './PowerBadge';

// Навигация (иконки/пути/гейтинг разделов) вынесена в единый реестр
// src/config/navigation.ts — один источник для десктоп-дропдауна, нижних табов
// и мобильного drawer (раньше конфиг был скопирован в трёх файлах). Здесь —
// только отрисовка дропдауна; список и порядок берём из реестра.

export function StatusBar() {
  const [now, setNow] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
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
  const isAdmin = isAdminRole(userRole);
  const isSuperOrAdmin = isSuperOrAdminRole(userRole);

  // Видимые разделы — из единого реестра (main, затем admin-блок для админов)
  const allItems = visibleDesktopItems({ isPageAllowed, isAdmin, isSuperOrAdmin });

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
          <span className="brand-caret">▾</span>
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
                const frozen = item.frozen ?? false;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    className={'nav-item' + (active ? ' on' : '')}
                    role="menuitem"
                    disabled={frozen}
                    onClick={() => handleNav(item.path, frozen)}
                    style={frozen ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                  >
                    <span className="nav-code" aria-hidden="true">{item.icon}</span>
                    <span className="nav-label">
                      <span className="nav-label-main">
                        {t(item.labelKey)}
                        {frozen && <span style={{ marginLeft: 8, fontSize: 10, opacity: 0.7 }}>🔒</span>}
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
                <span className="nav-code" style={{ color: 'oklch(0.70 0.15 28)' }}>⤴</span>
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

      {/* «Мощь игрока» — компактный бейдж между логотипом и языком, всегда виден (PO 2026-06-25) */}
      {user && <PowerBadge />}

      {/* СПРАВА: переключатель темы + языка */}
      <button
        className="lang-opt sb-theme-btn"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        style={{ marginRight: 6, fontSize: 14, flexShrink: 0 }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="lang-toggle" role="group" aria-label="Язык" style={{ flexShrink: 0 }}>
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
