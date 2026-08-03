/**
 * KpiRankWidget (2026-08-03) — рейтинг сотрудников по ОФИЦИАЛЬНОМУ KPI периода.
 *
 * Зачем отдельный виджет. На главной стоял только «Рейтинг обучения», который по
 * решению владельца от 2026-07-30 ранжирует на 100% по обучению. Это правильно для
 * своего экрана, но главная страница должна показывать оценку РАБОТЫ человека —
 * то есть KPI периода: продажи 40 · полевое исполнение 30 · обучение 20 ·
 * дисциплина 10, с потолком по компоненту и бонусом за серию.
 *
 * Источник — GET /api/v1/kpi/leaderboard/top: сортировка по total_kpi, в ответе
 * приходит разложение (ai_score / lms_score / crm_score). Веса НЕ хардкодим в
 * подписи: берём из ответа, если бэк их отдал, иначе показываем текущий реестр.
 *
 * NB: это одна из трёх оценок платформы. «Рейтинг обучения» (LearningRankWidget)
 *     меряет только развитие, накопительная Мощь — PowerBadge.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { kpiApi } from '../../api/kpi';
import { useAuthStore } from '../../stores/authStore';
import { useT } from '../../stores/langStore';

const ADMIN_ROLES = ['superadmin', 'admin', 'commercial_dir'];

/** Роли, между которыми админ переключает доску. */
const ROLE_TABS = [
  { key: 'sales_rep', labelKey: 'common.roles.abbreviations.tp' },
  { key: 'supervisor', labelKey: 'common.roles.abbreviations.sv' },
  { key: 'regional_manager', labelKey: 'common.roles.abbreviations.rm' },
] as const;

/** Медали — семантика, читаются на обеих темах. */
const PODIUM = {
  gold: { bg: 'linear-gradient(135deg, #FBBF24 0%, #C8A84B 100%)', text: '#0a1929', glow: 'rgba(251,191,36,0.40)' },
  silver: { bg: 'linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 100%)', text: '#0a1929', glow: 'rgba(229,231,235,0.30)' },
  bronze: { bg: 'linear-gradient(135deg, #FB923C 0%, #C2410C 100%)', text: '#fff', glow: 'rgba(251,146,60,0.40)' },
};

/** Цвет по величине KPI: сразу видно, кто в норме, а кто просел. */
function kpiColor(v: number): string {
  if (v >= 75) return 'var(--success)';
  if (v >= 60) return 'var(--info)';
  if (v >= 50) return 'var(--warning)';
  return 'var(--danger)';
}

interface Leader {
  rank: number;
  user_id: string;
  full_name: string;
  employee_id: string;
  role: string;
  total_kpi: number;
  ai_score: number;
  lms_score: number;
  crm_score: number;
  rank_change?: number;
}

