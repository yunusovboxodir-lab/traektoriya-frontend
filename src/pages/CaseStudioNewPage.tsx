/**
 * Module 17: Case Studio — форма создания нового кейса.
 *
 * Поля:
 *  - target_role (sales_rep / supervisor / regional_manager / commercial_dir)
 *  - категория (фильтр по applicable_roles)
 *  - заголовок (title_ru) — обязательно
 *  - ситуация (situation_ru) — обязательно, мин 20 символов
 *  - диалог (массив реплик, можно добавлять/удалять)
 *  - решение от автора (опционально)
 *
 * Доступ: supervisor, regional_manager, commercial_dir, admin, superadmin.
 * Юзер может создавать кейсы только для своей роли или ниже.
 */
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { caseStudioApi } from '../api/caseStudio';
import { useAuthStore } from '../stores/authStore';
import { useT } from '../stores/langStore';
import type {
  CaseCategory,
  CaseTargetRole,
  DialogueLine,
} from '../types/caseStudio';

const ROLE_LEVEL: Record<string, number> = {
  sales_rep: 1,
  supervisor: 2,
  regional_manager: 3,
  commercial_dir: 4,
  admin: 5,
  trainer: 5,
  superadmin: 6,
};

const ROLE_OPTIONS: { value: CaseTargetRole; labelKey: string }[] = [
  { value: 'sales_rep', labelKey: 'pipeline.roles.salesRep' },
  { value: 'supervisor', labelKey: 'pipeline.roles.supervisor' },
  { value: 'regional_manager', labelKey: 'pipeline.roles.regionalManager' },
  { value: 'commercial_dir', labelKey: 'pipeline.roles.commercialDir' },
];

