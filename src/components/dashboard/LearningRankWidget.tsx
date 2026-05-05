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
import type { LeaderboardResponse, LeaderboardEntry } from '../../api/learning';
import { useT } from '../../stores/langStore';

const LEVEL_COLOR: Record<string, { color: string; bg: string }> = {
  trainee: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  practitioner: { color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  expert: { color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  master: { color: '#4ADE80', bg: 'rgba(74,222,128,0.15)' },
};

// Цвета медалей
const PODIUM = {
  gold:   { bg: 'linear-gradient(135deg, #FBBF24 0%, #C8A84B 100%)', text: '#0a1929', glow: 'rgba(251,191,36,0.4)' },
  silver: { bg: 'linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 100%)', text: '#0a1929', glow: 'rgba(229,231,235,0.3)' },
  bronze: { bg: 'linear-gradient(135deg, #FB923C 0%, #C2410C 100%)', text: '#fff',     glow: 'rgba(251,146,60,0.4)' },
};

export function LearningRankWidget() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const t = useT();

  useEffect(() => {
    setLoading(true);
    setError(false);
    learningApi
      .getLeaderboard(10)
      .then((res) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const levelName = (level: string) => t(`dashboard.leaderboard.levels.${level}`);

  if (loading) {
    return (
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'linear-gradient(180deg, #11243d 0%, rgba(17,36,61,0.6) 100%)', borderColor: 'rgba(255,255,255,0.08)' }}
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
        style={{ background: 'rgba(17,36,61,0.5)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <p className="text-sm text-white/55">{t('dashboard.leaderboard.loadError')}</p>
      </div>
    );
  }

  const { my_rank, total_in_group, my_progress, leaderboard } = data;
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
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #11243d 0%, rgba(17,36,61,0.6) 100%)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {/* HERO — Лига Чемпионов баннер */}
      <div
        className="relative px-5 py-4 sm:px-6"
        style={{
          background: 'linear-gradient(135deg, rgba(200,168,75,0.15) 0%, rgba(96,165,250,0.08) 50%, rgba(200,168,75,0.05) 100%)',
          borderBottom: '1px solid rgba(200,168,75,0.2)',
        }}
      >
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h2
              className="text-lg font-bold text-white flex items-center gap-2.5"
              style={{ fontFamily: "'Unbounded',sans-serif" }}
            >
              <span className="text-2xl">🏆</span>
              {t('dashboard.leaderboard.title') || 'Лига Чемпионов'}
            </h2>
            <p className="text-[11px] text-white/55 mt-1">
              <span className="text-emerald-400 font-semibold">Сейчас:</span> Обучение
              <span className="mx-2 opacity-40">·</span>
              <span className="text-amber-300/70 font-semibold">Скоро:</span> + Активность + KPI с CRM
            </p>
          </div>
          <Link
            to="/learning"
            className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
          >
            {t('dashboard.leaderboard.goToLearning') || 'К обучению'} →
          </Link>
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
                  color: '#E5E7EB',
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
                  color: '#FBBF24',
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
                  color: '#FB923C',
                }}
              >
                3
              </div>
            </div>
          </div>

          {/* Линия пьедестала */}
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
                    color: '#FBBF24',
                  }}
                >
                  #{my_rank}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-amber-300/70" style={{ fontFamily: "'Unbounded',sans-serif" }}>
                    Твой ранг
                  </p>
                  <p className="text-xl font-bold text-white" style={{ fontFamily: "'Unbounded',sans-serif" }}>
                    {my_rank} <span className="text-sm font-normal text-white/55">из {total_in_group}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border"
                  style={{
                    background: LEVEL_COLOR[my_progress.current_level].bg,
                    color: LEVEL_COLOR[my_progress.current_level].color,
                    borderColor: LEVEL_COLOR[my_progress.current_level].color + '40',
                  }}
                >
                  {levelName(my_progress.current_level)}
                </span>
                <div className="mt-1 flex items-center gap-3 text-xs text-white/55 justify-end">
                  <span>Курсов: <strong className="text-white/85">{my_progress.total_courses_completed}</strong></span>
                  <span>Балл: <strong className="text-white/85">{my_progress.avg_quiz_score}%</strong></span>
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
            className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/45"
            style={{ fontFamily: "'Unbounded',sans-serif" }}
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
      {/* Аватар-медаль */}
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
        className="text-xs font-semibold text-white text-center w-full"
        style={{
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: isChampion ? 13 : 11,
        }}
        title={entry.full_name}
      >
        {entry.full_name || entry.employee_id}
        {entry.is_current_user && <span className="text-amber-300 ml-1">★</span>}
      </div>
      {/* Уровень */}
      <span
        className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium"
        style={{ background: lvl.bg, color: lvl.color }}
      >
        {levelName(entry.current_level)}
      </span>
      {/* Курсы / балл */}
      <div className="text-[10px] text-white/55 mt-1">
        {entry.courses_completed} курс · {entry.avg_quiz_score}%
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
        background: isMe ? 'rgba(200,168,75,0.10)' : 'rgba(255,255,255,0.02)',
        border: isMe ? '1px solid rgba(200,168,75,0.4)' : '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white/55"
        style={{ background: 'rgba(255,255,255,0.05)', fontFamily: "'Unbounded',sans-serif" }}
      >
        {entry.rank}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${isMe ? 'font-bold text-amber-300' : 'font-medium text-white/85'}`}>
          {entry.full_name || entry.employee_id}
          {isMe && <span className="ml-1 text-xs text-amber-400/70">(вы)</span>}
        </p>
        <span
          className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {levelName(entry.current_level)}
        </span>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-white/85" style={{ fontFamily: "'Unbounded',sans-serif" }}>
          {entry.courses_completed}
        </p>
        <p className="text-[10px] text-white/40">{entry.avg_quiz_score}%</p>
      </div>
    </div>
  );
}
