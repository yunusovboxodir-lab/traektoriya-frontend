import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '../stores/langStore';
import { DashboardPage } from './DashboardPage';
import { KPIPage } from './KPIPage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HomeTab = 'overview' | 'kpi';

const TAB_OPTIONS: { id: HomeTab; labelKey: string }[] = [
  { id: 'overview', labelKey: 'home.tabOverview' },
  { id: 'kpi', labelKey: 'home.tabKpi' },
];

// ---------------------------------------------------------------------------
// HomePage — combines Dashboard + KPI/Rating
// ---------------------------------------------------------------------------

export function HomePage() {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromUrl = searchParams.get('tab') as HomeTab | null;
  const [activeTab, setActiveTab] = useState<HomeTab>(
    tabFromUrl && TAB_OPTIONS.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'overview',
  );

  // Sync URL → state on mount / URL change
  useEffect(() => {
    const urlTab = searchParams.get('tab') as HomeTab | null;
    if (urlTab && TAB_OPTIONS.some((t) => t.id === urlTab)) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: HomeTab) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-6 w-fit">
        {TAB_OPTIONS.map((tab) => (
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

      {/* Tab content */}
      {activeTab === 'overview' && <DashboardPage />}
      {activeTab === 'kpi' && <KPIPage />}
    </div>
  );
}
