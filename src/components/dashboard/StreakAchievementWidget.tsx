import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGoalsStore } from '../../stores/goalsStore';
import { learningApi } from '../../api/learning';
import { useT } from '../../stores/langStore';

// Уровни достижений — на токенах вместо пастельных bg-orange/gray/amber/indigo
const TIER_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  bronze:   { bg: 'var(--color-rm-bg)',  text: 'var(--color-rm)',  ring: 'var(--color-rm-border)' },
  silver:   { bg: 'var(--bg-elevated)',  text: 'var(--text-primary)', ring: 'var(--border-strong)' },
  gold:     { bg: 'var(--warning-bg)',   text: 'var(--warning)',   ring: 'rgba(251,191,36,0.3)' },
  platinum: { bg: 'var(--color-tp-bg)',  text: 'var(--color-tp)',  ring: 'var(--color-tp-border)' },
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
      <div className="rounded-[var(--radius-lg)] p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 rounded bg-[var(--bg-elevated)]" />
        <div className="h-20 rounded-xl bg-[var(--bg-elevated)]" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-[var(--bg-elevated)]" />
          ))}
        </div>
      </div>
    );
  }

  const recent = achievements.slice(0, 3);

  return (
    <div className="rounded-[var(--radius-lg)] overflow-hidden">
      {/* Header — золото вместо оранжевого gradient */}
      <div className="px-5 py-3 sm:px-6 border-b border-[var(--border)] flex items-center justify-between">
        <h2
          className="text-sm font-semibold flex items-center gap-2 uppercase"
          style={{ color: 'var(--color-rm)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-3.52 1.122 6.023 6.023 0 01-3.52-1.122" />
          </svg>
          {t('dashboard.streak.title')}
        </h2>
        <Link
          to="/goals"
          className="text-xs font-medium hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-rm)' }}
        >
          {t('dashboard.streak.viewAll')} &rarr;
        </Link>
      </div>

      <div className="px-5 py-4 sm:px-6">
        {/* Streak + Points row — токены вместо bg-orange-50/blue-50/emerald-50 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Streak */}
          <div
            className="rounded-xl p-3 text-center ring-1"
            style={{ background: 'var(--warning-bg)', borderColor: 'rgba(251,191,36,0.3)' }}
          >
            <span className="text-2xl">&#x1F525;</span>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--warning)' }}>{streak}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.streak.days')}</p>
          </div>

          {/* Longest streak */}
          <div
            className="rounded-xl p-3 text-center ring-1"
            style={{ background: 'var(--info-bg)', borderColor: 'rgba(96,165,250,0.3)' }}
          >
            <span className="text-2xl">&#x1F3C6;</span>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--info)' }}>{longestStreak}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.streak.best')}</p>
          </div>

          {/* Total points */}
          <div
            className="rounded-xl p-3 text-center ring-1"
            style={{ background: 'var(--success-bg)', borderColor: 'rgba(74,222,128,0.3)' }}
          >
            <span className="text-2xl">&#x2B50;</span>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--success)' }}>{totalPoints}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.streak.points')}</p>
          </div>
        </div>

        {/* Recent achievements */}
        <div>
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('dashboard.streak.recentAchievements')}
          </p>

          {recent.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('dashboard.streak.noAchievements')}</p>
              <Link
                to="/learning"
                className="mt-1 inline-block text-sm font-medium hover:opacity-80"
                style={{ color: 'var(--color-rm)' }}
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
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1"
                    style={{ background: style.bg, borderColor: style.ring }}
                  >
                    <span className="text-xl shrink-0">
                      {ach.icon || TIER_ICON[ach.tier] || '\u{1F3C5}'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold" style={{ color: style.text }}>{ach.title}</p>
                      {ach.description && (
                        <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{ach.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-bold" style={{ color: style.text }}>
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
