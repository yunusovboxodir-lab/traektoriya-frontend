import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { learningApi } from '../../api/learning';
import type { LeaderboardResponse, LeaderboardEntry } from '../../api/learning';
import { useT } from '../../stores/langStore';

const LEVEL_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  trainee: { color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-300' },
  practitioner: { color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300' },
  expert: { color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-300' },
  master: { color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300' },
};

function getRankEmoji(rank: number): string {
  if (rank === 1) return '\u{1F947}';
  if (rank === 2) return '\u{1F948}';
  if (rank === 3) return '\u{1F949}';
  return `#${rank}`;
}

function getRankStyle(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
  if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
  if (rank === 3) return 'bg-gradient-to-r from-orange-300 to-orange-400 text-white';
  return 'bg-gray-100 text-gray-600';
}

export function LearningRankWidget() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const t = useT();

  useEffect(() => {
    setLoading(true);
    setError(false);
    learningApi
      .getLeaderboard(10)
      .then((res) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const levelName = (level: string) =>
    t(`dashboard.leaderboard.levels.${level}`);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="h-20 rounded-xl bg-gray-100" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <p className="text-sm text-gray-500">{t('dashboard.leaderboard.loadError')}</p>
      </div>
    );
  }

  const { my_rank, total_in_group, my_progress, leaderboard } = data;
  const myLevel = my_progress?.current_level || 'trainee';
  const myLevelCfg = LEVEL_CONFIG[myLevel] || LEVEL_CONFIG.trainee;

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
            </svg>
            {t('dashboard.leaderboard.title')}
          </h2>
          <Link
            to="/learning"
            className="text-xs font-medium text-blue-200 hover:text-white transition-colors"
          >
            {t('dashboard.leaderboard.goToLearning')} &rarr;
          </Link>
        </div>
      </div>

      {/* My Rank Card */}
      <div className="px-5 py-4 sm:px-6">
        <div className={`relative rounded-xl border-2 ${myLevelCfg.border} ${myLevelCfg.bg} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${getRankStyle(my_rank)}`}>
                {getRankEmoji(my_rank)}
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.leaderboard.yourRank')}</p>
                <p className="text-xl font-bold text-gray-900">
                  {my_rank} <span className="text-sm font-normal text-gray-500">{t('dashboard.leaderboard.of')} {total_in_group}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${myLevelCfg.bg} ${myLevelCfg.color}`}>
                {levelName(myLevel)}
              </span>
              {my_progress && (
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span>{t('dashboard.leaderboard.courses')}: {my_progress.total_courses_completed}</span>
                  <span>{t('dashboard.leaderboard.score')}: {my_progress.avg_quiz_score}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar — streak */}
          {my_progress && my_progress.current_streak_days > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
              <span className="text-orange-500">&#x1F525;</span>
              {t('dashboard.leaderboard.streak')}: {my_progress.current_streak_days} {t('dashboard.leaderboard.days')}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Table */}
      {leaderboard.length > 0 && (
        <div className="px-5 pb-4 sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {t('dashboard.leaderboard.tableTitle')}
          </p>
          <div className="space-y-1.5">
            {leaderboard.map((entry) => (
              <LeaderboardRow key={entry.user_id} entry={entry} t={t} levelName={levelName} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({
  entry,
  t,
  levelName,
}: {
  entry: LeaderboardEntry;
  t: (key: string, params?: Record<string, string | number>) => string;
  levelName: (level: string) => string;
}) {
  const cfg = LEVEL_CONFIG[entry.current_level] || LEVEL_CONFIG.trainee;
  const isMe = entry.is_current_user;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        isMe ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-gray-50'
      }`}
    >
      {/* Rank */}
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getRankStyle(entry.rank)}`}>
        {entry.rank <= 3 ? getRankEmoji(entry.rank) : entry.rank}
      </div>

      {/* Name + level */}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${isMe ? 'font-bold text-indigo-700' : 'font-medium text-gray-800'}`}>
          {entry.full_name}
          {isMe && <span className="ml-1 text-xs text-indigo-500">({t('dashboard.leaderboard.you')})</span>}
        </p>
        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
          {levelName(entry.current_level)}
        </span>
      </div>

      {/* Stats */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-gray-700">{entry.courses_completed}</p>
        <p className="text-[10px] text-gray-400">{entry.avg_quiz_score}%</p>
      </div>
    </div>
  );
}
