import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi, type ProductDetail, type ProductHPV } from '../api/products';

type Tab = 'info' | 'hpv' | 'test';

const TABS: { key: Tab; label: string }[] = [
  { key: 'info', label: 'Информация' },
  { key: 'hpv', label: 'ХПВ' },
  { key: 'test', label: 'Тест' },
];

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('info');

  // HPV refresh
  const [hpv, setHpv] = useState<ProductHPV | null>(null);
  const [hpvLoading, setHpvLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    loadProduct(productId);
  }, [productId]);

  const loadProduct = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await productsApi.getProduct(id);
      const data: ProductDetail = res.data;
      setProduct(data);
      setHpv(data.random_hpv);
    } catch (e: any) {
      console.error('Product load error:', e);
      setError('Не удалось загрузить товар');
    } finally {
      setLoading(false);
    }
  };

  const refreshHpv = useCallback(async () => {
    if (!productId) return;
    try {
      setHpvLoading(true);
      const res = await productsApi.getProduct(productId);
      setHpv(res.data.random_hpv);
    } catch (e) {
      console.error('HPV refresh error:', e);
    } finally {
      setHpvLoading(false);
    }
  }, [productId]);

  // -- Loading --
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // -- Error --
  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error || 'Товар не найден'}</p>
          <button
            onClick={() => navigate('/products')}
            className="text-red-600 underline text-sm mt-1"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/products')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Назад к товарам
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {product.brand && (
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {product.brand}
            </span>
          )}
          {product.category && (
            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
              {product.category}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'info' && <InfoTab product={product} />}
      {activeTab === 'hpv' && (
        <HpvTab hpv={hpv} loading={hpvLoading} onRefresh={refreshHpv} />
      )}
      {activeTab === 'test' && <TestTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info Tab
// ---------------------------------------------------------------------------

function InfoTab({ product }: { product: ProductDetail }) {
  const fields: { label: string; value: string | null | undefined }[] = [
    { label: 'Название', value: product.name },
    { label: 'Бренд', value: product.brand },
    { label: 'Категория', value: product.category },
    { label: 'Вес', value: product.weight },
    { label: 'Штрихкод', value: product.barcode },
    { label: 'SKU', value: product.sku_code },
    {
      label: 'Цена (РРЦ)',
      value:
        product.price_rrp != null
          ? new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }).format(product.price_rrp)
          : null,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      {fields.map((f) => (
        <div key={f.label} className="flex items-center px-5 py-3.5">
          <span className="text-sm text-gray-500 w-36 flex-shrink-0">
            {f.label}
          </span>
          <span className="text-sm text-gray-900 font-medium">
            {f.value || <span className="text-gray-300">&mdash;</span>}
          </span>
        </div>
      ))}

      {/* Description */}
      {product.description && (
        <div className="px-5 py-4">
          <p className="text-sm text-gray-500 mb-1.5">Описание</p>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HPV Tab
// ---------------------------------------------------------------------------

function HpvTab({
  hpv,
  loading,
  onRefresh,
}: {
  hpv: ProductHPV | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  if (!hpv) {
    return (
      <div className="text-center py-16">
        <svg
          className="mx-auto w-14 h-14 text-gray-300 mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p className="text-gray-500 font-medium">
          Варианты ХПВ ещё не добавлены
        </p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Характеристика',
      value: hpv.characteristic,
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      title: 'Преимущество',
      value: hpv.advantage,
      color: 'bg-green-50 border-green-200 text-green-800',
      icon: (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      title: 'Выгода',
      value: hpv.benefit,
      color: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: (
        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          Вариант #{hpv.variant_number}
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Другой вариант
        </button>
      </div>

      <div className="space-y-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-xl border p-5 ${card.color}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {card.icon}
              <h3 className="text-sm font-semibold">{card.title}</h3>
            </div>
            <p className="text-sm leading-relaxed">
              {card.value || (
                <span className="italic opacity-60">Не указано</span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Test Tab
// ---------------------------------------------------------------------------

function TestTab() {
  return (
    <div className="text-center py-16">
      <svg
        className="mx-auto w-14 h-14 text-gray-300 mb-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-gray-500 font-medium text-lg">
        Тестирование скоро будет доступно
      </p>
      <p className="text-gray-400 text-sm mt-1">
        Мы работаем над этим разделом
      </p>
    </div>
  );
}
