import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useT } from '../stores/langStore';

// =============================================================================
// Types — match backend supervisor API response schemas
// =============================================================================

interface TeamAgent {
  id: string;
  name: string;
  employee_id: string;
  role: string | null;
  kpi: number;
  kpi_trend: string; // up | stable | down
  kpi_change: number;
  level: string;
  last_training_days: number;
  shelf_avg_score: number;
  weak_zones: string[];
}

interface AttentionItem {
  agent_id: string;
  agent_name: string;
  reason: string;
  details: string;
  severity: string; // critical | warning
}

interface TeamBonuses {
  all_trained_bonus: number;
  no_underperformers_bonus: number;
  trend_bonus: number;
  total: number;
}

interface MyTeamData {
  team_name: string;
  team_id: string;
  agent_count: number;
  avg_kpi: number;
  team_rank: number;
  agents: TeamAgent[];
  attention_needed: AttentionItem[];
  bonuses: TeamBonuses;
}

interface MemberLearning {
  id: string;
  name: string;
  employee_id: string;
  current_level: string;
  courses_completed: number;
  courses_total: number;
  completion_percentage: number;
  avg_quiz_score: number;
  last_activity_at: string | null;
  days_since_activity: number;
  current_streak_days: number;
  total_time_spent_minutes: number;
  lms_score: number;
  needs_attention: boolean;
  attention_reasons: string[];
}

interface LevelDist {
  level: string;
  count: number;
  percentage: number;
}

interface TeamLearningData {
  total_members: number;
  avg_completion_percentage: number;
  avg_quiz_score: number;
  active_learners_7d: number;
  members_needing_attention: number;
  level_distribution: LevelDist[];
  members: MemberLearning[];
}

// =============================================================================
// Helpers
// =============================================================================

const LEVEL_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  trainee: { label: 'Стажёр', color: 'text-gray-600', bg: 'bg-gray-100' },
  practitioner: { label: 'Практик', color: 'text-blue-600', bg: 'bg-blue-100' },
  expert: { label: 'Эксперт', color: 'text-purple-600', bg: 'bg-purple-100' },
  master: { label: 'Мастер', color: 'text-amber-600', bg: 'bg-amber-100' },
};

const TrendIcon = ({ trend, change }: { trend: string; change: number }) => {
  if (trend === 'up') return <span className="text-green-600 font-bold text-xs">▲ +{change.toFixed(1)}</span>;
  if (trend === 'down') return <span className="text-red-600 font-bold text-xs">▼ {change.toFixed(1)}</span>;
  return <span className="text-gray-400 text-xs">— стабильно</span>;
};

// =============================================================================
// Component
// =============================================================================

