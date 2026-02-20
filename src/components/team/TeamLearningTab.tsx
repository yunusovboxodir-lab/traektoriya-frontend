import { useState, useEffect } from 'react';
import { teamApi, type TeamLearningResponse, type MemberLearningData } from '../../api/team';
import { useT } from '../../stores/langStore';

// ═══════════════════════════════════════════════════════════════
// LEVEL CONFIG
// ═══════════════════════════════════════════════════════════════

const LEVEL_CONFIG: Record<string, { color: string; bg: string; bar: string }> = {
  trainee:      { color: 'text-gray-600',   bg: 'bg-gray-100',   bar: 'bg-gray-400' },
  practitioner: { color: 'text-blue-700',   bg: 'bg-blue-100',   bar: 'bg-blue-500' },
  expert:       { color: 'text-purple-700', bg: 'bg-purple-100', bar: 'bg-purple-500' },
  master:       { color: 'text-amber-700',  bg: 'bg-amber-100',  bar: 'bg-amber-500' },
};

const AVATAR_COLORS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
  'from-cyan-500 to-cyan-600',
];

type SortKey = 'completion' | 'score' | 'activity';

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function TeamLearningTab() {
  const t = useT();
  const [data, setData] = useState<TeamLearningResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('completion');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const resp = await teamApi.getTeamLearning();
      setData(resp.data);
    } catch {
      setError(t('team.learning.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Sort members
  const sortedMembers = (data?.members || []).slice().sort((a, b) => {
    if (sortKey === 'completion') return b.completion_percentage - a.completion_percentage;
    if (sortKey === 'score') return b.avg_quiz_score - a.avg_quiz_score;
    return a.days_since_activity - b.days_since_activity;
  });

  // ─── LOADING ────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── ERROR ────
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p className="text-red-600 text-sm flex-1">{error}</p>
          <button onClick={loadData} className="text-red-600 hover:text-red-800 text-sm font-medium underline">
            {t('team.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.total_members === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <svg className="mx-auto w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        <p className="text-gray-500 font-medium">{t('team.learning.noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ SUMMARY CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avg Completion */}
        <MetricCard
          value={`${data.avg_completion_percentage}%`}
          label={t('team.learning.avgCompletion')}
          color="text-blue-600"
          bg="bg-blue-50"
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        >
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(data.avg_completion_percentage, 100)}%` }}
            />
          </div>
        </MetricCard>

        {/* Avg Score */}
        <MetricCard
          value={`${data.avg_quiz_score}%`}
          label={t('team.learning.avgScore')}
          color={data.avg_quiz_score >= 80 ? 'text-emerald-600' : data.avg_quiz_score >= 60 ? 'text-amber-600' : 'text-red-600'}
          bg={data.avg_quiz_score >= 80 ? 'bg-emerald-50' : data.avg_quiz_score >= 60 ? 'bg-amber-50' : 'bg-red-50'}
          icon="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />

        {/* Active This Week */}
        <MetricCard
          value={`${data.active_learners_7d}/${data.total_members}`}
          label={t('team.learning.activeThisWeek')}
          color="text-indigo-600"
          bg="bg-indigo-50"
          icon="M13 10V3L4 14h7v7l9-11h-7z"
        />

        {/* Need Attention */}
        <MetricCard
          value={String(data.members_needing_attention)}
          label={t('team.learning.needAttention')}
          color={data.members_needing_attention > 0 ? 'text-red-600' : 'text-emerald-600'}
          bg={data.members_needing_attention > 0 ? 'bg-red-50' : 'bg-emerald-50'}
          icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </div>

      {/* ═══ LEVEL DISTRIBUTION BAR ═══ */}
      {data.level_distribution.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {t('team.learning.levelDistribution')}
          </h3>

          {/* Stacked bar */}
          <div className="flex rounded-full overflow-hidden h-6 bg-gray-100">
            {data.level_distribution.map(ld => {
              const cfg = LEVEL_CONFIG[ld.level] || LEVEL_CONFIG.trainee;
              if (ld.percentage === 0) return null;
              return (
                <div
                  key={ld.level}
                  className={`${cfg.bar} flex items-center justify-center text-white text-[10px] font-bold transition-all`}
                  style={{ width: `${ld.percentage}%`, minWidth: ld.percentage > 0 ? '28px' : 0 }}
                  title={`${t(`team.learning.levels.${ld.level}`)}: ${ld.count}`}
                >
                  {ld.count}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2">
            {data.level_distribution.map(ld => {
              const cfg = LEVEL_CONFIG[ld.level] || LEVEL_CONFIG.trainee;
              return (
                <span key={ld.level} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`w-2.5 h-2.5 rounded-sm ${cfg.bar}`} />
                  {t(`team.learning.levels.${ld.level}`)} ({ld.count})
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ SORT CONTROLS ═══ */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          {t('team.learning.memberProgress')}
        </h3>
        <div className="flex gap-1">
          {([
            { key: 'completion' as SortKey, label: t('team.learning.sortCompletion') },
            { key: 'score' as SortKey, label: t('team.learning.sortScore') },
            { key: 'activity' as SortKey, label: t('team.learning.sortActivity') },
          ]).map(s => (
            <button
              key={s.key}
              onClick={() => setSortKey(s.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                sortKey === s.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ MEMBERS LIST ═══ */}
      <div className="space-y-2">
        {sortedMembers.map((m, idx) => (
          <MemberLearningCard
            key={m.id}
            member={m}
            index={idx}
            isExpanded={expandedId === m.id}
            onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// MetricCard
// ═══════════════════════════════════════════════════════════════

function MetricCard({
  value, label, color, bg, icon, children,
}: {
  value: string; label: string; color: string; bg: string; icon: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center ${color} flex-shrink-0`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
        <div className="min-w-0">
          <div className={`text-xl font-bold ${color}`}>{value}</div>
          <div className="text-xs text-gray-500 truncate">{label}</div>
        </div>
      </div>
      {children}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// MemberLearningCard
// ═══════════════════════════════════════════════════════════════

function MemberLearningCard({
  member: m, index, isExpanded, onToggle, t,
}: {
  member: MemberLearningData; index: number; isExpanded: boolean;
  onToggle: () => void; t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const levelCfg = LEVEL_CONFIG[m.current_level] || LEVEL_CONFIG.trainee;
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const scoreColor = m.avg_quiz_score >= 80 ? 'text-emerald-600' : m.avg_quiz_score >= 60 ? 'text-amber-600' : 'text-red-600';

  const activityText = m.days_since_activity === 0
    ? t('team.learning.today')
    : m.days_since_activity >= 999
      ? t('team.learning.noActivity')
      : t('team.learning.daysAgo', { n: m.days_since_activity });

  return (
    <div className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
      m.needs_attention ? 'border-amber-300' : 'border-gray-200'
    }`}>
      <div
        onClick={onToggle}
        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
      >
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
          {m.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 truncate text-sm">{m.name}</span>
            {/* Level badge */}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${levelCfg.bg} ${levelCfg.color}`}>
              {t(`team.learning.levels.${m.current_level}`)}
            </span>
            {/* Attention icon */}
            {m.needs_attention && (
              <span className="text-amber-500" title={m.attention_reasons.map(r => t(`team.learning.attention.${r}`)).join(', ')}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>

          {/* Progress bar + score */}
          <div className="flex items-center gap-3 mt-1.5">
            {/* Mini progress */}
            <div className="flex items-center gap-1.5 flex-1">
              <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[120px]">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(m.completion_percentage, 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-500 whitespace-nowrap">
                {m.courses_completed}/{m.courses_total}
              </span>
            </div>

            {/* Score */}
            <span className={`text-xs font-semibold ${scoreColor}`}>
              {m.avg_quiz_score > 0 ? `${m.avg_quiz_score}%` : '—'}
            </span>

            {/* Activity */}
            <span className={`text-[11px] hidden sm:inline ${
              m.days_since_activity <= 3 ? 'text-emerald-500' : m.days_since_activity <= 7 ? 'text-gray-400' : 'text-red-400'
            }`}>
              {activityText}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <DetailStat
              label={t('team.learning.completed')}
              value={`${m.courses_completed}/${m.courses_total}`}
              sub={`${m.completion_percentage}%`}
              bg="bg-blue-50"
              color="text-blue-700"
            />
            <DetailStat
              label={t('team.learning.score')}
              value={m.avg_quiz_score > 0 ? `${m.avg_quiz_score}%` : '—'}
              sub="LMS"
              bg={m.avg_quiz_score >= 70 ? 'bg-emerald-50' : 'bg-red-50'}
              color={m.avg_quiz_score >= 70 ? 'text-emerald-700' : 'text-red-700'}
            />
            <DetailStat
              label={t('team.learning.streak')}
              value={`${m.current_streak_days}`}
              sub={t('team.learning.days')}
              bg="bg-amber-50"
              color="text-amber-700"
            />
            <DetailStat
              label="LMS KPI"
              value={m.lms_score > 0 ? `${m.lms_score}%` : '—'}
              sub="30% KPI"
              bg="bg-purple-50"
              color="text-purple-700"
            />
          </div>

          {/* Attention reasons */}
          {m.attention_reasons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {m.attention_reasons.map(reason => (
                <span key={reason} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {t(`team.learning.attention.${reason}`)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// DetailStat
// ═══════════════════════════════════════════════════════════════

function DetailStat({
  label, value, sub, bg, color,
}: {
  label: string; value: string; sub: string; bg: string; color: string;
}) {
  return (
    <div className={`text-center p-3 ${bg} rounded-xl`}>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className={`text-[10px] ${color} opacity-70`}>{sub}</div>
    </div>
  );
}
