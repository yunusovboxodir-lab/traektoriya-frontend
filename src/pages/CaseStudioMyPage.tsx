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
        className="text-sm text-stone-600 hover:text-stone-900 mb-4"
      >
        ← К Кейсотеке
      </button>

      <h1 className="text-2xl font-serif text-stone-800 mb-2">Мой XP в Кейсотеке</h1>
      <p className="text-stone-600 mb-6">
        За что начисляются баллы — внизу страницы. Чем больше пишешь и оцениваешь, тем выше в лидерборде.
      </p>

      {/* Hero card with total XP */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl p-6 mb-6 shadow-lg">
        <div className="text-sm uppercase tracking-wider opacity-80 mb-1">Всего XP</div>
        <div className="text-5xl font-bold mb-2">{stats.total_xp}</div>
        {myRank && (
          <div className="text-sm opacity-90">
            Место в лидерборде: <strong>#{myRank}</strong> из {leaderboard.length}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <StatCard label="Создано кейсов" value={stats.scenarios_created} icon="📚" />
        <StatCard label="Предложено решений" value={stats.solutions_added} icon="💡" />
        <StatCard label="Поставлено оценок" value={stats.ratings_given} icon="⭐" />
        <StatCard label="Решения в TOP-3" value={stats.top3_solutions} icon="🥇" />
        <StatCard label="Популярные кейсы" value={stats.popular_scenarios} icon="🔥" />
        <StatCard label="Всего действий" value={totalActions} icon="🎯" />
      </div>

      {/* XP breakdown by action */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 mb-6">
        <h2 className="font-medium text-stone-800 mb-4">Разбивка XP по действиям</h2>
        <div className="space-y-2">
          {Object.keys(ACTION_LABELS).map((action) => {
            const xp = stats.by_action[action] || 0;
            if (xp === 0) return null;
            const points = ACTION_POINTS[action];
            const count = points > 0 ? Math.round(xp / points) : 0;
            return (
              <div key={action} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-stone-800">{ACTION_LABELS[action]}</div>
                  <div className="text-xs text-stone-600">
                    {count}× × +{points} XP
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-medium text-emerald-700">+{xp}</div>
                </div>
              </div>
            );
          })}
          {totalActions === 0 && (
            <div className="text-center py-6 text-stone-600">
              <p className="mb-3">Пока нет ни одного действия.</p>
              <button
                onClick={() => navigate('/case-studio/new')}
                className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700"
              >
                Создать первый кейс
              </button>
            </div>
          )}
        </div>
      </div>

      {/* How to earn XP */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-5">
        <h2 className="font-medium text-stone-800 mb-3">Как заработать XP</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between">
            <span className="text-stone-700">📚 Создать кейс (status=published)</span>
            <span className="font-medium text-emerald-700">+50 XP</span>
          </li>
          <li className="flex justify-between">
            <span className="text-stone-700">💡 Предложить решение (cap 5/неделю)</span>
            <span className="font-medium text-emerald-700">+20 XP</span>
          </li>
          <li className="flex justify-between">
            <span className="text-stone-700">⭐ Поставить оценку (cap 20/неделю)</span>
            <span className="font-medium text-emerald-700">+5 XP</span>
          </li>
          <li className="flex justify-between">
            <span className="text-stone-700">🥇 Решение попало в TOP-3 (мин. 3 оценки)</span>
            <span className="font-medium text-emerald-700">+100 XP бонус</span>
          </li>
          <li className="flex justify-between">
            <span className="text-stone-700">🔥 Кейс собрал 50+ оценок</span>
            <span className="font-medium text-emerald-700">+200 XP бонус</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-medium text-stone-800">{value}</div>
      <div className="text-xs text-stone-600 mt-0.5">{label}</div>
    </div>
  );
}
