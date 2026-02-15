import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi, type Product } from '../api/products';
import { useAuthStore } from '../stores/authStore';
import { BRAND_TABS } from '../config/brands';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { DeleteConfirmModal } from '../components/products/DeleteConfirmModal';

type ViewMode = 'grid' | 'table';

export function ProductsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'superadmin' || user?.role === 'manager';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Admin modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productsApi.getProducts(0, 100);
      const data = res.data;
      setProducts(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      setError('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  const currentBrand = BRAND_TABS[selectedTab];

  // Products count per brand (for tab badges)
  const brandCounts = useMemo(() => {
    const counts = new Map<string, number>();
    BRAND_TABS.forEach((b) => counts.set(b.brandKey, 0));
    products.forEach((p) => {
      if (p.brand && counts.has(p.brand)) {
        counts.set(p.brand, (counts.get(p.brand) || 0) + 1);
      }
    });
    return counts;
  }, [products]);

  // Filter products for current tab
  const filtered = useMemo(() => {
    let result = products.filter((p) => p.brand === currentBrand.brandKey);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [products, selectedTab, search, currentBrand.brandKey]);

  // Placeholder count (only when not searching)
  const placeholderCount = search.trim()
    ? 0
    : Math.max(0, currentBrand.expectedSKU - filtered.length);

  // -- Loading skeleton --
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -- Error --
  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={loadProducts} className="text-red-600 underline text-sm mt-1">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Библиотека товаров</h1>
          <p className="text-sm text-gray-500 mt-1">
            {currentBrand.label}: {filtered.length} из {currentBrand.expectedSKU} SKU
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin: Add product */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M12 5v14m-7-7h14" />
              </svg>
              Добавить
            </button>
          )}

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Карточки"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Таблица"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Brand tabs (12 fixed, horizontal scroll) */}
      <div className="flex overflow-x-auto gap-1.5 mb-5 pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
        {BRAND_TABS.map((brand, idx) => {
          const count = brandCounts.get(brand.brandKey) || 0;
          return (
            <button
              key={brand.brandKey}
              type="button"
              onClick={() => { setSelectedTab(idx); setSearch(''); }}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedTab === idx
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {brand.label}
              <span className={`ml-1.5 text-xs ${selectedTab === idx ? 'text-blue-200' : 'text-gray-400'}`}>
                {count}/{brand.expectedSKU}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {/* Real product cards */}
          {filtered.map((product) => (
            <div
              key={product.id}
              className="relative bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all group overflow-hidden cursor-pointer"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              {/* Admin icons (top-right, hover) */}
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingProduct(product); }}
                    className="p-1.5 bg-white/90 rounded-lg shadow-sm hover:bg-blue-50 text-gray-500 hover:text-blue-600"
                    title="Редактировать"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingProduct(product); }}
                    className="p-1.5 bg-white/90 rounded-lg shadow-sm hover:bg-red-50 text-gray-500 hover:text-red-600"
                    title="Удалить"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Product image */}
              <div className="w-full h-40 bg-gray-50 flex items-center justify-center p-3 border-b border-gray-100">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        '<span class="text-4xl opacity-20">📦</span>';
                    }}
                  />
                ) : (
                  <span className="text-4xl opacity-20">📦</span>
                )}
              </div>

              <div className="p-4">
                {product.brand && (
                  <span className="inline-block text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded mb-2">
                    {product.brand}
                  </span>
                )}
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug mb-2 line-clamp-2">
                  {product.name}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  {product.subcategory && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      {product.subcategory}
                    </span>
                  )}
                  {product.weight && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8" />
                      </svg>
                      {product.weight}
                    </span>
                  )}
                </div>
                {product.price_rrp != null && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-sm font-semibold text-gray-800">
                      {formatPrice(product.price_rrp)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Placeholder cards ("СКОРО БУДЕТ") */}
          {Array.from({ length: placeholderCount }).map((_, idx) => (
            <div
              key={`placeholder-${idx}`}
              className="bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 min-h-[260px]"
            >
              <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <path d="M3.27 6.96L12 12.01l8.73-5.05" />
                <path d="M12 22.08V12" />
              </svg>
              <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                СКОРО БУДЕТ
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 text-xs text-blue-500 hover:text-blue-700 font-medium"
                >
                  + Добавить товар
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <>
          {filtered.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      Название
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      Подкатегория
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      Вес
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      Цена
                    </th>
                    {isAdmin && (
                      <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3 w-24">
                        Действия
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((product) => (
                    <tr
                      key={product.id}
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {product.subcategory || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {product.weight || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-medium text-gray-800">
                        {product.price_rrp != null ? formatPrice(product.price_rrp) : '—'}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3.5">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingProduct(product); }}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                              title="Редактировать"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeletingProduct(product); }}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                              title="Удалить"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ) : null}

          {/* Table placeholder note */}
          {placeholderCount > 0 && (
            <div className="mt-4 px-4 py-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
              <span className="text-sm text-gray-400">
                Ожидается ещё {placeholderCount}{' '}
                {pluralize(placeholderCount, 'товар', 'товара', 'товаров')} для бренда{' '}
                <span className="font-medium">{currentBrand.label}</span>
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="ml-3 text-sm text-blue-500 hover:text-blue-700 font-medium"
                >
                  + Добавить
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty state (when search finds nothing) */}
      {filtered.length === 0 && placeholderCount === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg font-medium">Ничего не найдено</p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-blue-600 hover:text-blue-800 text-sm mt-2"
          >
            Сбросить поиск
          </button>
        </div>
      )}

      {/* Modals */}
      {(showCreateModal || editingProduct) && (
        <ProductFormModal
          product={editingProduct}
          defaultBrand={currentBrand.brandKey}
          onClose={() => { setShowCreateModal(false); setEditingProduct(null); }}
          onSaved={() => { setShowCreateModal(false); setEditingProduct(null); loadProducts(); }}
        />
      )}

      {deletingProduct && (
        <DeleteConfirmModal
          product={deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onDeleted={() => { setDeletingProduct(null); loadProducts(); }}
        />
      )}
    </div>
  );
}

// -- helpers --

function formatPrice(v: number): string {
  return new Intl.NumberFormat('ru-RU').format(v) + ' сум';
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}
