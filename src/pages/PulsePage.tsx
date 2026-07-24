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
import { KPIBreakdownCard } from '../components/kpi/KPIBreakdownCard';

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

// Подписи ролей — ключи словаря (pulse.role*), t() в рендере
const PULSE_ROLES = [
  { value: 'regional_manager', labelKey: 'pulse.roleRegionalManager' },
  { value: 'supervisor', labelKey: 'pulse.roleSupervisor' },
  { value: 'sales_rep', labelKey: 'pulse.roleSalesRep' },
];

const LEVEL_META = {
  master: { labelKey: 'pulse.master', range: '76–100%', color: '#4ADE80', bg: 'rgba(74,222,128,0.15)' },
  expert: { labelKey: 'pulse.expert', range: '51–75%', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  practitioner: { labelKey: 'pulse.practitioner', range: '26–50%', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  trainee: { labelKey: 'pulse.trainee', range: '0–25%', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
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

// Возвращает КЛЮЧ словаря (pulse.master и т.д.) — перевод через t() в рендере
function nextLevelLabelKey(pct: number): string | null {
  const thr = nextLevelThreshold(pct);
  if (thr === null) return null;
  return LEVEL_META[levelByPct(thr)].labelKey;
}

// Пороги «здоровья» для полоски-распределения (как в ShelfScan «Распределение агентов»).
// ⚠️ ОТДЕЛЬНЫЕ от уровней компетенций (76/51/26): здесь бизнес-сегменты ≥70 / 30–69 / <30.
// label: null у nodata → подпись из словаря (pulse.healthNoData) через t() в рендере
const HEALTH_BUCKETS = [
  { key: 'ge70', label: '≥70%', color: '#22C55E' },
  { key: 'mid', label: '30–69%', color: '#C8A84B' },
  { key: 'lt30', label: '<30%', color: '#E1626F' },
  { key: 'nodata', label: null, color: '#9CA3AF' },
] as const;

type HealthKey = (typeof HEALTH_BUCKETS)[number]['key'];

function healthBucket(m: SubordinatePulseEntry): HealthKey {
  const hasData = m.overall_pulse > 0 || (m.competencies?.some((c) => c.pct > 0) ?? false);
  if (!hasData) return 'nodata';
  if (m.overall_pulse >= 70) return 'ge70';
  if (m.overall_pulse >= 30) return 'mid';
  return 'lt30';
}

// Порядок ролей для колонок Пульса команды (подписи — i18n rolesPlural.*)
const ROLE_ORDER = ['regional_manager', 'supervisor', 'sales_rep'] as const;

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
  // Менеджеры/админ по умолчанию видят команду (у них нет личных данных обучения)
  const [view, setView] = useState<'me' | 'team'>(canViewTeam ? 'team' : 'me');

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
        setError('pulse.loadError'); // ключ словаря — t() в рендере
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
      .catch(() => setTeamError('pulse.teamLoadError')) // ключ словаря — t() в рендере
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
        <p className="text-red-400 mb-4">{t(error)}</p>
        <button
          onClick={loadPulse}
          className="px-4 py-2 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (!pulse || pulse.competencies.length === 0) {
    return <EmptyPulse isAdmin={isAdmin} selectedRole={selectedRole} setSelectedRole={setSelectedRole} t={t} />;
  }

  const headerName = isAdmin && teamUsers.find((u) => u.id === selectedUserId)?.full_name
    || (user?.full_name || t('nav.profile'));

  // ============================================================================
  // Team view branch
  // ============================================================================

  if (view === 'team' && canViewTeam) {
    return (
      <div className="space-y-5" style={{ color: 'var(--text-primary)' }}>
        <PulseHeader
          title={t('pulse.teamTitle')}
          subtitle={`${headerName} · ${getRoleLabel(user?.role || '', t)} · ${t((teamData?.members_count ?? 0) === 1 ? 'pulse.subordinateOne' : 'pulse.subordinatesMany', { n: teamData?.members_count ?? 0 })}`}
          view={view}
          setView={setView}
          canViewTeam={canViewTeam}
          isAdmin={isAdmin}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          teamUsers={teamUsers}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
        />
        {teamLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin h-10 w-10 border-2 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : teamError ? (
          <div className="text-center py-20 text-red-400">{t(teamError)}</div>
        ) : !teamData || teamData.members_count === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
            <div className="text-5xl mb-4">👥</div>
            <p className="text-lg">{t('pulse.noSubsCascade')}</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{t('pulse.backToMe')}</p>
          </div>
        ) : (
          <TeamPulseView data={teamData} />
        )}
        {canViewTeam && (
          <div className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {t('pulse.hint')} <kbd style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }} className="px-1.5 py-0.5 rounded font-mono text-xs">M</kbd> {t('pulse.hotkeyToggle')}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // Main render
  // ============================================================================

  return (
    <div className="space-y-5" style={{ color: 'var(--text-primary)' }}>

      {/* ─── HEADER ─── */}
      <PulseHeader
        title={t('pulse.pageTitle')}
        subtitle={`${headerName} · ${getRoleLabel(isAdmin ? selectedRole : (user?.role || ''), t)}`}
        view={view}
        setView={setView}
        canViewTeam={canViewTeam}
        isAdmin={isAdmin}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        teamUsers={teamUsers}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
      />

      {/* ─── MAIN GRID 3 columns ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-5">

        {/* COL 1: Общий пульс */}
        <Card title={t('pulse.overallPulse')}>
          <OverallGauge pulse={pulse} levelKey={overallLevel} />
          <Sparkline pulse={pulse} />
          <Benchmark pulse={pulse} />
        </Card>

        {/* COL 2: Радар */}
        <Card title={t('pulse.radarTitle')}>
          <RadarBlock
            data={radarData}
            onPointClick={(_, datum) => datum.id && drillCompetency(datum.id)}
            tooltipExtra={(d) => {
              const comp = pulse.competencies.find((c) => c.competency_id === d.id);
              if (!comp) return null;
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t('pulse.courses')}</span>
                    <span>{comp.courses_completed}/{comp.courses_total}</span>
                  </div>
                  {comp.avg_quiz_score !== null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('pulse.tests')}</span>
                      <span>{Math.round(comp.avg_quiz_score)}%</span>
                    </div>
                  )}
                </>
              );
            }}
          />
        </Card>

        {/* COL 3: KPI периода + Уровень компетенций */}
        <div className="flex flex-col gap-5">
          {/* KPI разбивка по 4 компонентам (Scoring v2.0, Этап 2) */}
          <KPIBreakdownCard />

          <Card title={t('pulse.levelsTitle')}>
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
        <div className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          {t('pulse.hint')} <kbd style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }} className="px-1.5 py-0.5 rounded font-mono text-xs">M</kbd> {t('pulse.hotkeyToggle')}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function getRoleLabel(role: string, t: (k: string) => string): string {
  const r = PULSE_ROLES.find((x) => x.value === role);
  if (r) return t(r.labelKey);
  return role;
}

