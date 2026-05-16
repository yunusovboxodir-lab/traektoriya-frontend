/**
 * Module 17: Case Studio — редактор категории (создание/редактирование).
 * Доступ: admin / superadmin.
 *
 * Маршруты:
 *  - /case-studio/categories/new            — создание
 *  - /case-studio/categories/:id/edit       — редактирование
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { caseStudioApi } from '../api/caseStudio';
import type { CaseCategory, CategoryCreateIn } from '../types/caseStudio';
import { SkeletonCard } from '@/components/ui';

const ROLE_OPTIONS = [
  { value: 'sales_rep', label: 'ТП' },
  { value: 'supervisor', label: 'СВ' },
  { value: 'regional_manager', label: 'РМ' },
  { value: 'commercial_dir', label: 'КД' },
];

const PRESET_ICONS = ['💬', '⚔️', '🤝', '💳', '🛒', '🎯', '👥', '⏰', '🆕', '📐', '☀️', '📈', '📁', '⭐', '🔥', '🚀'];
const PRESET_COLORS = [
  '#f59e0b', '#ef4444', '#dc2626', '#ea580c', '#0ea5e9',
  '#06b6d4', '#a855f7', '#f97316', '#10b981', '#8b5cf6',
  '#fbbf24', '#3b82f6', '#7a716a',
];

export function CaseCategoryEditPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const isNew = !categoryId;

  const [form, setForm] = useState<CategoryCreateIn>({
    code: '',
    label_ru: '',
    label_uz: '',
    icon: '',
    color: '#7a716a',
    description: '',
    applicable_roles: [],
    order_index: 100,
  });
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) return;
    caseStudioApi
      .listCategories({ only_active: false })
      .then((res) => {
        const c: CaseCategory | undefined = (res.data || []).find((x) => x.id === categoryId);
        if (c) {
          setForm({
            code: c.code,
            label_ru: c.label_ru,
            label_uz: c.label_uz || '',
            icon: c.icon || '',
            color: c.color || '#7a716a',
            description: c.description || '',
            applicable_roles: c.applicable_roles || [],
            order_index: c.order_index,
          });
          setIsActive(c.is_active);
        }
      })
      .finally(() => setLoading(false));
  }, [categoryId]);

  const toggleRole = (role: string) => {
    const current = form.applicable_roles || [];
    if (current.includes(role)) {
      setForm({ ...form, applicable_roles: current.filter((r) => r !== role) });
    } else {
      setForm({ ...form, applicable_roles: [...current, role] });
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (form.code.trim().length < 2 || form.label_ru.trim().length < 2) {
      setError('Код и название обязательны (мин. 2 символа)');
      return;
    }
    setSubmitting(true);
    try {
      if (isNew) {
        await caseStudioApi.createCategory(form);
      } else if (categoryId) {
        await caseStudioApi.updateCategory(categoryId, {
          label_ru: form.label_ru,
          label_uz: form.label_uz,
          icon: form.icon,
          color: form.color,
          description: form.description,
          applicable_roles: form.applicable_roles,
          order_index: form.order_index,
          is_active: isActive,
        });
      }
      navigate('/case-studio');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err?.response?.data?.detail || err?.message || 'Ошибка');
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryId) return;
    if (!confirm('Удалить категорию (soft delete)?')) return;
    await caseStudioApi.deleteCategory(categoryId);
    navigate('/case-studio');
  };

  if (loading) return <div className="max-w-2xl mx-auto p-6"><SkeletonCard lines={4} /></div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => navigate('/case-studio')}
        className="text-sm text-stone-500 hover:text-stone-800 mb-4"
      >
        ← К Кейсотеке
      </button>

      <h1 className="text-2xl font-serif text-stone-800 mb-6">
        {isNew ? 'Новая категория' : 'Редактировать категорию'}
      </h1>

      <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-5">
        {/* Code (только при создании) */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Код (slug, латиница)
          </label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            disabled={!isNew}
            placeholder="obj_price"
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm font-mono disabled:bg-stone-50"
          />
          <p className="text-xs text-stone-500 mt-1">
            Уникальный идентификатор. После создания не меняется.
          </p>
        </div>

        {/* Названия */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Название RU</label>
            <input
              type="text"
              value={form.label_ru}
              onChange={(e) => setForm({ ...form, label_ru: e.target.value })}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Название UZ</label>
            <input
              type="text"
              value={form.label_uz || ''}
              onChange={(e) => setForm({ ...form, label_uz: e.target.value })}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Иконка */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Иконка</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {PRESET_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setForm({ ...form, icon: ic })}
                className={`text-2xl p-1 rounded border ${
                  form.icon === ic ? 'border-stone-800 bg-stone-100' : 'border-transparent hover:border-stone-300'
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={form.icon || ''}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="Или свой эмодзи"
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            maxLength={4}
          />
        </div>

        {/* Цвет */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Цвет</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {PRESET_COLORS.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => setForm({ ...form, color: col })}
                className={`w-8 h-8 rounded border-2 ${
                  form.color === col ? 'border-stone-800' : 'border-transparent'
                }`}
                style={{ backgroundColor: col }}
                aria-label={col}
              />
            ))}
          </div>
          <input
            type="text"
            value={form.color || ''}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            placeholder="#7a716a"
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm font-mono"
          />
        </div>

        {/* Описание */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Описание</label>
          <textarea
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
          />
        </div>

        {/* Applicable roles */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Для каких ролей кейсы (target_role)
          </label>
          <div className="flex gap-3 flex-wrap">
            {ROLE_OPTIONS.map((r) => (
              <label key={r.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={(form.applicable_roles || []).includes(r.value)}
                  onChange={() => toggleRole(r.value)}
                  className="rounded"
                />
                {r.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Если ничего не выбрано — категория доступна для всех ролей.
          </p>
        </div>

        {/* Order */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Порядок сортировки
          </label>
          <input
            type="number"
            value={form.order_index || 0}
            onChange={(e) =>
              setForm({ ...form, order_index: parseInt(e.target.value, 10) || 0 })
            }
            className="w-32 border border-stone-300 rounded px-3 py-2 text-sm"
          />
        </div>

        {/* Active (только при редактировании) */}
        {!isNew && (
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-stone-700">Активна</span>
            </label>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-between pt-2">
          {!isNew && (
            <button
              onClick={handleDelete}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Удалить (soft)
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => navigate('/case-studio')}
              className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50"
            >
              {submitting ? 'Сохраняю…' : isNew ? 'Создать' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
