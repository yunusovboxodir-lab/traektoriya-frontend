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

const ROLE_OPTIONS: { value: CaseTargetRole; label: string }[] = [
  { value: 'sales_rep', label: 'Торговый представитель (ТП)' },
  { value: 'supervisor', label: 'Супервайзер (СВ)' },
  { value: 'regional_manager', label: 'Региональный менеджер (РМ)' },
  { value: 'commercial_dir', label: 'Коммерческий директор (КД)' },
];

export function CaseStudioNewPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

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
      setError('Выбери категорию');
      return;
    }
    if (titleRu.trim().length < 5) {
      setError('Заголовок: минимум 5 символов');
      return;
    }
    if (situationRu.trim().length < 20) {
      setError('Ситуация: минимум 20 символов');
      return;
    }
    if (hasSolution && solutionText.trim().length < 20) {
      setError('Решение: минимум 20 символов');
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
      setError(err?.response?.data?.detail || err?.message || 'Ошибка');
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
        ← К Кейсотеке
      </button>

      <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Создать кейс</h1>
      <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
        Опиши реальную ситуацию из практики. Чем конкретнее — тем полезнее команде.
        +50 XP за публикацию.
      </p>

      <div className="rounded-lg p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Target role */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Для какой роли этот кейс
          </label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as CaseTargetRole)}
            style={inputStyle}
          >
            {availableRoles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Кейсы видят только указанная роль и выше по иерархии.
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Категория
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={inputStyle}
          >
            <option value="">— Выбери категорию —</option>
            {compatibleCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ''}
                {c.label_ru}
              </option>
            ))}
          </select>
          {compatibleCategories.length === 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--warning)' }}>
              Для этой роли пока нет совместимых категорий. Сообщите админу.
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Заголовок кейса
          </label>
          <input
            type="text"
            value={titleRu}
            onChange={(e) => setTitleRu(e.target.value)}
            placeholder='Например: «ТП в Намангане встретил возражение по STROBAR»'
            style={inputStyle}
            maxLength={500}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{titleRu.length}/500</p>
        </div>

        {/* Situation */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Ситуация (контекст)
          </label>
          <textarea
            value={situationRu}
            onChange={(e) => setSituationRu(e.target.value)}
            placeholder="Где, кто участвует, что произошло до диалога. Чем конкретнее — тем лучше (имена, регион, бренды, цифры)."
            rows={6}
            style={inputStyle}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{situationRu.length} символов (мин. 20)</p>
        </div>

        {/* Dialogue */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Диалог (опционально)
          </label>
          <div className="space-y-2 mb-2">
            {dialogue.map((line, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <select
                  value={line.speaker}
                  onChange={(e) => updateLine(idx, 'speaker', e.target.value)}
                  style={{ ...inputStyle, width: '6rem' }}
                >
                  <option value="client">Клиент</option>
                  <option value="tp">ТП</option>
                  <option value="sv">СВ</option>
                  <option value="rm">РМ</option>
                  <option value="other">Другой</option>
                </select>
                <input
                  type="text"
                  value={line.text}
                  onChange={(e) => updateLine(idx, 'text', e.target.value)}
                  placeholder="Реплика…"
                  style={{ ...inputStyle, flex: 1 }}
                />
                {dialogue.length > 1 && (
                  <button
                    onClick={() => removeLine(idx)}
                    className="px-2"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Удалить реплику"
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
            + Добавить реплику
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
              Приложить своё решение к кейсу
            </span>
          </label>
          {hasSolution && (
            <>
              <textarea
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
                placeholder="Опиши, как ты решил эту ситуацию (или как стоит решать)..."
                rows={5}
                style={inputStyle}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {solutionText.length} символов (мин. 20). Твоё решение пойдёт в peer-review.
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
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 rounded-lg disabled:opacity-50 text-sm font-medium"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
          >
            {submitting ? 'Публикую…' : 'Опубликовать кейс'}
          </button>
        </div>
      </div>
    </div>
  );
}
