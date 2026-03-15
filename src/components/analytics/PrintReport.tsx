import { useEffect, useState, useRef } from 'react';
import { kpiApi } from '../../api/kpi';
import type { OverviewData, LearningMetrics, ProductStats, LeaderboardEntry } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamRating {
  team_id: string;
  team_name: string;
  rating: number;
  supervisor_name?: string;
  member_count?: number;
}

interface KpiEntry {
  user_id: string;
  full_name: string;
  role: string;
  total_kpi: number;
  ai_score: number;
  lms_score: number;
  crm_score: number;
  rank: number;
}

interface PrintReportProps {
  period: string;
  overview: OverviewData | null;
  learning: LearningMetrics | null;
  productStats: ProductStats | null;
  leaderboard: LeaderboardEntry[];
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const periodLabel = (p: string) => {
  const map: Record<string, string> = {
    week: 'Неделя',
    month: 'Месяц',
    quarter: 'Квартал',
    all: 'За всё время',
  };
  return map[p] || p;
};

const today = () => {
  const d = new Date();
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

const pct = (v?: number) => (v != null ? `${Math.round(v)}%` : '—');
const num = (v?: number) => (v != null ? v.toLocaleString('ru-RU') : '—');

const roleLabel = (r: string) => {
  const map: Record<string, string> = {
    superadmin: 'Суперадмин',
    admin: 'Администратор',
    commercial_dir: 'Ком. директор',
    supervisor: 'Супервайзер',
    sales_rep: 'Торг. представитель',
    dealer: 'Дилер',
  };
  return map[r] || r;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrintReport({ period, overview, learning, productStats, leaderboard: _leaderboard, onClose }: PrintReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [kpiLeaderboard, setKpiLeaderboard] = useState<KpiEntry[]>([]);
  const [teamRatings, setTeamRatings] = useState<TeamRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [kpiRes, teamsRes] = await Promise.allSettled([
          kpiApi.getLeaderboard({ period, limit: 15 }),
          kpiApi.getTeamRatings(period),
        ]);
        if (kpiRes.status === 'fulfilled') {
          setKpiLeaderboard(kpiRes.value.data?.leaders || kpiRes.value.data || []);
        }
        if (teamsRes.status === 'fulfilled') {
          setTeamRatings(teamsRes.value.data?.teams || teamsRes.value.data || []);
        }
      } catch {
        // non-critical
      } finally {
        setLoading(false);
      }
    })();
  }, [period]);

  const handlePrint = () => {
    window.print();
  };

  // Stats
  const users = overview?.users ?? overview;
  const totalUsers = (users as Record<string, number | undefined>)?.total ?? overview?.total_users ?? 0;
  const activeUsers = (users as Record<string, number | undefined>)?.active ?? totalUsers;
  const tasks = overview?.tasks;
  const courses = overview?.courses;

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body > *:not(#print-report-overlay) { display: none !important; }
          #print-report-overlay { position: static !important; background: white !important; }
          .no-print { display: none !important; }
          .report-page { box-shadow: none !important; margin: 0 !important; padding: 24px !important; }
          @page { size: A4; margin: 12mm 10mm; }
        }
      `}</style>

      <div id="print-report-overlay" className="fixed inset-0 z-[9999] bg-gray-900/60 overflow-y-auto">
        {/* Toolbar */}
        <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-[900px] mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-gray-800">Предпросмотр отчёта</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{periodLabel(period)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                Печать / PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Report body */}
        <div className="max-w-[900px] mx-auto my-6 no-print:px-4">
          <div ref={reportRef} className="report-page bg-white rounded-xl shadow-xl p-10" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

            {/* ═══ HEADER ═══ */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-800">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">T</div>
                  <span className="text-2xl font-bold tracking-tight text-gray-900">Траектория</span>
                </div>
                <p className="text-sm text-gray-500">AI-платформа управления полевым персоналом</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-800">Аналитический отчёт</div>
                <div className="text-xs text-gray-500 mt-1">{today()}</div>
                <div className="mt-2 inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                  Период: {periodLabel(period)}
                </div>
              </div>
            </div>

            {/* ═══ SUMMARY CARDS ═══ */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Сотрудники', value: num(totalUsers), sub: `${num(activeUsers)} активных`, color: 'blue' },
                { label: 'Задачи', value: num(tasks?.total), sub: `${pct(tasks?.completion_rate)} выполнено`, color: 'emerald' },
                { label: 'Курсы', value: num(courses?.total), sub: `${pct(courses?.avg_completion_rate)} прохождение`, color: 'purple' },
                { label: 'Просрочено', value: num(tasks?.overdue), sub: 'задач', color: 'red' },
              ].map((card) => (
                <div key={card.label} className={`rounded-lg border border-gray-200 p-4`}>
                  <div className="text-xs text-gray-500 mb-1">{card.label}</div>
                  <div className={`text-2xl font-bold text-${card.color}-600`}>{card.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{card.sub}</div>
                </div>
              ))}
            </div>

            {/* ═══ KPI LEADERBOARD ═══ */}
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Загрузка KPI данных...</div>
            ) : kpiLeaderboard.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-600 rounded-full inline-block" />
                  KPI Лидерборд — Топ {Math.min(kpiLeaderboard.length, 10)}
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="py-2 px-3 font-semibold text-gray-600 w-10">#</th>
                      <th className="py-2 px-3 font-semibold text-gray-600">Сотрудник</th>
                      <th className="py-2 px-3 font-semibold text-gray-600">Должность</th>
                      <th className="py-2 px-3 font-semibold text-gray-600 text-center">AI (40%)</th>
                      <th className="py-2 px-3 font-semibold text-gray-600 text-center">LMS (30%)</th>
                      <th className="py-2 px-3 font-semibold text-gray-600 text-center">CRM (30%)</th>
                      <th className="py-2 px-3 font-semibold text-gray-600 text-right">KPI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpiLeaderboard.slice(0, 10).map((entry, i) => (
                      <tr key={entry.user_id} className={`border-b border-gray-100 ${i < 3 ? 'bg-amber-50/40' : ''}`}>
                        <td className="py-2 px-3 font-bold text-gray-500">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : entry.rank || i + 1}
                        </td>
                        <td className="py-2 px-3 font-medium text-gray-800">{entry.full_name}</td>
                        <td className="py-2 px-3 text-gray-500">{roleLabel(entry.role)}</td>
                        <td className="py-2 px-3 text-center">{Math.round(entry.ai_score || 0)}</td>
                        <td className="py-2 px-3 text-center">{Math.round(entry.lms_score || 0)}</td>
                        <td className="py-2 px-3 text-center">{Math.round(entry.crm_score || 0)}</td>
                        <td className="py-2 px-3 text-right">
                          <span className={`font-bold ${entry.total_kpi >= 80 ? 'text-green-600' : entry.total_kpi >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {Math.round(entry.total_kpi)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ═══ TEAM RATINGS ═══ */}
            {teamRatings.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-emerald-600 rounded-full inline-block" />
                  Рейтинг команд
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {teamRatings.map((team, i) => (
                    <div key={team.team_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-800 truncate">{team.team_name}</div>
                        <div className="text-xs text-gray-500">
                          {team.supervisor_name || '—'} &middot; {team.member_count ?? '?'} чел.
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${team.rating >= 80 ? 'text-green-600' : team.rating >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {Math.round(team.rating)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ LEARNING ═══ */}
            {learning && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-purple-600 rounded-full inline-block" />
                  Обучение
                </h2>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Записано', value: num(learning.total_enrolled) },
                    { label: 'Завершили', value: num(learning.total_completed ?? learning.courses_completed) },
                    { label: 'Ср. прохождение', value: pct(learning.avg_completion_rate ?? learning.completion_rate) },
                    { label: 'Ср. балл', value: learning.average_score != null ? `${Math.round(learning.average_score)}` : '—' },
                  ].map((s) => (
                    <div key={s.label} className="bg-purple-50/50 rounded-lg p-3 border border-purple-100">
                      <div className="text-xs text-gray-500">{s.label}</div>
                      <div className="text-xl font-bold text-purple-700 mt-1">{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* By territory */}
                {learning.by_territory && learning.by_territory.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-600 mb-2">По территориям</div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-1.5 px-3 text-left font-semibold text-gray-600">Территория</th>
                          <th className="py-1.5 px-3 text-center font-semibold text-gray-600">Записано</th>
                          <th className="py-1.5 px-3 text-center font-semibold text-gray-600">Завершено</th>
                          <th className="py-1.5 px-3 text-right font-semibold text-gray-600">Ср. балл</th>
                        </tr>
                      </thead>
                      <tbody>
                        {learning.by_territory.map((t) => (
                          <tr key={t.territory} className="border-b border-gray-100">
                            <td className="py-1.5 px-3 text-gray-800">{t.territory}</td>
                            <td className="py-1.5 px-3 text-center">{t.enrolled}</td>
                            <td className="py-1.5 px-3 text-center">{t.completed}</td>
                            <td className="py-1.5 px-3 text-right font-medium">{Math.round(t.avg_score)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ═══ PRODUCTS ═══ */}
            {productStats && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-orange-500 rounded-full inline-block" />
                  Знание продуктов
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Товаров', value: num(productStats.total_products) },
                    { label: 'Тестов пройдено', value: num(productStats.test_stats?.total_attempts ?? productStats.tests_completed) },
                    { label: 'Ср. балл теста', value: productStats.test_stats?.avg_score != null ? `${Math.round(productStats.test_stats.avg_score)}` : num(productStats.average_test_score) },
                  ].map((s) => (
                    <div key={s.label} className="bg-orange-50/50 rounded-lg p-3 border border-orange-100">
                      <div className="text-xs text-gray-500">{s.label}</div>
                      <div className="text-xl font-bold text-orange-700 mt-1">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ FOOTER ═══ */}
            <div className="mt-10 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-400">
              <div>
                Траектория AI &middot; N'Medov Distribution &middot; {today()}
              </div>
              <div>
                Сгенерировано автоматически &middot; {periodLabel(period)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
