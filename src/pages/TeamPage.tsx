import { useState, useEffect, useCallback } from 'react';
import { teamApi, type TeamMember } from '../api/team';
import { useT, useLangStore } from '../stores/langStore';
import { useAuthStore } from '../stores/authStore';
import { TeamLearningTab } from '../components/team/TeamLearningTab';

const SUPERVISOR_ROLES = ['supervisor', 'admin', 'commercial_dir', 'regional_manager', 'superadmin'];

const ROLE_STYLES: Record<string, { bg: string; text: string; labelKey: string }> = {
  superadmin: { bg: 'bg-purple-50', text: 'text-purple-700', labelKey: 'roles.superadmin' },
  commercial_dir: { bg: 'bg-indigo-50', text: 'text-indigo-700', labelKey: 'roles.commercial_dir' },
  regional_manager: { bg: 'bg-teal-50', text: 'text-teal-700', labelKey: 'roles.regional_manager' },
  admin: { bg: 'bg-blue-50', text: 'text-blue-700', labelKey: 'roles.admin' },
  supervisor: { bg: 'bg-amber-50', text: 'text-amber-700', labelKey: 'roles.supervisor' },
  sales_rep: { bg: 'bg-green-50', text: 'text-green-700', labelKey: 'roles.sales_rep' },
  manager: { bg: 'bg-cyan-50', text: 'text-cyan-700', labelKey: 'roles.manager' },
  user: { bg: 'bg-gray-50', text: 'text-gray-600', labelKey: 'roles.user' },
};

const AVATAR_COLORS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
  'from-cyan-500 to-cyan-600',
  'from-indigo-500 to-indigo-600',
  'from-teal-500 to-teal-600',
];

export function TeamPage() {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const userRole = useAuthStore((s) => s.user?.role || 'sales_rep');
  const showLearningTab = SUPERVISOR_ROLES.includes(userRole);

  const [activeTab, setActiveTab] = useState<'members' | 'learning'>('members');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const relativeTime = useCallback((dateStr: string | null): string => {
    if (!dateStr) return t('team.relativeTime.never');
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return t('team.relativeTime.justNow');
    if (mins < 60) return t('team.relativeTime.minAgo', { n: mins });
    if (hours < 24) return t('team.relativeTime.hourAgo', { n: hours });
    if (days === 1) return t('team.relativeTime.yesterday');
    if (days < 7) return t('team.relativeTime.daysAgo', { n: days });
    if (days < 30) return t('team.relativeTime.weeksAgo', { n: Math.floor(days / 7) });
    return new Date(dateStr).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU');
  }, [t, lang]);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const resp = await teamApi.getMembers();
      const data = resp.data;
      setMembers(Array.isArray(data) ? data : (data as Record<string, unknown>).items as TeamMember[] || []);
      setError('');
    } catch (err: unknown) {
      setError(t('team.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = members.filter(m => {
    const matchSearch = !search ||
      (m.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      m.employee_id.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const activeCount = members.filter(m => m.is_active).length;
  const roles = [...new Set(members.map(m => m.role))];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('team.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('team.subtitle')}</p>
      </div>

      {/* Tabs (only for supervisor+ roles) */}
      {showLearningTab && (
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'members'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('team.tabs.members')}
          </button>
          <button
            onClick={() => setActiveTab('learning')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'learning'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('team.tabs.learning')}
          </button>
        </div>
      )}

      {/* Learning tab content */}
      {activeTab === 'learning' && showLearningTab ? (
        <TeamLearningTab />
      ) : (
      <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('team.stats.total'), value: members.length, icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', color: 'text-gray-700', bg: 'bg-gray-50' },
          { label: t('team.stats.active'), value: activeCount, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: t('team.stats.activity'), value: members.length > 0 ? Math.round((activeCount / members.length) * 100) + '%' : '0%', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: t('team.stats.supervisors'), value: members.filter(m => m.role === 'supervisor' || m.role === 'superadmin' || m.role === 'admin').length, icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path d={s.icon} />
                </svg>
              </div>
              <div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('team.search')}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              roleFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('team.allRoles')}
          </button>
          {roles.map(role => {
            const style = ROLE_STYLES[role] || ROLE_STYLES.user;
            return (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  roleFilter === role ? 'bg-blue-600 text-white' : `${style.bg} ${style.text} hover:opacity-80`
                }`}
              >
                {t(style.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
                <div className="h-3 w-3 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="text-red-600 text-sm flex-1">{error}</p>
            <button onClick={loadMembers} className="text-red-600 hover:text-red-800 text-sm font-medium underline">{t('team.retry')}</button>
          </div>
        </div>
      )}

      {/* Members list */}
      {!isLoading && !error && (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <svg className="mx-auto w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              <p className="text-gray-500 font-medium">{t('team.empty')}</p>
              {search && <p className="text-gray-400 text-sm mt-1">{t('team.emptyHint')}</p>}
            </div>
          ) : (
            filtered.map((m, idx) => {
              const roleStyle = ROLE_STYLES[m.role] || ROLE_STYLES.user;
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const isExpanded = expandedId === m.id;

              return (
                <div key={m.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                      {(m.full_name || m.employee_id).charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 truncate">{m.full_name || m.employee_id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded font-mono">#{m.employee_id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                          {t(roleStyle.labelKey)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        {m.position && <span>{m.position}</span>}
                        {(m.city || m.region) && (
                          <span className="flex items-center gap-0.5">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                            </svg>
                            {m.city || m.region}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status + chevron */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${m.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-400 hidden sm:inline">
                          {m.is_active ? t('team.status.active') : t('team.status.inactive')}
                        </span>
                      </div>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <div className="text-sm font-bold text-gray-700 truncate">{m.email || '\u2014'}</div>
                          <div className="text-xs text-gray-500">Email</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-xl">
                          <div className="text-sm font-bold text-blue-700">{new Date(m.created_at).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU')}</div>
                          <div className="text-xs text-blue-500">{t('team.detail.registration')}</div>
                        </div>
                        <div className="text-center p-3 bg-emerald-50 rounded-xl">
                          <div className="text-sm font-bold text-emerald-700">{relativeTime(m.last_login)}</div>
                          <div className="text-xs text-emerald-500">{t('team.detail.lastLogin')}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {filtered.length > 0 && (
            <p className="text-center text-xs text-gray-400 mt-4 pb-2">
              {t('team.shown', { filtered: filtered.length, total: members.length })}
            </p>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
}
