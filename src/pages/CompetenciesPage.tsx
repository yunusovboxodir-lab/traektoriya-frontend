import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '../stores/langStore';
import { PulsePage } from './PulsePage';
import { AssessmentsPage } from './AssessmentsPage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CompTab = 'pulse' | 'assessments';

// ---------------------------------------------------------------------------
// CompetenciesPage — Пульс + Оценка
// ---------------------------------------------------------------------------

export function CompetenciesPage() {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();

  const visibleTabs = useMemo(() => [
    { id: 'pulse' as CompTab, labelKey: 'comp.tabPulse' },
    { id: 'assessments' as CompTab, labelKey: 'comp.tabAssessments' },
  ], []);

  const tabFromUrl = searchParams.get('tab') as CompTab | null;
  const [activeTab, setActiveTab] = useState<CompTab>(
    tabFromUrl && visibleTabs.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'pulse',
  );

  useEffect(() => {
    const urlTab = searchParams.get('tab') as CompTab | null;
    if (urlTab && visibleTabs.some((t) => t.id === urlTab)) {
      setActiveTab(urlTab);
    }
  }, [searchParams, visibleTabs]);

  const handleTabChange = (tab: CompTab) => {
    setActiveTab(tab);
    if (tab === 'pulse') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  return (
    <div>
      {visibleTabs.length > 1 && (
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-6 w-fit">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'pulse' && <PulsePage />}
      {activeTab === 'assessments' && <AssessmentsPage />}
    </div>
  );
}
