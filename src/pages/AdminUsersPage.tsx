import { useState, useEffect, useCallback } from 'react';
import { usersApi, type UserListItem, type CreateUserPayload } from '../api/users';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLES = [
  { value: 'sales_rep', label: 'Торговый представитель' },
  { value: 'supervisor', label: 'Супервайзер' },
  { value: 'admin', label: 'Администратор' },
  { value: 'regional_manager', label: 'Региональный менеджер' },
  { value: 'commercial_dir', label: 'Коммерческий директор' },
  { value: 'superadmin', label: 'Суперадмин' },
] as const;

const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLES.map((r) => [r.value, r.label])
);

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-purple-100 text-purple-800',
  commercial_dir: 'bg-blue-100 text-blue-800',
  regional_manager: 'bg-teal-100 text-teal-800',
  admin: 'bg-green-100 text-green-800',
  supervisor: 'bg-orange-100 text-orange-800',
  sales_rep: 'bg-gray-100 text-gray-700',
};

// ---------------------------------------------------------------------------
// Add User Modal
// ---------------------------------------------------------------------------

interface AddUserModalProps {
  onClose: () => void;
  onCreated: (user: UserListItem) => void;
}

function AddUserModal({ onClose, onCreated }: AddUserModalProps) {
  const [form, setForm] = useState<CreateUserPayload>({
    employee_id: '',
    password: '',
    full_name: '',
    email: '',
    role: 'sales_rep',
    position: '',
    department: '',
    region: '',
    city: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.employee_id.trim()) {
      setError('Табельный номер обязателен');
      return;
    }
    if (form.password.length < 8) {
      setError('Пароль — минимум 8 символов');
      return;
    }
    setSaving(true);
    try {
      // Clean up empty optional strings
      const payload: CreateUserPayload = {
        employee_id: form.employee_id.trim(),
        password: form.password,
        role: form.role,
        ...(form.full_name?.trim() && { full_name: form.full_name.trim() }),
        ...(form.email?.trim() && { email: form.email.trim() }),
        ...(form.position?.trim() && { position: form.position.trim() }),
        ...(form.department?.trim() && { department: form.department.trim() }),
        ...(form.region?.trim() && { region: form.region.trim() }),
        ...(form.city?.trim() && { city: form.city.trim() }),
      };
      const res = await usersApi.create(payload);
      onCreated(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Ошибка при создании пользователя';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Добавить сотрудника</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Row: employee_id + password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Табельный номер <span className="text-red-500">*</span>
              </label>
              <input
                name="employee_id"
                value={form.employee_id}
                onChange={handleChange}
                placeholder="EMP001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пароль <span className="text-red-500">*</span>
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Мин. 8 символов"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Иванов Иван Иванович"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ivan@company.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Position + Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Должность</label>
              <input
                name="position"
                value={form.position}
                onChange={handleChange}
                placeholder="Торговый пред."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Отдел</label>
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="Продажи"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Region + City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Регион</label>
              <input
                name="region"
                value={form.region}
                onChange={handleChange}
                placeholder="Ташкент"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Ташкент"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({ limit: 200 });
      setUsers(res.data.items);
    } catch {
      // silently fail, list stays empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreated = (user: UserListItem) => {
    setUsers((prev) => [user, ...prev]);
    setShowModal(false);
    setSuccessMsg(`Сотрудник ${user.full_name || user.employee_id} добавлен. Онбординг запущен.`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // Client-side filter
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.employee_id.toLowerCase().includes(q) ||
      (u.full_name?.toLowerCase() ?? '').includes(q) ||
      (u.email?.toLowerCase() ?? '').includes(q) ||
      (u.position?.toLowerCase() ?? '').includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Сотрудники</h1>
          <p className="text-sm text-gray-500 mt-0.5">Управление аккаунтами и онбординг</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Добавить сотрудника
        </button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, ID, должности..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Все роли</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <span className="text-sm text-gray-400 self-center">{filtered.length} чел.</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <svg viewBox="0 0 24 24" className="w-10 h-10 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="text-sm">Сотрудники не найдены</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Сотрудник</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Роль</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Должность</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Регион</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Последний вход</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name || ''}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                            {(user.full_name || user.employee_id).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {user.full_name || user.employee_id}
                          </p>
                          <p className="text-xs text-gray-400">{user.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {user.position || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {user.region || user.city || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString('ru-RU')
                        : 'Не входил'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          user.is_active ? 'text-green-700' : 'text-gray-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.is_active ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                        {user.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <AddUserModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
