/**
 * LearningRankWidget v2 (2026-05-05)
 *
 * Рейтинг сотрудников по обучению — dark navy + gold для главной страницы.
 * Унифицирован со стилем PulseWidget v2 и страницы /competencies.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { learningApi } from '../../api/learning';
import type { LeaderboardResponse, LeaderboardEntry } from '../../api/learning';
import { useT } from '../../stores/langStore';

// Цвета уровней (синхронизированы с Pulse v2)
const LEVEL_COLOR: Record<string, { color: string; bg: string }> = {
  trainee: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  practitioner: { color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  expert: { color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  master: { color: '#4ADE80', bg: 'rgba(74,222,128,0.15)' },
};

function getRankEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function getRankBadgeStyle(rank: number): React.CSSProperties {
  if (rank === 1) return { background: 'linear-gradient(135deg, #FBBF24, #C8A84B)', color: '#0a1929' };
  if (rank === 2) return { background: 'linear-gradient(135deg, #D1D5DB, #9CA3AF)', color: '#0a1929' };
  if (rank === 3) return { background: 'linear-gradient(135deg, #FB923C, #C2410C)', color: '#fff' };
  return { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' };
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

  // Loading skeleton
  if (loading) {
    return (
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'linear-gradient(180deg, #11243d 0%, rgba(17,36,61,0.6) 100%)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-white/10" />
          <div className="h-20 rounded-xl bg-white/5" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'rgba(17,36,61,0.5)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <p className="text-sm text-white/55">{t('dashboard.leaderboard.loadError')}</p>
      </div>
    );
  }

  const { my_rank, total_in_group, my_progress, leaderboard } = data;
  const myLevel = my_progress?.current_level || 'trainee';
  const myLvlCfg = LEVEL_COLOR[myLevel] || LEVEL_COLOR.trainee;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #11243d 0%, rgba(17,36,61,0.6) 100%)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {/* Header — gold accent */}
      <div
        className="px-5 py-4 sm:px-6 flex items-center justify-between"
        style={{ background: 'linear-gradient(90deg, rgba(200,168,75,0.12), rgba(200,168,75,0.04))', borderBottom: '1px solid rgba(200,168,75,0.2)' }}
      >
        <h2 className="text-base font-bold text-white flex items-center gap-2.5" style={{ fontFamily: "'Unbounded',sans-serif" }}>
          <span className="text-amber-400 text-lg">🏆</span>
          {t('dashboard.leaderboard.title')}
        </h2>
        <Link
          to="/learning"
          className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
        >
          {t('dashboard.leaderboard.goToLearning')} →
        </Link>
      </div>

      {/* My Rank Card */}
      <div className="px-5 py-4 sm:px-6">
        <div
          className="relative rounded-xl border-2 p-4"
          style={{ borderColor: myLvlCfg.color + '66', background: myLvlCfg.bg }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
                style={{ ...getRankBadgeStyle(my_rank), fontFamily: "'Unbounded',sans-serif" }}
              >
                {getRankEmoji(my_rank)}
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/55">
                  {t('dashboard.leaderboard.yourRank')}
                </p>
                <p className="text-xl font-bold text-white" style={{ fontFamily: "'Unbounded',sans-serif" }}>
                  {my_rank}
                  <span className="text-sm font-normal text-white/50 ml-1">
                    {t('dashboard.leaderboard.of')} {total_in_group}
                  </span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border"
                style={{ background: myLvlCfg.bg, color: myLvlCfg.color, borderColor: myLvlCfg.color + '40' }}
              >
                {levelName(myLevel)}
              </span>
              {my_progress && (
                <div className="mt-1.5 flex items-center gap-3 text-xs text-white/55">
                  <span>{t('dashboard.leaderboard.courses')}: <strong className="text-white/80">{my_progress.total_courses_completed}</strong></span>
                  <span>{t('dashboard.leaderboard.score')}: <strong className="text-white/80">{my_progress.avg_quiz_score}%</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Streak */}
          {my_progress && my_progress.current_streak_days > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-white/65">
              <span className="text-orange-400">🔥</span>
              {t('dashboard.leaderboard.streak')}: <strong className="text-white">{my_progress.current_streak_days}</strong> {t('dashboard.leaderboard.days')}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Table */}
      {leaderboard.length > 0 && (
        <div className="px-5 pb-4 sm:px-6">
          <p
            className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/45"
            style={{ fontFamily: "'Unbounded',sans-serif" }}
          >
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
  const cfg = LEVEL_COLOR[entry.current_level] || LEVEL_COLOR.trainee;
  const isMe = entry.is_current_user;

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
      style={{
        background: isMe ? 'rgba(200,168,75,0.10)' : 'rgba(255,255,255,0.02)',
        border: isMe ? '1px solid rgba(200,168,75,0.4)' : '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Rank badge */}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ ...getRankBadgeStyle(entry.rank), fontFamily: "'Unbounded',sans-serif" }}
      >
        {entry.rank <= 3 ? getRankEmoji(entry.rank) : entry.rank}
      </div>

      {/* Name + level */}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${isMe ? 'font-bold text-amber-300' : 'font-medium text-white/85'}`}>
          {entry.full_name}
          {isMe && <span className="ml-1 text-xs text-amber-400/70">({t('dashboard.leaderboard.you')})</span>}
        </p>
        <span
          className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border"
          style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color + '40' }}
        >
          {levelName(entry.current_level)}
        </span>
      </div>

      {/* Stats */}
      <div className="shrink-0 text-right">
        <p
          className="text-sm font-semibold text-white/85"
          style={{ fontFamily: "'Unbounded',sans-serif" }}
        >
          {entry.courses_completed}
        </p>
        <p className="text-[10px] text-white/40">{entry.avg_quiz_score}%</p>
      </div>
    </div>
  );
}
