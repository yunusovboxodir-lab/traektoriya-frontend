import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useLangStore } from '../stores/langStore';
import {
  competencyProfilesApi,
  type PositionProfile,
  type PositionProfileDetail,
} from '../api/competencies';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, { label: Record<string, string>; cls: string }> = {
  draft: { label: { ru: 'Черновик', uz: 'Qoralama' }, cls: 'bg-gray-100 text-gray-600' },
  review: { label: { ru: 'На проверке', uz: "Ko'rib chiqilmoqda" }, cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: { ru: 'Утверждён', uz: 'Tasdiqlangan' }, cls: 'bg-green-100 text-green-700' },
  archived: { label: { ru: 'Архив', uz: 'Arxiv' }, cls: 'bg-red-100 text-red-600' },
};

const ROLE_LABELS: Record<string, { ru: string; uz: string }> = {
  sales_rep: { ru: 'Торговый представитель', uz: 'Savdo vakili' },
  supervisor: { ru: 'Супервайзер', uz: 'Supervayzer' },
  admin: { ru: 'Администратор', uz: 'Administrator' },
  regional_manager: { ru: 'Региональный менеджер', uz: 'Hududiy menejer' },
  commercial_dir: { ru: 'Коммерческий директор', uz: 'Tijorat direktori' },
};

