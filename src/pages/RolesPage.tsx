import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { roleScopesApi, type PageInfo } from '../api/roleScopes';
import { toast } from '../stores/toastStore';
import { useT } from '../stores/langStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 6,
  commercial_dir: 5,
  regional_manager: 4,
  admin: 3,
  supervisor: 2,
  sales_rep: 1,
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Суперадмин',
  commercial_dir: 'Ком. директор',
  regional_manager: 'Рег. менеджер',
  admin: 'Админ',
  supervisor: 'Супервайзер',
  sales_rep: 'Продавец',
};

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-purple-100 text-purple-800',
  commercial_dir: 'bg-blue-100 text-blue-800',
  regional_manager: 'bg-teal-100 text-teal-800',
  admin: 'bg-green-100 text-green-800',
  supervisor: 'bg-orange-100 text-orange-800',
  sales_rep: 'bg-gray-100 text-gray-800',
};

const ROLES_ORDER = ['superadmin', 'commercial_dir', 'regional_manager', 'admin', 'supervisor', 'sales_rep'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RolesPage() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role || 'sales_rep';
  const isAdmin = (ROLE_HIERARCHY[userRole] ?? 0) >= 3;

  const [scopes, setScopes] = useState<Record<string, string[]>>({});
  const [allPages, setAllPages] = useState<PageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load scopes on mount
  useEffect(() => {
    loadScopes();
  }, []);

  const loadScopes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await roleScopesApi.getAll();
      setScopes(response.data.scopes);
      setAllPages(response.data.all_pages);
      setHasChanges(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t('rolesPage.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleToggle = useCallback((role: string, pageKey: string) => {
    // superadmin is always full access
    if (role === 'superadmin') return;

    setScopes((prev) => {
      const currentPages = prev[role] || [];
      const updated = currentPages.includes(pageKey)
        ? currentPages.filter((p) => p !== pageKey)
        : [...currentPages, pageKey];
      return { ...prev, [role]: updated };
    });
    setHasChanges(true);
  }, []);

  const handleToggleAll = useCallback((role: string, checked: boolean) => {
    if (role === 'superadmin') return;

    setScopes((prev) => ({
      ...prev,
      [role]: checked ? allPages.map((p) => p.key) : [],
    }));
    setHasChanges(true);
  }, [allPages]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Don't send superadmin scopes
      const scopesToSave: Record<string, string[]> = {};
      for (const role of ROLES_ORDER) {
        if (role !== 'superadmin') {
          scopesToSave[role] = scopes[role] || [];
        }
      }
      await roleScopesApi.update(scopesToSave);
      toast.success(t('rolesPage.scopesSaved'));
      setHasChanges(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t('rolesPage.saveError'));
    } finally {
      setSaving(false);
    }
  }, [scopes, t]);

  // Non-admin users get redirected
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('rolesPage.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('rolesPage.subtitle')}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors
            ${hasChanges && !saving
              ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed'
            }`}
        >
          {saving ? t('rolesPage.saving') : t('rolesPage.save')}
        </button>
      </div>

      {/* Scopes Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32 sm:w-48">
                  {t('rolesPage.role')}
                </th>
                {allPages.map((page) => (
                  <th
                    key={page.key}
                    className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                  >
                    {page.label}
                  </th>
                ))}
                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('rolesPage.allAccess')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ROLES_ORDER.map((role) => {
                const rolePages = scopes[role] || [];
                const isSuperadmin = role === 'superadmin';
                const allChecked = allPages.every((p) => rolePages.includes(p.key));

                return (
                  <tr
                    key={role}
                    className={`hover:bg-gray-50 transition-colors ${isSuperadmin ? 'bg-purple-50/30' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-800'}`}>
                        {ROLE_LABELS[role] || role}
                      </span>
                      {isSuperadmin && (
                        <span className="ml-2 text-xs text-gray-400">{t('rolesPage.fullAccess')}</span>
                      )}
                    </td>
                    {allPages.map((page) => {
                      const checked = rolePages.includes(page.key);
                      return (
                        <td key={page.key} className="px-2 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSuperadmin ? true : checked}
                            disabled={isSuperadmin}
                            onChange={() => handleToggle(role, page.key)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          />
                        </td>
                      );
                    })}
                    <td className="px-2 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSuperadmin ? true : allChecked}
                        disabled={isSuperadmin}
                        onChange={(e) => handleToggleAll(role, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          {t('rolesPage.note')}
        </p>
      </div>
    </div>
  );
}
