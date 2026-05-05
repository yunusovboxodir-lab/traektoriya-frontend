/**
 * PulseWidget v2 (2026-05-05)
 *
 * Компактный виджет «Пульс» для главной страницы.
 * Layout: 2 колонки внутри карточки.
 *  - Левая: gauge + бейдж уровня + дельта
 *  - Правая: Главные точки роста + Уведомления (встроенные nudges)
 * Кликабелен → /competencies (полный радар).
 *
 * Темный navy + gold (унифицировано со страницей /competencies).
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useLangStore, useT } from '../../stores/langStore';
import { useGoalsStore } from '../../stores/goalsStore';
import { pulseApi, type UserPulse } from '../../api/competencies';
import { onPulseInvalidate } from '../../utils/pulseEvents';

const PULSE_ROLES = [
  { value: 'regional_manager', label: { ru: 'РМ', uz: 'RM' } },
  { value: 'supervisor', label: { ru: 'СВ', uz: 'SV' } },
  { value: 'sales_rep', label: { ru: 'ТП', uz: 'TP' } },
];

const ADMIN_ROLES = ['superadmin', 'admin', 'commercial_dir'];

const LEVEL_META = {
  master: { label: 'Мастер', range: '76–100%', color: '#4ADE80', bg: 'rgba(74,222,128,0.15)' },
  expert: { label: 'Эксперт', range: '51–75%', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  practitioner: { label: 'Практик', range: '26–50%', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  trainee: { label: 'Стажёр', range: '0–25%', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
} as const;

type LevelKey = keyof typeof LEVEL_META;

function levelByPct(pct: number): LevelKey {
  if (pct >= 76) return 'master';
  if (pct >= 51) return 'expert';
  if (pct >= 26) return 'practitioner';
  return 'trainee';
}

const NUDGE_TYPE_ICON: Record<string, string> = {
  reminder: '🔔',
  suggestion: '💡',
  alert: '⚠️',
  celebration: '🎉',
};

const NUDGE_PRIORITY_COLOR: Record<string, string> = {
  urgent: '#EF4444',
  high: '#FB923C',
  medium: '#60A5FA',
  low: 'rgba(255,255,255,0.3)',
};

export function PulseWidget() {
  const navigate = useNavigate();
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const user = useAuthStore((s) => s.user);

  const [pulse, setPulse] = useState<UserPulse | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = ADMIN_ROLES.includes(user?.role || '');
  const [selectedRole, setSelectedRole] = useState<string>(
    isAdmin ? 'regional_manager' : (user?.role || 'sales_rep'),
  );

  // Уведомления (nudges)
  const nudges = useGoalsStore((s) => s.nudges);
  const fetchNudges = useGoalsStore((s) => s.fetchNudges);
  const markNudgeRead = useGoalsStore((s) => s.markNudgeRead);

  useEffect(() => {
    fetchNudges(true, 3);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const userId = user?.id ? String(user.id) : null;

  const loadPulse = useCallback(
    async (signal?: AbortSignal): Promise<boolean> => {
      if (!userId) return false;
      setLoading(true);
      try {
        const roleParam = isAdmin ? selectedRole : undefined;
        const res = await pulseApi.getUserPulse(userId, roleParam, { signal });
        if (signal?.aborted) return false;
        const data = res.data;
        setPulse(data);
        return !!(data && data.competencies && data.competencies.length > 0);
      } catch {
        if (!signal?.aborted) setPulse(null);
        return false;
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [userId, isAdmin, selectedRole]
  );

  // Auto-retry для пустого пульса (бэк лениво считает)
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const ok = await loadPulse(controller.signal);
      if (!ok && !controller.signal.aborted && retryCount < 2) {
        const delay = (retryCount + 1) * 1500;
        retryTimer.current = setTimeout(() => {
          if (!controller.signal.aborted) setRetryCount((c) => c + 1);
        }, delay);
      }
    })();
    const off = onPulseInvalidate(() => loadPulse());
    return () => {
      controller.abort();
      off();
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [loadPulse, retryCount]);

  useEffect(() => { setRetryCount(0); }, [userId, selectedRole]);

  // === LOADING ===
  if (loading && !pulse) {
    return (
      <div className="rounded-xl p-8 border" style={{ background: 'rgba(17,36,61,0.5)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-amber-400 border-t-transparent" />
          <div className="text-xs uppercase tracking-widest text-white/50">
            {retryCount > 0
              ? (lang === 'uz' ? `Pulsi hisoblanmoqda… (${retryCount + 1}/3)` : `Считаем пульс… (${retryCount + 1}/3)`)
              : (lang === 'uz' ? 'Yuklanmoqda' : 'Загрузка')}
          </div>
        </div>
      </div>
    );
  }

  // === EMPTY ===
  if (!pulse || !pulse.competencies || pulse.competencies.length === 0) {
    return (
      <div className="rounded-xl p-6 border text-center" style={{ background: 'rgba(17,36,61,0.5)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="text-3xl mb-2">📊</div>
        <div className="text-sm text-white/60 mb-3">
          {lang === 'uz' ? 'Pulsi hali tayyor emas' : 'Пульс ещё не рассчитан'}
        </div>
        <button
          type="button"
          onClick={() => { setRetryCount(0); loadPulse(); }}
          className="px-4 py-2 rounded-lg text-sm font-medium border"
          style={{ background: 'rgba(200,168,75,0.1)', color: '#C8A84B', borderColor: 'rgba(200,168,75,0.4)' }}
        >
          {lang === 'uz' ? '🔄 Qayta yuklash' : '🔄 Обновить'}
        </button>
      </div>
    );
  }

  // === MAIN ===
  const overall = Math.round(pulse.overall_pulse);
  const lvl = levelByPct(pulse.overall_pulse);
  const meta = LEVEL_META[lvl];
  const overallLevelName = lang === 'uz' ? pulse.overall_level_uz : pulse.overall_level_ru;

  // Топ-3 слабых компетенции (для «точек роста»)
  const top3Weak = pulse.competencies
    .filter((c) => c.pulse_pct < 60)
    .sort((a, b) => a.pulse_pct - b.pulse_pct)
    .slice(0, 3);

  // Gauge (compact 140px)
  const r = 60;
  const C = 2 * Math.PI * r;
  const dash = (overall / 100) * C;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #11243d 0%, rgba(17,36,61,0.6) 100%)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {/* Селектор роли (только админ) */}
      {isAdmin && (
        <div
          className="px-5 py-2 flex items-center justify-between border-b"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
        >
          <span className="text-[11px] uppercase tracking-widest text-white/45">
            {lang === 'uz' ? 'Rol' : 'Роль'}
          </span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-1 rounded text-xs font-semibold bg-white/5 border border-white/15 text-white"
            style={{ colorScheme: 'dark' }}
          >
            {PULSE_ROLES.map((rl) => (
              <option key={rl.value} value={rl.value} style={{ color: '#000' }}>
                {lang === 'uz' ? rl.label.uz : rl.label.ru}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5 p-5">

        {/* ─── ЛЕВАЯ КОЛОНКА: Gauge ─── */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative w-[160px] h-[160px]">
            <svg viewBox="0 0 160 160" className="w-full h-full">
              <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <circle
                cx="80" cy="80" r={r}
                fill="none"
                stroke={meta.color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${C}`}
                transform="rotate(-90 80 80)"
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {overall}<span className="text-base opacity-60">%</span>
              </span>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold"
            style={{ background: meta.bg, borderColor: meta.color + '66', color: meta.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
            {overallLevelName} · {meta.range}
          </span>
          <div className="text-[11px] text-white/50">
            {pulse.competencies.length} {lang === 'uz' ? 'kompetensiya' : 'компетенций'}
          </div>
          <Link
            to="/competencies"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors mt-1"
          >
            {t('pulse.viewDetails') || 'Открыть полный пульс →'}
          </Link>
        </div>

        {/* ─── ПРАВАЯ КОЛОНКА: Точки роста + Уведомления ─── */}
        <div className="flex flex-col gap-4">

          {/* Главные точки роста */}
          {top3Weak.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-widest font-bold text-amber-400" style={{ fontFamily: "'Unbounded',sans-serif" }}>
                  ⚡ {lang === 'uz' ? 'O\'sish nuqtalari' : 'Главные точки роста'}
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/competencies')}
                  className="text-[11px] text-amber-400/70 hover:text-amber-300 transition-colors"
                >
                  все →
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {top3Weak.map((c) => {
                  const cPct = Math.round(c.pulse_pct);
                  const cLvl = levelByPct(c.pulse_pct);
                  const cColor = LEVEL_META[cLvl].color;
                  return (
                    <button
                      key={c.competency_id}
                      type="button"
                      onClick={() => navigate('/competencies')}
                      className="grid items-center gap-3 px-3 py-2 rounded-lg border bg-white/[0.02] hover:bg-amber-500/5 hover:border-amber-400/30 transition-all text-left"
                      style={{ gridTemplateColumns: '1fr 80px auto', borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <span className="text-sm text-white/85 truncate">
                        {lang === 'uz' && c.competency_name_uz ? c.competency_name_uz : c.competency_name}
                      </span>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.max(cPct, 3)}%`, background: cColor }}
                        />
                      </div>
                      <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 12, fontWeight: 700, color: cColor, minWidth: 36, textAlign: 'right' }}>
                        {cPct}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Уведомления */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-widest font-bold text-blue-400" style={{ fontFamily: "'Unbounded',sans-serif" }}>
                🔔 {lang === 'uz' ? 'Bildirishnomalar' : 'Уведомления'}
                {nudges.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-blue-400/20 text-blue-300 rounded text-[10px]">
                    {nudges.length}
                  </span>
                )}
              </div>
              <Link to="/goals" className="text-[11px] text-blue-400/70 hover:text-blue-300 transition-colors">
                все →
              </Link>
            </div>

            {nudges.length === 0 ? (
              <div className="text-center py-4 text-xs text-white/35 bg-white/[0.02] rounded-lg border border-white/5">
                {lang === 'uz' ? 'Yangi bildirishnomalar yo\'q' : 'Нет новых уведомлений · всё под контролем 👌'}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {nudges.slice(0, 3).map((nudge) => {
                  const borderColor = NUDGE_PRIORITY_COLOR[nudge.priority] || NUDGE_PRIORITY_COLOR.medium;
                  return (
                    <div
                      key={nudge.id}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border-l-4 bg-white/[0.02]"
                      style={{ borderLeftColor: borderColor }}
                    >
                      <span className="text-base flex-shrink-0 mt-0.5">{NUDGE_TYPE_ICON[nudge.type] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/90 leading-tight">{nudge.title}</p>
                        <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{nudge.message}</p>
                        {nudge.action_url && (
                          <Link
                            to={nudge.action_url}
                            className="inline-block mt-1 text-xs text-amber-400 hover:text-amber-300 font-medium"
                          >
                            {nudge.action_text || (lang === 'uz' ? 'O\'tish →' : 'Перейти →')}
                          </Link>
                        )}
                      </div>
                      <button
                        onClick={() => markNudgeRead(nudge.id)}
                        className="flex-shrink-0 p-0.5 text-white/30 hover:text-white/70 transition-colors"
                        title={lang === 'uz' ? 'O\'qilgan deb belgilash' : 'Отметить прочитанным'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
