/**
 * Module 17: Case Studio — «Мой XP» (личная статистика).
 *
 * Маршрут: /case-studio/my
 * Доступ: все аутентифицированные.
 *
 * Показывает:
 *  - Карточки с цифрами (всего XP, кейсы, решения, оценки, TOP-3, popular)
 *  - Разбивка по типам действий (как зарабатывал XP)
 *  - Текущая позиция в leaderboard
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseStudioApi } from '../api/caseStudio';
import { useAuthStore } from '../stores/authStore';
import type { LeaderboardEntry, MyStats } from '../types/caseStudio';
import { SkeletonCard } from '@/components/ui';

const ACTION_LABELS: Record<string, string> = {
  scenario_created: 'Создание кейса',
  solution_added: 'Предложение решения',
  rating_given: 'Оценка',
  top3_winner: 'Решение в TOP-3',
  scenario_popular: 'Кейс с 50+ оценок',
};

const ACTION_POINTS: Record<string, number> = {
  scenario_created: 50,
  solution_added: 20,
  rating_given: 5,
  top3_winner: 100,
  scenario_popular: 200,
};

export function CaseStudioMyPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([caseStudioApi.myStats(), caseStudioApi.leaderboard(100)])
      .then(([ms, lb]) => {
        setStats(ms.data);
        setLeaderboard(lb.data || []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const myRank = useMemo(() => {
    if (!user || leaderboard.length === 0) return null;
    const idx = leaderboard.findIndex((e) => e.user_id === user.id);
    return idx >= 0 ? idx + 1 : null;
  }, [leaderboard, user]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 grid gap-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={3} />
      </div>
    );
  }
  if (error) {
    return <div className="max-w-3xl mx-auto p-6 text-red-600">Ошибка: {error}</div>;
  }
  if (!stats) {
    return <div className="max-w-3xl mx-auto p-6">Нет данных</div>;
  }

  const totalActions =
    stats.scenarios_created + stats.solutions_added + stats.ratings_given;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate('/case-studio')}
        className="text-sm mb-4"
        style={{ color: 'var(--text-muted)' }}
      >
        ← К Кейсотеке
      </button>

      <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Мой XP в Кейсотеке</h1>
      <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
        За что начисляются баллы — внизу страницы. Чем больше пишешь и оцениваешь, тем выше в лидерборде.
      </p>

      {/* Hero card with total XP */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'linear-gradient(135deg, var(--success), #0B7568)', color: 'var(--text-inverse)' }}>
        <div className="text-sm uppercase tracking-wider mb-1" style={{ opacity: 0.8 }}>Всего XP</div>
        <div className="text-5xl font-bold mb-2">{stats.total_xp}</div>
        {myRank && (
          <div className="text-sm" style={{ opacity: 0.9 }}>
            Место в лидерборде: <strong>#{myRank}</strong> из {leaderboard.length}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <StatCard label="Создано кейсов" value={stats.scenarios_created} />
        <StatCard label="Предложено решений" value={stats.solutions_added} />
        <StatCard label="Поставлено оценок" value={stats.ratings_given} />
        <StatCard label="Решения в TOP-3" value={stats.top3_solutions} />
        <StatCard label="Популярные кейсы" value={stats.popular_scenarios} />
        <StatCard label="Всего действий" value={totalActions} />
      </div>

      {/* XP breakdown by action */}
      <div className="rounded-lg p-5 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Разбивка XP по действиям</h2>
        <div className="space-y-2">
          {Object.keys(ACTION_LABELS).map((action) => {
            const xp = stats.by_action[action] || 0;
            if (xp === 0) return null;
            const points = ACTION_POINTS[action];
            const count = points > 0 ? Math.round(xp / points) : 0;
            return (
              <div key={action} className="flex items-center justify-between py-2 last:border-0" style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ACTION_LABELS[action]}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {count}× × +{points} XP
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-medium" style={{ color: 'var(--success)' }}>+{xp}</div>
                </div>
              </div>
            );
          })}
          {totalActions === 0 && (
            <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
              <p className="mb-3">Пока нет ни одного действия.</p>
              <button
                onClick={() => navigate('/case-studio/new')}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
              >
                Создать первый кейс
              </button>
            </div>
          )}
        </div>
      </div>

      {/* How to earn XP */}
      <div className="rounded-lg p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <h2 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Как заработать XP</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Создать кейс (status=published)</span>
            <span className="font-medium" style={{ color: 'var(--success)' }}>+50 XP</span>
          </li>
          <li className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Предложить решение (cap 5/неделю)</span>
            <span className="font-medium" style={{ color: 'var(--success)' }}>+20 XP</span>
          </li>
          <li className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Поставить оценку (cap 20/неделю)</span>
            <span className="font-medium" style={{ color: 'var(--success)' }}>+5 XP</span>
          </li>
          <li className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Решение попало в TOP-3 (мин. 3 оценки)</span>
            <span className="font-medium" style={{ color: 'var(--success)' }}>+100 XP бонус</span>
          </li>
          <li className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Кейс собрал 50+ оценок</span>
            <span className="font-medium" style={{ color: 'var(--success)' }}>+200 XP бонус</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg p-4 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}
