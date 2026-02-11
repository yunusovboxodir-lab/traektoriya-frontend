import { useState, useEffect } from 'react';
import { kpiApi } from '../api/kpi';
import { useAuthStore } from '../stores/authStore';

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
// Main component
// ───────────────────────────────────────

export function KPIPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'commercial_dir';

  const [myKPI, setMyKPI] = useState<KPIData | null>(null);
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [teams, setTeams] = useState<TeamRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'my' | 'leaderboard' | 'teams'>('my');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [kpiRes, leaderRes, teamRes] = await Promise.allSettled([
        kpiApi.getMyKPI(),
        kpiApi.getLeaderboard({ limit: 20 }),
        isAdmin ? kpiApi.getTeamRatings() : Promise.resolve({ data: { teams: [] } }),
      ]);

      if (kpiRes.status === 'fulfilled') setMyKPI(kpiRes.value.data);
      if (leaderRes.status === 'fulfilled') setLeaders(leaderRes.value.data?.leaders ?? []);
      if (teamRes.status === 'fulfilled') setTeams(teamRes.value.data?.teams ?? []);

      if (kpiRes.status === 'rejected' && leaderRes.status === 'rejected') {
        setError('Не удалось загрузить KPI данные');
      }
    } catch {
      setError('Не удалось загрузить KPI данные');
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading ─────────────────────────
  if (loading) {
    return (
      <div className="animate-pulse space-y-6 p-6">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-4 gap-4">
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
          <button onClick={loadData} className="text-red-600 underline text-sm mt-1">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">KPI и Рейтинг</h1>
        {isAdmin && (
          <button
            onClick={async () => {
              try {
                await kpiApi.calculate();
                loadData();
              } catch { /* ignore */ }
            }}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Пересчитать KPI
          </button>
        )}
      </div>

      {/* My KPI Cards */}
      {myKPI && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center">
            <KPIGauge value={myKPI.total_kpi} label="Общий KPI" color="#3b82f6" />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center">
            <KPIGauge value={myKPI.ai_score} label="AI / Товары (40%)" color="#8b5cf6" />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center">
            <KPIGauge value={myKPI.lms_score} label="LMS / Обучение (30%)" color="#10b981" />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center">
            <KPIGauge value={myKPI.crm_score} label="CRM / Задачи (30%)" color="#f59e0b" />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {([['my', 'Мой KPI'], ['leaderboard', 'Лидерборд'], ['teams', 'Рейтинг команд']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: My KPI detail */}
      {tab === 'my' && myKPI && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Детали KPI — {myKPI.period}
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Формула</span>
              <span className="text-sm font-mono bg-gray-50 px-3 py-1 rounded">
                AI×0.4 + LMS×0.3 + CRM×0.3
              </span>
            </div>
            {(['ai_score', 'lms_score', 'crm_score'] as const).map((key) => {
              const labels: Record<string, string> = {
                ai_score: 'AI / Товарные тесты',
                lms_score: 'LMS / Обучение',
                crm_score: 'CRM / Задачи',
              };
              const weights: Record<string, number> = { ai_score: 40, lms_score: 30, crm_score: 30 };
              const val = myKPI[key];
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{labels[key]} ({weights[key]}%)</span>
                    <span className="font-medium">{val.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(val, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-3 border-t flex justify-between font-semibold">
              <span>Итого KPI</span>
              <span className="text-blue-600 text-lg">{myKPI.total_kpi.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Leaderboard */}
      {tab === 'leaderboard' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Сотрудник</th>
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
                    Нет данных за текущий период
                  </td>
                </tr>
              )}
              {leaders.map((l, i) => (
                <tr key={l.user_id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="px-4 py-3">
                    {l.rank <= 3 ? (
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                        l.rank === 1 ? 'bg-yellow-500' : l.rank === 2 ? 'bg-gray-400' : 'bg-amber-700'
                      }`}>
                        {l.rank}
                      </span>
                    ) : (
                      <span className="text-gray-500">{l.rank}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{l.full_name}</div>
                    <div className="text-xs text-gray-400">{l.employee_id}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{l.ai_score.toFixed(0)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{l.lms_score.toFixed(0)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{l.crm_score.toFixed(0)}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">{l.total_kpi.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Team ratings */}
      {tab === 'teams' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Команда</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Руководитель</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Членов</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">KPI рук.</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Рейтинг</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Нет данных за текущий период
                  </td>
                </tr>
              )}
              {teams.map((t, i) => (
                <tr key={t.team_id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{t.team_name}</td>
                  <td className="px-4 py-3 text-gray-600">{t.supervisor_name || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{t.member_count}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{t.supervisor_kpi.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">{t.rating.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {teams.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-400">
              Формула: (KPI руководителя + Сумма KPI сотрудников) / (кол-во + 1)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
