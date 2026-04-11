import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '../stores/langStore';
import { useAuthStore } from '../stores/authStore';
import { PulsePage } from './PulsePage';
import { AssessmentsPage } from './AssessmentsPage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CompTab = 'pulse' | 'assessments';

const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 5,
  commercial_dir: 4,
  regional_manager: 2,
  admin: 3,
  supervisor: 2,
  sales_rep: 1,
};

// ---------------------------------------------------------------------------
// CompetenciesPage — combines Assessments + Matrix + Profiles
// ---------------------------------------------------------------------------

export function CompetenciesPage() {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  // Роли пока не используются для табов (GAP-матрица и Профили убраны)
  // const userRole = user?.role || 'sales_rep';
  void user; // suppress unused warning

  // Build visible tabs — GAP-матрица и Профили убраны (не используются)
  const visibleTabs = useMemo(() => {
    const tabs: { id: CompTab; labelKey: string }[] = [
      { id: 'pulse', labelKey: 'comp.tabPulse' },
      { id: 'assessments', labelKey: 'comp.tabAssessments' },
    ];
    return tabs;
  }, []);

  const tabFromUrl = searchParams.get('tab') as CompTab | null;
  const [activeTab, setActiveTab] = useState<CompTab>(
    tabFromUrl && visibleTabs.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'pulse',
  );

  // Sync URL → state
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
      {/* Tab navigation — only show if more than 1 tab */}
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

      {/* Tab content */}
      {activeTab === 'pulse' && <PulsePage />}
      {activeTab === 'assessments' && <AssessmentsPage />}
    </div>
  );
}
