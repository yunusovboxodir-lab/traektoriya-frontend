import type React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useLangStore } from '../stores/langStore';
import {
  competencyMatrixApi,
  type UserMatrix,
  type TeamMatrixResponse,
  type CompetencyGap,
  type ManualAssessInput,
} from '../api/competencies';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEVEL_LABELS: Record<number, { ru: string; uz: string }> = {
  0: { ru: 'Нет', uz: 'Yo\'q' },
  1: { ru: 'Начальный', uz: 'Boshlang\'ich' },
  2: { ru: 'Базовый', uz: 'Asosiy' },
  3: { ru: 'Продвинутый', uz: 'Yuqori' },
  4: { ru: 'Экспертный', uz: 'Ekspert' },
};

// CSS-var based level badge styles
const LEVEL_STYLE: Record<number, React.CSSProperties> = {
  0: { background: 'var(--bg-elevated)', color: 'var(--text-muted)' },
  1: { background: 'var(--danger-bg)', color: 'var(--danger)' },
  2: { background: 'var(--warning-bg)', color: 'var(--warning)' },
  3: { background: 'var(--info-bg)', color: 'var(--info)' },
  4: { background: 'var(--success-bg)', color: 'var(--success)' },
};

// CSS-var based weight styles
const WEIGHT_STYLE: Record<string, React.CSSProperties> = {
  critical:    { color: 'var(--danger)' },
  important:   { color: 'var(--warning)' },
  nice_to_have: { color: 'var(--text-muted)' },
};

const WEIGHT_LABELS: Record<string, { ru: string; uz: string }> = {
  critical: { ru: 'Критичная', uz: 'Muhim' },
  important: { ru: 'Важная', uz: 'Kerakli' },
  nice_to_have: { ru: 'Желательная', uz: 'Qo\'shimcha' },
};

const CATEGORY_LABELS: Record<string, { ru: string; uz: string }> = {
  professional: { ru: 'Профессиональная', uz: 'Kasbiy' },
  soft_skills: { ru: 'Soft Skills', uz: 'Soft Skills' },
  corporate: { ru: 'Корпоративная', uz: 'Korporativ' },
  digital: { ru: 'Цифровая', uz: 'Raqamli' },
  leadership: { ru: 'Лидерство', uz: 'Yetakchilik' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function GapBar({ gap, required }: { gap: number; required: number }) {
  if (required === 0) return <span className="text-sm" style={{ color: 'var(--text-muted)' }}>-</span>;
  const pct = Math.max(0, Math.min(100, ((required - gap) / required) * 100));
  const barColor =
    gap === 0 ? 'var(--success)' : gap === 1 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span className="text-xs w-8 text-right" style={{ color: 'var(--text-muted)' }}>{Math.round(pct)}%</span>
    </div>
  );
}

function LevelDots({ level, max = 4 }: { level: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full transition-colors"
          style={{ background: i < level ? 'var(--info)' : 'var(--bg-elevated)' }}
        />
      ))}
    </div>
  );
}