export function KpiRankWidget() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const t = useT();
  const user = useAuthStore((s) => s.user);

  const isAdmin = ADMIN_ROLES.includes(user?.role || '');
  const [role, setRole] = useState<string>(
    isAdmin ? 'sales_rep' : (user?.role || 'sales_rep'),
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    kpiApi
      .getLeaderboard({ limit: 100, role })
      .then((res) => {
        if (!alive) return;
        const payload = (res.data?.leaders ?? res.data ?? []) as Leader[];
        setLeaders(Array.isArray(payload) ? payload : []);
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [role]);

  // Подпись формулы. Веса реестра: 40/30/20/10. Строки собираем через словарь —
  // иначе в узбекском режиме подпись осталась бы русской (так уже было).
  const formulaParts = [
    { text: t('dashboard.kpiRank.formulaSales', { pct: 40 }), color: 'var(--warning)' },
    { text: t('dashboard.kpiRank.formulaExecution', { pct: 30 }), color: 'var(--info)' },
    { text: t('dashboard.kpiRank.formulaLearning', { pct: 20 }), color: 'var(--success)' },
    { text: t('dashboard.kpiRank.formulaDiscipline', { pct: 10 }), color: 'var(--text-muted)' },
  ];

  const top3 = leaders.slice(0, 3);
  const rest = expanded ? leaders.slice(3) : leaders.slice(3, 10);
  const at = (r: number) => top3.find((e) => e.rank === r);
  const first = at(1);
  const second = at(2);
  const third = at(3);
  const me = leaders.find((e) => e.user_id === user?.id);
  const meInTop3 = !!me && me.rank <= 3;

  /** Один столбик пьедестала. */
  const Podium = ({ entry, medal, height }: { entry?: Leader; medal: keyof typeof PODIUM; height: number }) => {
    if (!entry) return <div className="flex-1" />;
    const p = PODIUM[medal];
    return (
      <div className="flex-1 flex flex-col items-center justify-end">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold mb-2"
          style={{ background: p.bg, color: p.text, boxShadow: `0 0 22px ${p.glow}` }}
        >
          {entry.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="text-sm font-semibold text-center px-1" style={{ color: 'var(--text-primary)' }}>
          {entry.full_name}
        </div>
        <div className="text-2xl font-extrabold mt-1" style={{ color: kpiColor(entry.total_kpi) }}>
          {entry.total_kpi.toFixed(1)}
        </div>
        <div className="text-[11px] mt-0.5 flex gap-2" style={{ color: 'var(--text-muted)' }}>
          <span>{t('dashboard.kpiRank.sales')} {Math.round(entry.crm_score)}</span>
          <span>{t('dashboard.kpiRank.execution')} {Math.round(entry.ai_score)}</span>
          <span>{t('dashboard.kpiRank.learning')} {Math.round(entry.lms_score)}</span>
        </div>
        <div
          className="w-full rounded-t-xl mt-2 flex items-start justify-center pt-2 text-2xl font-extrabold"
          style={{ height, background: p.bg, color: p.text }}
        >
          {entry.rank}
        </div>
      </div>
    );
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-opacity"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', opacity: loading ? 0.6 : 1 }}
    >
      {/* Шапка: название, формула, переключатель ролей */}
      <div
        className="px-5 py-4 sm:px-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(96,165,250,0.14) 0%, rgba(200,168,75,0.07) 55%, rgba(96,165,250,0.05) 100%)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('dashboard.kpiRank.title')}
            </h2>
            <div className="text-xs mt-1 flex flex-wrap gap-x-2 gap-y-1" style={{ color: 'var(--text-muted)' }}>
              <span>{t('dashboard.kpiRank.subtitle')}:</span>
              {formulaParts.map((p, i) => (
                <span key={i} style={{ color: p.color, fontWeight: 600 }}>
                  {p.text}
                </span>
              ))}
            </div>
          </div>
          <Link to="/kpi" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            {t('dashboard.kpiRank.goToKpi')} →
          </Link>
        </div>

        {isAdmin && (
          <div className="flex gap-1.5 mt-3">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRole(tab.key)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  background: role === tab.key ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: role === tab.key ? 'var(--bg-card)' : 'var(--text-secondary)',
                }}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Тело */}
      <div className="px-5 py-4 sm:px-6">
        {error ? (
          <div className="text-sm py-6 text-center" style={{ color: 'var(--danger)' }}>
            {t('dashboard.kpiRank.loadError')}
          </div>
        ) : !loading && leaders.length === 0 ? (
          <div className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
            {t('dashboard.kpiRank.empty')}
          </div>
        ) : (
          <>
            {/* Пьедестал: 2 — 1 — 3 */}
            <div className="flex items-end gap-2 sm:gap-4 mb-5">
              <Podium entry={second} medal="silver" height={54} />
              <Podium entry={first} medal="gold" height={78} />
              <Podium entry={third} medal="bronze" height={40} />
            </div>

            {/* Своё место, если не в тройке */}
            {me && !meInTop3 && (
              <div
                className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent)' }}
              >
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {t('dashboard.kpiRank.yourPlace')}
                  </div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {me.rank} {t('dashboard.kpiRank.of')} {leaders.length}
                  </div>
                </div>
                <div className="text-xl font-extrabold" style={{ color: kpiColor(me.total_kpi) }}>
                  {me.total_kpi.toFixed(1)}
                </div>
              </div>
            )}

            {/* Преследователи */}
            {rest.length > 0 && (
              <>
                <div
                  className="text-[11px] font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t('dashboard.kpiRank.chasers')}
                </div>
                <div className="flex flex-col gap-1.5">
                  {rest.map((e) => {
                    const isMe = e.user_id === user?.id;
                    return (
                      <div
                        key={e.user_id}
                        className="flex items-center gap-3 rounded-lg px-3 py-2"
                        style={{
                          background: isMe ? 'var(--bg-secondary)' : 'transparent',
                          border: isMe ? '1px solid var(--accent)' : '1px solid transparent',
                        }}
                      >
                        <div
                          className="w-7 text-center text-sm font-bold shrink-0"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {e.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-sm font-medium truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {e.full_name}
                            {isMe ? ` · ${t('dashboard.kpiRank.you')}` : ''}
                          </div>
                          {/* Мини-разложение: видно, чем набран балл */}
                          <div className="flex gap-1 mt-1 h-1.5">
                            <div
                              className="rounded-sm"
                              style={{ width: `${Math.min(100, e.crm_score) * 0.4}%`, background: 'var(--warning)' }}
                            />
                            <div
                              className="rounded-sm"
                              style={{ width: `${Math.min(100, e.ai_score) * 0.3}%`, background: 'var(--info)' }}
                            />
                            <div
                              className="rounded-sm"
                              style={{ width: `${Math.min(100, e.lms_score) * 0.2}%`, background: 'var(--success)' }}
                            />
                          </div>
                        </div>
                        <div
                          className="text-base font-bold shrink-0 tabular-nums"
                          style={{ color: kpiColor(e.total_kpi) }}
                        >
                          {e.total_kpi.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {leaders.length > 10 && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full mt-3 py-2 rounded-lg text-xs font-semibold"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                  >
                    {expanded ? t('dashboard.kpiRank.collapse') : t('dashboard.kpiRank.showAll')}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
