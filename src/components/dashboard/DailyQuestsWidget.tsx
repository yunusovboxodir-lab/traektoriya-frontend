import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { goalsApi, type Goal } from '../../api/goals';
import { useLangStore, useT } from '../../stores/langStore';
import { TacticalPanel } from '../tactical/shell';

/**
 * Куда ведёт квест по клику. Дневные квесты в основном про обучение
 * («закрой раздел») → /learning; по категории можно уточнить цель.
 * Авто-отметка «выполнено» — на бэке при реальном выполнении условия.
 */
function questTarget(q: Goal): string {
  const cat = q.metadata?.category;
  if (cat === 'tasks') return '/tasks';
  if (cat === 'products') return '/products';
  return '/learning';
}

/** Ташкентская «сегодня» (UTC+5) в формате YYYY-MM-DD. */
function tashkentToday(): string {
  const now = new Date();
  const tash = new Date(now.getTime() + (5 * 60 - now.getTimezoneOffset()) * 60000);
  return tash.toISOString().slice(0, 10);
}

export function DailyQuestsWidget() {
  const lang = useLangStore((s) => s.lang);
  const t = useT();
  const navigate = useNavigate();
  const [quests, setQuests] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const today = tashkentToday();
    goalsApi.list()
      .then((res) => {
        const items = (res.data?.items ?? [])
          .filter((g) => g.type === 'daily_quest' && g.metadata?.quest_date === today)
          .sort((a, b) => (a.metadata?.order ?? 0) - (b.metadata?.order ?? 0));
        setQuests(items);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  // Сбой загрузки ≠ «квестов нет». Раньше .catch() ставил пустой массив, и
  // упавший запрос выглядел как честная пустота — отсюда жалобы «платформа
  // показывает нули». Молчать об ошибке нельзя, но и пугать полевого
  // сотрудника стеком не нужно: показываем спокойную строку с возможностью
  // повторить.
  if (loading) return null;

  if (failed) {
    return (
      <TacticalPanel label="QUESTS" title={t('dashboard.quests.title')}>
        <div className="px-5 py-4 sm:px-6 flex items-center justify-between gap-3">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('dashboard.quests.loadFailed')}
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm font-semibold underline underline-offset-2"
            style={{ color: 'var(--accent)' }}
          >
            {t('common.actions.retry')}
          </button>
        </div>
      </TacticalPanel>
    );
  }

  // Квестов действительно нет (не ТП / не сгенерированы) → панель не показываем.
  if (quests.length === 0) return null;

  const done = quests.filter((q) => q.status === 'completed').length;

  return (
    <TacticalPanel label="QUESTS" title={lang === 'uz' ? 'Bugungi vazifalar' : 'Квесты дня'}>
      <div className="px-5 py-3 sm:px-6 border-b border-[var(--border)] flex items-center justify-end">
        <span className="text-xs font-bold" style={{ color: done === quests.length ? 'var(--success)' : 'var(--text-secondary)' }}>
          {done}/{quests.length}
        </span>
      </div>

      <div className="px-5 py-4 sm:px-6 space-y-2">
        {quests.map((q) => {
          const completed = q.status === 'completed';
          const title = lang === 'uz' ? (q.metadata?.title_uz ?? q.title) : q.title;
          return (
            <button
              key={q.id}
              type="button"
              onClick={completed ? undefined : () => navigate(questTarget(q))}
              disabled={completed}
              className="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1 transition-colors"
              style={{
                background: completed ? 'var(--success-bg)' : 'var(--bg-elevated)',
                borderColor: completed ? 'rgba(74,222,128,0.3)' : 'var(--border)',
                cursor: completed ? 'default' : 'pointer',
              }}
            >
              <span className="text-lg shrink-0">{completed ? '✅' : (q.metadata?.icon ?? '⬜')}</span>
              <span
                className="text-sm flex-1"
                style={{
                  color: completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                  textDecoration: completed ? 'line-through' : 'none',
                }}
              >
                {title}
              </span>
              {!completed && (
                <span className="shrink-0" aria-hidden="true" style={{ color: 'var(--text-muted)' }}>›</span>
              )}
            </button>
          );
        })}
        {done === quests.length && (
          <p className="text-center text-xs pt-1" style={{ color: 'var(--success)' }}>
            {lang === 'uz' ? 'Barcha vazifalar bajarildi! 🔥' : 'Все квесты дня закрыты! 🔥'}
          </p>
        )}
      </div>
    </TacticalPanel>
  );
}
