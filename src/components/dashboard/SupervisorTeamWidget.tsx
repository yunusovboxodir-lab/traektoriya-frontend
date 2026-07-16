/**
 * SupervisorTeamWidget — командный блок для роли supervisor на главной.
 *
 * Раньше дашборд СВ был пуст: личный LearningRankWidget скрыт (СВ не соревнуется
 * как ученик среди своих ТП), а после приветствия ничего не показывалось.
 * Этот виджет даёт СВ командный разрез:
 *   - место команды в рейтинге + рейтинг + число участников (GET /kpi/team-rating/all)
 *   - CTA «Команда» → /team, «Пульс команды» → /competencies?tab=pulse
 *
 * Данные честные: рейтинг из API, при отсутствии — понятное пустое состояние
 * (не белый экран). Команда матчится по user.team_id.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { kpiApi } from '../../api/kpi';
import type { TeamRatingEntry } from '../../api/kpi';
import { useAuthStore } from '../../stores/authStore';
import { useT } from '../../stores/langStore';

interface MyTeamRating {
  entry: TeamRatingEntry;
  rank: number;
  totalTeams: number;
}

export function SupervisorTeamWidget() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<MyTeamRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrored(false);
    kpiApi
      .getTeamRatings()
      .then((res) => {
        if (cancelled) return;
        const raw = res.data;
        const teams: TeamRatingEntry[] = Array.isArray(raw) ? raw : raw?.teams ?? [];
        // Массив уже отсортирован по rating бэком → место = индекс + 1.
        const idx = teams.findIndex((tm) => tm.team_id === user?.team_id);
        if (idx >= 0) {
          setData({ entry: teams[idx], rank: idx + 1, totalTeams: teams.length });
        } else {
          setData(null);
        }
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.team_id]);

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
  };

  if (loading) {
    return (
      <div style={cardStyle} className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 rounded" style={{ background: 'var(--bg-overlay)' }} />
          <div className="h-20 rounded-xl" style={{ background: 'var(--bg-overlay)' }} />
        </div>
      </div>
    );
  }

  const ratingColor = (r: number) =>
    r >= 80 ? 'var(--success)' : r >= 60 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div style={cardStyle} className="overflow-hidden">
      {/* Заголовок */}
      <div
        className="px-5 py-4 sm:px-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(200,168,75,0.12) 0%, rgba(96,165,250,0.06) 100%)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h2
          className="text-lg font-bold flex items-center gap-2"
          style={{ color: 'var(--text-primary)' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: 'var(--brass)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z" />
          </svg>
          {t('dashboard.supervisorTeam.title')}
        </h2>
      </div>

      <div className="p-5 sm:p-6">
        {/* Рейтинг команды или пустое состояние */}
        {data ? (
          <div
            className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-4"
            style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold"
                style={{
                  background: 'rgba(200,168,75,0.15)',
                  border: '2px solid rgba(200,168,75,0.5)',
                  color: 'var(--brass)',
                }}
              >
                #{data.rank}
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {t('dashboard.supervisorTeam.place', { total: data.totalTeams })}
                </p>
                <p className="text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {data.entry.team_name}
                </p>
                {data.entry.member_count != null && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {data.entry.member_count} {t('dashboard.supervisorTeam.membersUnit')}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold" style={{ color: ratingColor(data.entry.rating) }}>
                {Math.round(data.entry.rating)}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('dashboard.supervisorTeam.rating')}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl p-4 text-sm"
            style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            {errored
              ? t('dashboard.supervisorTeam.loadError')
              : t('dashboard.supervisorTeam.noRating')}
          </div>
        )}

        {/* CTA-ссылки */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            to="/team"
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
            style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z" />
            </svg>
            {t('dashboard.supervisorTeam.ctaTeam')}
          </Link>
          <Link
            to="/competencies?tab=pulse"
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
            style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l3 8 4-16 3 8h4" />
            </svg>
            {t('dashboard.supervisorTeam.ctaPulse')}
          </Link>
        </div>
      </div>
    </div>
  );
}
