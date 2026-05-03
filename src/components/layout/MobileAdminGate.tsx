/**
 * MobileAdminGate — блокирует mobile-доступ для админ-ролей
 * (superadmin / admin / commercial_dir).
 *
 * Причина: админ-разделы (роли, словари, переводы, KPI-pipeline,
 * AI-студия и т.д.) спроектированы под desktop. На mobile они режутся,
 * формы становятся ужасными, легко напартачить.
 *
 * Решение: показываем notice «работа доступна с компьютера». Плюс кнопка
 * «Продолжить как обычный пользователь» (форс-режим mobile, оставляем
 * только home/learning/tasks/profile).
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useAuthStore } from '../../stores/authStore';

const ADMIN_ROLES = new Set(['superadmin', 'admin', 'commercial_dir']);
const FORCE_MOBILE_KEY = 'traektoriya_admin_force_mobile';

interface Props {
  children: ReactNode;
}

function readForceMobile(): boolean {
  try {
    return localStorage.getItem(FORCE_MOBILE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeForceMobile(value: boolean) {
  try {
    localStorage.setItem(FORCE_MOBILE_KEY, String(value));
  } catch {
    // ignore
  }
}

export function MobileAdminGate({ children }: Props) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [forceMobile, setForceMobile] = useState(readForceMobile);

  const isAdmin = !!user?.role && ADMIN_ROLES.has(user.role);
  const shouldBlock = isMobile && isAdmin && !forceMobile;

  if (!shouldBlock) return <>{children}</>;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 'var(--radius-xl)',
          background: 'var(--color-rm-bg)',
          color: 'var(--color-rm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          marginBottom: 20,
          border: '1px solid var(--color-rm-border)',
        }}
      >
        🖥️
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 12,
          color: 'var(--text-primary)',
        }}
      >
        Только для компьютера
      </h1>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
          maxWidth: 320,
          marginBottom: 28,
        }}
      >
        Админ-разделы (роли, KPI-Pipeline, AI-студия, словари) полноценно
        работают только на десктопе. Откройте платформу с компьютера.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={() => {
            writeForceMobile(true);
            setForceMobile(true);
          }}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: 'var(--color-rm)',
            color: 'var(--text-inverse)',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.04em',
          }}
        >
          Продолжить в моб-режиме
        </button>
        <button
          type="button"
          onClick={async () => {
            await logout();
            window.location.href = '/login';
          }}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          Выйти
        </button>
      </div>

      <p
        className="mt-8"
        style={{
          fontSize: 10,
          letterSpacing: '0.2em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
        }}
      >
        Ваша роль: {user?.role}
      </p>
    </div>
  );
}
