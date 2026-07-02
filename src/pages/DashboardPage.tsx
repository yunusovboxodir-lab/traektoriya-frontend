/**
 * DashboardPage — главная страница (Командный центр).
 *
 * 2026-06-25 v5 (по запросу PO): упрощение.
 *   - Структура: Рейтинг сотрудников → Квесты дня. И всё.
 *   - Убраны с главной: Моя активность, Пульс компетенций, Уведомления о задачах.
 *   - «Моя мощь» переехала в верхнюю полосу (StatusBar → PowerBadge), всегда видна.
 *
 * 2026-07-02 (Кодекс 08_patterns_dashboard.md v2.0, quest-first): для роли sales_rep
 *   порядок изменён на «Квесты дня» → «Лидерборд» — реальное действие дня видно первым,
 *   социальное сравнение (может демотивировать новичка/отстающего) идёт вторым.
 *   Для остальных ролей (admin+, supervisor и т.д.) порядок не менялся.
 *
 * 2026-07-02 (Кодекс, СВ — командный разрез): для роли supervisor личный лидерборд
 *   обучения (LearningRankWidget) скрыт целиком — СВ не соревнуется как ученик среди
 *   своих ТП. Командный разрез живёт на отдельной странице «Команда» (SupervisorDashboardPage).
 */
import { useAuthStore } from '../stores/authStore';
import { useT, useLangStore } from '../stores/langStore';
import { DailyQuestsWidget } from '../components/dashboard/DailyQuestsWidget';
import { LearningRankWidget } from '../components/dashboard/LearningRankWidget';
import { TacticalShell } from '../components/tactical/shell';
import { formatDateLong } from '../utils/formatDate';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const t = useT();
  const lang = useLangStore((s) => s.lang);

  // Intl.DateTimeFormat('uz-UZ', {month:'long'}) даёт артефакты вида «2026 M07 2»
  // (ICU-данные для uz-UZ ненадёжны в браузерах) — используем ручной форматтер.
  const today = formatDateLong(new Date(), lang);

  const operatorRole = user?.role ? t(`roles.${user.role}`) : '';

  const isSalesRep = user?.role === 'sales_rep';
  const isSupervisor = user?.role === 'supervisor';

  return (
    <TacticalShell
      title={t('dashboard.welcome') + (user?.full_name ? `, ${user.full_name}` : '')}
      subtitle={`${today}${operatorRole ? ` · ${operatorRole}` : ''}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {isSalesRep ? (
          <>
            {/* 1. Квесты дня первыми (quest-first, решение владельца 2026-07-02):
                реальное действие сегодня — раньше социального сравнения. */}
            <DailyQuestsWidget />

            {/* 2. Рейтинг обучения — после того, как ТП увидел, что делать сегодня. */}
            <LearningRankWidget />
          </>
        ) : (
          <>
            {/* Рейтинг сотрудников — виджет сам себе карточка с заголовком «Рейтинг обучения».
                Внешнюю рамку TacticalPanel убрали (двойная рамка не несла ценности, PO 2026-06-27).
                Для supervisor скрыт целиком — командный разрез живёт на странице «Команда»,
                СВ не соревнуется как ученик среди своих ТП (Кодекс 08, находка ux-qa №14). */}
            {!isSupervisor && <LearningRankWidget />}

            {/* Квесты дня — ежедневная петля (P1). Виджет сам рендерит панель и скрывается, если квестов нет. */}
            <DailyQuestsWidget />
          </>
        )}
      </div>
    </TacticalShell>
  );
}
