/**
 * ActivityWidget (2026-05-05) — отдельный блок «Моя активность за 30 дней».
 *
 * Использует свежие данные из leaderboard (activity_breakdown текущего пользователя):
 *   - Средний ShelfScan score
 *   - Completion rate задач
 *   - Баллы за достижения
 *   - Streak дней (из my_progress)
 *
 * Это полноценный виджет — не путать с подсчётом для рейтинга.
 * Показывает PO/сотруднику: «вот как ты работаешь в поле».
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { learningApi } from '../../api/learning';
import { useT, useLangStore } from '../../stores/langStore';

interface ActivityData {
  shelfscan: number;
  tasks_rate: number;
  achievements: number;
  streak_days: number;
  total_score: number;
  activity_score: number;
}

const SCORE_COLORS = {
  master:       { color: '#4ADE80', bg: 'rgba(74,222,128,0.10)' },
  expert:       { color: '#60A5FA', bg: 'rgba(96,165,250,0.10)' },
  practitioner: { color: '#FBBF24', bg: 'rgba(251,191,36,0.10)' },
  trainee:      { color: '#EF4444', bg: 'rgba(239,68,68,0.10)' },
};

function scoreLevel(pct: number): keyof typeof SCORE_COLORS {
  if (pct >= 76) return 'master';
  if (pct >= 51) return 'expert';
  if (pct >= 26) return 'practitioner';
  return 'trainee';
}

export function ActivityWidget() {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    // Берём leaderboard и достаём СВОЮ запись (там уже есть activity_breakdown)
    learningApi.getLeaderboard(100)
      .then((res) => {
        const me = res.data.leaderboard.find((e) => e.is_current_user);
        if (!me) {
          setError(true);
          return;
        }
        setData({
          shelfscan: me.activity_breakdown?.shelfscan ?? 0,
          tasks_rate: me.activity_breakdown?.tasks_rate ?? 0,
          achievements: me.activity_breakdown?.achievements ?? 0,
          streak_days: me.current_streak_days,
          total_score: me.total_score ?? 0,
          activity_score: me.activity_score ?? 0,
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'rgba(17,36,61,0.5)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="animate-pulse grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map((i) => <div key={i} className="h-24 rounded-lg bg-white/5" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="rounded-2xl border p-6 text-center"
        style={{ background: 'rgba(17,36,61,0.5)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <p className="text-sm text-white/55">Активность пока не накоплена</p>
      </div>
    );
  }

  const totalLevel = scoreLevel(data.total_score);
  const totalMeta = SCORE_COLORS[totalLevel];

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #11243d 0%, rgba(17,36,61,0.6) 100%)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {/* Hero — общий итоговый балл */}
      <div
        className="px-5 py-4 sm:px-6 flex items-center justify-between flex-wrap gap-3 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          background: `linear-gradient(135deg, ${totalMeta.bg}, rgba(17,36,61,0.4))`,
        }}
      >
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/55 mb-1" style={{ fontFamily: "'Unbounded',sans-serif" }}>
            🔥 {lang === 'uz' ? 'Mening faolligim 30 kun' : 'Моя активность · 30 дней'}
          </div>
          <div className="text-xs text-white/55">
            Формула: <span className="text-emerald-300">50% обучение</span>
            {' + '}
            <span className="text-amber-300">30% активность</span>
            {' + '}
            <span className="text-blue-300">20% streak</span>
            <span className="text-white/30 ml-1.5">(KPI 30% — после CRM)</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/55" style={{ fontFamily: "'Unbounded',sans-serif" }}>
            Итоговый балл
          </div>
          <div
            className="text-3xl font-bold leading-none"
            style={{ fontFamily: "'Unbounded',sans-serif", color: totalMeta.color }}
          >
            {Math.round(data.total_score)}<span className="text-lg opacity-60">/100</span>
          </div>
        </div>
      </div>

      {/* 4 плитки активности */}
      <div className="px-5 py-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-3">

        <ActivityTile
          label="ShelfScan"
          value={Math.round(data.shelfscan)}
          unit="из 100"
          icon="📸"
          color={SCORE_COLORS[scoreLevel(data.shelfscan)].color}
          subtitle="средняя оценка"
          link="/planogram"
        />

        <ActivityTile
          label="Задачи"
          value={Math.round(data.tasks_rate)}
          unit="%"
          icon="✅"
          color={SCORE_COLORS[scoreLevel(data.tasks_rate)].color}
          subtitle="закрыто в срок"
          link="/tasks"
        />

        <ActivityTile
          label="Достижения"
          value={data.achievements}
          unit="pts"
          icon="🎖"
          color={data.achievements > 0 ? '#FBBF24' : 'rgba(255,255,255,0.4)'}
          subtitle="за месяц"
          link="/goals"
        />

        <ActivityTile
          label="Streak"
          value={data.streak_days}
          unit="дн"
          icon="🔥"
          color={data.streak_days > 0 ? '#FB923C' : 'rgba(255,255,255,0.4)'}
          subtitle="подряд"
          link="/learning"
        />
      </div>

      {/* CRM-заглушка */}
      <div
        className="px-5 py-3 sm:px-6 border-t flex items-center justify-between flex-wrap gap-2"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest"
            style={{ background: 'rgba(96,165,250,0.15)', color: '#60A5FA', fontFamily: "'Unbounded',sans-serif" }}
          >
            Скоро
          </span>
          <span className="text-white/55">
            <strong className="text-white/80">KPI продаж</strong> · вес <strong className="text-amber-300">+30%</strong>
            <span className="ml-2 opacity-60">— после интеграции CRM Sales Doc</span>
          </span>
        </div>
        <div className="text-[11px] text-white/35">
          {t('common.dataIs') || 'Данные'} за последние 30 дней
        </div>
      </div>
    </div>
  );
}

// ─── Подкомпонент: плитка активности ────────────────────────────────────────

function ActivityTile({
  label, value, unit, icon, color, subtitle, link,
}: {
  label: string;
  value: number;
  unit: string;
  icon: string;
  color: string;
  subtitle: string;
  link: string;
}) {
  return (
    <Link
      to={link}
      className="rounded-xl border p-4 transition-all hover:bg-white/[0.04] hover:scale-[1.02]"
      style={{
        background: `linear-gradient(135deg, ${color}10, transparent)`,
        borderColor: color + '30',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span
          className="text-[10px] uppercase tracking-widest text-white/50"
          style={{ fontFamily: "'Unbounded',sans-serif" }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span
          className="text-2xl font-bold leading-none"
          style={{ color, fontFamily: "'Unbounded',sans-serif" }}
        >
          {value}
        </span>
        <span className="text-xs text-white/45">{unit}</span>
      </div>
      <div className="text-[10px] text-white/40">
        {subtitle}
      </div>
    </Link>
  );
}
