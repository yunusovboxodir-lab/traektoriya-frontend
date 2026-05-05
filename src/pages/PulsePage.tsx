/**
 * PulsePage v2 (2026-05-05)
 *
 * Дашборд «Пульс компетенций» в темной теме (navy + gold).
 * Layout: 3-колоночный grid + bottom panel.
 *
 * Колонки:
 *  1. Общий пульс (gauge + sparkline + benchmark)
 *  2. Карта компетенций (interactive radar с tooltip + drill-down)
 *  3. Уровень (распределение 8 компетенций) + покрытие уровней
 *
 * Bottom:
 *  - Рекомендуемый фокус (самая слабая компетенция + 3 действия)
 *  - Быстрые победы (top-3 «дешёвых» level-ups)
 *  - Орбита (положение в ранге РМ Узбекистана)
 *
 * Toggle «Я / Команда» — каскадное наблюдение (СВ→ТП, РМ→СВ, Ком.Дир→всё).
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useLangStore, useT } from '../stores/langStore';
import {
  pulseApi,
  type CompetencyPulse,
  type UserPulse,
  type PulseCourse,
  type SubordinatesPulseResponse,
  type SubordinatePulseEntry,
} from '../api/competencies';
import { RadarChart, type RadarDataPoint } from '../components/competencies/RadarChart';
import { api } from '../api/client';

// ============================================================================
// Constants
// ============================================================================

const ADMIN_ROLES = ['superadmin', 'admin', 'commercial_dir'];
const SUBORDINATE_ROLES: Record<string, string> = {
  regional_manager: 'supervisor',
  supervisor: 'sales_rep',
  commercial_dir: 'regional_manager',
  admin: 'regional_manager',
  superadmin: 'regional_manager',
};

const PULSE_ROLES = [
  { value: 'regional_manager', label: { ru: 'Региональный менеджер', uz: 'Mintaqa menejeri' } },
  { value: 'supervisor', label: { ru: 'Супервайзер', uz: 'Supervayzer' } },
  { value: 'sales_rep', label: { ru: 'Торговый представитель', uz: 'Savdo vakili' } },
];

const LEVEL_META = {
  master: { label: 'Мастер', range: '76–100%', color: '#4ADE80', bg: 'rgba(74,222,128,0.15)' },
  expert: { label: 'Эксперт', range: '51–75%', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  practitioner: { label: 'Практик', range: '26–50%', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  trainee: { label: 'Стажёр', range: '0–25%', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
} as const;

type LevelKey = keyof typeof LEVEL_META;

// ============================================================================
// Helpers
// ============================================================================

function levelByPct(pct: number): LevelKey {
  if (pct >= 76) return 'master';
  if (pct >= 51) return 'expert';
  if (pct >= 26) return 'practitioner';
  return 'trainee';
}

function nextLevelThreshold(pct: number): number | null {
  if (pct >= 76) return null;
  if (pct >= 51) return 76;
  if (pct >= 26) return 51;
  return 26;
}

function nextLevelLabel(pct: number): string | null {
  const t = nextLevelThreshold(pct);
  if (t === null) return null;
  return LEVEL_META[levelByPct(t)].label;
}

// ============================================================================
// Главный компонент
// ============================================================================

export function PulsePage() {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const user = useAuthStore((s) => s.user);

  const [pulse, setPulse] = useState<UserPulse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drill-down (открытая компетенция)
  const [expandedComp, setExpandedComp] = useState<string | null>(null);
  const [courses, setCourses] = useState<PulseCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Admin: выбор роли + сотрудника
  const isAdmin = ADMIN_ROLES.includes(user?.role || '');
  const [selectedRole, setSelectedRole] = useState<string>(
    isAdmin ? 'regional_manager' : (user?.role || 'sales_rep'),
  );
  const [teamUsers, setTeamUsers] = useState<Array<{ id: string; full_name: string; employee_id: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // View toggle (для пользователей с подчинёнными)
  const subordinateRole = SUBORDINATE_ROLES[user?.role || ''];
  const canViewTeam = !!subordinateRole;
  const [view, setView] = useState<'me' | 'team'>('me');

  // Team data
  const [teamData, setTeamData] = useState<SubordinatesPulseResponse | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  const userId = user?.id ? String(user.id) : null;

  // Список сотрудников по выбранной роли (для админов)
  useEffect(() => {
    if (!isAdmin) return;
    api.get('/api/v1/users', { params: { role: selectedRole, limit: 100 } })
      .then(res => {
        const users = (res.data as { items?: Array<{ id: string; full_name: string; employee_id: string }> })?.items
          || (Array.isArray(res.data) ? res.data : []);
        setTeamUsers(users);
        setSelectedUserId('');
      })
      .catch(() => setTeamUsers([]));
  }, [isAdmin, selectedRole]);

  // Кого показывать
  const targetUserId = isAdmin
    ? (selectedUserId || teamUsers[0]?.id || userId)
    : userId;

  const loadPulse = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    setError(null);
    try {
      const roleParam = isAdmin ? selectedRole : undefined;
      const res = await pulseApi.getUserPulse(targetUserId, roleParam);
      setPulse(res.data);
    } catch (e: unknown) {
      const err = e as { response?: { status: number } };
      if (err.response?.status === 404) {
        setPulse(null);
      } else {
        setError('Ошибка загрузки');
      }
    } finally {
      setLoading(false);
    }
  }, [targetUserId, isAdmin, selectedRole]);

  useEffect(() => { loadPulse(); }, [loadPulse]);

  // Загружаем team-data только когда переключились на 'team'
  useEffect(() => {
    if (view !== 'team' || !canViewTeam) return;
    setTeamLoading(true);
    setTeamError(null);
    pulseApi.getSubordinatesPulse()
      .then((res) => setTeamData(res.data))
      .catch(() => setTeamError('Не удалось загрузить пульс команды'))
      .finally(() => setTeamLoading(false));
  }, [view, canViewTeam]);

  // Drill-down на компетенцию (клик в радаре или в карточке Quick Wins)
  const drillCompetency = useCallback(async (compId: string) => {
    if (expandedComp === compId) {
      setExpandedComp(null);
      setCourses([]);
      return;
    }
    setExpandedComp(compId);
    setLoadingCourses(true);
    try {
      const res = await pulseApi.getCompetencyCourses(compId, targetUserId || undefined);
      setCourses(res.data.courses);
    } catch {
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, [expandedComp, targetUserId]);

  // Keyboard: M для toggle
  useEffect(() => {
    if (!canViewTeam) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'm' || e.key === 'M') setView((v) => v === 'me' ? 'team' : 'me');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canViewTeam]);

  const radarData: RadarDataPoint[] = useMemo(() => (
    pulse?.competencies.map((c) => ({
      label: lang === 'uz' && c.competency_name_uz ? c.competency_name_uz : c.competency_name,
      value: c.pulse_pct,
      level: c.pulse_level,
      id: c.competency_id,
    })) || []
  ), [pulse, lang]);

  const overallLevel = pulse ? levelByPct(pulse.overall_pulse) : 'trainee';

  // Распределение компетенций по уровням
  const levelCounts = useMemo(() => {
    const counts = { master: 0, expert: 0, practitioner: 0, trainee: 0 };
    pulse?.competencies.forEach((c) => {
      const k = levelByPct(c.pulse_pct);
      counts[k]++;
    });
    return counts;
  }, [pulse]);

  // ============================================================================
  // Render — Loading / Error / Empty
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-10 w-10 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadPulse}
          className="px-4 py-2 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors"
        >
          {t('common.retry') || 'Повторить'}
        </button>
      </div>
    );
  }

  if (!pulse || pulse.competencies.length === 0) {
    return <EmptyPulse isAdmin={isAdmin} selectedRole={selectedRole} setSelectedRole={setSelectedRole} lang={lang} t={t} />;
  }

  const headerName = isAdmin && teamUsers.find((u) => u.id === selectedUserId)?.full_name
    || (user?.full_name || 'Профиль');

  // ============================================================================
  // Team view branch
  // ============================================================================

  if (view === 'team' && canViewTeam) {
    return (
      <div className="space-y-5" style={{ color: '#fff' }}>
        <PulseHeader
          title={lang === 'uz' ? 'Jamoa pulsi' : 'Пульс команды'}
          subtitle={`${headerName} · ${getRoleLabel(user?.role || '', lang)} · ${teamData?.members_count ?? 0} ${(teamData?.members_count ?? 0) === 1 ? 'подчинённый' : 'подчинённых'}`}
          view={view}
          setView={setView}
          canViewTeam={canViewTeam}
          isAdmin={isAdmin}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          teamUsers={teamUsers}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
          lang={lang}
        />
        {teamLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin h-10 w-10 border-2 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : teamError ? (
          <div className="text-center py-20 text-red-400">{teamError}</div>
        ) : !teamData || teamData.members_count === 0 ? (
          <div className="text-center py-20 text-white/55">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-lg">У вас пока нет подчинённых для каскадного обзора</p>
            <p className="text-sm mt-2 text-white/40">Нажмите «Я» чтобы вернуться к личному пульсу</p>
          </div>
        ) : (
          <TeamPulseView data={teamData} />
        )}
        {canViewTeam && (
          <div className="text-center text-xs text-white/40 mt-2">
            Подсказка: <kbd className="bg-white/10 border border-white/15 px-1.5 py-0.5 rounded font-mono text-[10px]">M</kbd> — переключить «Я ↔ Команда»
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // Main render
  // ============================================================================

  return (
    <div className="space-y-5" style={{ color: '#fff' }}>

      {/* ─── HEADER ─── */}
      <PulseHeader
        title={lang === 'uz' ? 'Kompetensiyalar pulsi' : 'Пульс компетенций'}
        subtitle={`${headerName} · ${getRoleLabel(isAdmin ? selectedRole : (user?.role || ''), lang)}`}
        view={view}
        setView={setView}
        canViewTeam={canViewTeam}
        isAdmin={isAdmin}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        teamUsers={teamUsers}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        lang={lang}
      />

      {/* ─── MAIN GRID 3 columns ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-5">

        {/* COL 1: Общий пульс */}
        <Card title="Общий пульс">
          <OverallGauge pulse={pulse} levelKey={overallLevel} />
          <Sparkline pulse={pulse} />
          <Benchmark pulse={pulse} />
        </Card>

        {/* COL 2: Радар */}
        <Card title="Карта компетенций · 8 направлений">
          <RadarBlock
            data={radarData}
            overallPulse={pulse.overall_pulse}
            overallLevelLabel={lang === 'uz' ? pulse.overall_level_uz : pulse.overall_level_ru}
            onPointClick={(_, datum) => datum.id && drillCompetency(datum.id)}
            tooltipExtra={(d) => {
              const comp = pulse.competencies.find((c) => c.competency_id === d.id);
              if (!comp) return null;
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ color: 'rgba(255,255,255,0.55)' }}>Курсы</span>
                    <span>{comp.courses_completed}/{comp.courses_total}</span>
                  </div>
                  {comp.avg_quiz_score !== null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ color: 'rgba(255,255,255,0.55)' }}>Тесты</span>
                      <span>{Math.round(comp.avg_quiz_score)}%</span>
                    </div>
                  )}
                </>
              );
            }}
          />
        </Card>

        {/* COL 3: Уровень + Покрытие */}
        <div className="flex flex-col gap-5">
          <Card title="Уровень компетенций">
            <LevelDistribution counts={levelCounts} total={pulse.competencies.length} />
          </Card>
        </div>
      </div>

      {/* ─── DRILL-DOWN (если открыта компетенция) ─── */}
      {expandedComp && (
        <DrilldownPanel
          comp={pulse.competencies.find((c) => c.competency_id === expandedComp)}
          courses={courses}
          loading={loadingCourses}
          lang={lang}
          onClose={() => { setExpandedComp(null); setCourses([]); }}
        />
      )}

      {/* ─── BOTTOM PANEL ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_240px] gap-5">
        <FocusPanel
          pulse={pulse}
          targetUserId={targetUserId || undefined}
          lang={lang}
          onCourseClick={(compId) => drillCompetency(compId)}
        />
        <QuickWinsPanel pulse={pulse} onClick={(compId) => drillCompetency(compId)} />
        <OrbitalPanel pulse={pulse} />
      </div>

      {/* Подсказка с горячими клавишами */}
      {canViewTeam && (
        <div className="text-center text-xs text-white/40 mt-2">
          Подсказка: <kbd className="bg-white/10 border border-white/15 px-1.5 py-0.5 rounded font-mono text-[10px]">M</kbd> — переключить «Я ↔ Команда»
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function getRoleLabel(role: string, lang: string): string {
  const r = PULSE_ROLES.find((x) => x.value === role);
  if (r) return lang === 'uz' ? r.label.uz : r.label.ru;
  return role;
}

// ─── Card ───────────────────────────────────────────────────────────────────

function Card({ title, children, accent }: { title: string; children: React.ReactNode; accent?: 'gold' | 'red' | 'green' }) {
  const accentBorder = accent === 'red'
    ? 'border-red-500/25'
    : accent === 'green'
      ? 'border-emerald-500/25'
      : 'border-white/10';
  const accentBg = accent === 'red'
    ? 'from-red-500/8 to-red-500/2'
    : accent === 'green'
      ? 'from-emerald-500/8 to-emerald-500/2'
      : 'from-[#11243d] to-[#11243d]/60';
  return (
    <div className={`rounded-2xl border ${accentBorder} bg-gradient-to-b ${accentBg} p-5`}>
      <h3
        className="font-bold uppercase mb-4"
        style={{
          fontFamily: "'Unbounded',sans-serif",
          fontSize: 11,
          letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────

interface PulseHeaderProps {
  title: string;
  subtitle: string;
  view: 'me' | 'team';
  setView: (v: 'me' | 'team') => void;
  canViewTeam: boolean;
  isAdmin: boolean;
  selectedRole: string;
  setSelectedRole: (r: string) => void;
  teamUsers: Array<{ id: string; full_name: string; employee_id: string }>;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  lang: string;
}

function PulseHeader({
  title, subtitle, view, setView, canViewTeam,
  isAdmin, selectedRole, setSelectedRole,
  teamUsers, selectedUserId, setSelectedUserId, lang,
}: PulseHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" style={{ boxShadow: '0 0 12px #FBBF24' }} />
          <span
            className="text-amber-400 font-bold uppercase"
            style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 11, letterSpacing: '0.2em' }}
          >
            ★ Pulse
          </span>
        </div>
        <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 28, fontWeight: 700, color: '#fff' }}>
          {title}
        </h1>
        <p className="text-sm text-white/60 mt-1">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canViewTeam && (
          <div className="inline-flex bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setView('me')}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                view === 'me'
                  ? 'bg-amber-400 text-[#0a1929] font-semibold'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              👤 Я
            </button>
            <button
              type="button"
              onClick={() => setView('team')}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                view === 'team'
                  ? 'bg-amber-400 text-[#0a1929] font-semibold'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              👥 Команда
            </button>
          </div>
        )}

        {isAdmin && (
          <>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
              style={{ colorScheme: 'dark' }}
            >
              {PULSE_ROLES.map((r) => (
                <option key={r.value} value={r.value} style={{ color: '#000' }}>
                  {lang === 'uz' ? r.label.uz : r.label.ru}
                </option>
              ))}
            </select>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white min-w-[180px]"
              style={{ colorScheme: 'dark' }}
            >
              <option value="" style={{ color: '#000' }}>Вся команда (среднее)</option>
              {teamUsers.map((u) => (
                <option key={u.id} value={u.id} style={{ color: '#000' }}>
                  {u.full_name || u.employee_id}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
    </div>
  );
}

// ─── OverallGauge ───────────────────────────────────────────────────────────

function OverallGauge({ pulse, levelKey }: { pulse: UserPulse; levelKey: LevelKey }) {
  const meta = LEVEL_META[levelKey];
  const pct = pulse.overall_pulse;
  const r = 80;
  const C = 2 * Math.PI * r;
  const dash = (pct / 100) * C;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[180px] h-[180px]">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
          <circle
            cx="100" cy="100" r={r}
            fill="none"
            stroke={meta.color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 42, fontWeight: 800, lineHeight: 1, color: '#fff' }}>
            {Math.round(pct)}<span className="text-lg opacity-60">%</span>
          </span>
        </div>
      </div>
      <span
        className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-sm font-semibold"
        style={{ background: meta.bg, borderColor: meta.color + '66', color: meta.color }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
        {meta.label} · {meta.range}
      </span>
      <div className="text-xs text-white/55">
        {Math.round(pulse.total_earned)} / {Math.round(pulse.total_max)} баллов · {pulse.competencies.length} компетенций
      </div>
    </div>
  );
}

// ─── Sparkline (TODO: backend history) ──────────────────────────────────────

function Sparkline({ pulse }: { pulse: UserPulse }) {
  // TODO: Backend endpoint /pulse/user/{id}/history даст реальные точки.
  // Пока показываем заглушку «новый дашборд → нет истории» с приглашением вернуться позже.
  void pulse;
  return (
    <div className="mt-4 pt-3 border-t border-white/10">
      <div className="text-[11px] text-white/35 text-center">
        ⏳ Тренд за 6 месяцев — скоро (после первого месяца замеров)
      </div>
    </div>
  );
}

// ─── Benchmark ──────────────────────────────────────────────────────────────

function Benchmark({ pulse }: { pulse: UserPulse }) {
  // Пока без реального бенчмарка — TODO backend
  // Логика-заглушка: показываем «средний по роли = 50» и дельту
  const benchAvg = 50;
  const delta = Math.round(pulse.overall_pulse - benchAvg);
  const sign = delta >= 0 ? '+' : '';
  const color = delta >= 0 ? '#4ADE80' : '#EF4444';
  return (
    <div
      className="mt-3 px-3 py-2.5 rounded-md text-xs leading-snug border-l-4 border-amber-400"
      style={{ background: 'rgba(200,168,75,0.06)', color: 'rgba(255,255,255,0.7)' }}
    >
      Средний РМ Узбекистана: <strong className="text-amber-300">{benchAvg}%</strong>
      <span className="mx-2">·</span>
      <strong style={{ color }}>{sign}{delta} п.п. {delta >= 0 ? 'выше' : 'ниже'} среднего</strong>
    </div>
  );
}

// ─── RadarBlock ─────────────────────────────────────────────────────────────

interface RadarBlockProps {
  data: RadarDataPoint[];
  overallPulse: number;
  overallLevelLabel: string;
  onPointClick?: (idx: number, d: RadarDataPoint) => void;
  tooltipExtra?: (d: RadarDataPoint, idx: number) => React.ReactNode;
}

function RadarBlock({ data, overallPulse, overallLevelLabel, onPointClick, tooltipExtra }: RadarBlockProps) {
  return (
    <div>
      <div className="relative flex items-center justify-center" style={{ minHeight: 460 }}>
        <RadarChart
          data={data}
          size={420}
          targetValues={70}
          onPointClick={onPointClick}
          tooltipExtra={tooltipExtra}
        />
        {/* Центральный overlay */}
        <div className="absolute pointer-events-none" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 38, fontWeight: 800, color: '#C8A84B', lineHeight: 1 }}>
            {Math.round(overallPulse)}%
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/45 mt-1">
            {overallLevelLabel}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5 mt-2 text-xs text-white/65">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-blue-400" />
          Твой пульс
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 border-t-2 border-dashed border-amber-400" />
          Целевой профиль (70%)
        </span>
        <span className="text-amber-300/70">💡 клик на точку — открыть курсы</span>
      </div>
    </div>
  );
}

// ─── LevelDistribution ──────────────────────────────────────────────────────

function LevelDistribution({ counts, total }: { counts: Record<LevelKey, number>; total: number }) {
  const masterShare = (counts.master / total) * 100;
  const expertShare = ((counts.master + counts.expert) / total) * 100;
  const practitionerShare = ((counts.master + counts.expert + counts.practitioner) / total) * 100;

  return (
    <>
      <div className="flex flex-col gap-2 mb-5">
        {(Object.entries(LEVEL_META) as Array<[LevelKey, typeof LEVEL_META[LevelKey]]>).map(([k, meta]) => (
          <div
            key={k}
            className="grid items-center gap-3 px-3.5 py-2.5 rounded-lg border"
            style={{
              gridTemplateColumns: '12px 1fr auto',
              background: 'rgba(255,255,255,0.02)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
            <div>
              <div className="text-sm font-medium">{meta.label}</div>
              <div className="text-[11px] text-white/40">{meta.range}</div>
            </div>
            <div
              style={{
                fontFamily: "'Unbounded',sans-serif",
                fontWeight: 800,
                fontSize: 18,
                color: meta.color,
                width: 28,
                textAlign: 'right',
              }}
            >
              {counts[k]}
            </div>
          </div>
        ))}
      </div>

      <h3
        className="font-bold uppercase mb-2.5"
        style={{
          fontFamily: "'Unbounded',sans-serif",
          fontSize: 11,
          letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        Покрытие уровней
      </h3>
      <div className="flex flex-col gap-3 text-xs">
        {[
          { key: 'master' as LevelKey, label: 'Мастер', share: masterShare, count: counts.master },
          { key: 'expert' as LevelKey, label: 'Эксперт+', share: expertShare, count: counts.master + counts.expert },
          { key: 'practitioner' as LevelKey, label: 'Практик+', share: practitionerShare, count: counts.master + counts.expert + counts.practitioner },
        ].map((p) => (
          <div key={p.key}>
            <div className="flex justify-between mb-1">
              <span className="text-white/65">{p.label}</span>
              <span style={{ color: LEVEL_META[p.key].color, fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 11 }}>
                {p.count} / {total} · {Math.round(p.share)}%
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${p.share}%`, background: LEVEL_META[p.key].color }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── FocusPanel ─────────────────────────────────────────────────────────────

interface FocusPanelProps {
  pulse: UserPulse;
  targetUserId?: string;
  lang: string;
  onCourseClick: (compId: string) => void;
}

function FocusPanel({ pulse, targetUserId, lang, onCourseClick }: FocusPanelProps) {
  // Самая слабая компетенция (с минимальным pulse_pct)
  const weakest = useMemo(() => {
    return [...pulse.competencies].sort((a, b) => a.pulse_pct - b.pulse_pct)[0];
  }, [pulse]);

  const [actions, setActions] = useState<PulseCourse[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);

  useEffect(() => {
    if (!weakest) return;
    setLoadingActions(true);
    pulseApi.getCompetencyCourses(weakest.competency_id, targetUserId)
      .then((res) => {
        // Берём top-3 не пройденных курса
        const incomplete = res.data.courses.filter((c) => !c.is_completed).slice(0, 3);
        setActions(incomplete);
      })
      .catch(() => setActions([]))
      .finally(() => setLoadingActions(false));
  }, [weakest, targetUserId]);

  if (!weakest) return null;

  // Расчёт «гейн» = сколько % компетенции даст 1 курс
  const gainPerCourse = (course: PulseCourse): number => {
    if (!weakest.score_max || weakest.score_max === 0) return 0;
    return Math.round((course.weight / weakest.score_max) * 100);
  };

  const nextLvl = nextLevelLabel(weakest.pulse_pct);
  const nextThr = nextLevelThreshold(weakest.pulse_pct);
  const gapToNext = nextThr ? nextThr - weakest.pulse_pct : 0;

  return (
    <Card title="🎯 Рекомендуемый фокус" accent="red">
      <div className="flex items-center gap-3.5 mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)' }}
        >
          🎯
        </div>
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-0.5 text-red-400"
            style={{ fontFamily: "'Unbounded',sans-serif" }}
          >
            Самая слабая компетенция
          </div>
          <h3 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 18, fontWeight: 700 }}>
            {lang === 'uz' && weakest.competency_name_uz ? weakest.competency_name_uz : weakest.competency_name}
          </h3>
          <div className="text-xs text-white/50 mt-0.5">
            Сейчас: <strong className="text-red-400">{Math.round(weakest.pulse_pct)}%</strong>
            {nextLvl && <> · до {nextLvl} осталось +{Math.ceil(gapToNext)} п.п.</>}
          </div>
        </div>
      </div>

      {loadingActions ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-amber-400 border-t-transparent rounded-full" />
        </div>
      ) : actions.length === 0 ? (
        <div className="text-center py-6 text-white/40 text-sm">
          Все курсы по этой компетенции уже пройдены 🎉
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {actions.map((course) => (
            <button
              key={course.course_id}
              type="button"
              onClick={() => onCourseClick(weakest.competency_id)}
              className="grid items-center gap-3 px-3.5 py-3 rounded-lg border bg-white/3 hover:bg-amber-500/5 hover:border-amber-400/40 hover:translate-x-0.5 transition-all text-left"
              style={{ gridTemplateColumns: '32px 1fr auto', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <span className="text-lg text-center">📚</span>
              <span>
                <span className="text-sm leading-tight font-medium block">
                  {lang === 'uz' && course.title_uz ? course.title_uz : course.title_ru}
                </span>
                <span className="text-xs text-white/40 mt-0.5 block">
                  Уровень: {course.level} · вес {course.weight}
                </span>
              </span>
              <span
                className="font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-md"
                style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 13 }}
              >
                +{gainPerCourse(course)}%
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── QuickWinsPanel ─────────────────────────────────────────────────────────

function QuickWinsPanel({ pulse, onClick }: { pulse: UserPulse; onClick: (compId: string) => void }) {
  // Top-3 «дешёвых» переходов: компетенция, у которой ближе всего до следующего уровня
  const wins = useMemo(() => {
    type Win = { comp: CompetencyPulse; gap: number; nextLevel: string };
    const items: Win[] = [];
    for (const c of pulse.competencies) {
      const thr = nextLevelThreshold(c.pulse_pct);
      if (thr === null) continue;
      items.push({
        comp: c,
        gap: thr - c.pulse_pct,
        nextLevel: LEVEL_META[levelByPct(thr)].label,
      });
    }
    return items.sort((a, b) => a.gap - b.gap).slice(0, 3);
  }, [pulse]);

  return (
    <Card title="⚡ Быстрые победы">
      <p className="text-xs text-white/65 mb-3.5 leading-snug">
        Самые дешёвые переходы на следующий уровень — закрой одно действие → +1 в счётчик уровня.
      </p>
      {wins.length === 0 ? (
        <div className="text-center py-6 text-white/40 text-sm">
          Все компетенции на максимальном уровне 🏆
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {wins.map(({ comp, gap, nextLevel }) => (
            <button
              key={comp.competency_id}
              type="button"
              onClick={() => onClick(comp.competency_id)}
              className="grid items-center gap-2.5 px-3.5 py-3 rounded-lg border bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-left"
              style={{ gridTemplateColumns: '1fr auto', borderColor: 'rgba(74,222,128,0.18)' }}
            >
              <span>
                <span className="text-sm leading-tight font-semibold block mb-0.5">
                  {comp.competency_name} · {Math.round(comp.pulse_pct)}% → {nextLevel}
                </span>
                <span className="text-xs text-white/40">
                  {comp.courses_completed}/{comp.courses_total} курсов закрыто
                </span>
              </span>
              <span
                className="text-emerald-400 font-bold"
                style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 13 }}
              >
                +{Math.ceil(gap)}% →
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── OrbitalPanel ───────────────────────────────────────────────────────────

function OrbitalPanel({ pulse }: { pulse: UserPulse }) {
  // Заглушка ранга — пока без реального бэкенд-ranking, считаем по overall_pulse
  // 80+ = топ-10%, 60+ = топ-30%, 40+ = средние, ниже = последние 30%
  const pct = pulse.overall_pulse;
  const rankText = pct >= 80
    ? 'топ-10%'
    : pct >= 60
      ? 'топ-30%'
      : pct >= 40
        ? 'средняя группа'
        : 'нижняя треть';

  return (
    <Card title="🪐 Твоя орбита">
      <div className="flex flex-col items-center text-center">
        <svg viewBox="0 0 180 130" className="w-44 h-32 my-2">
          <ellipse cx="90" cy="65" rx="70" ry="35" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <ellipse cx="90" cy="65" rx="40" ry="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <circle cx="160" cy="65" r="4" fill="rgba(255,255,255,0.5)" />
          <circle cx="50" cy="55" r="5" fill="rgba(255,255,255,0.4)" />
          <circle cx="90" cy="65" r="9" fill="#C8A84B" />
        </svg>
        <p className="text-xs text-white/65 leading-relaxed">
          Ты в <strong className="text-amber-300">{rankText}</strong> сотрудников этой роли.
          {pct < 76 && (
            <><br />До <strong className="text-amber-300">Мастера</strong> осталось +{Math.ceil(76 - pct)} п.п.</>
          )}
        </p>
      </div>
    </Card>
  );
}

// ─── DrilldownPanel ─────────────────────────────────────────────────────────

interface DrilldownProps {
  comp?: CompetencyPulse;
  courses: PulseCourse[];
  loading: boolean;
  lang: string;
  onClose: () => void;
}

function DrilldownPanel({ comp, courses, loading, lang, onClose }: DrilldownProps) {
  if (!comp) return null;
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        background: 'linear-gradient(180deg, #11243d, rgba(17,36,61,0.6))',
        borderColor: 'rgba(200,168,75,0.4)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-1" style={{ fontFamily: "'Unbounded',sans-serif" }}>
            🔍 Drill-down
          </div>
          <h3 className="text-lg font-bold" style={{ fontFamily: "'Unbounded',sans-serif" }}>
            {lang === 'uz' && comp.competency_name_uz ? comp.competency_name_uz : comp.competency_name}
          </h3>
          <div className="text-xs text-white/55 mt-1">
            {Math.round(comp.pulse_pct)}% · {comp.courses_completed}/{comp.courses_total} курсов
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/50 hover:text-white p-1 -mr-2"
          aria-label="Закрыть"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin h-6 w-6 border-2 border-amber-400 border-t-transparent rounded-full" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-6 text-white/40 text-sm">Курсы не привязаны к этой компетенции</div>
      ) : (
        <div className="grid gap-1.5">
          {courses.map((c) => (
            <div
              key={c.course_id}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm border"
              style={{
                background: c.is_completed ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)',
                borderColor: c.is_completed ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-base flex-shrink-0">{c.is_completed ? '✅' : '⬜'}</span>
                <span className={`truncate ${c.is_completed ? 'text-white/55' : 'text-white/85'}`}>
                  {lang === 'uz' && c.title_uz ? c.title_uz : c.title_ru}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/45 flex-shrink-0">
                <span className="px-2 py-0.5 bg-white/5 rounded font-mono">{c.level}</span>
                <span>вес {c.weight}</span>
                {c.quiz_score !== null && (
                  <span className="text-blue-400 font-semibold">{c.quiz_score}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TeamPulseView ──────────────────────────────────────────────────────────

function TeamPulseView({ data }: { data: SubordinatesPulseResponse }) {
  // Превращаем competency_averages в RadarDataPoint для общего радара команды
  const teamRadarData: RadarDataPoint[] = data.competency_averages.map((c) => ({
    label: c.name,
    value: c.avg_pct,
    level: c.level,
    id: c.id,
  }));

  // Распределение участников по уровням
  const levelCounts = useMemo(() => {
    const counts = { master: 0, expert: 0, practitioner: 0, trainee: 0 };
    data.members.forEach((m) => {
      counts[levelByPct(m.overall_pulse)]++;
    });
    return counts;
  }, [data]);

  const teamLevel = levelByPct(data.avg_pulse);

  return (
    <>
      {/* TOP: Сводный радар + распределение людей */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-5">
        <Card title="Средний пульс команды">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-[180px] h-[180px]">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
                <circle
                  cx="100" cy="100" r="80"
                  fill="none"
                  stroke={LEVEL_META[teamLevel].color}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${(data.avg_pulse / 100) * (2 * Math.PI * 80)} ${2 * Math.PI * 80}`}
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 42, fontWeight: 800, lineHeight: 1, color: '#fff' }}>
                  {Math.round(data.avg_pulse)}<span className="text-lg opacity-60">%</span>
                </span>
              </div>
            </div>
            <span
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-sm font-semibold"
              style={{ background: LEVEL_META[teamLevel].bg, borderColor: LEVEL_META[teamLevel].color + '66', color: LEVEL_META[teamLevel].color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: LEVEL_META[teamLevel].color }} />
              {LEVEL_META[teamLevel].label} · команда
            </span>
            <div className="text-xs text-white/55 text-center">
              Среднее по {data.members_count} {data.members_count === 1 ? 'подчинённому' : 'подчинённым'}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="text-[11px] uppercase tracking-widest text-white/45 mb-3" style={{ fontFamily: "'Unbounded',sans-serif" }}>
              Распределение
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(Object.keys(LEVEL_META) as LevelKey[]).map((k) => (
                <div
                  key={k}
                  className="flex items-center justify-between px-2.5 py-2 rounded-lg border"
                  style={{ background: LEVEL_META[k].bg, borderColor: LEVEL_META[k].color + '40' }}
                >
                  <span style={{ color: LEVEL_META[k].color }}>{LEVEL_META[k].label}</span>
                  <strong style={{ fontFamily: "'Unbounded',sans-serif", color: LEVEL_META[k].color }}>
                    {levelCounts[k]}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Сводная карта · средние по команде">
          <div className="relative flex items-center justify-center" style={{ minHeight: 460 }}>
            <RadarChart
              data={teamRadarData}
              size={420}
              targetValues={70}
              fillColor="rgba(200, 168, 75, 0.15)"
              strokeColor="#C8A84B"
            />
            <div className="absolute pointer-events-none" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 38, fontWeight: 800, color: '#C8A84B', lineHeight: 1 }}>
                {Math.round(data.avg_pulse)}%
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/45 mt-1">
                {LEVEL_META[teamLevel].label}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 mt-2 text-xs text-white/65">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-amber-400" />
              Средний по команде
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-amber-400" />
              Целевой профиль (70%)
            </span>
          </div>
        </Card>

        <Card title="Топ-3 / Худшие-3">
          <TopBottomList members={data.members} />
        </Card>
      </div>

      {/* Полный список членов команды */}
      <div
        className="rounded-2xl border border-white/10 p-5"
        style={{ background: 'linear-gradient(180deg, #11243d, rgba(17,36,61,0.6))' }}
      >
        <h3
          className="font-bold uppercase mb-4"
          style={{
            fontFamily: "'Unbounded',sans-serif",
            fontSize: 11,
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          👥 Все подчинённые ({data.members.length}) — отсортировано по пульсу
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.members.map((m, idx) => (
            <MemberCard key={m.user_id} member={m} rank={idx + 1} />
          ))}
        </div>
      </div>
    </>
  );
}

// ─── TopBottomList — мини-список топов и аутсайдеров ────────────────────────

function TopBottomList({ members }: { members: SubordinatePulseEntry[] }) {
  if (members.length === 0) return null;
  const top = members.slice(0, 3);
  const bottom = members.length > 3 ? members.slice(-3).reverse() : [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-emerald-300 mb-2" style={{ fontFamily: "'Unbounded',sans-serif" }}>
          🏆 Лидеры
        </div>
        {top.map((m, i) => (
          <div key={m.user_id} className="flex items-center gap-3 py-1.5 text-sm">
            <span className="w-6 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
            <span className="flex-1 truncate text-white/85">{m.full_name || m.employee_id}</span>
            <span style={{ color: LEVEL_META[levelByPct(m.overall_pulse)].color, fontFamily: "'Unbounded',sans-serif", fontWeight: 700 }}>
              {Math.round(m.overall_pulse)}%
            </span>
          </div>
        ))}
      </div>
      {bottom.length > 0 && (
        <div className="pt-3 border-t border-white/10">
          <div className="text-[10px] uppercase tracking-widest text-red-300 mb-2" style={{ fontFamily: "'Unbounded',sans-serif" }}>
            ⚠️ Нужна помощь
          </div>
          {bottom.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 py-1.5 text-sm">
              <span className="w-6 text-center text-white/40">↓</span>
              <span className="flex-1 truncate text-white/85">{m.full_name || m.employee_id}</span>
              <span style={{ color: LEVEL_META[levelByPct(m.overall_pulse)].color, fontFamily: "'Unbounded',sans-serif", fontWeight: 700 }}>
                {Math.round(m.overall_pulse)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MemberCard — карточка одного подчинённого ──────────────────────────────

function MemberCard({ member, rank }: { member: SubordinatePulseEntry; rank: number }) {
  const lvl = levelByPct(member.overall_pulse);
  const meta = LEVEL_META[lvl];

  // Топ-3 слабых компетенции
  const weakest = [...member.competencies].sort((a, b) => a.pct - b.pct).slice(0, 3);

  return (
    <div
      className="rounded-xl border p-4 transition-colors hover:bg-white/[0.03]"
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/40 mb-0.5">#{rank} · {member.employee_id}</div>
          <div className="font-semibold truncate">{member.full_name || member.employee_id}</div>
        </div>
        <div
          className="text-right ml-2"
          style={{ fontFamily: "'Unbounded',sans-serif" }}
        >
          <div className="text-2xl font-bold" style={{ color: meta.color }}>
            {Math.round(member.overall_pulse)}%
          </div>
          <div className="text-[10px] uppercase tracking-wider text-white/45">{meta.label}</div>
        </div>
      </div>

      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${member.overall_pulse}%`, background: meta.color }}
        />
      </div>

      {weakest.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/35 mb-1.5" style={{ fontFamily: "'Unbounded',sans-serif" }}>
            Слабые места
          </div>
          <div className="flex flex-col gap-1 text-xs">
            {weakest.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <span className="text-white/70 truncate">{c.name}</span>
                <span style={{ color: LEVEL_META[levelByPct(c.pct)].color, fontFamily: "'Unbounded',sans-serif", fontWeight: 700 }}>
                  {Math.round(c.pct)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EmptyPulse ─────────────────────────────────────────────────────────────

function EmptyPulse({
  isAdmin, selectedRole, setSelectedRole, lang, t,
}: {
  isAdmin: boolean;
  selectedRole: string;
  setSelectedRole: (r: string) => void;
  lang: string;
  t: (k: string) => string;
}) {
  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-sm text-white/60">Роль:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
            style={{ colorScheme: 'dark' }}
          >
            {PULSE_ROLES.map((r) => (
              <option key={r.value} value={r.value} style={{ color: '#000' }}>
                {lang === 'uz' ? r.label.uz : r.label.ru}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="text-center py-20 text-white/50">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-lg">{t('pulse.noData') || 'Данные пульса пока недоступны'}</p>
        <p className="text-sm mt-2 text-white/35">{t('pulse.noDataHint') || 'Компетенции ещё не настроены для этой роли'}</p>
      </div>
    </div>
  );
}
