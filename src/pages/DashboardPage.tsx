/**
 * DashboardPage — главная страница (Командный центр).
 *
 * 2026-05-05 v4 (по запросу PO):
 *   - Удалены stat-cards (Товары/Пользователи/Курсы/Задачи) и meta в шапке —
 *     это мониторинг платформы, на главной не нужен. Админу есть /analytics.
 *   - Структура: Рейтинг (Лига Чемпионов) → Пульс (эффектный) → Уведомления о задачах.
 */
import { useAuthStore } from '../stores/authStore';
import { useT, useLangStore } from '../stores/langStore';
import { PowerWidget } from '../components/dashboard/PowerWidget';
import { DailyQuestsWidget } from '../components/dashboard/DailyQuestsWidget';
import { LearningRankWidget } from '../components/dashboard/LearningRankWidget';
import { PulseWidget } from '../components/dashboard/PulseWidget';
import { ActivityWidget } from '../components/dashboard/ActivityWidget';
import { TasksNotificationsWidget } from '../components/dashboard/TasksNotificationsWidget';
import { TacticalShell, TacticalPanel } from '../components/tactical/shell';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const t = useT();
  const lang = useLangStore((s) => s.lang);

  const today = new Date().toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const operatorRole = user?.role ? t(`roles.${user.role}`) : '';

  return (
    <TacticalShell
      title={t('dashboard.welcome') + (user?.full_name ? `, ${user.full_name}` : '')}
      subtitle={`${today}${operatorRole ? ` · ${operatorRole}` : ''}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 0. Моя мощь — единый накопительный счётчик (Phase 0 геймификации). */}
        <TacticalPanel
          label="POWER"
          title={lang === 'uz' ? 'Mening kuchim' : 'Моя мощь'}
        >
          <PowerWidget />
        </TacticalPanel>

        {/* 0.5. Квесты дня — ежедневная петля (P1). Виджет сам рендерит панель и скрывается, если квестов нет. */}
        <DailyQuestsWidget />

        {/* 1. Рейтинг сотрудников — Лига Чемпионов с total_score 50/30/20. */}
        <TacticalPanel
          label="RANK"
          title={lang === 'uz' ? 'Xodimlar reytingi' : 'Рейтинг сотрудников'}
        >
          <LearningRankWidget />
        </TacticalPanel>

        {/* 2. Моя активность за 30 дней — ShelfScan + Tasks + Achievements + Streak. */}
        <TacticalPanel
          label="ACTIVITY"
          title={lang === 'uz' ? 'Mening faolligim' : 'Моя активность'}
        >
          <ActivityWidget />
        </TacticalPanel>

        {/* 3. Пульс компетенций — эффектный + информативный. */}
        <TacticalPanel
          label="PULSE"
          title={lang === 'uz' ? 'Kompetensiyalar pulsi' : 'Пульс компетенций'}
        >
          <PulseWidget />
        </TacticalPanel>

        {/* 4. Уведомления о висящих задачах — отдельным блоком. */}
        <TacticalPanel
          label="TASKS"
          title={lang === 'uz' ? 'Vazifalar bo\'yicha bildirishnomalar' : 'Уведомления о висящих задачах'}
        >
          <TasksNotificationsWidget />
        </TacticalPanel>

        {/* TODO: Кубок v2 (Tournament) widget — после согласования формата с Ком.Дир + РМ.
            Старая Cup-verification версия заморожена PO 2026-05-05. */}
      </div>
    </TacticalShell>
  );
}