export function SupervisorDashboardPage() {
  const t = useT();
  const [tab, setTab] = useState<'team' | 'learning'>('team');
  const [teamData, setTeamData] = useState<MyTeamData | null>(null);
  const [learningData, setLearningData] = useState<TeamLearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assign course modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignAgentId, setAssignAgentId] = useState('');
  const [assignCourseId, setAssignCourseId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamRes, learningRes] = await Promise.all([
        api.get('/api/v1/supervisor/my-team'),
        api.get('/api/v1/supervisor/team-learning'),
      ]);
      setTeamData(teamRes.data);
      setLearningData(learningRes.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(axiosErr?.response?.data?.detail || axiosErr?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCourse = async () => {
    if (!assignAgentId || !assignCourseId) return;
    setAssigning(true);
    setAssignMsg(null);
    try {
      const res = await api.post('/api/v1/supervisor/assign-course', {
        agent_id: assignAgentId,
        course_id: assignCourseId,
      });
      setAssignMsg(res.data.message || 'Курс назначен');
      setTimeout(() => {
        setShowAssign(false);
        setAssignMsg(null);
        setAssignAgentId('');
        setAssignCourseId('');
      }, 2000);
    } catch {
      setAssignMsg('Ошибка назначения курса');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-700 font-medium">{error}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium">
          Повторить
        </button>
      </div>
    );
  }

  if (!teamData) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">👔 {t('supervisor.title') || 'Моя команда'}</h1>
          <p className="text-sm text-gray-500 mt-1">{teamData.team_name} • {teamData.agent_count} сотрудников</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tab toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setTab('team')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === 'team' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 KPI & Команда
            </button>
            <button
              onClick={() => setTab('learning')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === 'learning' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📚 Обучение
            </button>
          </div>
          <button
            onClick={() => setShowAssign(true)}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm text-xs font-medium"
          >
            📝 Назначить курс
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon="👥" label="Сотрудники" value={teamData.agent_count} color="text-gray-700" bg="bg-gray-50" />
        <SummaryCard icon="📈" label="Средний KPI" value={`${teamData.avg_kpi}%`} color="text-blue-600" bg="bg-blue-50" />
        <SummaryCard icon="🏆" label="Место в рейтинге" value={`#${teamData.team_rank}`} color="text-amber-600" bg="bg-amber-50" />
        <SummaryCard icon="⚠️" label="Требуют внимания" value={teamData.attention_needed.length} color="text-red-600" bg="bg-red-50" />
      </div>

      {/* Attention Banner */}
      {teamData.attention_needed.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-bold text-red-800 text-sm mb-2">🚨 Требуют внимания</h3>
          <div className="space-y-2">
            {teamData.attention_needed.map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg ${
                item.severity === 'critical' ? 'bg-red-100' : 'bg-orange-50'
              }`}>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  item.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'
                }`}>
                  {item.severity === 'critical' ? '❗' : '⚠️'}
                </span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{item.agent_name}</span>
                  <span className="text-gray-500 text-xs ml-2">— {item.reason}</span>
                </div>
                <span className="text-xs text-gray-500">{item.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content */}
      {tab === 'team' ? (
        <TeamTab agents={teamData.agents} bonuses={teamData.bonuses} />
      ) : (
        <LearningTab data={learningData} />
      )}

      {/* Bonuses Banner */}
      {teamData.bonuses.total > 0 && (
        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <h3 className="font-bold text-green-800 text-sm mb-2">🎁 Командные бонусы: +{teamData.bonuses.total}%</h3>
          <div className="flex gap-4 text-xs text-green-700">
            {teamData.bonuses.all_trained_bonus > 0 && <span>✅ Все обучены: +{teamData.bonuses.all_trained_bonus}%</span>}
            {teamData.bonuses.no_underperformers_bonus > 0 && <span>💪 Нет отстающих: +{teamData.bonuses.no_underperformers_bonus}%</span>}
            {teamData.bonuses.trend_bonus > 0 && <span>📈 Рост команды: +{teamData.bonuses.trend_bonus}%</span>}
          </div>
        </div>
      )}

      {/* Assign Course Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">📝 Назначить курс</h3>
              <button onClick={() => setShowAssign(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Сотрудник</label>
                <select
                  value={assignAgentId}
                  onChange={e => setAssignAgentId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите сотрудника</option>
                  {teamData.agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.employee_id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ID курса</label>
                <input
                  type="text"
                  value={assignCourseId}
                  onChange={e => setAssignCourseId(e.target.value)}
                  placeholder="UUID курса"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {assignMsg && (
                <div className={`p-3 rounded-lg text-sm font-medium ${
                  assignMsg.includes('Ошибка') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}>{assignMsg}</div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowAssign(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100">
                Отмена
              </button>
              <button
                onClick={handleAssignCourse}
                disabled={!assignAgentId || !assignCourseId || assigning}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2.5 rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 text-sm font-medium shadow-sm"
              >
                {assigning ? 'Назначаю...' : 'Назначить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function SummaryCard({ icon, label, value, color, bg }: {
  icon: string; label: string; value: string | number; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center text-lg`}>
          {icon}
        </div>
        <div>
          <div className={`text-2xl font-bold ${color}`}>{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

function TeamTab({ agents, bonuses: _bonuses }: { agents: TeamAgent[]; bonuses: TeamBonuses }) {
  void _bonuses; // Used in parent component for bonuses banner
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Сотрудник</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-600">KPI</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-600">Тренд</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-600">Уровень</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-600">Обучение</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-600">Слабые зоны</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(agent => {
              const levelInfo = LEVEL_LABELS[agent.level] || LEVEL_LABELS.trainee;
              return (
                <tr key={agent.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{agent.name}</div>
                        <div className="text-xs text-gray-400">{agent.employee_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center px-3 py-3">
                    <span className={`font-bold text-lg ${
                      agent.kpi >= 70 ? 'text-green-600' : agent.kpi >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {agent.kpi}%
                    </span>
                  </td>
                  <td className="text-center px-3 py-3">
                    <TrendIcon trend={agent.kpi_trend} change={agent.kpi_change} />
                  </td>
                  <td className="text-center px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelInfo.bg} ${levelInfo.color}`}>
                      {levelInfo.label}
                    </span>
                  </td>
                  <td className="text-center px-3 py-3">
                    {agent.last_training_days > 999 ? (
                      <span className="text-gray-400 text-xs">—</span>
                    ) : agent.last_training_days > 10 ? (
                      <span className="text-red-500 text-xs font-medium">{agent.last_training_days}д назад</span>
                    ) : (
                      <span className="text-green-600 text-xs font-medium">{agent.last_training_days}д назад</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {agent.weak_zones.length === 0 ? (
                        <span className="text-green-500 text-xs">✅ Нет</span>
                      ) : (
                        agent.weak_zones.map((z, i) => (
                          <span key={i} className="bg-red-50 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-medium">
                            {z}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LearningTab({ data }: { data: TeamLearningData | null }) {
  if (!data) return <div className="text-center text-gray-400 py-12">Нет данных</div>;

  return (
    <div className="space-y-6">
      {/* Learning Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MiniCard label="Участников" value={data.total_members} />
        <MiniCard label="Ср. прохождение" value={`${data.avg_completion_percentage}%`} />
        <MiniCard label="Ср. оценка" value={`${data.avg_quiz_score}%`} />
        <MiniCard label="Активны (7д)" value={data.active_learners_7d} />
        <MiniCard label="Требуют внимания" value={data.members_needing_attention} alert={data.members_needing_attention > 0} />
      </div>

      {/* Level Distribution */}
      {data.level_distribution.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <h3 className="font-bold text-sm text-gray-700 mb-3">📊 Распределение по уровням</h3>
          <div className="flex gap-3">
            {data.level_distribution.map(ld => {
              const info = LEVEL_LABELS[ld.level] || LEVEL_LABELS.trainee;
              return (
                <div key={ld.level} className="flex-1 text-center">
                  <div className={`text-2xl font-bold ${info.color}`}>{ld.count}</div>
                  <div className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${info.bg} ${info.color} font-medium`}>
                    {info.label}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">{ld.percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Сотрудник</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">Уровень</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">Пройдено</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">Ср. оценка</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">Активность</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">Стрик</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600">Статус</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map(m => {
                const levelInfo = LEVEL_LABELS[m.current_level] || LEVEL_LABELS.trainee;
                return (
                  <tr key={m.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    m.needs_attention ? 'bg-red-50/30' : ''
                  }`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{m.name}</div>
                      <div className="text-xs text-gray-400">{m.employee_id}</div>
                    </td>
                    <td className="text-center px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelInfo.bg} ${levelInfo.color}`}>
                        {levelInfo.label}
                      </span>
                    </td>
                    <td className="text-center px-3 py-3">
                      <div className="font-medium">{m.courses_completed}/{m.courses_total}</div>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden mx-auto mt-1">
                        <div
                          className={`h-full rounded-full ${m.completion_percentage >= 60 ? 'bg-green-500' : m.completion_percentage >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${m.completion_percentage}%` }}
                        />
                      </div>
                    </td>
                    <td className="text-center px-3 py-3">
                      <span className={`font-medium ${
                        m.avg_quiz_score >= 80 ? 'text-green-600' : m.avg_quiz_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {m.avg_quiz_score > 0 ? `${m.avg_quiz_score}%` : '—'}
                      </span>
                    </td>
                    <td className="text-center px-3 py-3">
                      {m.days_since_activity > 999 ? (
                        <span className="text-gray-400 text-xs">Нет данных</span>
                      ) : m.days_since_activity > 7 ? (
                        <span className="text-red-500 text-xs font-medium">{m.days_since_activity}д</span>
                      ) : (
                        <span className="text-green-600 text-xs font-medium">{m.days_since_activity}д</span>
                      )}
                    </td>
                    <td className="text-center px-3 py-3">
                      {m.current_streak_days > 0 ? (
                        <span className="text-orange-500 font-medium text-xs">🔥 {m.current_streak_days}д</span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {m.needs_attention ? (
                        <div className="flex flex-wrap gap-1">
                          {m.attention_reasons.map((r, i) => (
                            <span key={i} className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-medium">
                              {r === 'no_training' ? '📚 Нет обучения' :
                               r === 'low_score' ? '📉 Низкие оценки' :
                               r === 'low_completion' ? '⚠️ Мало курсов' :
                               r === 'low_lms' ? '📊 Низкий LMS' : r}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-green-500 text-xs">✅ Ок</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MiniCard({ label, value, alert = false }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div className={`rounded-xl p-3 border ${alert ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'} shadow-sm`}>
      <div className={`text-xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
