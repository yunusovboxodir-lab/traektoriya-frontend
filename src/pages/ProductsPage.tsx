import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi, type Product } from '../api/products';

type ViewMode = 'grid' | 'table';

export function ProductsPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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

  // Extract unique categories from products
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  // Filter products by search + category
  const filtered = useMemo(() => {
    let result = products;

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [products, search, selectedCategory]);

  // -- Loading skeleton --
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-80 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mt-3" />
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
          <button
            onClick={loadProducts}
            className="text-red-600 underline text-sm mt-1"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Библиотека товаров
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Показано {filtered.length} из {products.length}{' '}
            {pluralize(products.length, 'товар', 'товара', 'товаров')}
          </p>
        </div>

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

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Поиск по названию, бренду или категории..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <svg
            className="mx-auto w-16 h-16 text-gray-300 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <path d="M3.27 6.96L12 12.01l8.73-5.05" />
            <path d="M12 22.08V12" />
          </svg>
          <p className="text-gray-500 text-lg font-medium">
            {search.trim() || selectedCategory !== 'all'
              ? 'Ничего не найдено'
              : 'Товары ещё не добавлены'}
          </p>
          {(search.trim() || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSelectedCategory('all'); }}
              className="text-blue-600 hover:text-blue-800 text-sm mt-2"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      )}

      {/* Card Grid View */}
      {filtered.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => navigate(`/products/${product.id}`)}
              className="text-left bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all group overflow-hidden"
            >
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
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-4xl opacity-20">📦</span>';
                    }}
                  />
                ) : (
                  <span className="text-4xl opacity-20">📦</span>
                )}
              </div>

              <div className="p-4">
                {/* Brand badge */}
                {product.brand && (
                  <span className="inline-block text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded mb-2">
                    {product.brand}
                  </span>
                )}

                {/* Name */}
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug mb-2 line-clamp-2">
                  {product.name}
                </h3>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  {product.category && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      {product.category}
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

                {/* Price */}
                {product.price_rrp != null && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-sm font-semibold text-gray-800">
                      {formatPrice(product.price_rrp)}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Table View */}
      {filtered.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                  Название
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                  Бренд
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                  Категория
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                  Вес
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                  Цена
                </th>
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
                    <span className="text-sm font-medium text-gray-900">
                      {product.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {product.brand && (
                      <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {product.brand}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {product.category || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {product.weight || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-medium text-gray-800">
                    {product.price_rrp != null ? formatPrice(product.price_rrp) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
