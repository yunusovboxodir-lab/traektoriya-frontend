/**
 * DashboardPage — главная страница (Командный центр).
 *
 * Tactical-стиль (Module 18 Sprint 1, 2026-05-03).
 * 2026-05-04 cleanup: убраны DIVISIONS, SHELF/STREAK, RANK.
 * 2026-05-04 v2: Stat-cards теперь только для админов (мониторинг платформы);
 * для РМ/СВ/ТП они малополезны (не их KPI) — место освобождается под
 * EmployeeRanking widget (Кубок NMEDOV 2026).
 */
import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';
import { useT, useLangStore } from '../stores/langStore';
import { NudgesWidget } from '../components/dashboard/NudgesWidget';
import { PulseWidget } from '../components/dashboard/PulseWidget';
import {
  TacticalShell, TacticalPanel, TacticalStat,
} from '../components/tactical/shell';

const ADMIN_ROLES = new Set(['superadmin', 'admin', 'commercial_dir']);

interface OverviewStatsRaw {
  users?: { total?: number };
  courses?: { total?: number };
  tasks?: { total?: number };
  products?: { total?: number };
  total_products?: number;
  total_users?: number;
  total_courses?: number;
  total_tasks?: number;
}

interface OverviewStats {
  total_products: number;
  total_users: number;
  total_courses: number;
  total_tasks: number;
}

function normalizeOverview(raw: OverviewStatsRaw): OverviewStats {
  return {
    total_products: raw.products?.total ?? raw.total_products ?? 0,
    total_users: raw.users?.total ?? raw.total_users ?? 0,
    total_courses: raw.courses?.total ?? raw.total_courses ?? 0,
    total_tasks: raw.tasks?.total ?? raw.total_tasks ?? 0,
  };
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const isAdmin = !!user?.role && ADMIN_ROLES.has(user.role);

  useEffect(() => {
    if (!isAdmin) return; // не-админу общая аналитика не нужна
    api.get<OverviewStatsRaw>('/api/v1/analytics/overview')
      .then((res) => setStats(normalizeOverview(res.data)))
      .catch(() => setStats({ total_products: 0, total_users: 0, total_courses: 0, total_tasks: 0 }));
  }, [isAdmin]);

  const today = new Date().toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const operatorRole = user?.role ? t(`roles.${user.role}`) : '';

  return (
    <TacticalShell
      title={t('dashboard.welcome') + (user?.full_name ? `, ${user.full_name}` : '')}
      subtitle={`${today}${operatorRole ? ` · ${operatorRole}` : ''}`}
      meta={
        isAdmin ? (
          <>
            <span><b>{stats?.total_products ?? '—'}</b> {lang === 'uz' ? 'MAHSULOT' : 'ТОВАРОВ'}</span>
            <span><b>{stats?.total_users ?? '—'}</b> {lang === 'uz' ? 'XODIM' : 'СОТРУДНИКОВ'}</span>
            <span><b>{stats?.total_courses ?? '—'}</b> {lang === 'uz' ? 'KURS' : 'КУРСОВ'}</span>
          </>
        ) : undefined
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Dynamic Enablement (compass_artifact L&D 2026 §1.1) — push-нудж дня
           вверху, до Stat-карточек: «что тебе посмотреть прямо сейчас». */}
        <TacticalPanel
          label="DYNAMIC ENABLEMENT"
          title={lang === 'uz' ? 'Bugun siz uchun' : 'Сегодня для вас'}
        >
          <NudgesWidget />
        </TacticalPanel>

        {/* Quick stats — мониторинг платформы (только для admin/superadmin/commercial_dir).
            Для РМ/СВ/ТП эти агрегаты не их KPI — место освобождается под
            будущий EmployeeRanking widget (Кубок NMEDOV 2026). */}
        {isAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <TacticalStat
              label={t('dashboard.stats.products')}
              value={stats?.total_products ?? '—'}
              icon={<span style={{ fontSize: 18 }}>📦</span>}
              accent="info"
            />
            <TacticalStat
              label={t('dashboard.stats.users')}
              value={stats?.total_users ?? '—'}
              icon={<span style={{ fontSize: 18 }}>👥</span>}
              accent="sv"
            />
            <TacticalStat
              label={t('dashboard.stats.courses')}
              value={stats?.total_courses ?? '—'}
              icon={<span style={{ fontSize: 18 }}>📚</span>}
              accent="rm"
              highlight
            />
            <TacticalStat
              label={t('dashboard.stats.tasks')}
              value={stats?.total_tasks ?? '—'}
              icon={<span style={{ fontSize: 18 }}>📋</span>}
              accent="success"
            />
          </div>
        )}

        {/* Pulse — компетенции/уровень (compass §2.4 + §1.5).
            Кликабелен → /competencies для полного радара. */}
        <TacticalPanel label="PULSE" title={lang === 'uz' ? 'Kompetensiyalar pulsi' : 'Пульс компетенций'}>
          <PulseWidget />
        </TacticalPanel>

        {/* TODO 2026-05-04: EmployeeRankingWidget (Кубок NMEDOV 2026)
            KPI = AI tasks (40%) + Learning online+offline (30%) + CRM sales (30%).
            Готовится после получения шаблона CRM Sales Doc от PO. */}
      </div>
    </TacticalShell>
  );
}
