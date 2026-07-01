/**
 * Championship2026Page — «Чемпионат N'Medov 2026».
 *
 * Живые данные из GET /api/v1/kpi/championship (Scoring v2.0, Этап 3).
 * Две секции:
 *   1. Лидеры лиги — ранжирование по перцентилю среди ЗАКРЫТЫХ периодов.
 *   2. Лучший прирост — участники с наибольшим ростом KPI к прошлому периоду.
 *
 * Лига (роль) выбирается селектором. Статус «обновлено ...» из computed_at.
 * Пустой случай: note из бэка.
 *
 * Стиль: тактическая тема (tactical-design.css), CSS-переменные, NO emoji.
 * Бизнес-процесс: П3 (Scoring v2.0, Этап 3 — Чемпионат-2026).
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLangStore } from '../stores/langStore';
import { useAuthStore } from '../stores/authStore';
import { StatusBar } from '../components/tactical/StatusBar';
import { kpiApi, type ChampionshipResponse, type ChampionshipLeader, type ChampionshipImproved } from '../api/kpi';
import '../styles/tactical-design.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONO = 'JetBrains Mono, monospace';

const LEAGUE_OPTIONS: Array<{ value: string; label: { ru: string; uz: string } }> = [
  { value: 'sales_rep',         label: { ru: 'Торговые представители', uz: 'Savdo vakillari' } },
  { value: 'supervisor',        label: { ru: 'Супервайзеры',           uz: 'Supervayzerlar' } },
  { value: 'regional_manager',  label: { ru: 'Региональные менеджеры', uz: 'Mintaqa menejerlar' } },
  { value: 'commercial_dir',    label: { ru: 'Коммерческие директора', uz: 'Tijorat direktorlar' } },
];

/** Роль по умолчанию — роль текущего пользователя, если она есть в лигах. */
function defaultLeague(role: string | null | undefined): string {
  const known = LEAGUE_OPTIONS.map((o) => o.value);
  return known.includes(role || '') ? (role as string) : 'sales_rep';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const btnBase: React.CSSProperties = {
  background: 'var(--bg-overlay)',
  border: '1px solid var(--line)',
  borderRadius: 6,
  padding: '6px 12px',
  color: 'var(--brass)',
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'border-color 0.15s, background 0.15s',
};

function rankColor(rank: number): string {
  if (rank === 1) return 'var(--gold, #f2c660)';
  if (rank === 2) return '#cdd6e3';
  if (rank === 3) return '#d08a4e';
  return 'var(--text-2, #8a93a3)';
}

function kpiColor(v: number): string {
  if (v >= 80) return 'var(--success, #4ade80)';
  if (v >= 60) return 'var(--warning, #fbbf24)';
  if (v >= 40) return '#fb923c';
  return 'var(--danger, #ef4444)';
}

function deltaColor(d: number): string {
  if (d >= 10) return 'var(--success, #4ade80)';
  if (d >= 5)  return 'var(--warning, #fbbf24)';
  return '#60a5fa';
}

function formatComputedAt(iso: string | null, lang: string): string {
  if (!iso) return lang === 'uz' ? 'yangilanmadi' : 'не обновлялось';
  const d = new Date(iso);
  return d.toLocaleString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ThCell({ label, align = 'left' }: { label: string; align?: 'left' | 'center' | 'right' }) {
  return (
    <th style={{
      fontFamily: MONO,
      fontSize: 10.5,
      letterSpacing: '.12em',
      textTransform: 'uppercase',
      color: 'var(--text-2)',
      textAlign: align,
      padding: '11px 12px',
      fontWeight: 600,
      borderBottom: '1px solid var(--line)',
      background: 'var(--bg-overlay)',
      whiteSpace: 'nowrap',
    }}>{label}</th>
  );
}

/** Строка медального пьедестала (топ-3). */
function PodiumCard({ leader, rank }: { leader: ChampionshipLeader; rank: 1 | 2 | 3 }) {
  const isFirst = rank === 1;
  const medalColor = rankColor(rank);
  const rankLabels = { 1: '1 МЕСТО', 2: '2 МЕСТО', 3: '3 МЕСТО' };

  return (
    <div
      className="glass-panel"
      style={{
        textAlign: 'center',
        padding: isFirst ? '24px 14px 18px' : '18px 14px',
        borderColor: isFirst ? 'rgba(242,198,96,.5)' : undefined,
        boxShadow: isFirst ? '0 10px 40px -12px rgba(242,198,96,.4)' : undefined,
      }}
    >
      {/* Медаль — SVG вместо emoji */}
      <svg
        width={isFirst ? 36 : 28}
        height={isFirst ? 36 : 28}
        viewBox="0 0 24 24"
        fill="none"
        style={{ display: 'inline-block', marginBottom: 6 }}
      >
        <circle cx="12" cy="12" r="10" fill={medalColor} opacity={0.18} />
        <circle cx="12" cy="12" r="7" stroke={medalColor} strokeWidth={1.5} fill="none" />
        <text
          x="12" y="16"
          textAnchor="middle"
          fontFamily={MONO}
          fontSize="8"
          fontWeight="700"
          fill={medalColor}
        >{rank}</text>
      </svg>

      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.2em', color: 'var(--text-2)', marginTop: 2 }}>
        {rankLabels[rank]}
      </div>
      <div style={{
        fontFamily: 'Cinzel, serif',
        fontSize: isFirst ? 18 : 15,
        fontWeight: 700,
        margin: '8px 0 2px',
        color: 'var(--text-0)',
        wordBreak: 'break-word',
      }}>
        {leader.full_name}
      </div>
      <div style={{ color: 'var(--text-2)', fontSize: 11, marginTop: 1, fontFamily: MONO }}>
        {leader.employee_id}
      </div>
      <div style={{
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: isFirst ? 28 : 22,
        marginTop: 10,
        color: medalColor,
        lineHeight: 1,
      }}>
        {leader.kpi_final.toFixed(1)}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 4, fontFamily: MONO }}>
        {leader.percentile.toFixed(0)}‑й перцентиль
      </div>
    </div>
  );
}

