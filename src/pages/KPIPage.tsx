import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { kpiApi } from '../api/kpi';
import { useAuthStore } from '../stores/authStore';
import { useT } from '../stores/langStore';

// ───────────────────────────────────────
// Types
// ───────────────────────────────────────

interface KPIData {
  user_id: string;
  period: string;
  ai_score: number;
  lms_score: number;
  crm_score: number;
  total_kpi: number;
  breakdown: Record<string, unknown> | null;
}

interface LeaderEntry {
  rank: number;
  user_id: string;
  full_name: string;
  employee_id: string;
  role: string;
  total_kpi: number;
  ai_score: number;
  lms_score: number;
  crm_score: number;
  rank_change: number;
}

interface TeamRating {
  team_id: string;
  team_name: string;
  supervisor_name: string | null;
  member_count: number;
  supervisor_kpi: number;
  members_kpi_sum: number;
  rating: number;
}

interface BoostTip {
  area: string;
  icon: string;
  action: string;
  link: string;
  score: number;
  priority: string;
}

// ───────────────────────────────────────
// CSS animations (injected once)
// ───────────────────────────────────────

const STYLE_ID = 'kpi-animations';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes kpiFadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes kpiScaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .kpi-fade-in { animation: kpiFadeInUp 0.4s ease-out both; }
    .kpi-scale-in { animation: kpiScaleIn 0.5s ease-out both; }
  `;
  document.head.appendChild(style);
}

// ───────────────────────────────────────
// Trend Badge — ▲ ▼ —
// ───────────────────────────────────────

function TrendBadge({ change, light = false }: { change: number; light?: boolean }) {
  if (change > 0)
    return (
      <span className={`text-xs font-semibold ${light ? 'text-green-300' : 'text-green-600'}`}>
        ▲{change}
      </span>
    );
  if (change < 0)
    return (
      <span className={`text-xs font-semibold ${light ? 'text-red-300' : 'text-red-500'}`}>
        ▼{Math.abs(change)}
      </span>
    );
  return <span className={`text-xs ${light ? 'text-blue-200' : 'text-gray-400'}`}>—</span>;
}

// ───────────────────────────────────────
// Mini Progress Bar (for table cells)
// ───────────────────────────────────────

function MiniProgress({ value, color }: { value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setWidth(Math.min(value, 100)));
    return () => cancelAnimationFrame(t);
  }, [value]);

  return (
    <div className="flex items-center gap-1.5 justify-end">
      <div className="w-10 sm:w-14 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`${color} h-1.5 rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 w-6 text-right tabular-nums">{Math.round(value)}</span>
    </div>
  );
}

// ───────────────────────────────────────
// KPI Gauge (SVG donut)
// ───────────────────────────────────────

function KPIGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const pct = Math.min(value, 100);
  const r = 36;
  const C = 2 * Math.PI * r;
  const offset = C - (pct / 100) * C;

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={C} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          className="transition-all duration-700"
        />
        <text x="40" y="40" textAnchor="middle" dominantBaseline="middle"
          className="fill-gray-900 font-bold" fontSize="16">
          {Math.round(pct)}
        </text>
      </svg>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  );
}

// ───────────────────────────────────────
// Rank medal component
// ───────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold text-gray-500">
      {rank}
    </span>
  );
}

// ───────────────────────────────────────
// Podium — Top 3 visual
// ───────────────────────────────────────

