/**
 * PulseWidget — мини-радар Пульса компетенций для Главной.
 *
 * 2026-05-04 переделка:
 * - Auto-retry если первый запрос вернул пустой пульс (бэк лениво считает)
 * - Демонстративный UI: большой overall %, цветной gauge-bar, явные топ-3 GAP
 * - Tactical-токены (--bg-card / --color-rm), не bg-white
 * - Кликабельный → /competencies (полный радар)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useLangStore, useT } from '../../stores/langStore';
import { pulseApi, type UserPulse } from '../../api/competencies';
import { RadarChart, type RadarDataPoint } from '../competencies/RadarChart';
import { onPulseInvalidate } from '../../utils/pulseEvents';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const PULSE_ROLES = [
  { value: 'regional_manager', label: { ru: 'РМ', uz: 'RM' } },
  { value: 'supervisor', label: { ru: 'СВ', uz: 'SV' } },
  { value: 'sales_rep', label: { ru: 'ТП', uz: 'TP' } },
];

const ADMIN_ROLES = ['superadmin', 'admin', 'commercial_dir'];

// Цветовая шкала по уровню (token-based)
function levelColor(pct: number): string {
  if (pct >= 76) return 'var(--success)';        // Мастер
  if (pct >= 51) return 'var(--color-tp)';       // Эксперт
  if (pct >= 26) return 'var(--warning)';        // Практик
  return 'var(--danger)';                        // Стажёр
}

function levelTextColor(pct: number): string {
  if (pct >= 76) return 'var(--success)';
  if (pct >= 51) return 'var(--color-tp)';
  if (pct >= 26) return 'var(--warning)';
  return 'var(--danger)';
}

export function PulseWidget() {
  const navigate = useNavigate();
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const user = useAuthStore((s) => s.user);
  const isMobile = useMediaQuery('(max-width: 640px)');

  const [pulse, setPulse] = useState<UserPulse | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = ADMIN_ROLES.includes(user?.role || '');
  const [selectedRole, setSelectedRole] = useState<string>(
    isAdmin ? 'regional_manager' : (user?.role || 'sales_rep')
  );

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
        // Возвращаем true если данные нормальные (компетенции есть)
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

  // Initial load с auto-retry: если первый запрос вернул пустой пульс
  // (бэк только что начал считать), пробуем ещё 2 раза с задержкой 1.5/3 сек
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      const ok = await loadPulse(controller.signal);
      if (!ok && !controller.signal.aborted && retryCount < 2) {
        // Ставим retry с экспоненциальной паузой
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

  // Сброс счётчика retry при смене роли/юзера
  useEffect(() => {
    setRetryCount(0);
  }, [userId, selectedRole]);

  const radarData: RadarDataPoint[] = pulse?.competencies.map((c) => ({
    label: lang === 'uz' && c.competency_name_uz ? c.competency_name_uz : c.competency_name,
    value: c.pulse_pct,
    level: c.pulse_level,
  })) || [];

  const overallLevelName = pulse
    ? lang === 'uz' ? pulse.overall_level_uz : pulse.overall_level_ru
    : '';

  // === LOADING ===
  if (loading) {
    return (
      <div
        className="rounded-xl p-8"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div
            className="animate-spin h-8 w-8 rounded-full"
            style={{
              border: '3px solid var(--border)',
              borderTopColor: 'var(--color-rm)',
            }}
          />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {retryCount > 0
              ? (lang === 'uz' ? `Pulsi hisoblanmoqda… (${retryCount + 1}/3)` : `Считаем пульс… (${retryCount + 1}/3)`)
              : (lang === 'uz' ? 'Yuklanmoqda' : 'Загрузка')}
          </div>
        </div>
      </div>
    );
  }

  // === EMPTY (после всех retry — данных нет) ===
  if (!pulse || !pulse.competencies || pulse.competencies.length === 0) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>
          {lang === 'uz' ? 'Pulsi hali tayyor emas' : 'Пульс ещё не рассчитан'}
        </div>
        <button
          type="button"
          onClick={() => { setRetryCount(0); loadPulse(); }}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            background: 'var(--color-rm-bg)',
            color: 'var(--color-rm)',
            border: '1px solid var(--color-rm-border)',
          }}
        >
          {lang === 'uz' ? '🔄 Qayta yuklash' : '🔄 Обновить'}
        </button>
      </div>
    );
  }

  // === MAIN VIEW ===
  const overall = Math.round(pulse.overall_pulse);
  const overallColor = levelTextColor(pulse.overall_pulse);
  const overallBg = levelColor(pulse.overall_pulse);
  const top3Weak = pulse.competencies
    .filter((c) => c.pulse_pct < 60)
    .sort((a, b) => a.pulse_pct - b.pulse_pct)
    .slice(0, 3);

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      onClick={() => navigate('/competencies')}
    >
      {/* Селектор роли (только админ) */}
      {isAdmin && (
        <div
          className="px-5 py-2 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            {lang === 'uz' ? 'Rol' : 'Роль'}
          </span>
          <select
            value={selectedRole}
            onChange={(e) => { e.stopPropagation(); setSelectedRole(e.target.value); }}
            onClick={(e) => e.stopPropagation()}
            className="px-3 py-1 rounded text-xs font-semibold"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            {PULSE_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {lang === 'uz' ? r.label.uz : r.label.ru}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Главный блок — большой % + gauge */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6 p-6`}>
        {/* Левая часть: hero number + gauge + level badge */}
        <div className="flex flex-col items-center justify-center">
          {/* Большая цифра */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1,
              color: overallColor,
            }}
          >
            {overall}<span style={{ fontSize: 36, opacity: 0.6 }}>%</span>
          </div>

          {/* Уровень badge */}
          <div
            className="mt-3 px-4 py-1.5 rounded-full"
            style={{
              background: `${overallBg}1A`, // ~10% opacity
              color: overallColor,
              border: `1px solid ${overallBg}66`,
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {overallLevelName}
          </div>

          {/* Gauge-bar внизу */}
          <div className="w-full max-w-[200px] mt-5">
            <div
              className="relative h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${overall}%`,
                  background: `linear-gradient(90deg, ${overallBg}AA, ${overallBg})`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
              <span>0</span>
              <span style={{ opacity: 0.5 }}>50</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Правая часть: радар */}
        <div className="flex items-center justify-center">
          <RadarChart data={radarData} size={isMobile ? 180 : 220} showValues={false} />
        </div>
      </div>

      {/* Топ-3 слабых компетенции — внизу */}
      {top3Weak.length > 0 && (
        <div
          className="px-6 py-4"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          <div
            className="mb-3"
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            {lang === 'uz' ? 'Asosiy o\'sish nuqtalari' : 'Главные точки роста'}
          </div>
          <div className="space-y-2.5">
            {top3Weak.map((c) => {
              const cPct = Math.round(c.pulse_pct);
              const cColor = levelColor(c.pulse_pct);
              return (
                <div key={c.competency_id} className="flex items-center gap-3">
                  <div
                    className="flex-1 min-w-0 truncate"
                    style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}
                  >
                    {lang === 'uz' && c.competency_name_uz ? c.competency_name_uz : c.competency_name}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="relative rounded-full overflow-hidden"
                      style={{ width: 80, height: 6, background: 'var(--bg-elevated)' }}
                    >
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(cPct, 3)}%`, background: cColor }}
                      />
                    </div>
                    <div
                      style={{
                        width: 36,
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                        color: cColor,
                      }}
                    >
                      {cPct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div
            className="mt-3 text-right"
            style={{ fontSize: 11, color: 'var(--color-rm)', fontWeight: 600 }}
          >
            {t('pulse.viewDetails') || 'Подробнее →'}
          </div>
        </div>
      )}
    </div>
  );
}