/** Строка таблицы лидеров (место 4+). */
function LeaderRow({ leader }: { leader: ChampionshipLeader }) {
  const mc = rankColor(leader.rank);
  return (
    <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
      <td style={{ fontFamily: MONO, fontWeight: 700, textAlign: 'center', color: mc, padding: '10px 12px', width: 40 }}>
        {leader.rank}
      </td>
      <td style={{ padding: '10px 12px', color: 'var(--text-0)', fontWeight: 600 }}>
        {leader.full_name}
      </td>
      <td style={{ padding: '10px 12px', color: 'var(--text-2)', fontFamily: MONO, fontSize: 12 }}>
        {leader.employee_id}
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
        <span style={{ fontFamily: MONO, fontWeight: 700, color: kpiColor(leader.kpi_final) }}>
          {leader.kpi_final.toFixed(1)}
        </span>
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
        {/* Перцентильная полоса */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
          <div style={{ width: 64, height: 4, background: 'var(--bg-overlay)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${leader.percentile}%`,
              background: 'var(--brass, #c8a84b)',
              borderRadius: 2,
            }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--brass)', minWidth: 32, textAlign: 'right' }}>
            {leader.percentile.toFixed(0)}%
          </span>
        </div>
      </td>
    </tr>
  );
}

/** Строка таблицы «Лучший прирост». */
function ImprovedRow({ entry, rank }: { entry: ChampionshipImproved; rank: number }) {
  const mc = rankColor(rank);
  const dc = deltaColor(entry.delta);
  return (
    <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
      <td style={{ fontFamily: MONO, fontWeight: 700, textAlign: 'center', color: mc, padding: '10px 12px', width: 40 }}>
        {rank}
      </td>
      <td style={{ padding: '10px 12px', color: 'var(--text-0)', fontWeight: 600 }}>
        {entry.full_name}
      </td>
      <td style={{ padding: '10px 12px', color: 'var(--text-2)', fontFamily: MONO, fontSize: 12 }}>
        {entry.employee_id}
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
        {/* Прирост со стрелкой SVG */}
        <span style={{ fontFamily: MONO, fontWeight: 700, color: dc, fontSize: 14 }}>
          +{entry.delta.toFixed(1)}
        </span>
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
        <span style={{ fontFamily: MONO, fontSize: 12, color: 'var(--text-2)' }}>
          {entry.from.toFixed(1)}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', margin: '0 4px', verticalAlign: 'middle' }}>
          <path d="M5 12h14M13 6l6 6-6 6" stroke={dc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontFamily: MONO, fontSize: 12, color: kpiColor(entry.to), fontWeight: 600 }}>
          {entry.to.toFixed(1)}
        </span>
      </td>
    </tr>
  );
}

/** Skeleton-заглушка при загрузке. */
function ChampionshipSkeleton() {
  return (
    <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 16px' }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="glass-panel animate-pulse"
          style={{ height: 48, marginBottom: 12, opacity: 0.4 }}
        />
      ))}
    </div>
  );
}

