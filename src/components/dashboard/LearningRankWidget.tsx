/**
 * LearningRankWidget v3 (2026-05-05) — Стиль «Лиги Чемпионов».
 *
 * Структура:
 *  1. ТОП-3 пьедестал — серебро / золото / бронза с подсветкой
 *  2. Карточка «Твой ранг» (если не в топ-3) с прогрессом к следующему
 *  3. Список 4-10 ниже
 *  4. Подзаголовок: «Сейчас: Обучение · Скоро: + Активность + KPI»
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { learningApi } from '../../api/learning';
import type { LeaderboardResponse, LeaderboardEntry, LeaderboardPeriod, LeaderboardRole } from '../../api/learning';
import { DEMO_EMPLOYEE_ID } from '../../api/demoData';
import { useAuthStore } from '../../stores/authStore';
import { useT } from '../../stores/langStore';
import { useDashboardFilters } from '../../stores/dashboardFiltersStore';

// Период-кнопки
const PERIOD_OPTIONS: Array<{ value: LeaderboardPeriod; label: string; short: string }> = [
  { value: 'month',     label: 'Месяц',     short: '30 дн' },
  { value: 'quarter',   label: 'Квартал',   short: '90 дн' },
  { value: 'half_year', label: 'Полгода',   short: '180 дн' },
  { value: 'year',      label: 'Год',       short: '365 дн' },
];

// Роли для админ-селектора
const ROLE_OPTIONS: Array<{ value: LeaderboardRole; label: string; icon: string }> = [
  { value: 'regional_manager', label: 'РМ',  icon: '👔' },
  { value: 'supervisor',       label: 'СВ',  icon: '🤝' },
  { value: 'sales_rep',        label: 'ТП',  icon: '🛒' },
];

const ADMIN_ROLES = ['superadmin', 'admin', 'commercial_dir'];

// Цвет-как-текст через токены (тёмно в светлой теме, ярко в тёмной — контраст ≥4.5).
// bg-tint оставляем ярким — текст теперь адаптируется.
const LEVEL_COLOR: Record<string, { color: string; bg: string }> = {
  trainee:     { color: 'var(--rank-trainee)',      bg: 'rgba(239,68,68,0.15)' },
  practitioner: { color: 'var(--rank-practitioner)', bg: 'rgba(251,191,36,0.15)' },
  expert:      { color: 'var(--rank-expert)',       bg: 'rgba(96,165,250,0.15)' },
  master:      { color: 'var(--rank-master)',       bg: 'rgba(74,222,128,0.15)' },
};

// Цвета медалей — бренд/семантика, корректны на обеих темах
const PODIUM = {
  gold:   { bg: 'linear-gradient(135deg, #FBBF24 0%, #C8A84B 100%)', text: '#0a1929', glow: 'rgba(251,191,36,0.4)' },
  silver: { bg: 'linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 100%)', text: '#0a1929', glow: 'rgba(229,231,235,0.3)' },
  bronze: { bg: 'linear-gradient(135deg, #FB923C 0%, #C2410C 100%)', text: '#fff',    glow: 'rgba(251,146,60,0.4)' },
};

export function LearningRankWidget() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const isAdmin = !!user?.role && ADMIN_ROLES.includes(user.role);

  // Shared filters (синхронизировано с Activity и Pulse)
  const role = useDashboardFilters((s) => s.role);
  const period = useDashboardFilters((s) => s.period);
  const setRole = useDashboardFilters((s) => s.setRole);
  const setPeriod = useDashboardFilters((s) => s.setPeriod);

  // Инициализация role: если не админ — синхронизируем со своей ролью при первом рендере
  useEffect(() => {
    if (!isAdmin && user?.role) {
      const userRole = user.role as LeaderboardRole;
      if (['regional_manager', 'supervisor', 'sales_rep'].includes(userRole)) {
        if (role !== userRole) setRole(userRole);
      }
    }
  }, [isAdmin, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    setError(false);
    const opts: { period: LeaderboardPeriod; role?: LeaderboardRole } = { period };
    if (isAdmin) opts.role = role;
    learningApi
      .getLeaderboard(10, opts)
      .then((res) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [period, role, isAdmin]);

  // Алиасы для совместимости с UI (был selectedRole/setSelectedRole)
  const selectedRole = role;
  const setSelectedRole = setRole;

  const levelName = (level: string) => t(`dashboard.leaderboard.levels.${level}`);

  // Показываем skeleton только при первой загрузке (когда data ещё нет)
  if (loading && !data) {
    return (
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-xl bg-white/5" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-white/5" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('dashboard.leaderboard.loadError')}</p>
      </div>
    );
  }

  const { my_rank, total_in_group, my_progress } = data;
  // Демо-аккаунт seller1 в рейтинге виден ТОЛЬКО себе. Для всех остальных
  // (включая админа) он скрыт и не участвует в зачёте (PO 2026-06-25).
  const viewerIsDemo = user?.employee_id === DEMO_EMPLOYEE_ID;
  const leaderboard = viewerIsDemo
    ? data.leaderboard
    : data.leaderboard.filter((e) => e.employee_id !== DEMO_EMPLOYEE_ID);
  const myInTop3 = my_rank <= 3;

  // Разделение на пьедестал и список
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // ТОП-3 расположение: 2 место (серебро) - 1 место (золото) - 3 место (бронза)
  const podiumEntry = (rank: number) => top3.find((e) => e.rank === rank);
  const first = podiumEntry(1);
  const second = podiumEntry(2);
  const third = podiumEntry(3);

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-opacity"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {/* HERO — Лига Чемпионов баннер + контролы */}
      <div
        className="relative px-5 py-4 sm:px-6"
        style={{
          background: 'linear-gradient(135deg, rgba(200,168,75,0.15) 0%, rgba(96,165,250,0.08) 50%, rgba(200,168,75,0.05) 100%)',
          borderBottom: '1px solid rgba(200,168,75,0.2)',
        }}
      >
        <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
          <div>
            <h2
              className="text-lg font-bold flex items-center gap-2.5"
              style={{ fontFamily: "'Unbounded',sans-serif", color: 'var(--text-primary)' }}
            >
              <span className="text-2xl">🏆</span>
              {t('dashboard.leaderboard.title') || 'Лига Чемпионов'}
            </h2>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Формула: <span className="font-semibold" style={{ color: 'var(--success)' }}>50% обучение</span>
              {' + '}
              <span className="font-semibold" style={{ color: 'var(--warning)' }}>30% активность</span>
              {' + '}
              <span className="font-semibold" style={{ color: 'var(--info)' }}>20% streak</span>
              <span className="ml-1.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>· KPI 30% после CRM</span>
            </p>
          </div>
          <Link
            to="/learning"
            className="text-xs font-medium transition-colors"
            style={{ color: 'var(--color-rm)' }}
          >
            {t('dashboard.leaderboard.goToLearning') || 'К обучению'} →
          </Link>
        </div>

        {/* Контролы: роль (admin) + период */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role selector — только admin */}
          {isAdmin && (
            <div
              className="inline-flex rounded-lg p-1"
              style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}
            >
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedRole(r.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    selectedRole === r.value
                      ? 'bg-amber-400 text-[#0a1929]'
                      : ''
                  }`}
                  style={selectedRole !== r.value ? { color: 'var(--text-secondary)' } : undefined}
                  title={`Рейтинг ${r.label}`}
                >
                  <span className="mr-1">{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {/* Period selector */}
          <div
            className="inline-flex rounded-lg p-1"
            style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}
          >
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  period === p.value
                    ? 'bg-amber-400 text-[#0a1929]'
                    : ''
                }`}
                style={period !== p.value ? { color: 'var(--text-secondary)' } : undefined}
                title={p.short}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Контекст текущего выбора */}
          <div className="text-[11px] ml-auto" style={{ color: 'var(--text-muted)' }}>
            {data.formula?.period_days && (
              <>За последние <strong style={{ color: 'var(--text-secondary)' }}>{data.formula.period_days}</strong> дней</>
            )}
          </div>
        </div>
      </div>

      {/* ПЬЕДЕСТАЛ — Top-3 */}
      {(first || second || third) && (
        <div className="px-5 py-6 sm:px-6">
          <div className="grid grid-cols-3 items-end gap-3 mb-4" style={{ minHeight: 200 }}>
            {/* 2 место — слева, средняя высота */}
            <div className="flex flex-col items-center gap-2">
              {second && <PodiumPlayer entry={second} medal="silver" levelName={levelName} />}
              <div
                className="w-full rounded-t-xl flex items-center justify-center font-bold"
                style={{
                  background: 'linear-gradient(180deg, rgba(229,231,235,0.25), rgba(156,163,175,0.1))',
                  border: '1px solid rgba(229,231,235,0.3)',
                  borderBottom: 'none',
                  height: 60,
                  fontFamily: "'Unbounded',sans-serif",
                  fontSize: 28,
                  color: '#E5E7EB', // серебряный цвет цифры — бренд медали, оставляем
                }}
              >
                2
              </div>
            </div>

            {/* 1 место — центр, выше всех */}
            <div className="flex flex-col items-center gap-2">
              {first && <PodiumPlayer entry={first} medal="gold" levelName={levelName} isChampion />}
              <div
                className="w-full rounded-t-xl flex items-center justify-center font-bold relative"
                style={{
                  background: 'linear-gradient(180deg, rgba(251,191,36,0.4), rgba(200,168,75,0.15))',
                  border: '1px solid rgba(251,191,36,0.5)',
                  borderBottom: 'none',
                  height: 90,
                  fontFamily: "'Unbounded',sans-serif",
                  fontSize: 36,
                  color: 'var(--color-rm)', // золотой цвет цифры — бренд медали, оставляем
                  boxShadow: '0 -8px 24px rgba(251,191,36,0.25)',
                }}
              >
                1
                {/* Корона */}
                <span style={{ position: 'absolute', top: -16, fontSize: 24 }}>👑</span>
              </div>
            </div>

            {/* 3 место — справа, низкая */}
            <div className="flex flex-col items-center gap-2">
              {third && <PodiumPlayer entry={third} medal="bronze" levelName={levelName} />}
              <div
                className="w-full rounded-t-xl flex items-center justify-center font-bold"
                style={{
                  background: 'linear-gradient(180deg, rgba(251,146,60,0.25), rgba(194,65,12,0.1))',
                  border: '1px solid rgba(251,146,60,0.4)',
                  borderBottom: 'none',
                  height: 40,
                  fontFamily: "'Unbounded',sans-serif",
                  fontSize: 22,
                  color: '#FB923C', // бронзовый цвет цифры — бренд медали, оставляем
                }}
              >
                3
              </div>
            </div>
          </div>

          {/* Линия пьедестала — золотой декор, оставляем */}
          <div
            className="h-1 rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(200,168,75,0.4), transparent)' }}
          />
        </div>
      )}

      {/* МОЙ РАНГ — отдельная карточка если я не в Топ-3 */}
      {!myInTop3 && my_progress && (
        <div className="px-5 pb-4 sm:px-6">
          <div
            className="rounded-xl border-2 p-4"
            style={{ borderColor: 'rgba(200,168,75,0.5)', background: 'rgba(200,168,75,0.06)' }}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold"
                  style={{
                    background: 'rgba(200,168,75,0.15)',
                    border: '2px solid rgba(200,168,75,0.5)',
                    fontFamily: "'Unbounded',sans-serif",
                    color: 'var(--color-rm)', // золотой акцент — бренд, оставляем
                  }}
                >
                  #{my_rank}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest" style={{ fontFamily: "'Unbounded',sans-serif", color: 'var(--color-rm)', opacity: 0.85 }}>
                    Твой ранг
                  </p>
                  <p className="text-xl font-bold" style={{ fontFamily: "'Unbounded',sans-serif", color: 'var(--text-primary)' }}>
                    {my_rank} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>из {total_in_group}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border"
                  style={{
                    background: LEVEL_COLOR[my_progress.current_level].bg,
                    color: LEVEL_COLOR[my_progress.current_level].color,
                    borderColor: 'var(--border)',
                  }}
                >
                  {levelName(my_progress.current_level)}
                </span>
                <div className="mt-1 flex items-center gap-3 text-xs justify-end" style={{ color: 'var(--text-muted)' }}>
                  <span>Курсов: <strong style={{ color: 'var(--text-secondary)' }}>{my_progress.total_courses_completed}</strong></span>
                  <span>Балл: <strong style={{ color: 'var(--text-secondary)' }}>{my_progress.avg_quiz_score}%</strong></span>
                  {my_progress.current_streak_days > 0 && (
                    <span className="text-orange-300">🔥 {my_progress.current_streak_days}д</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* СПИСОК 4-10 */}
      {rest.length > 0 && (
        <div className="px-5 pb-5 sm:px-6">
          <p
            className="mb-3 text-[10px] font-bold uppercase tracking-widest"
            style={{ fontFamily: "'Unbounded',sans-serif", color: 'var(--text-muted)' }}
          >
            Преследователи
          </p>
          <div className="space-y-1.5">
            {rest.map((entry) => (
              <LeaderboardRow key={entry.user_id} entry={entry} levelName={levelName} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Подкомпоненты ──────────────────────────────────────────────────────────

function PodiumPlayer({
  entry,
  medal,
  levelName,
  isChampion,
}: {
  entry: LeaderboardEntry;
  medal: 'gold' | 'silver' | 'bronze';
  levelName: (lvl: string) => string;
  isChampion?: boolean;
}) {
  const meta = PODIUM[medal];
  const lvl = LEVEL_COLOR[entry.current_level] || LEVEL_COLOR.trainee;
  const initials = entry.full_name
    ? entry.full_name.split(' ').slice(0, 2).map((s) => s[0]).join('').toUpperCase()
    : '?';

  return (
    <div className="flex flex-col items-center text-center w-full" style={{ filter: entry.is_current_user ? 'drop-shadow(0 0 12px rgba(200,168,75,0.5))' : 'none' }}>
      {/* Аватар-медаль — meta.bg и meta.text это бренд-цвета медалей, оставляем */}
      <div
        className="rounded-full flex items-center justify-center font-bold mb-1.5 relative"
        style={{
          background: meta.bg,
          color: meta.text,
          width: isChampion ? 60 : 48,
          height: isChampion ? 60 : 48,
          fontFamily: "'Unbounded',sans-serif",
          fontSize: isChampion ? 18 : 14,
          boxShadow: `0 0 20px ${meta.glow}`,
          border: entry.is_current_user ? '2px solid #FBBF24' : 'none',
        }}
      >
        {initials}
      </div>
      {/* Имя */}
      <div
        className="text-xs font-semibold text-center w-full"
        style={{
          color: 'var(--text-primary)',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: isChampion ? 13 : 11,
        }}
        title={entry.full_name}
      >
        {entry.full_name || entry.employee_id}
        {entry.is_current_user && <span className="ml-1" style={{ color: 'var(--color-rm)' }}>★</span>}
      </div>
      {/* Уровень */}
      <span
        className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium"
        style={{ background: lvl.bg, color: lvl.color }}
      >
        {levelName(entry.current_level)}
      </span>
      {/* Total score / breakdown */}
      <div className="text-center mt-1">
        {entry.total_score !== undefined ? (
          <>
            <div
              className="text-base font-bold leading-none"
              style={{ fontFamily: "'Unbounded',sans-serif", color: meta.text === '#fff' ? '#fff' : '#0a1929' }}
            >
              {/* meta.text === '#fff' — бронзовая медаль (тёмный фон), meta.text === '#0a1929' — золото/серебро.
                  Здесь намеренно тёмный текст #0a1929 на светлых медалях (золото/серебро) — оставляем. */}
              <span style={{ color: 'var(--color-rm)' }}>{Math.round(entry.total_score)}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75em' }}> /100</span>
            </div>
            <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              📚 {Math.round(entry.learning_score ?? 0)}
              <span className="mx-1">·</span>
              🔥 {Math.round(entry.activity_score ?? 0)}
              <span className="mx-1">·</span>
              ⏱ {Math.round(entry.streak_score ?? 0)}
            </div>
          </>
        ) : (
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {entry.courses_completed} курс · {entry.avg_quiz_score}%
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardRow({
  entry,
  levelName,
}: {
  entry: LeaderboardEntry;
  levelName: (level: string) => string;
}) {
  const cfg = LEVEL_COLOR[entry.current_level] || LEVEL_COLOR.trainee;
  const isMe = entry.is_current_user;

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
      style={{
        background: isMe ? 'rgba(200,168,75,0.10)' : 'var(--bg-overlay)',
        border: isMe ? '1px solid rgba(200,168,75,0.4)' : '1px solid var(--border)',
      }}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{
          background: 'var(--bg-overlay)',
          color: 'var(--text-muted)',
          fontFamily: "'Unbounded',sans-serif",
        }}
      >
        {entry.rank}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${isMe ? 'font-bold' : 'font-medium'}`}
          style={{ color: isMe ? 'var(--color-rm)' : 'var(--text-primary)' }}
        >
          {entry.full_name || entry.employee_id}
          {isMe && <span className="ml-1 text-xs" style={{ color: 'var(--color-rm)', opacity: 0.8 }}>(вы)</span>}
        </p>
        <span
          className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {levelName(entry.current_level)}
        </span>
      </div>

      <div className="shrink-0 text-right">
        {entry.total_score !== undefined ? (
          <>
            <p
              className="text-base font-bold"
              style={{ fontFamily: "'Unbounded',sans-serif", color: 'var(--color-rm)' }}
              title={`Обучение ${Math.round(entry.learning_score ?? 0)} · Активность ${Math.round(entry.activity_score ?? 0)} · Streak ${Math.round(entry.streak_score ?? 0)}`}
            >
              {Math.round(entry.total_score)}
            </p>
            <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
              📚{Math.round(entry.learning_score ?? 0)} · 🔥{Math.round(entry.activity_score ?? 0)} · ⏱{Math.round(entry.streak_score ?? 0)}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold" style={{ fontFamily: "'Unbounded',sans-serif", color: 'var(--text-primary)' }}>
              {entry.courses_completed}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{entry.avg_quiz_score}%</p>
          </>
        )}
      </div>
    </div>
  );
}
