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

function fmtDelta(v: number | null): { text: string; cls: string } {
  if (v === null) return { text: '—', cls: 'text-gray-400' };
  const sign = v > 0 ? '+' : '';
  const cls = v > 0 ? 'text-emerald-600' : v < 0 ? 'text-red-600' : 'text-gray-500';
  return { text: `${sign}${v}`, cls };
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
      bgLight: 'bg-blue-50', textColor: 'text-blue-600',
      icon: <GraduationCap size={20} />,
    },
    {
      label: t('analytics.roi.cardParticipants'),
      value: data.summary.participants,
      gradientFrom: 'from-purple-500', gradientTo: 'to-purple-600',
      bgLight: 'bg-purple-50', textColor: 'text-purple-600',
      icon: <Users size={20} />,
    },
    {
      label: t('analytics.roi.cardAvgDelta'),
      value: fmtDelta(data.summary.avg_kpi_delta).text,
      gradientFrom: 'from-emerald-500', gradientTo: 'to-emerald-600',
      bgLight: 'bg-emerald-50', textColor: 'text-emerald-600',
      icon: <TrendingUp size={20} />,
    },
    {
      label: t('analytics.roi.cardCoverage'),
      value: `${data.summary.participants_with_kpi}/${data.summary.participants}`,
      gradientFrom: 'from-amber-500', gradientTo: 'to-amber-600',
      bgLight: 'bg-amber-50', textColor: 'text-amber-600',
      icon: <Target size={20} />,
    },
  ] : [];

  return (
    <div>
      {/* Селектор baseline-месяца */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <p className="text-sm text-gray-500">{t('analytics.roi.subtitle')}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{t('analytics.roi.monthLabel')}</span>
          <select
            value={baseline}
            onChange={(e) => setBaseline(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      ) : !data || data.summary.trainings === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <GraduationCap size={48} className="mx-auto mb-3 text-gray-300" />
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
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs">
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
                        <tr key={p.code || p.title} className="border-t border-gray-100">
                          <td className="px-4 py-2 text-gray-900 font-medium">{p.title}</td>
                          <td className="px-4 py-2 text-center text-gray-600">{p.participants}</td>
                          <td className="px-4 py-2 text-center text-gray-600">
                            {p.avg_pre !== null && p.avg_post !== null
                              ? `${p.avg_pre}% → ${p.avg_post}%`
                              : '—'}
                          </td>
                          <td className="px-4 py-2 text-center text-gray-600">{fmtNum(p.avg_kpi_baseline)}</td>
                          <td className="px-4 py-2 text-center text-gray-600">{fmtNum(p.avg_kpi_next)}</td>
                          <td className={`px-4 py-2 text-center font-semibold ${d.cls}`}>{d.text}</td>
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
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs">
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
                        <tr key={c.section} className="border-t border-gray-100">
                          <td className="px-4 py-2 text-gray-900 font-medium">{c.title}</td>
                          <td className="px-4 py-2 text-center text-gray-600">{c.completions}</td>
                          <td className="px-4 py-2 text-center text-gray-600">{fmtNum(c.avg_quiz, '%')}</td>
                          <td className={`px-4 py-2 text-center font-semibold ${d.cls}`}>{d.text}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Методологическая сноска */}
          <p className="text-xs text-gray-400 mt-2">
            {t('analytics.roi.note', { baseline: data.period.baseline, comparison: data.period.comparison })}
          </p>
        </>
      )}
    </div>
  );
}
