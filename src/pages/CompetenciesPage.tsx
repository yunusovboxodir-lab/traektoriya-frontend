import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '../stores/langStore';
import { useAuthStore } from '../stores/authStore';
import { AssessmentsPage } from './AssessmentsPage';
import { CompetencyMatrixPage } from './CompetencyMatrixPage';
import { CompetencyProfilePage } from './CompetencyProfilePage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CompTab = 'assessments' | 'matrix' | 'profiles';

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

  const userRole = user?.role || 'sales_rep';
  const roleLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const isSupervisorPlus = roleLevel >= 2;
  const isAdminPlus = roleLevel >= 3;

  // Build visible tabs based on role
  const visibleTabs = useMemo(() => {
    const tabs: { id: CompTab; labelKey: string }[] = [
      { id: 'assessments', labelKey: 'comp.tabAssessments' },
    ];
    if (isSupervisorPlus) {
      tabs.push({ id: 'matrix', labelKey: 'comp.tabMatrix' });
    }
    if (isAdminPlus) {
      tabs.push({ id: 'profiles', labelKey: 'comp.tabProfiles' });
    }
    return tabs;
  }, [isSupervisorPlus, isAdminPlus]);

  const tabFromUrl = searchParams.get('tab') as CompTab | null;
  const [activeTab, setActiveTab] = useState<CompTab>(
    tabFromUrl && visibleTabs.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'assessments',
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
    if (tab === 'assessments') {
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
      {activeTab === 'assessments' && <AssessmentsPage />}
      {activeTab === 'matrix' && isSupervisorPlus && <CompetencyMatrixPage />}
      {activeTab === 'profiles' && isAdminPlus && <CompetencyProfilePage />}
    </div>
  );
}
