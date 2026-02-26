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

const LEVEL_LABELS: Record<number, { ru: string; uz: string; color: string }> = {
  0: { ru: 'Нет', uz: 'Yo\'q', color: 'bg-gray-200 text-gray-600' },
  1: { ru: 'Начальный', uz: 'Boshlang\'ich', color: 'bg-red-100 text-red-700' },
  2: { ru: 'Базовый', uz: 'Asosiy', color: 'bg-orange-100 text-orange-700' },
  3: { ru: 'Продвинутый', uz: 'Yuqori', color: 'bg-blue-100 text-blue-700' },
  4: { ru: 'Экспертный', uz: 'Ekspert', color: 'bg-green-100 text-green-700' },
};

const WEIGHT_COLORS: Record<string, string> = {
  critical: 'text-red-600',
  important: 'text-orange-500',
  nice_to_have: 'text-gray-400',
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
  if (required === 0) return <span className="text-gray-400 text-sm">-</span>;
  const pct = Math.max(0, Math.min(100, ((required - gap) / required) * 100));
  const barColor =
    gap === 0 ? 'bg-green-500' : gap === 1 ? 'bg-yellow-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{Math.round(pct)}%</span>
    </div>
  );
}

function LevelDots({ level, max = 4 }: { level: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${
            i < level ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

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
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-4 bg-gray-200 rounded w-48" />
          <div className="space-y-3 mt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 text-sm text-red-600 underline"
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
        <h1 className="text-2xl font-bold text-gray-800">
          {t('Матрица компетенций', 'Kompetensiyalar matritsasi')}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              mode === 'personal'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('Мои компетенции', 'Mening kompetensiyalarim')}
          </button>
          <button
            onClick={() => setMode('team')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              mode === 'team'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
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
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-xs text-gray-400 uppercase">
                {t('Профиль', 'Profil')}
              </p>
              <p className="text-lg font-semibold text-gray-800 mt-1">
                {userMatrix.position_title}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-xs text-gray-400 uppercase">
                {t('Всего компетенций', 'Jami kompetensiyalar')}
              </p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {userMatrix.total_competencies}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-xs text-gray-400 uppercase">
                {t('Пробелов (GAP)', 'Kamchiliklar (GAP)')}
              </p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {userMatrix.gaps_count}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-xs text-gray-400 uppercase">
                {t('Средний GAP', "O'rtacha GAP")}
              </p>
              <p className="text-2xl font-bold text-orange-500 mt-1">
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
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">
                    {t('Компетенция', 'Kompetensiya')}
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">
                    {t('Категория', 'Kategoriya')}
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">
                    {t('Норма', 'Norma')}
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">
                    {t('Факт', 'Fakt')}
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">
                    GAP
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    {t('Прогресс', 'Progress')}
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">
                    {t('Вес', "Og'irlik")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
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
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
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
            <p className="text-sm text-gray-500">
              {t('Профиль:', 'Profil:')} <strong>{teamMatrix.profile_title}</strong>
              {' · '}
              {teamMatrix.members_count} {t('сотрудников', 'xodim')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">
                    {t('Сотрудник', 'Xodim')}
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">
                    {t('Всего', 'Jami')}
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">
                    {t('Пробелы', 'Kamchilik')}
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">
                    {t('Ср. GAP', "O'rt. GAP")}
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {teamMatrix.members.map((m) => (
                  <tr
                    key={m.user_id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      setSelectedMember(
                        selectedMember === m.user_id ? null : m.user_id,
                      )
                    }
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {m.full_name || m.employee_id}
                      </p>
                      <p className="text-xs text-gray-400">{m.employee_id}</p>
                    </td>
                    <td className="px-4 py-3 text-center">{m.total_competencies}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.gaps_count === 0
                            ? 'bg-green-100 text-green-700'
                            : m.gaps_count <= 3
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {m.gaps_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{m.avg_gap}</td>
                    <td className="px-4 py-3 text-right">
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform inline-block ${
                          selectedMember === m.user_id ? 'rotate-180' : ''
                        }`}
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
              <div className="mt-4 bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-semibold text-gray-800 mb-3">
                  {member.full_name || member.employee_id} — {t('Детальный GAP', 'Batafsil GAP')}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-3 py-2 font-medium text-gray-500">
                          {t('Компетенция', 'Kompetensiya')}
                        </th>
                        <th className="px-3 py-2 font-medium text-gray-500 text-center">
                          {t('Норма', 'Norma')}
                        </th>
                        <th className="px-3 py-2 font-medium text-gray-500 text-center">
                          {t('Факт', 'Fakt')}
                        </th>
                        <th className="px-3 py-2 font-medium text-gray-500 text-center">
                          GAP
                        </th>
                        <th className="px-3 py-2 font-medium text-gray-500">
                          {t('Прогресс', 'Progress')}
                        </th>
                        {isSupervisor && (
                          <th className="px-3 py-2 font-medium text-gray-500" />
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {t('Оценка компетенции', 'Kompetensiyani baholash')}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{assessModal.competencyName}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  {t('Уровень', 'Daraja')}
                </label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setAssessLevel(lvl)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                        assessLevel === lvl
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {lvl} — {LEVEL_LABELS[lvl]?.[lang] || ''}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {t('Комментарий', 'Izoh')}
                </label>
                <textarea
                  value={assessNotes}
                  onChange={(e) => setAssessNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                {t('Отмена', 'Bekor')}
              </button>
              <button
                onClick={handleAssess}
                disabled={assessing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
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
    <tr className={`hover:bg-gray-50 ${g.gap > 0 ? '' : 'opacity-70'}`}>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-800">{g.competency_name}</p>
        {!compact && (
          <p className="text-xs text-gray-400 mt-0.5">
            {g.ksa_type} · {g.bloom_level}
          </p>
        )}
      </td>
      {!compact && (
        <td className="px-4 py-3 text-center">
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
            {CATEGORY_LABELS[g.category]?.[lang] || g.category}
          </span>
        </td>
      )}
      <td className="px-4 py-3 text-center">
        <LevelDots level={g.required_level} />
        <span className="text-xs text-gray-400 block mt-0.5">
          {LEVEL_LABELS[g.required_level]?.[lang]}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <LevelDots level={g.current_level} />
        <span className="text-xs text-gray-400 block mt-0.5">
          {LEVEL_LABELS[g.current_level]?.[lang]}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
            g.gap === 0
              ? 'bg-green-100 text-green-700'
              : g.gap === 1
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
          }`}
        >
          {g.gap > 0 ? `-${g.gap}` : '0'}
        </span>
      </td>
      <td className="px-4 py-3">
        <GapBar gap={g.gap} required={g.required_level} />
      </td>
      {!compact && (
        <td className="px-4 py-3 text-center">
          <span className={`text-xs font-medium ${WEIGHT_COLORS[g.weight] || ''}`}>
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
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {lang === 'ru' ? 'Оценить' : 'Baholash'}
          </button>
        </td>
      )}
    </tr>
  );
}

export default CompetencyMatrixPage;
