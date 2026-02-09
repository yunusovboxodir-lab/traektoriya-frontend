import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { teamApi, type TeamMember } from '../api/team';

// ===========================================
// УТИЛИТЫ
// ===========================================
function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'никогда';
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн назад`;
  if (days < 30) return `${Math.floor(days / 7)} нед назад`;
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

const roleColors: Record<string, string> = {
  superadmin: 'bg-red-100 text-red-700',
  admin: 'bg-orange-100 text-orange-700',
  manager: 'bg-blue-100 text-blue-700',
  user: 'bg-green-100 text-green-700',
};

const roleLabels: Record<string, string> = {
  superadmin: 'SuperAdmin',
  admin: 'Админ',
  manager: 'Менеджер',
  user: 'Сотрудник',
};

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];

// ===========================================
// СТРАНИЦА УПРАВЛЕНИЯ КОМАНДОЙ
// ===========================================
export function TeamPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const resp = await teamApi.getMembers();
      const data = resp.data;
      setMembers(Array.isArray(data) ? data : (data as any).items || []);
      setError('');
    } catch (err: any) {
      setError('Не удалось загрузить список сотрудников');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Фильтрация
  const filtered = members.filter(m => {
    const matchSearch = !search ||
      (m.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      m.employee_id.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || m.role === roleFilter;
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'active' ? m.is_active : !m.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const activeCount = members.filter(m => m.is_active).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-white/80 hover:text-white transition text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </Link>
            <h1 className="text-xl font-bold">👥 Управление командой</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/80 text-sm hidden sm:inline">{user?.full_name || 'Пользователь'}</span>
            <button onClick={handleLogout} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition">Выйти</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-3xl mb-1">👥</div>
            <div className="text-2xl font-bold text-gray-800">{members.length}</div>
            <div className="text-sm text-gray-500">Всего</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-3xl mb-1">✅</div>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <div className="text-sm text-gray-500">Активных</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-3xl mb-1">📊</div>
            <div className="text-2xl font-bold text-indigo-600">{members.length > 0 ? Math.round((activeCount / members.length) * 100) : 0}%</div>
            <div className="text-sm text-gray-500">Активность</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-3xl mb-1">🏆</div>
            <div className="text-2xl font-bold text-orange-600">{members.filter(m => m.role === 'superadmin' || m.role === 'admin').length}</div>
            <div className="text-sm text-gray-500">Админов</div>
          </div>
        </div>

        {/* Фильтры */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Поиск по имени или ID..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Все роли</option>
              <option value="superadmin">SuperAdmin</option>
              <option value="admin">Админ</option>
              <option value="manager">Менеджер</option>
              <option value="user">Сотрудник</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>
        </div>

        {/* Загрузка */}
        {isLoading && (
          <div className="text-center py-12">
            <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-500">Загрузка команды...</p>
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-6">
            ❌ {error}
            <button onClick={loadMembers} className="ml-4 underline hover:no-underline">Повторить</button>
          </div>
        )}

        {/* Список сотрудников */}
        {!isLoading && !error && (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500">Сотрудники не найдены</p>
              </div>
            ) : (
              filtered.map((m, idx) => (
                <div key={m.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div
                    onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition"
                  >
                    {/* Аватар */}
                    <div className={`w-10 h-10 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {(m.full_name || m.employee_id).charAt(0).toUpperCase()}
                    </div>

                    {/* Инфо */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 truncate">{m.full_name || m.employee_id}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">#{m.employee_id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[m.role] || 'bg-gray-100 text-gray-600'}`}>
                          {roleLabels[m.role] || m.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        {m.position && <span>{m.position}</span>}
                        {m.city && <span>📍 {m.city}</span>}
                        {m.region && !m.city && <span>📍 {m.region}</span>}
                      </div>
                    </div>

                    {/* Статус и время */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${m.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-xs text-gray-400 hidden sm:inline">{relativeTime(m.last_login)}</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === m.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Расширенная информация */}
                  {expandedId === m.id && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-bold text-gray-800">—</div>
                          <div className="text-xs text-gray-500">Курсов</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-bold text-gray-800">—</div>
                          <div className="text-xs text-gray-500">Тестов</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-bold text-gray-800">—</div>
                          <div className="text-xs text-gray-500">Средний балл</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-bold text-gray-800">{m.email || '—'}</div>
                          <div className="text-xs text-gray-500">Email</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-3 text-center">
                        Регистрация: {new Date(m.created_at).toLocaleDateString('ru-RU')} • Последний вход: {relativeTime(m.last_login)}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}

            <p className="text-center text-xs text-gray-400 mt-4">
              Показано {filtered.length} из {members.length} сотрудников
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
