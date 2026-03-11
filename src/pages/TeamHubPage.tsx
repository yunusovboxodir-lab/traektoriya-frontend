import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '../stores/langStore';
import { useAuthStore } from '../stores/authStore';
import { TeamPage } from './TeamPage';
import { SupervisorDashboardPage } from './SupervisorDashboardPage';
import { AdminUsersPage } from './AdminUsersPage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TeamTab = 'members' | 'management' | 'admin';

const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 5,
  commercial_dir: 4,
  regional_manager: 2,
  admin: 3,
  supervisor: 2,
  sales_rep: 1,
};

// ---------------------------------------------------------------------------
// TeamHubPage — combines Team + Supervisor + AdminUsers
// ---------------------------------------------------------------------------

export function TeamHubPage() {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const userRole = user?.role || 'sales_rep';
  const roleLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const isSupervisorPlus = roleLevel >= 2;
  const isAdminPlus = roleLevel >= 3;

  // Build visible tabs based on role
  const visibleTabs = useMemo(() => {
    const tabs: { id: TeamTab; labelKey: string }[] = [
      { id: 'members', labelKey: 'teamHub.tabMembers' },
    ];
    if (isSupervisorPlus) {
      tabs.push({ id: 'management', labelKey: 'teamHub.tabManagement' });
    }
    if (isAdminPlus) {
      tabs.push({ id: 'admin', labelKey: 'teamHub.tabAdmin' });
    }
    return tabs;
  }, [isSupervisorPlus, isAdminPlus]);

  const tabFromUrl = searchParams.get('tab') as TeamTab | null;
  const [activeTab, setActiveTab] = useState<TeamTab>(
    tabFromUrl && visibleTabs.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'members',
  );

  // Sync URL → state
  useEffect(() => {
    const urlTab = searchParams.get('tab') as TeamTab | null;
    if (urlTab && visibleTabs.some((t) => t.id === urlTab)) {
      setActiveTab(urlTab);
    }
  }, [searchParams, visibleTabs]);

  const handleTabChange = (tab: TeamTab) => {
    setActiveTab(tab);
    if (tab === 'members') {
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
      {activeTab === 'members' && <TeamPage />}
      {activeTab === 'management' && isSupervisorPlus && <SupervisorDashboardPage />}
      {activeTab === 'admin' && isAdminPlus && <AdminUsersPage />}
    </div>
  );
}
