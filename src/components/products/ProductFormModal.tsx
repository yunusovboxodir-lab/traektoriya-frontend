import { useState } from 'react';
import { productsApi, type Product } from '../../api/products';
import { BRAND_TABS } from '../../config/brands';
import { toast } from '../../stores/toastStore';

interface Props {
  product: Product | null; // null = create mode
  defaultBrand: string;
  onClose: () => void;
  onSaved: () => void;
}

export function ProductFormModal({ product, defaultBrand, onClose, onSaved }: Props) {
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: product?.name ?? '',
    brand: product?.brand ?? defaultBrand,
    category: product?.category ?? '',
    subcategory: product?.subcategory ?? '',
    weight: product?.weight ?? '',
    flavor: product?.flavor ?? '',
    barcode: product?.barcode ?? '',
    sku_code: product?.sku_code ?? '',
    short_description: product?.short_description ?? '',
    description: product?.description ?? '',
    target_audience: product?.target_audience ?? '',
    consumption_occasion: product?.consumption_occasion ?? '',
    price_rrp: product?.price_rrp ?? '',
    shelf_life: product?.shelf_life ?? '',
    storage_conditions: product?.storage_conditions ?? '',
  });

  const [saving, setSaving] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [showCommerce, setShowCommerce] = useState(false);

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        brand: form.brand || null,
        category: form.category || null,
        subcategory: form.subcategory || null,
        weight: form.weight || null,
        flavor: form.flavor || null,
        barcode: form.barcode || null,
        sku_code: form.sku_code || null,
        short_description: form.short_description || null,
        description: form.description || null,
        target_audience: form.target_audience || null,
        consumption_occasion: form.consumption_occasion || null,
        price_rrp: form.price_rrp ? Number(form.price_rrp) : null,
        shelf_life: form.shelf_life || null,
        storage_conditions: form.storage_conditions || null,
      };

      if (isEdit) {
        await productsApi.updateProduct(product!.id, payload as Partial<Product>);
        toast.success('Товар обновлён');
      } else {
        await productsApi.createProduct(payload as Partial<Product>);
        toast.success('Товар создан');
      }
      onSaved();
    } catch {
      toast.error(isEdit ? 'Ошибка обновления' : 'Ошибка создания');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mb-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Редактировать товар' : 'Новый товар'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Section 1: Basic (always open) */}
          <div className="space-y-3">
            <Input label="Название *" value={form.name} onChange={(v) => set('name', v)} required />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Бренд</label>
              <select
                value={form.brand}
                onChange={(e) => set('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">— Без бренда —</option>
                {BRAND_TABS.map((b) => (
                  <option key={b.brandKey} value={b.brandKey}>{b.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Категория" value={form.category} onChange={(v) => set('category', v)} />
              <Input label="Подкатегория" value={form.subcategory} onChange={(v) => set('subcategory', v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Вес" value={form.weight} onChange={(v) => set('weight', v)} />
              <Input label="Вкус" value={form.flavor} onChange={(v) => set('flavor', v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Штрихкод" value={form.barcode} onChange={(v) => set('barcode', v)} />
              <Input label="Артикул (SKU)" value={form.sku_code} onChange={(v) => set('sku_code', v)} />
            </div>
          </div>

          {/* Section 2: Description (collapsible) */}
          <SectionToggle label="Описание" open={showDesc} onToggle={() => setShowDesc(!showDesc)} />
          {showDesc && (
            <div className="space-y-3 pl-1">
              <Input label="Краткое описание" value={form.short_description} onChange={(v) => set('short_description', v)} />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Полное описание</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <Input label="Целевая аудитория" value={form.target_audience} onChange={(v) => set('target_audience', v)} />
              <Input label="Повод потребления" value={form.consumption_occasion} onChange={(v) => set('consumption_occasion', v)} />
            </div>
          )}

          {/* Section 3: Commerce (collapsible) */}
          <SectionToggle label="Коммерция" open={showCommerce} onToggle={() => setShowCommerce(!showCommerce)} />
          {showCommerce && (
            <div className="space-y-3 pl-1">
              <Input label="Цена РРЦ (сум)" value={String(form.price_rrp ?? '')} onChange={(v) => set('price_rrp', v)} type="number" />
              <Input label="Срок годности" value={form.shelf_life} onChange={(v) => set('shelf_life', v)} />
              <Input label="Условия хранения" value={form.storage_conditions} onChange={(v) => set('storage_conditions', v)} />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Small helpers ---

function Input({
  label, value, onChange, required, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

function SectionToggle({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 pt-1"
    >
      <svg
        className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
      >
        <path d="M9 5l7 7-7 7" />
      </svg>
      {label}
    </button>
  );
}
