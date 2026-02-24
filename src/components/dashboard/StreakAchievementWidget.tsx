import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGoalsStore } from '../../stores/goalsStore';
import { learningApi } from '../../api/learning';
import { useT } from '../../stores/langStore';

const TIER_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  bronze: { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-200' },
  silver: { bg: 'bg-gray-100', text: 'text-gray-600', ring: 'ring-gray-300' },
  gold: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-300' },
  platinum: { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-300' },
};

const TIER_ICON: Record<string, string> = {
  bronze: '\u{1F949}',
  silver: '\u{1F948}',
  gold: '\u{1F947}',
  platinum: '\u{1F48E}',
};

export function StreakAchievementWidget() {
  const achievements = useGoalsStore((s) => s.achievements);
  const totalPoints = useGoalsStore((s) => s.totalPoints);
  const fetchAchievements = useGoalsStore((s) => s.fetchAchievements);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const t = useT();

  useEffect(() => {
    const load = async () => {
      try {
        await fetchAchievements();
        const res = await learningApi.getLeaderboard(1);
        const progress = res.data?.my_progress;
        if (progress) {
          setStreak(progress.current_streak_days ?? 0);
          setLongestStreak(progress.longest_streak_days ?? 0);
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="h-20 rounded-xl bg-gray-100" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recent = achievements.slice(0, 3);

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-3.52 1.122 6.023 6.023 0 01-3.52-1.122" />
            </svg>
            {t('dashboard.streak.title')}
          </h2>
          <Link
            to="/goals"
            className="text-xs font-medium text-amber-200 hover:text-white transition-colors"
          >
            {t('dashboard.streak.viewAll')} &rarr;
          </Link>
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6">
        {/* Streak + Points row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Streak */}
          <div className="rounded-xl bg-orange-50 p-3 text-center ring-1 ring-orange-200">
            <span className="text-2xl">&#x1F525;</span>
            <p className="text-2xl font-bold text-orange-600 mt-1">{streak}</p>
            <p className="text-xs text-gray-500">{t('dashboard.streak.days')}</p>
          </div>

          {/* Longest streak */}
          <div className="rounded-xl bg-blue-50 p-3 text-center ring-1 ring-blue-200">
            <span className="text-2xl">&#x1F3C6;</span>
            <p className="text-2xl font-bold text-blue-600 mt-1">{longestStreak}</p>
            <p className="text-xs text-gray-500">{t('dashboard.streak.best')}</p>
          </div>

          {/* Total points */}
          <div className="rounded-xl bg-emerald-50 p-3 text-center ring-1 ring-emerald-200">
            <span className="text-2xl">&#x2B50;</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{totalPoints}</p>
            <p className="text-xs text-gray-500">{t('dashboard.streak.points')}</p>
          </div>
        </div>

        {/* Recent achievements */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {t('dashboard.streak.recentAchievements')}
          </p>

          {recent.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400">{t('dashboard.streak.noAchievements')}</p>
              <Link
                to="/learning"
                className="mt-1 inline-block text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                {t('dashboard.streak.startLearning')}
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((ach) => {
                const style = TIER_STYLES[ach.tier] || TIER_STYLES.bronze;
                return (
                  <div
                    key={ach.id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1 ${style.ring} ${style.bg}`}
                  >
                    <span className="text-xl shrink-0">
                      {ach.icon || TIER_ICON[ach.tier] || '\u{1F3C5}'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${style.text}`}>{ach.title}</p>
                      {ach.description && (
                        <p className="text-xs text-gray-500 truncate">{ach.description}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-xs font-bold ${style.text}`}>
                      +{ach.points}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
