/**
 * DashboardPage — главная страница (Командный центр).
 *
 * Tactical-стиль (Module 18 Sprint 1, 2026-05-03):
 * Использует TacticalShell + базовые tactical-компоненты вместо Layout/Tailwind.
 * Виджеты (Nudges/ShelfScan/Streak/LearningRank) обёрнуты в TacticalPanel —
 * сохраняют свой внутренний Tailwind-стиль до их собственной миграции.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';
import { useT, useLangStore } from '../stores/langStore';
import { NudgesWidget } from '../components/dashboard/NudgesWidget';
import { LearningRankWidget } from '../components/dashboard/LearningRankWidget';
import { ShelfScanHistoryWidget } from '../components/dashboard/ShelfScanHistoryWidget';
import { StreakAchievementWidget } from '../components/dashboard/StreakAchievementWidget';
import { PulseWidget } from '../components/dashboard/PulseWidget';
import {
  TacticalShell, TacticalPanel, TacticalStat, TacticalCard, TacticalGrid,
} from '../components/tactical/shell';

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

const NAV_CARDS = [
  { titleKey: 'nav.learning', descKey: 'dashboard.cards.learningDesc', path: '/learning', icon: '📚' },
  { titleKey: 'nav.products', descKey: 'dashboard.cards.productsDesc', path: '/products', icon: '📦' },
  { titleKey: 'nav.tasks', descKey: 'dashboard.cards.tasksDesc', path: '/tasks', icon: '📋' },
  { titleKey: 'nav.team', descKey: 'dashboard.cards.teamDesc', path: '/team', icon: '👥' },
  { titleKey: 'nav.competencies', descKey: 'dashboard.cards.assessmentsDesc', path: '/competencies', icon: '🎯' },
  { titleKey: 'nav.aiStudio', descKey: 'dashboard.cards.generationDesc', path: '/ai-studio', icon: '✨' },
  { titleKey: 'nav.planogram', descKey: 'dashboard.cards.planogramDesc', path: '/planogram', icon: '📐' },
  { titleKey: 'nav.analytics', descKey: 'dashboard.cards.analyticsDesc', path: '/analytics', icon: '📊' },
  { titleKey: 'nav.trainingPlan', descKey: 'dashboard.cards.trainingPlanDesc', path: '/training-plan', icon: '🎓' },
];

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const [stats, setStats] = useState<OverviewStats | null>(null);

  useEffect(() => {
    api.get<OverviewStatsRaw>('/api/v1/analytics/overview')
      .then((res) => setStats(normalizeOverview(res.data)))
      .catch(() => setStats({ total_products: 0, total_users: 0, total_courses: 0, total_tasks: 0 }));
  }, []);

  const today = new Date().toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const operatorRole = user?.role ? t(`roles.${user.role}`) : '';

  return (
    <TacticalShell
      title={t('dashboard.welcome') + (user?.full_name ? `, ${user.full_name}` : '')}
      subtitle={`${today}${operatorRole ? ` · ${operatorRole}` : ''}`}
      meta={
        <>
          <span><b>{stats?.total_products ?? '—'}</b> {lang === 'uz' ? 'MAHSULOT' : 'ТОВАРОВ'}</span>
          <span><b>{stats?.total_users ?? '—'}</b> {lang === 'uz' ? 'XODIM' : 'СОТРУДНИКОВ'}</span>
          <span><b>{stats?.total_courses ?? '—'}</b> {lang === 'uz' ? 'KURS' : 'КУРСОВ'}</span>
        </>
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

        {/* Quick stats — 4 карточки */}
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

        {/* Navigation cards */}
        <TacticalPanel label="DIVISIONS" title={t('dashboard.sections')}>
          <TacticalGrid minColWidth={240} gap={12}>
            {NAV_CARDS.map((card) => (
              <TacticalCard
                key={card.path}
                onClick={() => navigate(card.path)}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                }}>
                  <span style={{ fontSize: 28 }}>{card.icon}</span>
                </div>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 600,
                  color: 'var(--text-0)', marginBottom: 4, letterSpacing: '0.02em',
                }}>
                  {t(card.titleKey)}
                </div>
                <div style={{
                  fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4,
                }}>
                  {t(card.descKey)}
                </div>
              </TacticalCard>
            ))}
          </TacticalGrid>
        </TacticalPanel>

        {/* Pulse — компетенции/уровень (compass §2.4 + §1.5: pulse-трекеры
            короткие, частые, мобильные. Виджет кликабелен → /competencies). */}
        <TacticalPanel label="PULSE" title={lang === 'uz' ? 'Pulsi' : 'Пульс компетенций'}>
          <PulseWidget />
        </TacticalPanel>

        {/* Widgets — токены подтянуты в Блоке 1.3 (gradient-killer). */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14 }}>
          <TacticalPanel label="SHELF" title={lang === 'uz' ? "Yaqindagi tahlillar" : 'Недавние фотоанализы'}>
            <ShelfScanHistoryWidget />
          </TacticalPanel>
          <TacticalPanel label="STREAK" title={lang === 'uz' ? 'Yutuqlar' : 'Достижения'}>
            <StreakAchievementWidget />
          </TacticalPanel>
        </div>

        <TacticalPanel label="RANK" title={lang === 'uz' ? "O'qish reytingi" : 'Рейтинг обучения'}>
          <LearningRankWidget />
        </TacticalPanel>
      </div>
    </TacticalShell>
  );
}