function Podium({ leaders }: { leaders: LeaderEntry[] }) {
  if (leaders.length < 3) return null;

  const top3 = leaders.slice(0, 3);
  // Display order: 2nd | 1st | 3rd
  const order = [top3[1], top3[0], top3[2]];
  const heights = ['h-24', 'h-32', 'h-20'];
  const gradients = [
    'from-gray-400 to-gray-500',     // 2nd - silver
    'from-yellow-400 to-amber-500',   // 1st - gold
    'from-orange-400 to-amber-600',   // 3rd - bronze
  ];
  const medals = ['🥈', '🥇', '🥉'];
  const delays = ['0.15s', '0s', '0.3s'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-end justify-center gap-3 sm:gap-6 lg:gap-10">
        {order.map((leader, i) => (
          <div
            key={leader.user_id}
            className="flex-1 max-w-[200px] flex flex-col items-center kpi-fade-in"
            style={{ animationDelay: delays[i] }}
          >
            {/* Medal + Name */}
            <span className="text-3xl sm:text-4xl mb-1">{medals[i]}</span>
            <div className="text-center mb-2">
              <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[100px] sm:max-w-[160px]">
                {leader.full_name}
              </div>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className="text-sm sm:text-base font-bold text-gray-800">
                  {leader.total_kpi.toFixed(1)}
                </span>
                <TrendBadge change={leader.rank_change} />
              </div>
            </div>

            {/* Podium pillar */}
            <div className={`${heights[i]} w-full rounded-t-xl bg-gradient-to-b ${gradients[i]} flex items-center justify-center shadow-md`}>
              <span className="text-white font-bold text-xl sm:text-2xl opacity-80">
                #{leader.rank}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────
// Boost Panel — tips to improve KPI
// ───────────────────────────────────────

function BoostPanel({ t }: { t: (key: string) => string }) {
  const navigate = useNavigate();
  const [tips, setTips] = useState<BoostTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const loadTips = useCallback(async () => {
    try {
      const res = await kpiApi.getBoostTips();
      setTips(res.data?.tips ?? []);
    } catch {
      setTips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpen = () => {
    if (!open && tips.length === 0 && loading) loadTips();
    setOpen(!open);
  };

  const tipLabels: Record<string, string> = {
    ai: t('kpi.leaderboard.boostTipAi'),
    lms: t('kpi.leaderboard.boostTipLms'),
    crm: t('kpi.leaderboard.boostTipCrm'),
  };

  const areaLabels: Record<string, string> = {
    ai: 'AI',
    lms: 'LMS',
    crm: 'CRM',
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5 backdrop-blur-sm"
      >
        <span>🚀</span>
        <span className="hidden sm:inline">{t('kpi.leaderboard.boostRating')}</span>
        <span className="sm:hidden">🚀</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 kpi-scale-in overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600">
            <h4 className="text-white font-semibold text-sm">{t('kpi.leaderboard.boostTitle')}</h4>
          </div>

          {loading ? (
            <div className="p-4 text-center text-gray-400 text-sm">...</div>
          ) : (
            <div className="p-3 space-y-2">
              {tips.map((tip, i) => (
                <div
                  key={tip.area}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-gray-50 ${
                    i === 0 ? 'border-red-200 bg-red-50/50' : 'border-gray-100'
                  }`}
                >
                  <span className="text-xl">{tip.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{areaLabels[tip.area]}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        tip.priority === 'high' ? 'bg-red-100 text-red-700' :
                        tip.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {tip.score.toFixed(0)}
                      </span>
                      {i === 0 && (
                        <span className="text-xs text-red-500 font-medium">
                          {t('kpi.leaderboard.boostWeakest')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{tipLabels[tip.area]}</p>
                  </div>
                  <button
                    onClick={() => { setOpen(false); navigate(tip.link); }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
                  >
                    {t('kpi.leaderboard.boostGoTo')} →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────
// Guide component — how rating is formed
// ───────────────────────────────────────

function RatingGuide({ t }: { t: (key: string) => string }) {
  const [open, setOpen] = useState(false);

  const guideItems = [
    {
      icon: '🧪',
      title: t('kpi.guide.aiTitle'),
      desc: t('kpi.guide.aiDesc'),
      source: t('kpi.guide.aiSource'),
      color: 'border-purple-200 bg-purple-50',
      link: '/products',
    },
    {
      icon: '📚',
      title: t('kpi.guide.lmsTitle'),
      desc: t('kpi.guide.lmsDesc'),
      source: t('kpi.guide.lmsSource'),
      color: 'border-green-200 bg-green-50',
      link: '/learning',
    },
    {
      icon: '✅',
      title: t('kpi.guide.crmTitle'),
      desc: t('kpi.guide.crmDesc'),
      source: t('kpi.guide.crmSource'),
      color: 'border-amber-200 bg-amber-50',
      link: '/tasks',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📖</span>
          <span className="font-semibold text-gray-900">{t('kpi.guide.title')}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          <p className="text-sm text-gray-500">{t('kpi.guide.description')}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {guideItems.map((item) => (
              <div key={item.title} className={`rounded-lg border p-4 ${item.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium text-gray-900 text-sm">{item.title}</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{item.desc}</p>
                <a
                  href={item.link}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  📎 {item.source}
                </a>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-1">{t('kpi.guide.formulaTitle')}</p>
            <code className="text-sm font-mono text-blue-600 bg-white px-3 py-1 rounded border">
              {t('kpi.guide.formulaText')}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────
// Main component
// ───────────────────────────────────────

export function KPIPage() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'commercial_dir';

  const [myKPI, setMyKPI] = useState<KPIData | null>(null);
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [teams, setTeams] = useState<TeamRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'leaderboard' | 'my' | 'teams'>('leaderboard');

  // Sticky "your position" card
  const myCardRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  // Auto-refresh leaderboard every 30 seconds
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadData();

    // Live update: refresh every 30s
    intervalRef.current = setInterval(() => {
      loadData(true); // silent refresh
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // IntersectionObserver for sticky card
  useEffect(() => {
    if (!myCardRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(myCardRef.current);
    return () => obs.disconnect();
  }, [leaders, loading]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const [kpiRes, leaderRes, teamRes] = await Promise.allSettled([
        kpiApi.getMyKPI(),
        kpiApi.getLeaderboard({ limit: 100 }),
        isAdmin ? kpiApi.getTeamRatings() : Promise.resolve({ data: { teams: [] } }),
      ]);

      if (kpiRes.status === 'fulfilled') setMyKPI(kpiRes.value.data);
      if (leaderRes.status === 'fulfilled') setLeaders(leaderRes.value.data?.leaders ?? []);
      if (teamRes.status === 'fulfilled') setTeams(teamRes.value.data?.teams ?? []);

      if (!silent && kpiRes.status === 'rejected' && leaderRes.status === 'rejected') {
        setError(t('kpi.loadError'));
      }
    } catch {
      if (!silent) setError(t('kpi.loadError'));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Find current user's position in leaderboard
  const myRank = leaders.find((l) => l.user_id === user?.id);

  // ─── Loading ─────────────────────────
  if (loading) {
    return (
      <div className="animate-pulse space-y-6 p-4 sm:p-6">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  // ─── Error ───────────────────────────
  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => loadData()} className="text-red-600 underline text-sm mt-1">
            {t('kpi.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('kpi.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('kpi.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {t('kpi.leaderboard.liveUpdate')}
          </span>
          {isAdmin && (
            <button
              onClick={async () => {
                try {
                  await kpiApi.calculate();
                  loadData();
                } catch { /* ignore */ }
              }}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('kpi.recalculate')}
            </button>
          )}
        </div>
      </div>

      {/* Your position card (always visible if user has rank) */}
      {myRank && (
        <div ref={myCardRef} className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 sm:p-5 text-white shadow-lg kpi-scale-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold">{myRank.rank}</div>
                <div className="text-xs text-blue-200">{t('kpi.leaderboard.place')}</div>
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <TrendBadge change={myRank.rank_change} light />
              </div>
              <div className="h-12 w-px bg-blue-400/30" />
              <div>
                <div className="font-semibold text-lg">{myRank.full_name}</div>
                <div className="text-sm text-blue-200">{t('kpi.leaderboard.yourPosition')}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-3xl sm:text-4xl font-bold">{myRank.total_kpi.toFixed(1)}</div>
                <div className="text-xs text-blue-200">KPI</div>
              </div>
              <BoostPanel t={t} />
            </div>
          </div>
          {/* Mini scores */}
          <div className="flex gap-4 mt-3 pt-3 border-t border-blue-400/30">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-blue-200">AI:</span>
              <span className="text-sm font-medium">{myRank.ai_score.toFixed(0)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-blue-200">LMS:</span>
              <span className="text-sm font-medium">{myRank.lms_score.toFixed(0)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-blue-200">CRM:</span>
              <span className="text-sm font-medium">{myRank.crm_score.toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs — leaderboard is first */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
        {([['leaderboard', t('kpi.tabs.leaderboard')], ['my', t('kpi.tabs.my')], ['teams', t('kpi.tabs.teams')]] as [typeof tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              tab === key ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Leaderboard (default, first) */}
      {tab === 'leaderboard' && (
        <>
          {/* Podium Top-3 */}
          <Podium leaders={leaders} />

          {/* Leaderboard Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">{t('kpi.leaderboard.employee')}</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">AI</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">LMS</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">CRM</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">KPI</th>
                </tr>
              </thead>
              <tbody>
                {leaders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      {t('kpi.leaderboard.noData')}
                    </td>
                  </tr>
                )}
                {leaders.map((l, idx) => {
                  const isMe = l.user_id === user?.id;
                  return (
                    <tr
                      key={l.user_id}
                      className={`transition-colors kpi-fade-in ${
                        isMe
                          ? 'bg-blue-50 border-l-4 border-l-blue-500'
                          : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                      }`}
                      style={{ animationDelay: `${Math.min(idx * 30, 600)}ms` }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <RankBadge rank={l.rank} />
                          <TrendBadge change={l.rank_change} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className={`font-medium ${isMe ? 'text-blue-700' : 'text-gray-900'}`}>
                              {l.full_name}
                              {isMe && <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">you</span>}
                            </div>
                            <div className="text-xs text-gray-400">{l.employee_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <MiniProgress value={l.ai_score} color="bg-purple-500" />
                      </td>
                      <td className="px-4 py-3">
                        <MiniProgress value={l.lms_score} color="bg-green-500" />
                      </td>
                      <td className="px-4 py-3">
                        <MiniProgress value={l.crm_score} color="bg-amber-500" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold text-lg ${isMe ? 'text-blue-600' : 'text-gray-900'}`}>
                          {l.total_kpi.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      {/* Tab: My KPI detail */}
      {tab === 'my' && myKPI && (
        <div className="space-y-4">
          {/* Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center">
              <KPIGauge value={myKPI.total_kpi} label={t('kpi.totalKpi')} color="#3b82f6" />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center">
              <KPIGauge value={myKPI.ai_score} label={t('kpi.aiProducts')} color="#8b5cf6" />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center">
              <KPIGauge value={myKPI.lms_score} label={t('kpi.lmsLearning')} color="#10b981" />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center">
              <KPIGauge value={myKPI.crm_score} label={t('kpi.crmTasks')} color="#f59e0b" />
            </div>
          </div>

          {/* Detail breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('kpi.detail.title')} — {myKPI.period}
            </h3>
            <div className="space-y-4">
              {(['ai_score', 'lms_score', 'crm_score'] as const).map((key) => {
                const labels: Record<string, string> = {
                  ai_score: t('kpi.detail.aiTests'),
                  lms_score: t('kpi.detail.lmsLearning'),
                  crm_score: t('kpi.detail.crmTasks'),
                };
                const weights: Record<string, number> = { ai_score: 40, lms_score: 30, crm_score: 30 };
                const colors: Record<string, string> = { ai_score: 'bg-purple-500', lms_score: 'bg-green-500', crm_score: 'bg-amber-500' };
                const val = myKPI[key];
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{labels[key]} ({weights[key]}%)</span>
                      <span className="font-medium">{val.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`${colors[key]} h-2.5 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(val, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t flex justify-between font-semibold">
                <span>{t('kpi.detail.total')}</span>
                <span className="text-blue-600 text-lg">{myKPI.total_kpi.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Team ratings */}
      {tab === 'teams' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">{t('kpi.teamRatings.team')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">{t('kpi.teamRatings.leader')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">{t('kpi.teamRatings.members')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">{t('kpi.teamRatings.leaderKpi')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">{t('kpi.teamRatings.rating')}</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    {t('kpi.teamRatings.noData')}
                  </td>
                </tr>
              )}
              {teams.map((tm, i) => (
                <tr key={tm.team_id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{tm.team_name}</td>
                  <td className="px-4 py-3 text-gray-600">{tm.supervisor_name || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{tm.member_count}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{tm.supervisor_kpi.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">{tm.rating.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {teams.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-400">
              {t('kpi.teamRatings.formula')}
            </div>
          )}
        </div>
      )}

      {/* Rating guide — always visible at the bottom */}
      <RatingGuide t={t} />

      {/* Sticky bottom card — appears when main card scrolls out of view */}
      {showSticky && myRank && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600/95 to-indigo-600/95 backdrop-blur-md text-white shadow-2xl border-t border-blue-400/20">
          <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold">#{myRank.rank}</span>
              <TrendBadge change={myRank.rank_change} light />
              <div className="h-5 w-px bg-blue-400/30" />
              <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">{myRank.full_name}</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex items-center gap-3 text-xs text-blue-200">
                <span>AI: {myRank.ai_score.toFixed(0)}</span>
                <span>LMS: {myRank.lms_score.toFixed(0)}</span>
                <span>CRM: {myRank.crm_score.toFixed(0)}</span>
              </div>
              <span className="text-xl font-bold">{myRank.total_kpi.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
