/**
 * PulsePage — Пульс по 8 компетенциям.
 *
 * Показывает SVG-радар прогресса, таблицу компетенций,
 * и drill-down по курсам внутри каждой компетенции.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useLangStore, useT } from '../stores/langStore';
import { pulseApi, type CompetencyPulse, type UserPulse, type PulseCourse } from '../api/competencies';
import { RadarChart, type RadarDataPoint } from '../components/competencies/RadarChart';

// Цвета уровней для бейджей
const LEVEL_STYLES: Record<string, string> = {
  trainee: 'bg-red-100 text-red-700',
  practitioner: 'bg-yellow-100 text-yellow-700',
  expert: 'bg-blue-100 text-blue-700',
  master: 'bg-green-100 text-green-700',
};

const LEVEL_BAR_COLORS: Record<string, string> = {
  trainee: 'bg-red-500',
  practitioner: 'bg-yellow-500',
  expert: 'bg-blue-500',
  master: 'bg-green-500',
};

export function PulsePage() {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const user = useAuthStore((s) => s.user);

  const [pulse, setPulse] = useState<UserPulse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drill-down: какая компетенция раскрыта
  const [expandedComp, setExpandedComp] = useState<string | null>(null);
  const [courses, setCourses] = useState<PulseCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const userId = user?.id ? String(user.id) : null;

  const loadPulse = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await pulseApi.getUserPulse(userId);
      setPulse(res.data);
    } catch (e: unknown) {
      const err = e as { response?: { status: number } };
      if (err.response?.status === 404) {
        setPulse(null);
      } else {
        setError('Ошибка загрузки');
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPulse();
  }, [loadPulse]);

  // Drill-down: загрузка курсов компетенции
  const toggleCompetency = async (compId: string) => {
    if (expandedComp === compId) {
      setExpandedComp(null);
      setCourses([]);
      return;
    }
    setExpandedComp(compId);
    setLoadingCourses(true);
    try {
      const res = await pulseApi.getCompetencyCourses(compId, userId || undefined);
      setCourses(res.data.courses);
    } catch {
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Данные для радара
  const radarData: RadarDataPoint[] = pulse?.competencies.map((c) => ({
    label: lang === 'uz' && c.competency_name_uz ? c.competency_name_uz : c.competency_name,
    value: c.pulse_pct,
    level: c.pulse_level,
  })) || [];

  // Название уровня
  const levelName = (c: CompetencyPulse) =>
    lang === 'uz' ? c.pulse_level_uz : c.pulse_level_ru;

  const overallLevelName = pulse
    ? lang === 'uz' ? pulse.overall_level_uz : pulse.overall_level_ru
    : '';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-600">
        <p>{error}</p>
        <button onClick={loadPulse} className="mt-4 text-blue-600 underline">
          {t('common.retry') || 'Повторить'}
        </button>
      </div>
    );
  }

  if (!pulse || pulse.competencies.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg">{t('pulse.noData') || 'Данные пульса пока недоступны'}</p>
        <p className="text-sm mt-2">{t('pulse.noDataHint') || 'Компетенции ещё не настроены'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок + Общий Пульс */}
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Общий Пульс — карточка */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 text-center min-w-[200px]">
          <p className="text-sm text-gray-500 mb-1">
            {t('pulse.overallPulse') || 'Общий пульс'}
          </p>
          <p className={`text-5xl font-bold ${
            pulse.overall_pulse >= 76 ? 'text-green-600' :
            pulse.overall_pulse >= 51 ? 'text-blue-600' :
            pulse.overall_pulse >= 26 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {Math.round(pulse.overall_pulse)}%
          </p>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
            LEVEL_STYLES[pulse.overall_level] || 'bg-gray-100 text-gray-700'
          }`}>
            {overallLevelName}
          </span>
        </div>

        {/* Радар */}
        <div className="flex-1 flex justify-center">
          <RadarChart data={radarData} size={340} />
        </div>

        {/* Краткая статистика */}
        <div className="grid grid-cols-2 gap-3 min-w-[200px]">
          <div className="bg-white rounded-xl border p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{Math.round(pulse.total_earned)}</p>
            <p className="text-xs text-gray-500">{t('pulse.earned') || 'Набрано'}</p>
          </div>
          <div className="bg-white rounded-xl border p-3 text-center">
            <p className="text-2xl font-bold text-gray-400">{Math.round(pulse.total_max)}</p>
            <p className="text-xs text-gray-500">{t('pulse.max') || 'Макс'}</p>
          </div>
          <div className="col-span-2 bg-white rounded-xl border p-3 text-center">
            <p className="text-sm text-gray-500">{t('pulse.competencies') || 'Компетенций'}: <span className="font-bold text-gray-800">{pulse.competencies.length}</span></p>
          </div>
        </div>
      </div>

      {/* Пороги уровней */}
      <div className="flex gap-4 justify-center text-xs">
        {[
          { key: 'trainee', label: t('pulse.trainee') || 'Стажёр', range: '0–25%', color: 'bg-red-500' },
          { key: 'practitioner', label: t('pulse.practitioner') || 'Практик', range: '26–50%', color: 'bg-yellow-500' },
          { key: 'expert', label: t('pulse.expert') || 'Эксперт', range: '51–75%', color: 'bg-blue-500' },
          { key: 'master', label: t('pulse.master') || 'Мастер', range: '76–100%', color: 'bg-green-500' },
        ].map((l) => (
          <div key={l.key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
            <span className="text-gray-600">{l.label} {l.range}</span>
          </div>
        ))}
      </div>

      {/* Таблица компетенций */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-3">{t('pulse.competency') || 'Компетенция'}</th>
              <th className="px-4 py-3 w-48">{t('pulse.progress') || 'Прогресс'}</th>
              <th className="px-4 py-3 text-center">{t('pulse.earned') || 'Набрано'}</th>
              <th className="px-4 py-3 text-center">{t('pulse.maxShort') || 'Макс'}</th>
              <th className="px-4 py-3 text-center">{t('pulse.courses') || 'Курсы'}</th>
              <th className="px-4 py-3 text-center">{t('pulse.level') || 'Уровень'}</th>
            </tr>
          </thead>
          <tbody>
            {pulse.competencies.map((c) => (
              <>
                <tr
                  key={c.competency_id}
                  className="border-t hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => toggleCompetency(c.competency_id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">
                        {expandedComp === c.competency_id ? '▼' : '▶'}
                      </span>
                      <span className="font-medium text-gray-800">
                        {lang === 'uz' && c.competency_name_uz ? c.competency_name_uz : c.competency_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            LEVEL_BAR_COLORS[c.pulse_level] || 'bg-gray-400'
                          }`}
                          style={{ width: `${Math.min(c.pulse_pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-10 text-right">
                        {Math.round(c.pulse_pct)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium">
                    {Math.round(c.score_earned)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-400">
                    {Math.round(c.score_max)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <span className="text-gray-800">{c.courses_completed}</span>
                    <span className="text-gray-400">/{c.courses_total}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      LEVEL_STYLES[c.pulse_level] || 'bg-gray-100 text-gray-700'
                    }`}>
                      {levelName(c)}
                    </span>
                  </td>
                </tr>

                {/* Drill-down: курсы */}
                {expandedComp === c.competency_id && (
                  <tr key={`${c.competency_id}-courses`}>
                    <td colSpan={6} className="px-4 py-2 bg-gray-50">
                      {loadingCourses ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                        </div>
                      ) : courses.length === 0 ? (
                        <p className="text-center text-gray-400 py-4 text-sm">
                          {t('pulse.noCourses') || 'Курсы не привязаны'}
                        </p>
                      ) : (
                        <div className="grid gap-1">
                          {courses.map((course) => (
                            <div
                              key={course.course_id}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                                course.is_completed ? 'bg-green-50' : 'bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <span className={`text-base ${course.is_completed ? 'opacity-100' : 'opacity-30'}`}>
                                  {course.is_completed ? '\u2705' : '\u2B1C'}
                                </span>
                                <span className={course.is_completed ? 'text-gray-600' : 'text-gray-800'}>
                                  {lang === 'uz' && course.title_uz ? course.title_uz : course.title_ru}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                                  {t(`level.${course.level}`) || course.level}
                                </span>
                                <span>{t('pulse.weight') || 'вес'}: {course.weight}</span>
                                {course.quiz_score !== null && (
                                  <span className="text-blue-600 font-medium">{course.quiz_score}%</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
