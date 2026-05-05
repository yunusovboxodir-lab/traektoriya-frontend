/**
 * DashboardPage — главная страница (Командный центр).
 *
 * Tactical-стиль (Module 18 Sprint 1, 2026-05-03).
 * 2026-05-04 cleanup: убраны DIVISIONS, SHELF/STREAK, RANK.
 * 2026-05-04 v2: Stat-cards только для админов; место освобождается
 * под виджеты сотруднику.
 * 2026-05-05 v3: Новый порядок по запросу PO:
 *   1) Stat-cards (admin)
 *   2) Рейтинг сотрудников (LearningRank — топ-10)
 *   3) Пульс v2 со встроенными уведомлениями (раньше nudges были отдельным блоком)
 *   4) CUP (для верификаторов)
 */
import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';
import { useT, useLangStore } from '../stores/langStore';
import { LearningRankWidget } from '../components/dashboard/LearningRankWidget';
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
        {/* Quick stats — мониторинг платформы (только для admin/superadmin/commercial_dir). */}
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

        {/* Рейтинг сотрудников — топ-10 по обучению (LMS leaderboard).
            По запросу PO (2026-05-05) — выводим первым после статов: сотрудник
            видит «где я в рейтинге» прежде чем смотреть свой пульс. */}
        <TacticalPanel
          label="RANK"
          title={lang === 'uz' ? 'Xodimlar reytingi' : 'Рейтинг сотрудников'}
        >
          <LearningRankWidget />
        </TacticalPanel>

        {/* Пульс v2 — компетенции/уровень + встроенные уведомления (nudges).
            По запросу PO (2026-05-05) — отдельный блок NudgesWidget убран,
            уведомления теперь в правой колонке внутри карточки Pulse.
            Кликабелен → /competencies для полного радара. */}
        <TacticalPanel label="PULSE" title={lang === 'uz' ? 'Kompetensiyalar pulsi' : 'Пульс компетенций'}>
          <PulseWidget />
        </TacticalPanel>

        {/* TODO: Кубок v2 (Tournament) widget — после согласования формата с Ком.Дир + РМ.
            Старая Cup-verification версия заморожена PO 2026-05-05. */}
        {/* TODO: полный EmployeeRankingWidget (40/30/30) — после получения CRM Sales Doc. */}
      </div>
    </TacticalShell>
  );
}
