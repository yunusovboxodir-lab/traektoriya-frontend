import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentsApi, type Assessment } from '../api/assessments';
import { useT, useLangStore } from '../stores/langStore';

const TERRITORY_TABS = [
  { key: 'all', label: 'Все' },
  { key: 'Новичок', label: 'Новичок' },
  { key: 'Агент', label: 'Агент' },
  { key: 'Эксперт', label: 'Эксперт' },
  { key: 'Мастер', label: 'Мастер' },
] as const;

const TYPE_BADGE_COLORS: Record<string, string> = {
  knowledge: 'bg-blue-50 text-blue-700',
  skills: 'bg-green-50 text-green-700',
  certification: 'bg-purple-50 text-purple-700',
};

const TERRITORY_BADGE_COLORS: Record<string, string> = {
  'Новичок': 'bg-gray-100 text-gray-700',
  'Агент': 'bg-sky-50 text-sky-700',
  'Эксперт': 'bg-amber-50 text-amber-700',
  'Мастер': 'bg-red-50 text-red-700',
};

export function AssessmentsPage() {
  const navigate = useNavigate();
  const t = useT();
  const lang = useLangStore((s) => s.lang);

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTerritory, setActiveTerritory] = useState<string>('all');

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await assessmentsApi.getAssessments();
      const data = res.data;
      setAssessments(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      setError(t('assessments.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (activeTerritory === 'all') return assessments;
    return assessments.filter((a) => a.territory === activeTerritory);
  }, [assessments, activeTerritory]);

  // -- Loading --
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // -- Error --
  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={loadAssessments}
            className="text-red-600 underline text-sm mt-1"
          >
            {t('assessments.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('assessments.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('assessments.subtitle')}
        </p>
      </div>

      {/* Territory filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TERRITORY_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTerritory(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTerritory === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.key === 'all' ? t('assessments.all') : tab.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <svg
            className="mx-auto w-16 h-16 text-gray-300 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <p className="text-gray-500 text-lg font-medium">
            {activeTerritory !== 'all'
              ? t('assessments.noAssessmentsForLevel', { level: activeTerritory })
              : t('assessments.noAssessments')}
          </p>
        </div>
      )}

      {/* Assessment grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((assessment) => (
            <button
              key={assessment.id}
              type="button"
              onClick={() => navigate(`/assessments/${assessment.id}/take`)}
              className="text-left bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    TYPE_BADGE_COLORS[assessment.assessment_type] ??
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  {assessment.assessment_type}
                </span>
                {assessment.territory && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      TERRITORY_BADGE_COLORS[assessment.territory] ??
                      'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {assessment.territory}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1.5">
                {assessment.title}
              </h3>

              {/* Description */}
              {assessment.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {assessment.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {assessment.question_count}
                </span>

                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('assessments.threshold', { value: assessment.pass_threshold })}
                </span>

                {assessment.time_limit_minutes != null && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    {assessment.time_limit_minutes} {t('assessments.min')}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

