import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '../stores/langStore';
import { useAuthStore } from '../stores/authStore';
import { GenerationPage } from './GenerationPage';
import { KnowledgeBasePage } from './KnowledgeBasePage';
import { ChatPage } from './ChatPage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AITab = 'generation' | 'knowledge' | 'chat';

const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 5,
  commercial_dir: 4,
  regional_manager: 2,
  admin: 3,
  supervisor: 2,
  sales_rep: 1,
};

// ---------------------------------------------------------------------------
// AIStudioPage — combines Generation + KnowledgeBase + Chat
// ---------------------------------------------------------------------------

export function AIStudioPage() {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const userRole = user?.role || 'sales_rep';
  const roleLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const isAdminPlus = roleLevel >= 3;

  // Build visible tabs based on role
  // Generation is admin-only, KnowledgeBase and Chat are available for everyone
  const visibleTabs = useMemo(() => {
    const tabs: { id: AITab; labelKey: string }[] = [];
    if (isAdminPlus) {
      tabs.push({ id: 'generation', labelKey: 'ai.tabGeneration' });
    }
    tabs.push({ id: 'knowledge', labelKey: 'ai.tabKnowledge' });
    tabs.push({ id: 'chat', labelKey: 'ai.tabChat' });
    return tabs;
  }, [isAdminPlus]);

  // Default tab: generation for admins, knowledge for everyone else
  const defaultTab: AITab = isAdminPlus ? 'generation' : 'knowledge';

  const tabFromUrl = searchParams.get('tab') as AITab | null;
  const [activeTab, setActiveTab] = useState<AITab>(
    tabFromUrl && visibleTabs.some((t) => t.id === tabFromUrl) ? tabFromUrl : defaultTab,
  );

  // Sync URL → state
  useEffect(() => {
    const urlTab = searchParams.get('tab') as AITab | null;
    if (urlTab && visibleTabs.some((t) => t.id === urlTab)) {
      setActiveTab(urlTab);
    }
  }, [searchParams, visibleTabs]);

  const handleTabChange = (tab: AITab) => {
    setActiveTab(tab);
    if (tab === defaultTab) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  return (
    <div>
      {/* Tab navigation */}
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

      {/* Tab content */}
      {activeTab === 'generation' && isAdminPlus && <GenerationPage />}
      {activeTab === 'knowledge' && <KnowledgeBasePage />}
      {activeTab === 'chat' && <ChatPage />}
    </div>
  );
}
