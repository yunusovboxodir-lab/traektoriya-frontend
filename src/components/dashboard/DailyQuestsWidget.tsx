import { useEffect, useState } from 'react';
import { goalsApi, type Goal } from '../../api/goals';
import { useLangStore } from '../../stores/langStore';
import { TacticalPanel } from '../tactical/shell';

/** Ташкентская «сегодня» (UTC+5) в формате YYYY-MM-DD. */
function tashkentToday(): string {
  const now = new Date();
  const tash = new Date(now.getTime() + (5 * 60 - now.getTimezoneOffset()) * 60000);
  return tash.toISOString().slice(0, 10);
}

export function DailyQuestsWidget() {
  const lang = useLangStore((s) => s.lang);
  const [quests, setQuests] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = tashkentToday();
    goalsApi.list()
      .then((res) => {
        const items = (res.data?.items ?? [])
          .filter((g) => g.type === 'daily_quest' && g.metadata?.quest_date === today)
          .sort((a, b) => (a.metadata?.order ?? 0) - (b.metadata?.order ?? 0));
        setQuests(items);
      })
      .catch(() => setQuests([]))
      .finally(() => setLoading(false));
  }, []);

  // Нет квестов (не ТП / не сгенерированы) → панель не показываем целиком.
  if (loading || quests.length === 0) return null;

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
            <div
              key={q.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1"
              style={{
                background: completed ? 'var(--success-bg)' : 'var(--bg-elevated)',
                borderColor: completed ? 'rgba(74,222,128,0.3)' : 'var(--border)',
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
            </div>
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
