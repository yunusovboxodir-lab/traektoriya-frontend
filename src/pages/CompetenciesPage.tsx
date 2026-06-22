import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '../stores/langStore';
import { useAuthStore } from '../stores/authStore';
import { PulsePage } from './PulsePage';
import { AssessmentsPage } from './AssessmentsPage';
import { CompetencyMatrixPage } from './CompetencyMatrixPage';
import { CompetencyProfilePage } from './CompetencyProfilePage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CompTab = 'pulse' | 'assessments' | 'matrix' | 'profiles';

// ---------------------------------------------------------------------------
// CompetenciesPage — Пульс + Оценка + Матрица GAP + Профили должностей
// ---------------------------------------------------------------------------

export function CompetenciesPage() {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = useAuthStore((s) => s.user?.role) || 'sales_rep';
  const isAdmin = role === 'superadmin' || role === 'admin';

  const visibleTabs = useMemo(() => {
    const tabs = [
      { id: 'pulse' as CompTab, labelKey: 'comp.tabPulse' },
      { id: 'assessments' as CompTab, labelKey: 'comp.tabAssessments' },
      { id: 'matrix' as CompTab, labelKey: 'comp.tabMatrix' },
    ];
    // Профили должностей — управление, только админ
    if (isAdmin) tabs.push({ id: 'profiles' as CompTab, labelKey: 'comp.tabProfiles' });
    return tabs;
  }, [isAdmin]);

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
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-6 w-fit">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-400 text-[#0a1929] font-semibold shadow-sm'
                  : 'text-white/65 hover:text-white'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'pulse' && <PulsePage />}
      {activeTab === 'assessments' && <AssessmentsPage />}
      {activeTab === 'matrix' && <CompetencyMatrixPage />}
      {activeTab === 'profiles' && isAdmin && <CompetencyProfilePage />}
    </div>
  );
}
