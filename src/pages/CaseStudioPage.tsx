/**
 * Module 17: Case Studio (Кейсотека) — главная страница.
 *
 * Три вкладки:
 *  - Кейсы: список published-сценариев (по видимости роли) с фильтрами
 *  - Лидерборд: топ авторов кейсов по XP
 *  - Категории: справочник (только admin/superadmin может редактировать)
 *
 * Доступ:
 *  - Все аутентифицированные видят кейсы своего уровня и ниже
 *  - sv/rm/cd/admin могут создавать кейсы
 *  - admin/superadmin управляют категориями
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseStudioApi } from '../api/caseStudio';
import { useAuthStore } from '../stores/authStore';
import { useLangStore } from '../stores/langStore';
import { pickLang } from '../utils/pickLang';
import type {
  CaseCategory,
  CaseScenario,
  CaseTargetRole,
  LeaderboardEntry,
  MyStats,
} from '../types/caseStudio';

type Tab = 'scenarios' | 'leaderboard' | 'categories';

const ROLE_LABELS: Record<string, string> = {
  sales_rep: 'ТП',
  supervisor: 'СВ',
  regional_manager: 'РМ',
  commercial_dir: 'КД',
  admin: 'Админ',
  trainer: 'Тренер',
  superadmin: 'Суперадмин',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  archived: 'В архиве',
};

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-700 border-stone-300',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  archived: 'bg-amber-50 text-amber-700 border-amber-200',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function CaseStudioPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const lang = useLangStore((s) => s.lang);
  const [tab, setTab] = useState<Tab>('scenarios');

  const canCreateScenario =
    user && ['supervisor', 'regional_manager', 'commercial_dir', 'admin', 'superadmin'].includes(user.role);
  const canManageCategories =
    user && ['admin', 'superadmin'].includes(user.role);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div
            role="heading"
            aria-level={1}
            className="text-3xl font-semibold text-yellow-100"
          >
            {lang === 'uz' ? 'Keyslar bazasi' : 'Кейсотека'}
          </div>
          <p className="text-stone-500 mt-1">
            База реальных сценариев + peer-review. Топ-3 решения становятся эталонами.
          </p>
        </div>
        <div className="flex gap-2">
          {canCreateScenario && (
            <button
              onClick={() => navigate('/case-studio/new')}
              className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700"
            >
              Создать кейс
            </button>
          )}
          <button
            onClick={() => navigate('/case-studio/my')}
            className="px-4 py-2 border border-zinc-600 text-zinc-200 rounded-lg hover:bg-zinc-800"
          >
            Мой XP
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-700 mb-6 flex gap-6">
        {(
          [
            { key: 'scenarios' as Tab, label: 'Кейсы' },
            { key: 'leaderboard' as Tab, label: 'Лидерборд' },
            { key: 'categories' as Tab, label: 'Категории' },
          ]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 -mb-px text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-yellow-500 text-yellow-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'scenarios' && <ScenariosTab />}
      {tab === 'leaderboard' && <LeaderboardTab />}
      {tab === 'categories' && <CategoriesTab canManage={!!canManageCategories} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scenarios tab
// ---------------------------------------------------------------------------

function ScenariosTab() {
  const navigate = useNavigate();
  const lang = useLangStore((s) => s.lang);
  const [scenarios, setScenarios] = useState<CaseScenario[]>([]);
  const [categories, setCategories] = useState<CaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<CaseTargetRole | ''>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [onlyEtalon, setOnlyEtalon] = useState(false);

  useEffect(() => {
    caseStudioApi
      .listCategories({ only_active: true })
      .then((res) => setCategories(res.data || []))
      .catch(() => {
        /* noop */
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    caseStudioApi
      .listScenarios({
        target_role: filterRole || undefined,
        category_id: filterCategory || undefined,
        status: 'published',
        only_with_etalon: onlyEtalon,
        limit: 100,
      })
      .then((res) => {
        if (!cancelled) {
          setScenarios(res.data || []);
          setError(null);
        }
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filterRole, filterCategory, onlyEtalon]);

  const categoryById = useMemo(() => {
    const m = new Map<string, CaseCategory>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label className="block text-xs text-stone-500 mb-1">Роль</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as CaseTargetRole | '')}
            className="border border-stone-300 rounded px-3 py-1.5 text-sm"
          >
            <option value="">Все</option>
            <option value="sales_rep">ТП</option>
            <option value="supervisor">СВ</option>
            <option value="regional_manager">РМ</option>
            <option value="commercial_dir">КД</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">Категория</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-stone-300 rounded px-3 py-1.5 text-sm min-w-[200px]"
          >
            <option value="">Все</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ''}{c.label_ru}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={onlyEtalon}
            onChange={(e) => setOnlyEtalon(e.target.checked)}
            className="rounded"
          />
          Только с эталонами
        </label>
        <div className="ml-auto text-sm text-stone-500">
          Найдено: <span className="font-medium text-stone-800">{scenarios.length}</span>
        </div>
      </div>

      {loading && <p className="text-stone-500 py-4">Загрузка…</p>}
      {error && <p className="text-red-600 py-4">Ошибка: {error}</p>}

      {!loading && !error && scenarios.length === 0 && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 text-center">
          <p className="text-stone-600">
            Кейсов пока нет. Будь первым — создай свой эталонный сценарий.
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {scenarios.map((s) => {
          const cat = s.category_id ? categoryById.get(s.category_id) : null;
          return (
            <button
              key={s.id}
              onClick={() => navigate(`/case-studio/${s.id}`)}
              className="text-left bg-zinc-950/60 border border-zinc-800 rounded-lg p-4 hover:border-yellow-600/50 hover:bg-zinc-900/80 transition-all"
            >
              <div className="flex justify-between items-start gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {cat && (
                      <span
                        className="px-2 py-0.5 text-xs rounded-full border bg-stone-50 border-stone-200 text-stone-700"
                        style={cat.color ? { backgroundColor: `${cat.color}15`, borderColor: `${cat.color}40`, color: cat.color } : undefined}
                      >
                        {cat.icon ? `${cat.icon} ` : ''}{cat.label_ru}
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-xs rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                      {ROLE_LABELS[s.target_role] || s.target_role}
                    </span>
                    {s.has_author_solution && (
                      <span className="px-2 py-0.5 text-xs rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        + решение
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${STATUS_BADGE[s.status]}`}>
                      {STATUS_LABELS[s.status]}
                    </span>
                  </div>
                  <h3 className="font-semibold text-zinc-100 mb-1">{pickLang(s, lang, 'title')}</h3>
                  <p className="text-sm text-zinc-400 line-clamp-2">
                    {pickLang(s, lang, 'situation')}
                  </p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-stone-500">
                <span>{formatDate(s.created_at)}</span>
                <span>
                  {s.ratings_count > 0 && <>★ {s.ratings_count}</>}
                  {s.views_count > 0 && <span className="ml-2">{s.views_count} просмотров</span>}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Leaderboard tab
// ---------------------------------------------------------------------------

function LeaderboardTab() {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [my, setMy] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([caseStudioApi.leaderboard(20), caseStudioApi.myStats()])
      .then(([lb, ms]) => {
        setRows(lb.data || []);
        setMy(ms.data);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-stone-500 py-4">Загрузка…</p>;

  return (
    <div>
      {my && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-stone-800 mb-2">Мои показатели</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <Stat label="Всего XP" value={my.total_xp} highlight />
            <Stat label="Кейсов" value={my.scenarios_created} />
            <Stat label="Решений" value={my.solutions_added} />
            <Stat label="Оценок" value={my.ratings_given} />
            <Stat label="В TOP-3" value={my.top3_solutions} />
          </div>
        </div>
      )}

      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-stone-500 border-b border-stone-200">
          <tr>
            <th className="text-left py-2 font-medium">#</th>
            <th className="text-left py-2 font-medium">Имя</th>
            <th className="text-left py-2 font-medium">Роль</th>
            <th className="text-right py-2 font-medium">XP</th>
            <th className="text-right py-2 font-medium">Кейсов</th>
            <th className="text-right py-2 font-medium">Решений</th>
            <th className="text-right py-2 font-medium">TOP-3</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.user_id} className="border-b border-stone-100">
              <td className="py-2 text-stone-500">
                {i === 0 && '🥇'}
                {i === 1 && '🥈'}
                {i === 2 && '🥉'}
                {i > 2 && i + 1}
              </td>
              <td className="py-2 font-medium text-stone-800">
                {r.full_name || r.employee_id || '—'}
              </td>
              <td className="py-2 text-stone-600">
                {ROLE_LABELS[r.role || ''] || r.role || '—'}
              </td>
              <td className="py-2 text-right font-medium text-stone-900">{r.total_xp}</td>
              <td className="py-2 text-right text-stone-600">{r.scenarios_count}</td>
              <td className="py-2 text-right text-stone-600">{r.solutions_count}</td>
              <td className="py-2 text-right text-stone-600">{r.top3_count}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="py-4 text-center text-stone-500">
                Лидерборд пока пуст. Создай первый кейс!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-stone-500">{label}</div>
      <div className={`text-2xl font-medium ${highlight ? 'text-emerald-700' : 'text-stone-800'}`}>
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Categories tab
// ---------------------------------------------------------------------------

function CategoriesTab({ canManage }: { canManage: boolean }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CaseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    caseStudioApi
      .listCategories({ only_active: false })
      .then((res) => setCategories(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-stone-500 py-4">Загрузка…</p>;

  return (
    <div>
      {canManage && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => navigate('/case-studio/categories/new')}
            className="px-3 py-1.5 text-sm bg-stone-800 text-white rounded hover:bg-stone-700"
          >
            Добавить категорию
          </button>
        </div>
      )}

      <div className="grid gap-2">
        {categories.map((c) => (
          <div
            key={c.id}
            className={`flex items-center justify-between bg-white border rounded-lg p-3 ${
              !c.is_active ? 'opacity-50' : 'border-stone-200'
            }`}
            style={c.color && c.is_active ? { borderColor: `${c.color}30` } : undefined}
          >
            <div className="flex items-start gap-3 flex-1">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={c.color ? { backgroundColor: `${c.color}15` } : { backgroundColor: '#f5f5f4' }}
              >
                {c.icon || '📁'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-800">{c.label_ru}</span>
                  <span className="text-xs text-stone-400">{c.code}</span>
                  {!c.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-stone-100 text-stone-500 border-stone-300">
                      отключена
                    </span>
                  )}
                </div>
                {c.description && (
                  <p className="text-sm text-stone-600 mt-0.5">{c.description}</p>
                )}
                {c.applicable_roles && c.applicable_roles.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {c.applicable_roles.map((r) => (
                      <span
                        key={r}
                        className="text-xs px-1.5 py-0.5 rounded bg-stone-100 text-stone-600"
                      >
                        {ROLE_LABELS[r] || r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {canManage && (
              <button
                onClick={() => navigate(`/case-studio/categories/${c.id}/edit`)}
                className="text-sm text-stone-600 hover:text-stone-900 px-3"
              >
                Редактировать
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
