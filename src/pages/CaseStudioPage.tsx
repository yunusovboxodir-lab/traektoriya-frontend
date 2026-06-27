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
import React, { useEffect, useMemo, useState } from 'react';
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
import { SkeletonLine, SkeletonCard } from '@/components/ui';

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

// STATUS_BADGE: published/archived используем токены через инлайн-стиль;
// draft — нейтральный бейдж через токены ниже
const STATUS_BADGE_STYLE: Record<string, React.CSSProperties> = {
  draft:      { background: 'var(--bg-overlay)',   color: 'var(--text-muted)',    borderColor: 'var(--border)' },
  published:  { background: 'var(--success-bg)',   color: 'var(--success)',       borderColor: 'var(--success)' },
  archived:   { background: 'var(--warning-bg)',   color: 'var(--warning)',       borderColor: 'var(--warning)' },
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
            className="text-3xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {lang === 'uz' ? 'Keyslar bazasi' : 'Кейсотека'}
          </div>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
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
            className="px-4 py-2 rounded-lg"
            style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
          >
            Мой XP
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-6" style={{ borderBottom: '1px solid var(--border)' }}>
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
            className="pb-3 -mb-px text-sm font-medium border-b-2 transition-colors"
            style={
              tab === t.key
                ? { borderColor: 'var(--color-rm)', color: 'var(--text-primary)' }
                : { borderColor: 'transparent', color: 'var(--text-muted)' }
            }
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
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Роль</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as CaseTargetRole | '')}
            className="rounded px-3 py-1.5 text-sm"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', colorScheme: 'dark light' }}
          >
            <option value="">Все</option>
            <option value="sales_rep">ТП</option>
            <option value="supervisor">СВ</option>
            <option value="regional_manager">РМ</option>
            <option value="commercial_dir">КД</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Категория</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded px-3 py-1.5 text-sm min-w-[200px]"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', colorScheme: 'dark light' }}
          >
            <option value="">Все</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ''}{c.label_ru}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={onlyEtalon}
            onChange={(e) => setOnlyEtalon(e.target.checked)}
            className="rounded"
          />
          Только с эталонами
        </label>
        <div className="ml-auto text-sm" style={{ color: 'var(--text-muted)' }}>
          Найдено: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{scenarios.length}</span>
        </div>
      </div>

      {loading && (
        <div className="grid gap-3 py-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      )}
      {error && <p className="text-red-600 py-4">Ошибка: {error}</p>}

      {!loading && !error && scenarios.length === 0 && (
        <div className="rounded-lg p-6 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
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
              className="text-left rounded-lg p-4 transition-all w-full"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-rm)';
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
              }}
            >
              <div className="flex justify-between items-start gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {cat && (
                      <span
                        className="px-2 py-0.5 text-xs rounded-full border"
                        style={cat.color ? { backgroundColor: `${cat.color}15`, borderColor: `${cat.color}40`, color: cat.color } : { background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                      >
                        {cat.icon ? `${cat.icon} ` : ''}{cat.label_ru}
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-xs rounded-full border" style={{ background: 'var(--info-bg)', color: 'var(--info)', borderColor: 'var(--info)' }}>
                      {ROLE_LABELS[s.target_role] || s.target_role}
                    </span>
                    {s.has_author_solution && (
                      <span className="px-2 py-0.5 text-xs rounded-full border" style={{ background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success)' }}>
                        + решение
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-xs rounded-full border" style={STATUS_BADGE_STYLE[s.status]}>
                      {STATUS_LABELS[s.status]}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{pickLang(s, lang, 'title')}</h3>
                  <p className="text-sm line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                    {pickLang(s, lang, 'situation')}
                  </p>
                </div>
              </div>
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
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

  if (loading) {
    return (
      <div className="grid gap-3 py-4">
        <SkeletonLine width="3/4" />
        <SkeletonLine width="1/2" />
        <SkeletonLine width="2/3" />
      </div>
    );
  }

  return (
    <div>
      {my && (
        <div className="rounded-lg p-4 mb-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Мои показатели</h3>
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
        <thead className="text-xs uppercase" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
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
            <tr key={r.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td className="py-2" style={{ color: 'var(--text-muted)' }}>
                {i === 0 && <span style={{ color: '#C8A84B' }}>1</span>}
                {i === 1 && <span style={{ color: '#9CA3AF' }}>2</span>}
                {i === 2 && <span style={{ color: '#A0764A' }}>3</span>}
                {i > 2 && i + 1}
              </td>
              <td className="py-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                {r.full_name || r.employee_id || '—'}
              </td>
              <td className="py-2" style={{ color: 'var(--text-secondary)' }}>
                {ROLE_LABELS[r.role || ''] || r.role || '—'}
              </td>
              <td className="py-2 text-right font-medium" style={{ color: 'var(--text-primary)' }}>{r.total_xp}</td>
              <td className="py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{r.scenarios_count}</td>
              <td className="py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{r.solutions_count}</td>
              <td className="py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{r.top3_count}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="py-4 text-center" style={{ color: 'var(--text-muted)' }}>
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
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-2xl font-medium" style={{ color: highlight ? 'var(--success)' : 'var(--text-primary)' }}>
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

  if (loading) {
    return (
      <div className="grid gap-3 py-4">
        <SkeletonLine width="3/4" />
        <SkeletonLine width="1/2" />
        <SkeletonLine width="2/3" />
      </div>
    );
  }

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
            className={`flex items-center justify-between rounded-lg p-3 ${!c.is_active ? 'opacity-50' : ''}`}
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${c.color && c.is_active ? `${c.color}30` : 'var(--border)'}`,
            }}
          >
            <div className="flex items-start gap-3 flex-1">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={c.color ? { backgroundColor: `${c.color}15` } : { backgroundColor: 'var(--bg-overlay)' }}
              >
                {c.icon || (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{c.label_ru}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.code}</span>
                  {!c.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full border" style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                      отключена
                    </span>
                  )}
                </div>
                {c.description && (
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{c.description}</p>
                )}
                {c.applicable_roles && c.applicable_roles.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {c.applicable_roles.map((r) => (
                      <span
                        key={r}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}
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
                className="text-sm px-3"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
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
