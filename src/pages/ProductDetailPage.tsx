import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi, type ProductDetail, type ProductHPV, type ProductTest } from '../api/products';

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
      setHpv(data.hpv);
    } catch {
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
      setHpv(res.data.hpv);
    } catch {
      // HPV refresh failed silently — user can retry
    } finally {
      setHpvLoading(false);
    }
  }, [productId]);

  // -- Loading --
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse mt-4" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 mt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
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
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {product.brand && (
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
              {product.brand}
            </span>
          )}
          {product.category && (
            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded">
              {product.category}
            </span>
          )}
          {product.is_active ? (
            <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded">
              Активен
            </span>
          ) : (
            <span className="text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded">
              Неактивен
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
        {product.price_rrp != null && (
          <p className="text-xl font-bold text-blue-600">
            {new Intl.NumberFormat('ru-RU').format(product.price_rrp)} сум
          </p>
        )}
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
      {activeTab === 'test' && <TestTab questions={product.test_questions} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info Tab
// ---------------------------------------------------------------------------

function InfoTab({ product }: { product: ProductDetail }) {
  const fields: { label: string; value: string | null | undefined; icon: React.ReactNode }[] = [
    {
      label: 'Вес / Объём',
      value: product.weight,
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></svg>,
    },
    {
      label: 'Штрихкод',
      value: product.barcode,
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M2 4h2v16H2M6 4h1v16H6M10 4h2v16h-2M15 4h1v16h-1M19 4h3v16h-3" /></svg>,
    },
    {
      label: 'Артикул (SKU)',
      value: product.sku_code,
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
    },
    {
      label: 'Срок годности',
      value: product.shelf_life,
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
    },
    {
      label: 'Условия хранения',
      value: product.storage_conditions,
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
    },
    {
      label: 'Штук в коробке',
      value: product.units_per_box != null ? String(product.units_per_box) : null,
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg>,
    },
    {
      label: 'Штук на паллете',
      value: product.units_per_pallet != null ? String(product.units_per_pallet) : null,
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Info card */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center px-5 py-3.5">
            <span className="flex items-center gap-2 text-sm text-gray-500 w-44 flex-shrink-0">
              <span className="text-gray-400">{f.icon}</span>
              {f.label}
            </span>
            <span className="text-sm text-gray-900 font-medium">
              {f.value || <span className="text-gray-300">&mdash;</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Description */}
      {product.description && (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-sm text-gray-500 mb-1.5 font-medium">Описание</p>
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
          ХПВ будет доступно после генерации
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Варианты Характеристика-Преимущество-Выгода генерируются через ИИ
        </p>
      </div>
    );
  }

  const cards = [
    {
      letter: 'Х',
      title: 'Характеристика',
      value: hpv.characteristic,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      letterBg: 'bg-blue-600',
    },
    {
      letter: 'П',
      title: 'Преимущество',
      value: hpv.advantage,
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      letterBg: 'bg-green-600',
    },
    {
      letter: 'В',
      title: 'Выгода',
      value: hpv.benefit,
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      letterBg: 'bg-purple-600',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          Вариант <span className="font-semibold text-gray-700">#{hpv.variant_number}</span> из 100
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
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
          Обновить ХПВ
        </button>
      </div>

      <div className="space-y-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-xl border p-5 ${card.bg} ${card.border}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className={`w-8 h-8 rounded-lg ${card.letterBg} text-white font-bold text-sm flex items-center justify-center`}>
                {card.letter}
              </span>
              <h3 className={`text-sm font-semibold ${card.text}`}>{card.title}</h3>
            </div>
            <p className={`text-sm leading-relaxed ${card.text}`}>
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

function TestTab({ questions }: { questions: ProductTest[] }) {
  if (!questions || questions.length === 0) {
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
          Тесты скоро будут доступны
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Вопросы по товару генерируются автоматически через ИИ
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-2">
        {questions.length} {pluralize(questions.length, 'вопрос', 'вопроса', 'вопросов')}
      </p>
      {questions.map((q, idx) => (
        <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-900 mb-3">
            <span className="text-gray-400 mr-2">{idx + 1}.</span>
            {q.question}
          </p>
          {q.options && q.options.length > 0 && (
            <div className="space-y-2 ml-5">
              {q.options.map((opt, optIdx) => (
                <label
                  key={optIdx}
                  className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer hover:text-gray-900"
                >
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={opt}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// -- helpers --

function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}