/** Empty-state когда нет закрытых периодов. */
function EmptyState({ note, lang }: { note?: string; lang: string }) {
  const defaultNote = lang === 'uz'
    ? "Yopiq davrlar hali yo'q. Birinchi oy yopilgandan so'ng chempionat boshlaydi."
    : 'Нет закрытых периодов. Чемпионат стартует после закрытия первого месяца.';
  return (
    <div
      className="glass-panel"
      style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 560, margin: '32px auto' }}
    >
      {/* Иконка финиша — SVG */}
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ display: 'block', margin: '0 auto 16px', opacity: 0.4 }}>
        <rect x="3" y="3" width="4" height="18" rx="1" fill="var(--text-2)" />
        <path d="M7 5h10l-2 4 2 4H7" fill="var(--text-2)" opacity="0.6" />
      </svg>
      <div style={{ fontFamily: MONO, fontSize: 13, color: 'var(--text-1)', lineHeight: 1.6 }}>
        {note || defaultNote}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function Championship2026Page() {
  const lang = useLangStore((s) => s.lang);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [league, setLeague] = useState<string>(() => defaultLeague(user?.role));
  const [data, setData] = useState<ChampionshipResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    kpiApi
      .getChampionship({ role: league, limit: 20 })
      .then((res) => setData(res.data))
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string };
        setError(e.response?.data?.detail || e.message || 'Ошибка загрузки данных чемпионата');
      })
      .finally(() => setLoading(false));
  }, [league]);

  useEffect(() => { load(); }, [load]);

  const leagueLabel = (role: string) => {
    const opt = LEAGUE_OPTIONS.find((o) => o.value === role);
    return opt ? (lang === 'uz' ? opt.label.uz : opt.label.ru) : role;
  };

  // Топ-3 для подиума
  const top3 = data?.leaders.slice(0, 3) ?? [];
  const rest = data?.leaders.slice(3) ?? [];

  // Порядок подиума: 2-й / 1-й / 3-й (классический)
  const podiumOrder: Array<0 | 1 | 2> = [1, 0, 2];

  return (
    <div className="tactical-root" style={{ paddingBottom: 60 }}>
      <StatusBar />

      {/* ─── HEADER ─── */}
      <div className="title-row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          onClick={() => navigate('/learning')}
          style={btnBase}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--brass)';
            e.currentTarget.style.background = 'var(--bg-elevated)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.background = 'var(--bg-overlay)';
          }}
        >
          {/* SVG стрелка назад вместо символа */}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }}>
            <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {lang === 'uz' ? 'XARITA' : 'КАРТА'}
        </button>

        <h1 style={{ fontFamily: 'Cinzel, serif' }}>
          {lang === 'uz' ? "Chempionat 2026" : 'Чемпионат 2026'}
        </h1>
        <span className="tactical-tag" />

        <div className="title-meta">
          {data?.period && (
            <span>
              <b>{data.period}</b>{' '}
              {lang === 'uz' ? 'DAVR' : 'ПЕРИОД'}
            </span>
          )}
          {data?.computed_at && (
            <span style={{ color: 'var(--text-2)', fontSize: 10 }}>
              {lang === 'uz' ? 'yangilandi' : 'обновлено'} {formatComputedAt(data.computed_at, lang)}
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px' }}>

        {/* ─── ЛИГА-СЕЛЕКТОР ─── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0 24px', justifyContent: 'center' }}>
          {LEAGUE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLeague(opt.value)}
              style={{
                ...btnBase,
                color: league === opt.value ? 'var(--gold)' : 'var(--text-1)',
                borderColor: league === opt.value ? 'var(--brass)' : 'var(--line)',
                background: league === opt.value ? 'var(--bg-elevated)' : 'var(--bg-overlay)',
                fontWeight: league === opt.value ? 700 : 600,
                textTransform: 'uppercase',
              }}
              onMouseEnter={(e) => {
                if (league !== opt.value) {
                  e.currentTarget.style.borderColor = 'var(--brass)';
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                }
              }}
              onMouseLeave={(e) => {
                if (league !== opt.value) {
                  e.currentTarget.style.borderColor = 'var(--line)';
                  e.currentTarget.style.background = 'var(--bg-overlay)';
                }
              }}
            >
              {lang === 'uz' ? opt.label.uz : opt.label.ru}
            </button>
          ))}
        </div>

        {/* ─── СОСТОЯНИЯ ─── */}
        {loading && <ChampionshipSkeleton />}

        {!loading && error && (
          <div
            className="glass-panel"
            style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--danger, #ef4444)' }}
          >
            <div style={{ fontFamily: MONO, fontSize: 13, marginBottom: 16 }}>{error}</div>
            <button
              type="button"
              onClick={load}
              style={{ ...btnBase, color: 'var(--danger)' }}
            >
              {lang === 'uz' ? 'QAYTA URINISH' : 'ПОВТОРИТЬ'}
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* ─── СЕКЦИЯ 1: ЛИДЕРЫ ─── */}
            <div style={{ marginBottom: 40 }}>
              <div style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '.15em',
                color: 'var(--text-2)',
                textTransform: 'uppercase',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                {/* Иконка кубка SVG */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M6 2h12v7a6 6 0 01-12 0V2z" stroke="var(--gold)" strokeWidth="1.5" fill="none" />
                  <path d="M6 5H3a3 3 0 003 3M18 5h3a3 3 0 01-3 3" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M12 15v4M8 21h8" stroke="var(--text-2)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {lang === 'uz'
                  ? `LIGA LIDERLARI · ${leagueLabel(league).toUpperCase()}`
                  : `ЛИДЕРЫ ЛИГИ · ${leagueLabel(league).toUpperCase()}`}
                <span style={{ color: 'var(--text-2)', fontWeight: 400, letterSpacing: '.06em', fontSize: 10 }}>
                  · {lang === 'uz' ? 'percentil bo\'yicha' : 'по перцентилю'} · {lang === 'uz' ? 'yopiq davrlar' : 'закрытые периоды'}
                </span>
              </div>

              {data.leaders.length === 0 ? (
                <EmptyState note={data.note} lang={lang} />
              ) : (
                <>
                  {/* Подиум топ-3 */}
                  {top3.length >= 3 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1.15fr 1fr',
                      gap: 14,
                      alignItems: 'end',
                      marginBottom: 24,
                    }}>
                      {podiumOrder.map((idx) => {
                        const leader = top3[idx];
                        if (!leader) return <div key={idx} />;
                        const rank = (idx + 1) as 1 | 2 | 3;
                        return <PodiumCard key={leader.user_id} leader={leader} rank={rank} />;
                      })}
                    </div>
                  )}

                  {/* Если меньше 3 — показываем без подиума */}
                  {top3.length < 3 && top3.map((leader) => (
                    <div key={leader.user_id} className="glass-panel" style={{ marginBottom: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontFamily: MONO, fontWeight: 700, color: rankColor(leader.rank), width: 28, textAlign: 'center' }}>{leader.rank}</span>
                      <span style={{ flex: 1, color: 'var(--text-0)', fontWeight: 600 }}>{leader.full_name}</span>
                      <span style={{ fontFamily: MONO, fontWeight: 700, color: kpiColor(leader.kpi_final) }}>{leader.kpi_final.toFixed(1)}</span>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--brass)' }}>{leader.percentile.toFixed(0)}%</span>
                    </div>
                  ))}

                  {/* Остальные (4+) в таблице */}
                  {rest.length > 0 && (
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                        <thead>
                          <tr>
                            <ThCell label="#" align="center" />
                            <ThCell label={lang === 'uz' ? 'ISM' : 'СОТРУДНИК'} />
                            <ThCell label="ID" />
                            <ThCell label="KPI" align="right" />
                            <ThCell label={lang === 'uz' ? 'PERCENTIL' : 'ПЕРЦЕНТИЛЬ'} align="right" />
                          </tr>
                        </thead>
                        <tbody>
                          {rest.map((leader) => (
                            <LeaderRow key={leader.user_id} leader={leader} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ─── СЕКЦИЯ 2: ЛУЧШИЙ ПРИРОСТ ─── */}
            {data.most_improved.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: '.15em',
                  color: 'var(--text-2)',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  {/* Иконка роста SVG */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="var(--success, #4ade80)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="16 7 22 7 22 13" stroke="var(--success, #4ade80)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {lang === 'uz' ? 'ENG KO\'P O\'SISH' : 'ЛУЧШИЙ ПРИРОСТ'}
                  <span style={{ color: 'var(--text-2)', fontWeight: 400, letterSpacing: '.06em', fontSize: 10 }}>
                    · {data.previous_period
                        ? (lang === 'uz' ? `${data.previous_period} → ${data.period}` : `${data.previous_period} → ${data.period}`)
                        : (lang === 'uz' ? 'oldingi davrga nisbatan' : 'к прошлому периоду')}
                  </span>
                </div>

                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                    <thead>
                      <tr>
                        <ThCell label="#" align="center" />
                        <ThCell label={lang === 'uz' ? 'ISM' : 'СОТРУДНИК'} />
                        <ThCell label="ID" />
                        <ThCell label={lang === 'uz' ? 'O\'SISH' : 'ПРИРОСТ'} align="right" />
                        <ThCell label={lang === 'uz' ? 'O\'ZGARISH' : 'БЫЛО → СТАЛО'} align="right" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.most_improved.map((entry, i) => (
                        <ImprovedRow key={entry.user_id} entry={entry} rank={i + 1} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── ФУТЕР ─── */}
            <div style={{
              textAlign: 'center',
              color: 'var(--text-2)',
              fontSize: 10,
              marginTop: 24,
              fontFamily: MONO,
              letterSpacing: '.1em',
            }}>
              {lang === 'uz'
                ? `Chempionat 2026 · ${leagueLabel(league)} · yopiq davrlar bo'yicha`
                : `Чемпионат 2026 · ${leagueLabel(league)} · по закрытым периодам`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
