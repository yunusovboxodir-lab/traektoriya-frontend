/**
 * Вкладка «ROI обучения» — петля «обучение → KPI-дельта».
 * По каждой офлайн-программе и типу онлайн-курса показывает рост знаний (PRE→POST)
 * и дельту KPI участников (месяц тренинга → следующий месяц).
 */
import { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '../../api/analytics';
import type { LearningRoiData, RoiProgramRow, RoiCourseRow } from '../../api/analytics';
import { useT } from '../../stores/langStore';
import { SectionTitle, StatCard } from './charts';
import { GraduationCap, Users, TrendingUp, Target } from 'lucide-react';

// Последние N месяцев в формате YYYY-MM, начиная с прошлого месяца
function recentMonths(count: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1); // прошлый месяц (чтобы месяц сравнения уже существовал)
  for (let i = 0; i < count; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

function fmtDelta(v: number | null): { text: string; color: string } {
  if (v === null) return { text: '—', color: 'var(--text-muted)' };
  const sign = v > 0 ? '+' : '';
  const color = v > 0 ? 'var(--success)' : v < 0 ? 'var(--danger)' : 'var(--text-muted)';
  return { text: `${sign}${v}`, color };
}

function fmtNum(v: number | null, suffix = ''): string {
  return v === null ? '—' : `${v}${suffix}`;
}

export function RoiTab() {
  const t = useT();
  const months = recentMonths(6);
  const [baseline, setBaseline] = useState<string>(months[0]);
  const [data, setData] = useState<LearningRoiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (b: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.getLearningRoi({ baseline: b });
      setData(res.data);
    } catch {
      setError(t('analytics.roi.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(baseline); }, [baseline, load]);

  const cards = data ? [
    {
      label: t('analytics.roi.cardTrainings'),
      value: data.summary.trainings,
      gradientFrom: 'from-blue-500', gradientTo: 'to-blue-600',
      accentColor: 'var(--info)', accentBg: 'var(--info-bg)',
      icon: <GraduationCap size={20} />,
    },
    {
      label: t('analytics.roi.cardParticipants'),
      value: data.summary.participants,
      gradientFrom: 'from-purple-500', gradientTo: 'to-purple-600',
      accentColor: 'var(--color-tp)', accentBg: 'var(--color-tp-bg)',
      icon: <Users size={20} />,
    },
    {
      label: t('analytics.roi.cardAvgDelta'),
      value: fmtDelta(data.summary.avg_kpi_delta).text,
      gradientFrom: 'from-emerald-500', gradientTo: 'to-emerald-600',
      accentColor: 'var(--success)', accentBg: 'var(--success-bg)',
      icon: <TrendingUp size={20} />,
    },
    {
      label: t('analytics.roi.cardCoverage'),
      value: `${data.summary.participants_with_kpi}/${data.summary.participants}`,
      gradientFrom: 'from-amber-500', gradientTo: 'to-amber-600',
      accentColor: 'var(--warning)', accentBg: 'var(--warning-bg)',
      icon: <Target size={20} />,
    },
  ] : [];

  return (
    <div>
      {/* Селектор baseline-месяца */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('analytics.roi.subtitle')}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('analytics.roi.monthLabel')}</span>
          <select
            value={baseline}
            onChange={(e) => setBaseline(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          >
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: 'var(--info)' }} />
        </div>
      ) : error ? (
        <div className="rounded-lg p-4" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)' }}>
          <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      ) : !data || data.summary.trainings === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <div className="mx-auto mb-3 w-12 h-12 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <GraduationCap size={48} />
          </div>
          <p className="text-sm">{t('analytics.roi.empty')}</p>
        </div>
      ) : (
        <>
          {/* StatCards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((c) => <StatCard key={c.label} card={c} />)}
          </div>

          {/* Офлайн-программы */}
          {data.programs.length > 0 && (
            <div className="mb-8">
              <SectionTitle title={t('analytics.roi.offlineTitle')} />
              <div className="rounded-xl overflow-hidden overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      <th className="text-left px-4 py-2">{t('analytics.roi.colProgram')}</th>
                      <th className="text-center px-4 py-2">{t('analytics.roi.colParticipants')}</th>
                      <th className="text-center px-4 py-2">{t('analytics.roi.colGrowth')}</th>
                      <th className="text-center px-4 py-2">{t('analytics.roi.colKpiBefore')}</th>
                      <th className="text-center px-4 py-2">{t('analytics.roi.colKpiAfter')}</th>
                      <th className="text-center px-4 py-2">{t('analytics.roi.colKpiDelta')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.programs.map((p: RoiProgramRow) => {
                      const d = fmtDelta(p.avg_kpi_delta);
                      return (
                        <tr key={p.code || p.title} style={{ borderTop: '1px solid var(--border)' }}>
                          <td className="px-4 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{p.title}</td>
                          <td className="px-4 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>{p.participants}</td>
                          <td className="px-4 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>
                            {p.avg_pre !== null && p.avg_post !== null
                              ? `${p.avg_pre}% → ${p.avg_post}%`
                              : '—'}
                          </td>
                          <td className="px-4 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>{fmtNum(p.avg_kpi_baseline)}</td>
                          <td className="px-4 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>{fmtNum(p.avg_kpi_next)}</td>
                          <td className="px-4 py-2 text-center font-semibold" style={{ color: d.color }}>{d.text}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Онлайн-курсы */}
          {data.courses.length > 0 && (
            <div className="mb-8">
              <SectionTitle title={t('analytics.roi.onlineTitle')} />
              <div className="rounded-xl overflow-hidden overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      <th className="text-left px-4 py-2">{t('analytics.roi.colCourseType')}</th>
                      <th className="text-center px-4 py-2">{t('analytics.roi.colCompletions')}</th>
                      <th className="text-center px-4 py-2">{t('analytics.roi.colQuiz')}</th>
                      <th className="text-center px-4 py-2">{t('analytics.roi.colKpiDelta')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.courses.map((c: RoiCourseRow) => {
                      const d = fmtDelta(c.avg_kpi_delta);
                      return (
                        <tr key={c.section} style={{ borderTop: '1px solid var(--border)' }}>
                          <td className="px-4 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{c.title}</td>
                          <td className="px-4 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>{c.completions}</td>
                          <td className="px-4 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>{fmtNum(c.avg_quiz, '%')}</td>
                          <td className="px-4 py-2 text-center font-semibold" style={{ color: d.color }}>{d.text}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Методологическая сноска */}
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {t('analytics.roi.note', { baseline: data.period.baseline, comparison: data.period.comparison })}
          </p>
        </>
      )}
    </div>
  );
}
