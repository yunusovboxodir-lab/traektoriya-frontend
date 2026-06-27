/**
 * DashboardPage — главная страница (Командный центр).
 *
 * 2026-06-25 v5 (по запросу PO): упрощение.
 *   - Структура: Рейтинг сотрудников → Квесты дня. И всё.
 *   - Убраны с главной: Моя активность, Пульс компетенций, Уведомления о задачах.
 *   - «Моя мощь» переехала в верхнюю полосу (StatusBar → PowerBadge), всегда видна.
 */
import { useAuthStore } from '../stores/authStore';
import { useT, useLangStore } from '../stores/langStore';
import { DailyQuestsWidget } from '../components/dashboard/DailyQuestsWidget';
import { LearningRankWidget } from '../components/dashboard/LearningRankWidget';
import { TacticalShell } from '../components/tactical/shell';

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
        {/* 1. Рейтинг сотрудников — виджет сам себе карточка с заголовком «Рейтинг обучения».
            Внешнюю рамку TacticalPanel убрали (двойная рамка не несла ценности, PO 2026-06-27). */}
        <LearningRankWidget />

        {/* 2. Квесты дня — ежедневная петля (P1). Виджет сам рендерит панель и скрывается, если квестов нет. */}
        <DailyQuestsWidget />
      </div>
    </TacticalShell>
  );
}