const LEVEL_LABELS: Record<number, { ru: string; uz: string }> = {
  0: { ru: 'Нет', uz: "Yo'q" },
  1: { ru: 'Начальный', uz: "Boshlang'ich" },
  2: { ru: 'Базовый', uz: 'Asosiy' },
  3: { ru: 'Продвинутый', uz: 'Yuqori' },
  4: { ru: 'Экспертный', uz: 'Ekspert' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CompetencyProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { lang } = useLangStore();
  const t = (ru: string, uz: string) => (lang === 'ru' ? ru : uz);

  const isAdmin = ['superadmin', 'admin', 'commercial_dir'].includes(user?.role || '');

  // List state
  const [profiles, setProfiles] = useState<PositionProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail state
  const [selectedProfile, setSelectedProfile] = useState<PositionProfileDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<'document' | 'manual'>('document');
  const [docId, setDocId] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // Load profiles
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await competencyProfilesApi.getProfiles();
      setProfiles(res.data.items || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await competencyProfilesApi.getProfile(id);
      setSelectedProfile(res.data);
    } catch {
      // silent
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      if (createMode === 'document') {
        await competencyProfilesApi.createFromDocument(docId, targetRole || undefined);
      } else {
        await competencyProfilesApi.createManual({
          title: manualTitle,
          target_role: targetRole || undefined,
          competencies: [],
        });
      }
      setShowCreate(false);
      setDocId('');
      setTargetRole('');
      setManualTitle('');
      loadProfiles();
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (profileId: string, newStatus: string) => {
    try {
      await competencyProfilesApi.updateProfile(profileId, { status: newStatus });
      loadProfiles();
      if (selectedProfile?.id === profileId) {
        openDetail(profileId);
      }
    } catch {
      // silent
    }
  };

  const handleDelete = async (profileId: string) => {
    try {
      await competencyProfilesApi.deleteProfile(profileId);
      if (selectedProfile?.id === profileId) {
        setSelectedProfile(null);
      }
      loadProfiles();
    } catch {
      // silent
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
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {t('Профили должностей', 'Lavozim profillari')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t(
              'Управление требованиями к компетенциям для каждой роли',
              "Har bir rol uchun kompetensiya talablarini boshqarish",
            )}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('Создать профиль', 'Profil yaratish')}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <button onClick={loadProfiles} className="mt-2 text-sm text-red-600 underline">
            {t('Повторить', 'Qayta urinish')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile list */}
        <div className="lg:col-span-1 space-y-3">
          {profiles.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center text-gray-400">
              {t('Нет профилей', "Profillar yo'q")}
            </div>
          )}
          {profiles.map((p) => {
            const statusDef = STATUS_STYLES[p.status] || STATUS_STYLES.draft;
            const isSelected = selectedProfile?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => openDetail(p.id)}
                className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition hover:shadow-md ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{p.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ROLE_LABELS[p.target_role || '']?.[lang] || p.target_role || '—'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusDef.cls}`}>
                    {statusDef.label[lang]}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span>{p.total_competencies} {t('комп.', 'komp.')}</span>
                  {p.department && <span>{p.department}</span>}
                  <span>{new Date(p.created_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ')}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Profile detail */}
        <div className="lg:col-span-2">
          {detailLoading && (
            <div className="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-64 mb-4" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          )}

          {!detailLoading && !selectedProfile && (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>{t('Выберите профиль из списка', "Ro'yxatdan profil tanlang")}</p>
            </div>
          )}

          {!detailLoading && selectedProfile && (
            <div className="bg-white rounded-xl shadow-sm border">
              {/* Detail header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{selectedProfile.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {ROLE_LABELS[selectedProfile.target_role || '']?.[lang] || selectedProfile.target_role || ''}
                      {selectedProfile.department && ` · ${selectedProfile.department}`}
                    </p>
                    {selectedProfile.description && (
                      <p className="text-sm text-gray-400 mt-2">{selectedProfile.description}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      {selectedProfile.status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(selectedProfile.id, 'review')}
                          className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                        >
                          {t('На проверку', "Ko'rib chiqish")}
                        </button>
                      )}
                      {selectedProfile.status === 'review' && (
                        <button
                          onClick={() => handleStatusChange(selectedProfile.id, 'approved')}
                          className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        >
                          {t('Утвердить', 'Tasdiqlash')}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(selectedProfile.id)}
                        className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      >
                        {t('Удалить', "O'chirish")}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Competencies table */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-700 mb-3">
                  {t('Требуемые компетенции', 'Talab qilingan kompetensiyalar')} ({selectedProfile.required_competencies?.length || 0})
                </h3>

                {(!selectedProfile.required_competencies || selectedProfile.required_competencies.length === 0) ? (
                  <p className="text-gray-400 text-sm">
                    {t('Компетенции не добавлены', "Kompetensiyalar qo'shilmagan")}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-4 py-2 font-medium text-gray-500">
                            {t('Компетенция', 'Kompetensiya')}
                          </th>
                          <th className="px-4 py-2 font-medium text-gray-500 text-center">
                            {t('Категория', 'Kategoriya')}
                          </th>
                          <th className="px-4 py-2 font-medium text-gray-500 text-center">
                            {t('Треб. уровень', 'Talab. daraja')}
                          </th>
                          <th className="px-4 py-2 font-medium text-gray-500 text-center">
                            {t('Вес', "Og'irlik")}
                          </th>
                          <th className="px-4 py-2 font-medium text-gray-500 text-center">
                            {t('Тип', 'Tur')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedProfile.required_competencies.map((c) => (
                          <tr key={c.competency_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-800">{c.competency_name}</p>
                              {c.bloom_level && (
                                <p className="text-xs text-gray-400 mt-0.5">Bloom: {c.bloom_level}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                {c.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {Array.from({ length: 4 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-2.5 h-2.5 rounded-full ${
                                      i < c.required_level ? 'bg-blue-500' : 'bg-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-400 block mt-0.5">
                                {LEVEL_LABELS[c.required_level]?.[lang] || c.required_level}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs font-medium ${
                                c.weight === 'critical' ? 'text-red-600' :
                                c.weight === 'important' ? 'text-orange-500' : 'text-gray-400'
                              }`}>
                                {c.weight}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs text-gray-500">{c.ksa_type}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== CREATE MODAL ========== */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {t('Создать профиль должности', 'Lavozim profili yaratish')}
            </h3>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCreateMode('document')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  createMode === 'document'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('Из документа (AI)', 'Hujjatdan (AI)')}
              </button>
              <button
                onClick={() => setCreateMode('manual')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  createMode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('Вручную', "Qo'lda")}
              </button>
            </div>

            <div className="space-y-3">
              {createMode === 'document' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {t('ID документа (JD)', 'Hujjat ID (JD)')}
                  </label>
                  <input
                    type="text"
                    value={docId}
                    onChange={(e) => setDocId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="uuid..."
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {t(
                      'AI извлечёт компетенции из описания должности',
                      "AI lavozim tavsifidan kompetensiyalarni ajratib oladi",
                    )}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {t('Название профиля', 'Profil nomi')}
                  </label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('Торговый представитель Junior', 'Junior savdo vakili')}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {t('Целевая роль', 'Maqsadli rol')}
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('Не указана', "Ko'rsatilmagan")}</option>
                  {Object.entries(ROLE_LABELS).map(([key, lbl]) => (
                    <option key={key} value={key}>{lbl[lang]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setDocId('');
                  setManualTitle('');
                  setTargetRole('');
                }}
                className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                {t('Отмена', 'Bekor')}
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || (createMode === 'document' ? !docId : !manualTitle)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {creating
                  ? t('Создание...', 'Yaratilmoqda...')
                  : t('Создать', 'Yaratish')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompetencyProfilePage;
