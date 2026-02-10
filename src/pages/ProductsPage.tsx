import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi, type Product } from '../api/products';

export function ProductsPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productsApi.getProducts(0, 200);
      const data = res.data;
      setProducts(Array.isArray(data) ? data : data.items ?? []);
    } catch (e: any) {
      console.error('Products load error:', e);
      setError('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)),
    );
  }, [products, search]);

  // -- Loading --
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Библиотека товаров
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {products.length}{' '}
          {pluralize(products.length, 'товар', 'товара', 'товаров')}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
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
            {search.trim()
              ? 'Ничего не найдено'
              : 'Товары ещё не добавлены'}
          </p>
          {search.trim() && (
            <p className="text-gray-400 text-sm mt-1">
              Попробуйте изменить запрос
            </p>
          )}
        </div>
      )}

      {/* Product grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => navigate(`/products/${product.id}`)}
              className="text-left bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              {/* Brand badge */}
              {product.brand && (
                <span className="inline-block text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded mb-3">
                  {product.brand}
                </span>
              )}

              {/* Name */}
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug mb-2">
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
                  <span className="text-xs text-gray-400 ml-1">
                    РРЦ
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// -- helpers --

function formatPrice(v: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(v);
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}
