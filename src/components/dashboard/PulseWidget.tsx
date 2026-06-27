/**
 * PulseWidget v3 (2026-05-05) — эффектный + информативный.
 *
 * По запросу PO: Pulse должен быть «максимально эффектным и информативным».
 * Структура:
 *  - Hero: огромный gauge (220px) с glow + level badge + delta
 *  - Center: компактный radar (260px) с benchmark target
 *  - Right: 4 KPI-плитки (компетенций / средний / точек роста / streak)
 *  - Bottom: топ-3 точки роста с прогресс-барами
 *
 * Уведомления (nudges) вынесены в отдельный TasksNotificationsWidget.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useLangStore, useT } from '../../stores/langStore';
import { pulseApi, type UserPulse } from '../../api/competencies';
import { onPulseInvalidate } from '../../utils/pulseEvents';
import { RadarChart, type RadarDataPoint } from '../competencies/RadarChart';
import { useDashboardFilters } from '../../stores/dashboardFiltersStore';

const ADMIN_ROLES = ['superadmin', 'admin', 'commercial_dir'];

const ROLE_LABEL_RU: Record<string, string> = {
  regional_manager: 'РМ',
  supervisor: 'СВ',
  sales_rep: 'ТП',
};

const LEVEL_META = {
  master: { label: 'Мастер', range: '76–100%', color: '#4ADE80', bg: 'rgba(74,222,128,0.15)', glow: 'rgba(74,222,128,0.5)' },
  expert: { label: 'Эксперт', range: '51–75%', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)', glow: 'rgba(96,165,250,0.5)' },
  practitioner: { label: 'Практик', range: '26–50%', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)', glow: 'rgba(251,191,36,0.5)' },
  trainee: { label: 'Стажёр', range: '0–25%', color: '#EF4444', bg: 'rgba(239,68,68,0.15)', glow: 'rgba(239,68,68,0.5)' },
} as const;

type LevelKey = keyof typeof LEVEL_META;

function levelByPct(pct: number): LevelKey {
  if (pct >= 76) return 'master';
  if (pct >= 51) return 'expert';
  if (pct >= 26) return 'practitioner';
  return 'trainee';
}

export function PulseWidget() {
  const navigate = useNavigate();
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const user = useAuthStore((s) => s.user);

  const [pulse, setPulse] = useState<UserPulse | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAggregateView, setIsAggregateView] = useState(false);
  const [aggregateMembers, setAggregateMembers] = useState(0);

  const isAdmin = ADMIN_ROLES.includes(user?.role || '');
  // Shared role из dashboardFilters (синхр. с Rank/Activity)
  const selectedRole = useDashboardFilters((s) => s.role);

  const userId = user?.id ? String(user.id) : null;

  // Aggregate-режим: admin переключил на чужую роль → загружаем средний pulse роли
  const useAggregate = isAdmin && selectedRole !== user?.role;

  const loadPulse = useCallback(
    async (signal?: AbortSignal): Promise<boolean> => {
      if (!userId) return false;
      setLoading(true);
      try {
        if (useAggregate) {
          // Средний pulse выбранной роли (для admin-обзора)
          const res = await pulseApi.getRoleAggregate(selectedRole);
          if (signal?.aborted) return false;
          const agg = res.data;
          setIsAggregateView(true);
          setAggregateMembers(agg.members_count);
          setPulse({
            user_id: 'aggregate',
            overall_pulse: agg.avg_pulse,
            overall_level: agg.overall_level,
            overall_level_ru: agg.overall_level_ru,
            overall_level_uz: agg.overall_level_uz,
            total_earned: agg.total_earned,
            total_max: agg.total_max,
            competencies: agg.competencies,
          });
          return agg.competencies.length > 0;
        }
        // Обычный режим: свой pulse
        setIsAggregateView(false);
        const res = await pulseApi.getUserPulse(userId, undefined, { signal });
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
    [userId, useAggregate, selectedRole]
  );

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

  useEffect(() => { setRetryCount(0); }, [userId, selectedRole, useAggregate]);

  if (loading && !pulse) {
    return (
      <div className="rounded-2xl p-12 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-amber-400 border-t-transparent" />
          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            {retryCount > 0
              ? (lang === 'uz' ? `Pulsi hisoblanmoqda… (${retryCount + 1}/3)` : `Считаем пульс… (${retryCount + 1}/3)`)
              : (lang === 'uz' ? 'Yuklanmoqda' : 'Загрузка')}
          </div>
        </div>
      </div>
    );
  }

  if (!pulse || !pulse.competencies || pulse.competencies.length === 0) {
    return (
      <div className="rounded-2xl p-8 border text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="text-4xl mb-3">📊</div>
        <div className="text-base mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {lang === 'uz' ? 'Pulsi hali tayyor emas' : 'Пульс ещё не рассчитан'}
        </div>
        <div className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          {lang === 'uz' ? 'Birinchi kursni tugating, statistik to\'planadi' : 'Пройди первый курс — статистика накопится'}
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

  // === Подготовка данных ===
  const overall = Math.round(pulse.overall_pulse);
  const lvl = levelByPct(pulse.overall_pulse);
  const meta = LEVEL_META[lvl];
  const overallLevelName = lang === 'uz' ? pulse.overall_level_uz : pulse.overall_level_ru;

  // Радар данные
  const radarData: RadarDataPoint[] = pulse.competencies.map((c) => ({
    label: lang === 'uz' && c.competency_name_uz ? c.competency_name_uz : c.competency_name,
    value: c.pulse_pct,
    level: c.pulse_level,
    id: c.competency_id,
  }));

  // Топ-3 точки роста
  const top3Weak = pulse.competencies
    .filter((c) => c.pulse_pct < 60)
    .sort((a, b) => a.pulse_pct - b.pulse_pct)
    .slice(0, 3);

  // KPI-метрики
  const totalCourses = pulse.competencies.reduce((s, c) => s + c.courses_total, 0);
  const completedCourses = pulse.competencies.reduce((s, c) => s + c.courses_completed, 0);
  const masterCount = pulse.competencies.filter((c) => c.pulse_pct >= 76).length;
  const weakCount = pulse.competencies.filter((c) => c.pulse_pct < 50).length;

  // Gauge геометрия
  const r = 90;
  const C = 2 * Math.PI * r;
  const dash = (overall / 100) * C;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-card) 100%)', borderColor: 'var(--border)' }}
    >
      {/* Hero header (gradient) */}
      <div
        className="px-5 py-3 sm:px-6 flex items-center justify-between flex-wrap gap-2"
        style={{
          background: `linear-gradient(135deg, ${meta.bg}, var(--bg-overlay))`,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: meta.color, boxShadow: `0 0 12px ${meta.color}` }} />
          <span
            className="text-[11px] uppercase tracking-widest font-bold"
            style={{ fontFamily: "'Unbounded',sans-serif", color: meta.color }}
          >
            {isAggregateView ? `Средний пульс ${ROLE_LABEL_RU[selectedRole]}` : 'Live · обновлено сейчас'}
          </span>
        </div>
        {isAggregateView && (
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest"
              style={{ background: 'rgba(96,165,250,0.15)', color: '#60A5FA', fontFamily: "'Unbounded',sans-serif" }}
            >
              admin view
            </span>
            <span>На основе <strong style={{ color: 'var(--text-secondary)' }}>{aggregateMembers}</strong> сотрудников</span>
          </div>
        )}
      </div>

      {/* MAIN: 3 секции */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-5 p-5">

        {/* ─── ЛЕВО: Большой gauge ─── */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative w-[220px] h-[220px]">
            {/* Glow эффект сзади */}
            <div
              className="absolute inset-4 rounded-full opacity-30"
              style={{ background: `radial-gradient(circle, ${meta.color}, transparent 70%)`, filter: 'blur(20px)' }}
            />
            <svg viewBox="0 0 220 220" className="relative w-full h-full">
              <circle cx="110" cy="110" r={r} fill="none" stroke="var(--border)" strokeWidth="14" />
              {/* Сегменты уровней — деления */}
              {[25, 50, 75].map((p) => {
                const angle = (p / 100) * 360 - 90;
                const rad = (angle * Math.PI) / 180;
                const x1 = 110 + Math.cos(rad) * (r - 7);
                const y1 = 110 + Math.sin(rad) * (r - 7);
                const x2 = 110 + Math.cos(rad) * (r + 7);
                const y2 = 110 + Math.sin(rad) * (r + 7);
                return <line key={p} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border-strong)" strokeWidth="1" />;
              })}
              <circle
                cx="110" cy="110" r={r}
                fill="none"
                stroke={meta.color}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${C}`}
                transform="rotate(-90 110 110)"
                style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 8px ${meta.glow})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: "'Unbounded',sans-serif", color: 'var(--text-muted)' }}>
                Общий пульс
              </div>
              <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 56, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, textShadow: `0 0 20px ${meta.glow}` }}>
                {overall}<span className="text-2xl opacity-60">%</span>
              </span>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm font-bold"
            style={{ background: meta.bg, borderColor: meta.color + '66', color: meta.color, fontFamily: "'Unbounded',sans-serif" }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
            {overallLevelName}
          </span>
          <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            {meta.range} · {pulse.competencies.length} {lang === 'uz' ? 'kompetensiya' : 'компетенций'}
          </div>
        </div>

        {/* ─── ЦЕНТР: компактный радар ─── */}
        <div
          className="flex flex-col items-center justify-center py-2 cursor-pointer hover:bg-white/[0.02] rounded-xl transition-colors"
          onClick={() => navigate('/competencies')}
          title={lang === 'uz' ? 'Kengaytirish' : 'Открыть полный пульс'}
        >
          <div className="relative w-full" style={{ minHeight: 280 }}>
            <RadarChart
              data={radarData}
              size={280}
              targetValues={70}
              fillColor={meta.color + '30'}
              strokeColor={meta.color}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5" style={{ background: meta.color }} />
              Твой пульс
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 border-t-2 border-dashed border-amber-400" />
              Цель 70%
            </span>
          </div>
        </div>

        {/* ─── ПРАВО: 4 KPI-плитки + ссылка ─── */}
        <div className="flex flex-col gap-2.5">
          <KpiTile
            label="Курсов закрыто"
            value={`${completedCourses}/${totalCourses}`}
            color="#60A5FA"
            icon="📚"
          />
          <KpiTile
            label="Уровень Мастер"
            value={`${masterCount} ${masterCount === 1 ? 'компетенция' : 'компетенций'}`}
            color="#4ADE80"
            icon="🏆"
          />
          <KpiTile
            label="Слабые зоны"
            value={`${weakCount} ${weakCount === 1 ? 'зона' : 'зон'}`}
            color={weakCount > 3 ? '#EF4444' : '#FBBF24'}
            icon="⚡"
          />
          <KpiTile
            label="До Эксперта"
            value={overall >= 51 ? '✓ достигнут' : `+${51 - overall} п.п.`}
            color={overall >= 51 ? '#4ADE80' : '#60A5FA'}
            icon="🎯"
          />
          <Link
            to="/competencies"
            className="mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #C8A84B, #E5C76B)',
              color: 'var(--text-inverse)',
              fontFamily: "'Unbounded',sans-serif",
              fontSize: 12,
              boxShadow: '0 4px 12px rgba(200,168,75,0.3)',
            }}
          >
            {t('pulse.viewDetails') || 'Открыть полный пульс'} →
          </Link>
        </div>
      </div>

      {/* BOTTOM: топ-3 точки роста с прогресс-барами */}
      {top3Weak.length > 0 && (
        <div
          className="px-5 py-4 sm:px-6 border-t"
          style={{ background: 'var(--bg-overlay)', borderTopColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest font-bold text-amber-400 flex items-center gap-2" style={{ fontFamily: "'Unbounded',sans-serif" }}>
              ⚡ Главные точки роста
            </div>
            <button
              type="button"
              onClick={() => navigate('/competencies')}
              className="text-[11px] text-amber-400/70 hover:text-amber-300 transition-colors"
            >
              все компетенции →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {top3Weak.map((c) => {
              const cPct = Math.round(c.pulse_pct);
              const cLvl = levelByPct(c.pulse_pct);
              const cColor = LEVEL_META[cLvl].color;
              return (
                <button
                  key={c.competency_id}
                  type="button"
                  onClick={() => navigate('/competencies')}
                  className="text-left rounded-lg border p-3 hover:bg-white/[0.03] hover:border-amber-400/30 transition-all"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm truncate font-medium" style={{ color: 'var(--text-primary)' }}>
                      {lang === 'uz' && c.competency_name_uz ? c.competency_name_uz : c.competency_name}
                    </span>
                    <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 14, fontWeight: 800, color: cColor }}>
                      {cPct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg-overlay)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(cPct, 3)}%`, background: cColor, boxShadow: `0 0 6px ${cColor}80` }}
                    />
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {c.courses_completed}/{c.courses_total} курсов · {LEVEL_META[cLvl].label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KPI Tile ────────────────────────────────────────────────────────────────

function KpiTile({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div
      className="rounded-lg border p-3 transition-all hover:scale-[1.02]"
      style={{
        background: `linear-gradient(135deg, ${color}10, transparent)`,
        borderColor: color + '20',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: "'Unbounded',sans-serif", color: 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      <div
        className="text-base font-bold"
        style={{ color, fontFamily: "'Unbounded',sans-serif" }}
      >
        {value}
      </div>
    </div>
  );
}