export function CaseStudioNewPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const t = useT();

  const [categories, setCategories] = useState<CaseCategory[]>([]);
  const [targetRole, setTargetRole] = useState<CaseTargetRole>('sales_rep');
  const [categoryId, setCategoryId] = useState<string>('');
  const [titleRu, setTitleRu] = useState('');
  const [situationRu, setSituationRu] = useState('');
  const [dialogue, setDialogue] = useState<DialogueLine[]>([
    { speaker: 'client', text: '' },
    { speaker: 'tp', text: '' },
  ]);
  const [hasSolution, setHasSolution] = useState(false);
  const [solutionText, setSolutionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    caseStudioApi
      .listCategories({ only_active: true })
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]));
  }, []);

  // Доступные роли — свой уровень и ниже (admin/superadmin/trainer/cd могут любую)
  const availableRoles = useMemo(() => {
    if (!user) return ROLE_OPTIONS;
    if (['admin', 'superadmin', 'trainer', 'commercial_dir'].includes(user.role)) {
      return ROLE_OPTIONS;
    }
    const myLevel = ROLE_LEVEL[user.role] || 0;
    return ROLE_OPTIONS.filter((r) => (ROLE_LEVEL[r.value] || 0) <= myLevel);
  }, [user]);

  // Категории, совместимые с выбранной ролью
  const compatibleCategories = useMemo(() => {
    return categories.filter((c) => {
      if (!c.applicable_roles || c.applicable_roles.length === 0) return true;
      return c.applicable_roles.includes(targetRole);
    });
  }, [categories, targetRole]);

  // При смене роли — сбросить категорию если она несовместима
  useEffect(() => {
    if (categoryId && !compatibleCategories.some((c) => c.id === categoryId)) {
      setCategoryId('');
    }
  }, [targetRole, compatibleCategories, categoryId]);

  const updateLine = (idx: number, field: 'speaker' | 'text', value: string) => {
    const next = [...dialogue];
    next[idx] = { ...next[idx], [field]: value };
    setDialogue(next);
  };

  const addLine = () => {
    const lastSpeaker = dialogue[dialogue.length - 1]?.speaker;
    setDialogue([...dialogue, { speaker: lastSpeaker === 'client' ? 'tp' : 'client', text: '' }]);
  };

  const removeLine = (idx: number) => {
    setDialogue(dialogue.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!categoryId) {
      setError(t('caseStudioForms.new.errCategory'));
      return;
    }
    if (titleRu.trim().length < 5) {
      setError(t('caseStudioForms.new.errTitleMin'));
      return;
    }
    if (situationRu.trim().length < 20) {
      setError(t('caseStudioForms.new.errSituationMin'));
      return;
    }
    if (hasSolution && solutionText.trim().length < 20) {
      setError(t('caseStudioForms.new.errSolutionMin'));
      return;
    }
    const filteredDialogue = dialogue.filter((l) => l.text.trim().length > 0);

    setSubmitting(true);
    try {
      const res = await caseStudioApi.createScenario({
        target_role: targetRole,
        category_id: categoryId,
        title_ru: titleRu.trim(),
        situation_ru: situationRu.trim(),
        original_dialogue: filteredDialogue.length > 0 ? filteredDialogue : null,
        has_author_solution: hasSolution,
        author_solution_text: hasSolution ? solutionText.trim() : null,
      });
      // После создания — сразу публикуем (или оставляем draft и переходим)
      await caseStudioApi.publishScenario(res.data.id);
      navigate(`/case-studio/${res.data.id}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err?.response?.data?.detail || err?.message || t('common.error'));
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: 6,
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    width: '100%',
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate('/case-studio')}
        className="text-sm mb-4"
        style={{ color: 'var(--text-muted)' }}
      >
        {t('caseStudioForms.my.backToCases')}
      </button>

      <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{t('caseStudio.createCase')}</h1>
      <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
        {t('caseStudioForms.new.intro')}
      </p>

      <div className="rounded-lg p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Target role */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            {t('caseStudioForms.new.roleLabel')}
          </label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as CaseTargetRole)}
            style={inputStyle}
          >
            {availableRoles.map((r) => (
              <option key={r.value} value={r.value}>
                {t(r.labelKey)}
              </option>
            ))}
          </select>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {t('caseStudioForms.new.roleHint')}
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            {t('caseStudio.filters.category')}
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={inputStyle}
          >
            <option value="">{t('caseStudioForms.new.categoryPlaceholder')}</option>
            {compatibleCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ''}
                {c.label_ru}
              </option>
            ))}
          </select>
          {compatibleCategories.length === 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--warning)' }}>
              {t('caseStudioForms.new.noCompatibleCategories')}
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            {t('caseStudioForms.new.titleLabel')}
          </label>
          <input
            type="text"
            value={titleRu}
            onChange={(e) => setTitleRu(e.target.value)}
            placeholder={t('caseStudioForms.new.titlePlaceholder')}
            style={inputStyle}
            maxLength={500}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{titleRu.length}/500</p>
        </div>

        {/* Situation */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            {t('caseStudioForms.new.situationLabel')}
          </label>
          <textarea
            value={situationRu}
            onChange={(e) => setSituationRu(e.target.value)}
            placeholder={t('caseStudioForms.new.situationPlaceholder')}
            rows={6}
            style={inputStyle}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('caseStudioForms.new.charsMin20', { n: situationRu.length })}</p>
        </div>

        {/* Dialogue */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            {t('caseStudioForms.new.dialogueLabel')}
          </label>
          <div className="space-y-2 mb-2">
            {dialogue.map((line, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <select
                  value={line.speaker}
                  onChange={(e) => updateLine(idx, 'speaker', e.target.value)}
                  style={{ ...inputStyle, width: '6rem' }}
                >
                  <option value="client">{t('caseStudio.speakers.client')}</option>
                  <option value="tp">{t('caseStudio.roles.sales_rep')}</option>
                  <option value="sv">{t('caseStudio.roles.supervisor')}</option>
                  <option value="rm">{t('caseStudio.roles.regional_manager')}</option>
                  <option value="other">{t('caseStudio.speakers.other')}</option>
                </select>
                <input
                  type="text"
                  value={line.text}
                  onChange={(e) => updateLine(idx, 'text', e.target.value)}
                  placeholder={t('caseStudioForms.new.linePlaceholder')}
                  style={{ ...inputStyle, flex: 1 }}
                />
                {dialogue.length > 1 && (
                  <button
                    onClick={() => removeLine(idx)}
                    className="px-2"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label={t('caseStudioForms.new.removeLine')}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addLine}
            className="text-sm underline"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('caseStudioForms.new.addLine')}
          </button>
        </div>

        {/* Author solution */}
        <div className="pt-5" style={{ borderTop: '1px solid var(--border)' }}>
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={hasSolution}
              onChange={(e) => setHasSolution(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {t('caseStudioForms.new.attachSolution')}
            </span>
          </label>
          {hasSolution && (
            <>
              <textarea
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
                placeholder={t('caseStudioForms.new.solutionPlaceholder')}
                rows={5}
                style={inputStyle}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {t('caseStudioForms.new.solutionCharsHint', { n: solutionText.length })}
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="rounded p-3 text-sm" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => navigate('/case-studio')}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 rounded-lg disabled:opacity-50 text-sm font-medium"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
          >
            {submitting ? t('caseStudioForms.new.publishing') : t('caseStudioForms.new.publishCase')}
          </button>
        </div>
      </div>
    </div>
  );
}