// ─── Card ───────────────────────────────────────────────────────────────────

function Card({ title, children, accent }: { title: string; children: React.ReactNode; accent?: 'gold' | 'red' | 'green' }) {
  const accentBorderColor = accent === 'red'
    ? 'rgba(239,68,68,0.25)'
    : accent === 'green'
      ? 'rgba(74,222,128,0.25)'
      : 'var(--border)';
  const accentBgFrom = accent === 'red'
    ? 'rgba(239,68,68,0.08)'
    : accent === 'green'
      ? 'rgba(74,222,128,0.08)'
      : 'var(--bg-card)';
  const accentBgTo = accent === 'red'
    ? 'rgba(239,68,68,0.02)'
    : accent === 'green'
      ? 'rgba(74,222,128,0.02)'
      : 'var(--bg-surface)';
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        border: `1px solid ${accentBorderColor}`,
        background: `linear-gradient(180deg, ${accentBgFrom}, ${accentBgTo})`,
      }}
    >
      <h3
        className="font-bold uppercase mb-4"
        style={{
          fontSize: 12,
          letterSpacing: '0.18em',
          color: 'var(--text-muted)',
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
}

function PulseHeader({
  title, subtitle, view, setView, canViewTeam,
  isAdmin, selectedRole, setSelectedRole,
  teamUsers, selectedUserId, setSelectedUserId,
}: PulseHeaderProps) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" style={{ boxShadow: '0 0 12px #FBBF24' }} />
          <span
            className="text-amber-400 font-bold uppercase"
            style={{ fontSize: 12, letterSpacing: '0.2em' }}
          >
            {'★ Pulse'}
          </span>
        </div>
        <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
          {title}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canViewTeam && (
          <div
            className="inline-flex rounded-xl p-1"
            style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}
          >
            <button
              type="button"
              onClick={() => setView('me')}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                view === 'me'
                  ? 'bg-amber-400 font-semibold'
                  : ''
              }`}
              style={view === 'me'
                ? { color: 'var(--text-inverse)' }
                : { color: 'var(--text-secondary)' }
              }
            >
              {t('pulse.viewMe')}
            </button>
            <button
              type="button"
              onClick={() => setView('team')}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                view === 'team'
                  ? 'bg-amber-400 font-semibold'
                  : ''
              }`}
              style={view === 'team'
                ? { color: 'var(--text-inverse)' }
                : { color: 'var(--text-secondary)' }
              }
            >
              {t('pulse.viewTeam')}
            </button>
          </div>
        )}

        {isAdmin && (
          <>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm"
              style={{
                background: 'var(--bg-overlay)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                colorScheme: 'dark light',
              }}
            >
              {PULSE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {t(r.labelKey)}
                </option>
              ))}
            </select>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm min-w-[180px]"
              style={{
                background: 'var(--bg-overlay)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                colorScheme: 'dark light',
              }}
            >
              <option value="">{t('pulse.allTeamAvg')}</option>
              {teamUsers.map((u) => (
                <option key={u.id} value={u.id}>
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
  const t = useT();
  const meta = LEVEL_META[levelKey];
  const pct = pulse.overall_pulse;
  const r = 80;
  const C = 2 * Math.PI * r;
  const dash = (pct / 100) * C;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[180px] h-[180px]">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r={r} fill="none" stroke="var(--border)" strokeWidth="14" />
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
          <span style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>
            {Math.round(pct)}<span className="text-lg" style={{ color: 'var(--text-secondary)' }}>%</span>
          </span>
        </div>
      </div>
      <span
        className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-sm font-semibold"
        style={{ background: meta.bg, borderColor: meta.color + '66', color: meta.color }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
        {t(meta.labelKey)} {'·'} {meta.range}
      </span>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {t('pulse.gaugeStats', { earned: Math.round(pulse.total_earned), max: Math.round(pulse.total_max), n: pulse.competencies.length })}
      </div>
    </div>
  );
}

// ─── Sparkline (TODO: backend history) ──────────────────────────────────────

function Sparkline({ pulse }: { pulse: UserPulse }) {
  // TODO: Backend endpoint /pulse/user/{id}/history даст реальные точки.
  // Пока показываем заглушку «новый дашборд → нет истории» с приглашением вернуться позже.
  const t = useT();
  void pulse;
  return (
    <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        {t('pulse.trendSoon')}
      </div>
    </div>
  );
}

// ─── Benchmark ──────────────────────────────────────────────────────────────

function Benchmark({ pulse }: { pulse: UserPulse }) {
  // Пока без реального бенчмарка — TODO backend
  // Логика-заглушка: показываем «средний по роли = 50» и дельту
  const t = useT();
  const benchAvg = 50;
  const delta = Math.round(pulse.overall_pulse - benchAvg);
  const sign = delta >= 0 ? '+' : '';
  const color = delta >= 0 ? '#4ADE80' : '#EF4444';
  return (
    <div
      className="mt-3 px-3 py-2.5 rounded-md text-sm leading-snug border-l-4 border-amber-400"
      style={{ background: 'rgba(200,168,75,0.06)', color: 'var(--text-secondary)' }}
    >
      {t('pulse.benchAvg')} <strong className="text-amber-300">{benchAvg}%</strong>
      <span className="mx-2">{'·'}</span>
      <strong style={{ color }}>{sign}{delta} {t(delta >= 0 ? 'pulse.benchAbove' : 'pulse.benchBelow')}</strong>
    </div>
  );
}

// ─── RadarBlock ─────────────────────────────────────────────────────────────

interface RadarBlockProps {
  data: RadarDataPoint[];
  onPointClick?: (idx: number, d: RadarDataPoint) => void;
  tooltipExtra?: (d: RadarDataPoint, idx: number) => React.ReactNode;
}

function RadarBlock({ data, onPointClick, tooltipExtra }: RadarBlockProps) {
  const t = useT();
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
        {/* Центральный overlay убран по запросу PO — дубль с левой карточкой «Общий пульс» */}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-blue-400" />
          {t('pulse.legendYou')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 border-t-2 border-dashed border-amber-400" />
          {t('pulse.legendTarget')}
        </span>
        <span style={{ color: 'var(--warning)' }}>{t('pulse.legendClickHint')}</span>
      </div>
    </div>
  );
}

// ─── LevelDistribution ──────────────────────────────────────────────────────

function LevelDistribution({ counts, total }: { counts: Record<LevelKey, number>; total: number }) {
  const t = useT();
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
              background: 'var(--bg-overlay)',
              borderColor: 'var(--border)',
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
            <div>
              <div className="text-sm font-medium">{t(meta.labelKey)}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{meta.range}</div>
            </div>
            <div
              style={{
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
          fontSize: 12,
          letterSpacing: '0.18em',
          color: 'var(--text-muted)',
        }}
      >
        {t('pulse.levelCoverage')}
      </h3>
      <div className="flex flex-col gap-3 text-xs">
        {[
          { key: 'master' as LevelKey, label: t('pulse.master'), share: masterShare, count: counts.master },
          { key: 'expert' as LevelKey, label: `${t('pulse.expert')}+`, share: expertShare, count: counts.master + counts.expert },
          { key: 'practitioner' as LevelKey, label: `${t('pulse.practitioner')}+`, share: practitionerShare, count: counts.master + counts.expert + counts.practitioner },
        ].map((p) => (
          <div key={p.key}>
            <div className="flex justify-between mb-1">
              <span style={{ color: 'var(--text-secondary)' }}>{p.label}</span>
              <span style={{ color: LEVEL_META[p.key].color, fontWeight: 700, fontSize: 12 }}>
                {p.count} / {total} · {Math.round(p.share)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
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
  const t = useT();
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

  const nextLvlKey = nextLevelLabelKey(weakest.pulse_pct);
  const nextThr = nextLevelThreshold(weakest.pulse_pct);
  const gapToNext = nextThr ? nextThr - weakest.pulse_pct : 0;

  return (
    <Card title={`🎯 ${t('pulse.focusTitle')}`} accent="red">
      <div className="flex items-center gap-3.5 mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)' }}
        >
          🎯
        </div>
        <div>
          {/* было text-[10px] — UX-прогон 2026-07-02: подпись мелкая → 12px */}
          <div
            className="text-xs font-bold uppercase tracking-widest mb-0.5 text-red-400"
          >
            {t('pulse.weakestComp')}
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>
            {lang === 'uz' && weakest.competency_name_uz ? weakest.competency_name_uz : weakest.competency_name}
          </h3>
          <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {t('pulse.now')} <strong className="text-red-400">{Math.round(weakest.pulse_pct)}%</strong>
            {nextLvlKey && <> {'·'} {t('pulse.toNextLevel', { level: t(nextLvlKey), n: Math.ceil(gapToNext) })}</>}
          </div>
        </div>
      </div>

      {loadingActions ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-amber-400 border-t-transparent rounded-full" />
        </div>
      ) : actions.length === 0 ? (
        <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('pulse.allCoursesDone')}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {actions.map((course) => (
            <button
              key={course.course_id}
              type="button"
              onClick={() => onCourseClick(weakest.competency_id)}
              className="grid items-center gap-3 px-3.5 py-3 rounded-lg border hover:bg-amber-500/5 hover:border-amber-400/40 hover:translate-x-0.5 transition-all text-left"
              style={{ gridTemplateColumns: '32px 1fr auto', background: 'var(--bg-overlay)', borderColor: 'var(--border)' }}
            >
              <svg className="w-5 h-5 mx-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span>
                <span className="text-sm leading-tight font-medium block">
                  {lang === 'uz' && course.title_uz ? course.title_uz : course.title_ru}
                </span>
                <span className="text-xs mt-0.5 block" style={{ color: 'var(--text-muted)' }}>
                  {t('pulse.level')}: {course.level} {'·'} {t('pulse.weight')} {course.weight}
                </span>
              </span>
              <span
                className="font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-md"
                style={{ fontSize: 14 }}
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
  const t = useT();
  // Top-3 «дешёвых» переходов: компетенция, у которой ближе всего до следующего уровня
  const wins = useMemo(() => {
    type Win = { comp: CompetencyPulse; gap: number; nextLevelKey: string };
    const items: Win[] = [];
    for (const c of pulse.competencies) {
      const thr = nextLevelThreshold(c.pulse_pct);
      if (thr === null) continue;
      items.push({
        comp: c,
        gap: thr - c.pulse_pct,
        nextLevelKey: LEVEL_META[levelByPct(thr)].labelKey,
      });
    }
    return items.sort((a, b) => a.gap - b.gap).slice(0, 3);
  }, [pulse]);

  return (
    <Card title={`⚡ ${t('pulse.quickWinsTitle')}`}>
      <p className="text-sm mb-3.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
        {t('pulse.quickWinsDesc')}
      </p>
      {wins.length === 0 ? (
        <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('pulse.allMaxLevel')}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {wins.map(({ comp, gap, nextLevelKey }) => (
            <button
              key={comp.competency_id}
              type="button"
              onClick={() => onClick(comp.competency_id)}
              className="grid items-center gap-2.5 px-3.5 py-3 rounded-lg border bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-left"
              style={{ gridTemplateColumns: '1fr auto', borderColor: 'rgba(74,222,128,0.25)' }}
            >
              <span>
                <span className="text-sm leading-tight font-semibold block mb-0.5">
                  {comp.competency_name} {'·'} {Math.round(comp.pulse_pct)}% {'→'} {t(nextLevelKey)}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t('pulse.coursesClosed', { done: comp.courses_completed, total: comp.courses_total })}
                </span>
              </span>
              <span
                className="text-emerald-400 font-bold"
                style={{ fontSize: 14 }}
              >
                +{Math.ceil(gap)}% {'→'}
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
  const t = useT();
  // Заглушка ранга — пока без реального бэкенд-ranking, считаем по overall_pulse
  // 80+ = топ-10%, 60+ = топ-30%, 40+ = средние, ниже = последние 30%
  const pct = pulse.overall_pulse;
  const rankKey = pct >= 80
    ? 'pulse.rankTop10'
    : pct >= 60
      ? 'pulse.rankTop30'
      : pct >= 40
        ? 'pulse.rankMid'
        : 'pulse.rankBottom';

  return (
    <Card title={`🪐 ${t('pulse.orbitTitle')}`}>
      <div className="flex flex-col items-center text-center">
        <svg viewBox="0 0 180 130" className="w-44 h-32 my-2">
          <ellipse cx="90" cy="65" rx="70" ry="35" fill="none" stroke="var(--border)" strokeWidth="1" />
          <ellipse cx="90" cy="65" rx="40" ry="20" fill="none" stroke="var(--border)" strokeWidth="1" />
          <circle cx="160" cy="65" r="4" fill="var(--text-muted)" />
          <circle cx="50" cy="55" r="5" fill="var(--text-muted)" />
          <circle cx="90" cy="65" r="9" fill="#C8A84B" />
        </svg>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {t('pulse.orbitPre')} <strong className="text-amber-300">{t(rankKey)}</strong> {t('pulse.orbitPost')}
          {pct < 76 && (
            <><br />{t('pulse.orbitToMasterPre')} <strong className="text-amber-300">{t('pulse.masterGen')}</strong> {t('pulse.orbitToMasterPost', { n: Math.ceil(76 - pct) })}</>
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
  const t = useT();
  if (!comp) return null;
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: `linear-gradient(180deg, var(--bg-card), var(--bg-surface))`,
        border: '1px solid rgba(200,168,75,0.4)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          {/* было text-[10px] → 12px */}
          <div className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
            {'Drill-down'}
          </div>
          <h3 className="text-lg font-bold">
            {lang === 'uz' && comp.competency_name_uz ? comp.competency_name_uz : comp.competency_name}
          </h3>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {Math.round(comp.pulse_pct)}% {'·'} {t('pulse.coursesCount', { done: comp.courses_completed, total: comp.courses_total })}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 -mr-2 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          aria-label={t('common.close')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin h-6 w-6 border-2 border-amber-400 border-t-transparent rounded-full" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>{t('pulse.drillNoCourses')}</div>
      ) : (
        <div className="grid gap-1.5">
          {courses.map((c) => (
            <div
              key={c.course_id}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm border"
              style={{
                background: c.is_completed ? 'rgba(74,222,128,0.06)' : 'var(--bg-overlay)',
                borderColor: c.is_completed ? 'rgba(74,222,128,0.2)' : 'var(--border)',
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {c.is_completed
                  ? <svg className="w-4 h-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  : <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }}><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                }
                <span className="truncate" style={{ color: c.is_completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  {lang === 'uz' && c.title_uz ? c.title_uz : c.title_ru}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                <span className="px-2 py-0.5 rounded font-mono" style={{ background: 'var(--bg-overlay)' }}>{c.level}</span>
                <span>{t('pulse.weight')} {c.weight}</span>
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

// ─── RoleDistributionBar — сегментированная полоска «здоровья» (как в ShelfScan) ──

function RoleDistributionBar({ members }: { members: SubordinatePulseEntry[] }) {
  const t = useT();
  const counts: Record<HealthKey, number> = { ge70: 0, mid: 0, lt30: 0, nodata: 0 };
  members.forEach((m) => { counts[healthBucket(m)]++; });
  const total = members.length || 1;
  const bucketLabel = (b: (typeof HEALTH_BUCKETS)[number]): string => b.label ?? t('pulse.healthNoData');

  return (
    <div>
      <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
        {HEALTH_BUCKETS.map((b) =>
          counts[b.key] > 0 ? (
            <div
              key={b.key}
              style={{ width: `${(counts[b.key] / total) * 100}%`, background: b.color }}
              title={`${bucketLabel(b)}: ${counts[b.key]}`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
        {HEALTH_BUCKETS.map((b) => (
          <span key={b.key} className="inline-flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
            {bucketLabel(b)} <strong style={{ color: 'var(--text-primary)' }}>{counts[b.key]}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── TeamPulseView ──────────────────────────────────────────────────────────
// Каскадный обзор по ролям: на КАЖДУЮ подчинённую роль (РМ/СВ/ТП) — свой радар
// компетенций, под ним полоска-распределение, а ниже — отдельная колонка-список
// участников. Количество колонок = число подчинённых ролей (1, 2 или 3).

function TeamPulseView({ data }: { data: SubordinatesPulseResponse }) {
  const t = useT();
  const lang = useLangStore((s) => s.lang);

  // Роли с готовым множественным числом в словаре (rolesPlural.*)
  const PLURAL_ROLES = new Set(['regional_manager', 'supervisor', 'sales_rep', 'commercial_dir', 'dealer']);
  const roleLabel = (r: string, roleRu?: string | null) =>
    PLURAL_ROLES.has(r) ? t(`rolesPlural.${r}`) : (roleRu ?? r);

  const toRadar = (avgs: SubordinatesPulseResponse['competency_averages']): RadarDataPoint[] =>
    avgs.map((c) => ({
      label: lang === 'uz' && c.name_uz ? c.name_uz : c.name,
      value: c.avg_pct,
      level: c.level,
      id: c.id,
    }));

  // Радары приходят с бэка сгруппированными по роли (competency_averages_by_role)
  const roleGroups = (data.competency_averages_by_role ?? []).filter(
    (g) => g.competency_averages.length > 0
  );

  // Члены — группируем по роли и сортируем по пульсу (desc) внутри каждой
  const membersByRole = useMemo(() => {
    const acc: Record<string, SubordinatePulseEntry[]> = {};
    data.members.forEach((m) => { (acc[m.role] ||= []).push(m); });
    Object.values(acc).forEach((arr) => arr.sort((a, b) => b.overall_pulse - a.overall_pulse));
    return acc;
  }, [data]);

  // Порядок ролей: сперва канонический (РМ→СВ→ТП), потом всё прочее
  const roles = useMemo(() => {
    const present = new Set([...Object.keys(membersByRole), ...roleGroups.map((g) => g.role)]);
    const ordered = ROLE_ORDER.filter((r) => present.has(r));
    const extra = [...present].filter((r) => !ROLE_ORDER.includes(r as (typeof ROLE_ORDER)[number]));
    return [...ordered, ...extra];
  }, [membersByRole, roleGroups]);

  const gridCols =
    roles.length >= 3 ? 'md:grid-cols-2 xl:grid-cols-3' : roles.length === 2 ? 'md:grid-cols-2' : '';

  return (
    <>
      {/* Радар + полоска-распределение — на каждую роль */}
      <div className={`grid grid-cols-1 ${gridCols} gap-5`}>
        {roles.map((r) => {
          const g = roleGroups.find((x) => x.role === r);
          const mem = membersByRole[r] ?? [];
          const avg = mem.length ? mem.reduce((s, m) => s + m.overall_pulse, 0) / mem.length : 0;
          const label = roleLabel(r, g?.role_ru);
          return (
            <Card key={r} title={`${t('pulse.summaryMap')} · ${label}`}>
              <div className="text-xs text-center mb-1" style={{ color: 'var(--text-muted)' }}>
                {t('pulse.membersAvg', { n: mem.length, pct: Math.round(g?.avg_pulse ?? avg) })}
              </div>
              <div className="relative flex items-center justify-center" style={{ minHeight: 320 }}>
                {g ? (
                  <RadarChart
                    data={toRadar(g.competency_averages)}
                    size={300}
                    targetValues={70}
                    fillColor="rgba(200, 168, 75, 0.15)"
                    strokeColor="#C8A84B"
                  />
                ) : (
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {t('pulse.noCompData')}
                  </div>
                )}
              </div>
              {/* Полоска-распределение под радаром */}
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  {t('pulse.distribution')}
                </div>
                <RoleDistributionBar members={mem} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Списки подчинённых — отдельная колонка на каждую роль */}
      <div className={`grid grid-cols-1 ${gridCols} gap-5 mt-5`}>
        {roles.map((r) => {
          const mem = membersByRole[r] ?? [];
          const label = roleLabel(r, roleGroups.find((x) => x.role === r)?.role_ru);
          return (
            <div
              key={r}
              className="rounded-2xl p-4"
              style={{
                background: `linear-gradient(180deg, var(--bg-card), var(--bg-surface))`,
                border: '1px solid var(--border)',
              }}
            >
              <h3
                className="font-bold uppercase mb-3"
                style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--text-muted)' }}
              >
                {label} ({mem.length})
              </h3>
              <div className="flex flex-col gap-3">
                {mem.length === 0 ? (
                  <div className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                    {t('pulse.noSubs')}
                  </div>
                ) : (
                  mem.map((m, idx) => <MemberCard key={m.user_id} member={m} rank={idx + 1} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── MemberCard — карточка одного подчинённого ──────────────────────────────

function MemberCard({ member, rank }: { member: SubordinatePulseEntry; rank: number }) {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const lvl = levelByPct(member.overall_pulse);
  const meta = LEVEL_META[lvl];

  // Топ-3 слабых компетенции
  const weakest = [...member.competencies].sort((a, b) => a.pct - b.pct).slice(0, 3);

  return (
    <div
      className="rounded-xl p-4 transition-colors"
      style={{
        background: 'var(--bg-overlay)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>#{rank} · {member.employee_id}</div>
          <div className="font-semibold truncate">{member.full_name || member.employee_id}</div>
        </div>
        <div className="text-right ml-2">
          <div className="text-2xl font-bold" style={{ color: meta.color }}>
            {Math.round(member.overall_pulse)}%
          </div>
          {/* было text-[10px] → 12px */}
          <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t(meta.labelKey)}</div>
        </div>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--bg-overlay)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${member.overall_pulse}%`, background: meta.color }}
        />
      </div>

      {weakest.length > 0 && (
        <div>
          {/* было text-[10px] → 12px */}
          <div className="text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
            {t('pulse.weakSpots')}
          </div>
          <div className="flex flex-col gap-1 text-sm">
            {weakest.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <span className="truncate min-w-0" style={{ color: 'var(--text-secondary)' }}>{lang === 'uz' && c.name_uz ? c.name_uz : c.name}</span>
                <span className="flex-shrink-0" style={{ color: LEVEL_META[levelByPct(c.pct)].color, fontWeight: 700 }}>
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
  isAdmin, selectedRole, setSelectedRole, t,
}: {
  isAdmin: boolean;
  selectedRole: string;
  setSelectedRole: (r: string) => void;
  t: (k: string) => string;
}) {
  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('pulse.roleLabel')}</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm"
            style={{
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              colorScheme: 'dark light',
            }}
          >
            {PULSE_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {t(r.labelKey)}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
        <svg className="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <p className="text-lg">{t('pulse.noData')}</p>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{t('pulse.noDataHint')}</p>
      </div>
    </div>
  );
}
