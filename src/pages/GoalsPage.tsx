import { useState, useEffect } from 'react';
import { useGoalsStore } from '../stores/goalsStore';
import { useT } from '../stores/langStore';
import type { Goal, UserAchievement, AchievementCatalogItem } from '../api/goals';

// ───────────────────────────────────────
// Helpers
// ───────────────────────────────────────

const TIER_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  bronze: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-300' },
  silver: { bg: 'bg-gray-100', text: 'text-gray-600', ring: 'ring-gray-300' },
  gold: { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-400' },
  platinum: { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-400' },
};


const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-blue-100', text: 'text-blue-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
  failed: { bg: 'bg-red-100', text: 'text-red-700' },
  paused: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

function formatDeadline(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ───────────────────────────────────────
// Goal Card
// ───────────────────────────────────────

function GoalCard({ goal }: { goal: Goal }) {
  const t = useT();
  const sc = STATUS_COLORS[goal.status] || STATUS_COLORS.active;
  const pct = Math.min(goal.percentage, 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{goal.title}</h3>
          {goal.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{goal.description}</p>
          )}
        </div>
        <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${sc.bg} ${sc.text}`}>
          {t('goals.goalStatus.' + goal.status)}
        </span>
      </div>

      {/* Type + Deadline */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
        <span className="bg-gray-100 px-2 py-0.5 rounded">{t('goals.goalType.' + goal.type) || goal.type}</span>
        {goal.deadline && (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatDeadline(goal.deadline)}
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {goal.current_value} / {goal.target_value} {goal.unit || ''}
        </span>
        <span className="font-semibold text-gray-700">{Math.round(pct)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ───────────────────────────────────────
// Achievement Badge
// ───────────────────────────────────────

function AchievementBadge({ item, earned }: { item: AchievementCatalogItem | UserAchievement; earned: boolean }) {
  const t = useT();
  const tc = TIER_COLORS[item.tier] || TIER_COLORS.bronze;

  return (
    <div
      className={`flex flex-col items-center text-center p-4 rounded-xl border transition-all ${
        earned
          ? `${tc.bg} border-transparent ring-2 ${tc.ring} shadow-sm`
          : 'bg-gray-50 border-gray-200 opacity-50 grayscale'
      }`}
    >
      <span className="text-3xl mb-2">{item.icon || '🏆'}</span>
      <p className={`text-xs font-semibold leading-tight ${earned ? tc.text : 'text-gray-400'}`}>
        {item.title}
      </p>
      <span className={`mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
        earned ? `${tc.bg} ${tc.text}` : 'bg-gray-100 text-gray-400'
      }`}>
        {item.points} {t('goals.pts')}
      </span>
    </div>
  );
}

// ───────────────────────────────────────
// Main Page
// ───────────────────────────────────────

type Tab = 'all' | 'active' | 'completed';

export function GoalsPage() {
  const t = useT();
  const { goals, achievements, catalog, totalPoints, loading, fetchGoals, fetchAchievements, fetchCatalog } =
    useGoalsStore();

  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    fetchGoals();
    fetchAchievements();
    fetchCatalog();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredGoals = goals.filter((g) => {
    if (tab === 'active') return g.status === 'active';
    if (tab === 'completed') return g.status === 'completed';
    return true;
  });

  const earnedCodes = new Set(achievements.map((a) => a.code));

  // ─── Loading ─────────────────────────
  if (loading && goals.length === 0) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('goals.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('goals.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl">
            <span className="text-xl">🏆</span>
            <div>
              <p className="text-lg font-bold text-amber-700">{totalPoints}</p>
              <p className="text-[10px] text-amber-600 leading-tight">{t('goals.points')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl">
            <span className="text-xl">🎖️</span>
            <div>
              <p className="text-lg font-bold text-blue-700">{achievements.length}</p>
              <p className="text-[10px] text-blue-600 leading-tight">{t('goals.achievements')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {([['all', t('goals.tabs.all')], ['active', t('goals.tabs.active')], ['completed', t('goals.tabs.completed')]] as [string, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          {t('goals.goalsTitle')} {tab === 'active' ? t('goals.goalsActive') : tab === 'completed' ? t('goals.goalsCompleted') : ''}
        </h2>
        {filteredGoals.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
            </svg>
            <p className="text-gray-400 text-sm">{t('goals.noGoals')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>

      {/* My Achievements */}
      {achievements.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">{t('goals.myAchievements')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {achievements.map((a) => (
              <AchievementBadge key={a.id} item={a} earned />
            ))}
          </div>
        </div>
      )}

      {/* Catalog */}
      {catalog.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">{t('goals.catalog')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {catalog.map((item) => (
              <AchievementBadge key={item.id} item={item} earned={earnedCodes.has(item.code)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