// Shared input style for this page
const inputStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: 8,
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  outline: 'none',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CompetencyMatrixPage() {
  const user = useAuthStore((s) => s.user);
  const { lang } = useLangStore();
  const t = (ru: string, uz: string) => (lang === 'ru' ? ru : uz);

  const isSupervisor = ['superadmin', 'admin', 'supervisor', 'commercial_dir', 'regional_manager'].includes(
    user?.role || '',
  );

  // State
  const [mode, setMode] = useState<'personal' | 'team'>('personal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userMatrix, setUserMatrix] = useState<UserMatrix | null>(null);
  const [teamMatrix, setTeamMatrix] = useState<TeamMatrixResponse | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Manual assess modal
  const [assessModal, setAssessModal] = useState<{
    userId: string;
    competencyId: string;
    competencyName: string;
    currentLevel: number;
  } | null>(null);
  const [assessLevel, setAssessLevel] = useState(0);
  const [assessNotes, setAssessNotes] = useState('');
  const [assessing, setAssessing] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, [mode]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'personal') {
        const res = await competencyMatrixApi.getUserMatrix(user?.id || '');
        setUserMatrix(res.data);
      } else if (isSupervisor && user?.team_id) {
        const res = await competencyMatrixApi.getTeamMatrix(user.team_id);
        setTeamMatrix(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Categories from data
  const allCategories = useMemo(() => {
    const gaps = mode === 'personal'
      ? userMatrix?.gaps || []
      : teamMatrix?.members.flatMap((m) => m.gaps) || [];
    return ['all', ...new Set(gaps.map((g) => g.category))];
  }, [mode, userMatrix, teamMatrix]);

  // Filtered personal gaps
  const filteredGaps = useMemo(() => {
    if (!userMatrix) return [];
    let gaps = userMatrix.gaps;
    if (categoryFilter !== 'all') {
      gaps = gaps.filter((g) => g.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      gaps = gaps.filter((g) => g.competency_name.toLowerCase().includes(q));
    }
    return gaps;
  }, [userMatrix, categoryFilter, search]);

  // Manual assess handler
  const handleAssess = async () => {
    if (!assessModal) return;
    setAssessing(true);
    try {
      const input: ManualAssessInput = {
        user_id: assessModal.userId,
        competency_id: assessModal.competencyId,
        level: assessLevel,
        notes: assessNotes || undefined,
      };
      await competencyMatrixApi.manualAssess(input);
      setAssessModal(null);
      setAssessNotes('');
      loadData();
    } catch {
      // silent
    } finally {
      setAssessing(false);
    }
  };

  // ----- Render -----

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 rounded w-64" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-4 rounded w-48" style={{ background: 'var(--bg-elevated)' }} />
          <div className="space-y-3 mt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 rounded" style={{ background: 'var(--bg-elevated)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg p-4" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)' }}>
          <p style={{ color: 'var(--danger)' }}>{error}</p>
          <button
            onClick={loadData}
            className="mt-2 text-sm underline"
            style={{ color: 'var(--danger)' }}
          >
            {t('Повторить', 'Qayta urinish')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {t('Матрица компетенций', 'Kompetensiyalar matritsasi')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {t(
            'GAP-анализ: сравнение требуемого и текущего уровня компетенций',
            'GAP-tahlil: talab qilingan va joriy kompetensiya darajasi taqqoslash',
          )}
        </p>
      </div>

      {/* Tabs: Personal / Team */}
      {isSupervisor && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('personal')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition"
            style={mode === 'personal'
              ? { background: 'var(--info)', color: 'var(--text-inverse)' }
              : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
            }
          >
            {t('Мои компетенции', 'Mening kompetensiyalarim')}
          </button>
          <button
            onClick={() => setMode('team')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition"
            style={mode === 'team'
              ? { background: 'var(--info)', color: 'var(--text-inverse)' }
              : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
            }
          >
            {t('Команда', 'Jamoa')}
          </button>
        </div>
      )}

      {/* ========== PERSONAL VIEW ========== */}
      {mode === 'personal' && userMatrix && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl shadow-sm p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>
                {t('Профиль', 'Profil')}
              </p>
              <p className="text-lg font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
                {userMatrix.position_title}
              </p>
            </div>
            <div className="rounded-xl shadow-sm p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>
                {t('Всего компетенций', 'Jami kompetensiyalar')}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                {userMatrix.total_competencies}
              </p>
            </div>
            <div className="rounded-xl shadow-sm p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>
                {t('Пробелов (GAP)', 'Kamchiliklar (GAP)')}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--danger)' }}>
                {userMatrix.gaps_count}
              </p>
            </div>
            <div className="rounded-xl shadow-sm p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>
                {t('Средний GAP', "O'rtacha GAP")}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--warning)' }}>
                {userMatrix.avg_gap}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              placeholder={t('Поиск компетенции...', "Kompetensiya qidirish...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
              style={inputStyle}
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={inputStyle}
            >
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all'
                    ? t('Все категории', 'Barcha kategoriyalar')
                    : CATEGORY_LABELS[c]?.[lang] || c}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="rounded-xl shadow-sm overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  <th className="px-4 py-3 font-medium text-left" style={{ color: 'var(--text-muted)' }}>
                    {t('Компетенция', 'Kompetensiya')}
                  </th>
                  <th className="px-4 py-3 font-medium text-center" style={{ color: 'var(--text-muted)' }}>
                    {t('Категория', 'Kategoriya')}
                  </th>
                  <th className="px-4 py-3 font-medium text-center" style={{ color: 'var(--text-muted)' }}>
                    {t('Норма', 'Norma')}
                  </th>
                  <th className="px-4 py-3 font-medium text-center" style={{ color: 'var(--text-muted)' }}>
                    {t('Факт', 'Fakt')}
                  </th>
                  <th className="px-4 py-3 font-medium text-center" style={{ color: 'var(--text-muted)' }}>
                    GAP
                  </th>
                  <th className="px-4 py-3 font-medium text-left" style={{ color: 'var(--text-muted)' }}>
                    {t('Прогресс', 'Progress')}
                  </th>
                  <th className="px-4 py-3 font-medium text-center" style={{ color: 'var(--text-muted)' }}>
                    {t('Вес', "Og'irlik")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredGaps.map((g) => (
                  <GapRow
                    key={g.competency_id}
                    gap={g}
                    lang={lang}
                    onAssess={
                      isSupervisor
                        ? () => {
                            setAssessModal({
                              userId: userMatrix.user_id,
                              competencyId: g.competency_id,
                              competencyName: g.competency_name,
                              currentLevel: g.current_level,
                            });
                            setAssessLevel(g.current_level);
                          }
                        : undefined
                    }
                  />
                ))}
                {filteredGaps.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                      {t('Нет данных', "Ma'lumot yo'q")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ========== TEAM VIEW ========== */}
      {mode === 'team' && teamMatrix && (
        <>
          <div className="mb-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('Профиль:', 'Profil:')} <strong style={{ color: 'var(--text-primary)' }}>{teamMatrix.profile_title}</strong>
              {' · '}
              {teamMatrix.members_count} {t('сотрудников', 'xodim')}
            </p>
          </div>

          <div className="rounded-xl shadow-sm overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  <th className="px-4 py-3 font-medium text-left" style={{ color: 'var(--text-muted)' }}>
                    {t('Сотрудник', 'Xodim')}
                  </th>
                  <th className="px-4 py-3 font-medium text-center" style={{ color: 'var(--text-muted)' }}>
                    {t('Всего', 'Jami')}
                  </th>
                  <th className="px-4 py-3 font-medium text-center" style={{ color: 'var(--text-muted)' }}>
                    {t('Пробелы', 'Kamchilik')}
                  </th>
                  <th className="px-4 py-3 font-medium text-center" style={{ color: 'var(--text-muted)' }}>
                    {t('Ср. GAP', "O'rt. GAP")}
                  </th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {teamMatrix.members.map((m) => (
                  <tr
                    key={m.user_id}
                    className="cursor-pointer transition-colors"
                    style={{ borderTop: '1px solid var(--border)' }}
                    onClick={() =>
                      setSelectedMember(
                        selectedMember === m.user_id ? null : m.user_id,
                      )
                    }
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {m.full_name || m.employee_id}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.employee_id}</p>
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: 'var(--text-secondary)' }}>{m.total_competencies}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={
                          m.gaps_count === 0
                            ? { background: 'var(--success-bg)', color: 'var(--success)' }
                            : m.gaps_count <= 3
                              ? { background: 'var(--warning-bg)', color: 'var(--warning)' }
                              : { background: 'var(--danger-bg)', color: 'var(--danger)' }
                        }
                      >
                        {m.gaps_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: 'var(--text-secondary)' }}>{m.avg_gap}</td>
                    <td className="px-4 py-3 text-right">
                      <svg
                        className={`w-4 h-4 transition-transform inline-block ${
                          selectedMember === m.user_id ? 'rotate-180' : ''
                        }`}
                        style={{ color: 'var(--text-muted)' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded member detail */}
          {selectedMember && (() => {
            const member = teamMatrix.members.find((m) => m.user_id === selectedMember);
            if (!member) return null;
            return (
              <div className="mt-4 rounded-xl shadow-sm p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  {member.full_name || member.employee_id} — {t('Детальный GAP', 'Batafsil GAP')}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--bg-elevated)' }}>
                        <th className="px-3 py-2 font-medium text-left" style={{ color: 'var(--text-muted)' }}>
                          {t('Компетенция', 'Kompetensiya')}
                        </th>
                        <th className="px-3 py-2 font-medium text-center" style={{ color: 'var(--text-muted)' }}>
                          {t('Норма', 'Norma')}
                        </th>
                        <th className="px-3 py-2 font-medium text-center" style={{ color: 'var(--text-muted)' }}>
                          {t('Факт', 'Fakt')}
                        </th>
                        <th className="px-3 py-2 font-medium text-center" style={{ color: 'var(--text-muted)' }}>
                          GAP
                        </th>
                        <th className="px-3 py-2 font-medium text-left" style={{ color: 'var(--text-muted)' }}>
                          {t('Прогресс', 'Progress')}
                        </th>
                        {isSupervisor && (
                          <th className="px-3 py-2 font-medium" />
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {member.gaps.map((g) => (
                        <GapRow
                          key={g.competency_id}
                          gap={g}
                          lang={lang}
                          compact
                          onAssess={
                            isSupervisor
                              ? () => {
                                  setAssessModal({
                                    userId: member.user_id,
                                    competencyId: g.competency_id,
                                    competencyName: g.competency_name,
                                    currentLevel: g.current_level,
                                  });
                                  setAssessLevel(g.current_level);
                                }
                              : undefined
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* ========== MANUAL ASSESS MODAL ========== */}
      {assessModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl shadow-xl w-full max-w-md p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {t('Оценка компетенции', 'Kompetensiyani baholash')}
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{assessModal.competencyName}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {t('Уровень', 'Daraja')}
                </label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setAssessLevel(lvl)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium transition"
                      style={assessLevel === lvl
                        ? { background: 'var(--info)', color: 'var(--text-inverse)' }
                        : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
                      }
                    >
                      {lvl} — {LEVEL_LABELS[lvl]?.[lang] || ''}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {t('Комментарий', 'Izoh')}
                </label>
                <textarea
                  value={assessNotes}
                  onChange={(e) => setAssessNotes(e.target.value)}
                  rows={3}
                  className="w-full focus:outline-none"
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder={t('Необязательно', 'Ixtiyoriy')}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setAssessModal(null);
                  setAssessNotes('');
                }}
                className="flex-1 px-4 py-2 rounded-lg text-sm"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}
              >
                {t('Отмена', 'Bekor')}
              </button>
              <button
                onClick={handleAssess}
                disabled={assessing}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: 'var(--info)', color: 'var(--text-inverse)' }}
              >
                {assessing
                  ? t('Сохранение...', 'Saqlanmoqda...')
                  : t('Сохранить', 'Saqlash')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GapRow sub-component
// ---------------------------------------------------------------------------

function GapRow({
  gap: g,
  lang,
  compact,
  onAssess,
}: {
  gap: CompetencyGap;
  lang: 'ru' | 'uz';
  compact?: boolean;
  onAssess?: () => void;
}) {
  return (
    <tr
      className="transition-colors"
      style={{
        borderTop: '1px solid var(--border)',
        opacity: g.gap > 0 ? 1 : 0.7,
      }}
    >
      <td className="px-4 py-3">
        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{g.competency_name}</p>
        {!compact && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {g.ksa_type} · {g.bloom_level}
          </p>
        )}
      </td>
      {!compact && (
        <td className="px-4 py-3 text-center">
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
            {CATEGORY_LABELS[g.category]?.[lang] || g.category}
          </span>
        </td>
      )}
      <td className="px-4 py-3 text-center">
        <LevelDots level={g.required_level} />
        <span className="text-xs block mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {LEVEL_LABELS[g.required_level]?.[lang]}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <LevelDots level={g.current_level} />
        <span className="text-xs block mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {LEVEL_LABELS[g.current_level]?.[lang]}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
          style={
            g.gap === 0
              ? LEVEL_STYLE[4]
              : g.gap === 1
                ? LEVEL_STYLE[2]
                : LEVEL_STYLE[1]
          }
        >
          {g.gap > 0 ? `-${g.gap}` : '0'}
        </span>
      </td>
      <td className="px-4 py-3">
        <GapBar gap={g.gap} required={g.required_level} />
      </td>
      {!compact && (
        <td className="px-4 py-3 text-center">
          <span className="text-xs font-medium" style={WEIGHT_STYLE[g.weight] || { color: 'var(--text-muted)' }}>
            {WEIGHT_LABELS[g.weight]?.[lang] || g.weight}
          </span>
        </td>
      )}
      {onAssess && (
        <td className="px-4 py-3 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAssess();
            }}
            className="text-xs"
            style={{ color: 'var(--info)' }}
          >
            {lang === 'ru' ? 'Оценить' : 'Baholash'}
          </button>
        </td>
      )}
    </tr>
  );
}

export default CompetencyMatrixPage;
