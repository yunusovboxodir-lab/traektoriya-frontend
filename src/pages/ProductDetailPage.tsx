import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi, type ProductDetail, type ProductHPV, type ProductTest } from '../api/products';
import { useT } from '../stores/langStore';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../stores/toastStore';

type Tab = 'info' | 'merch' | 'sales' | 'hpv' | 'test';

// Кубок NMEDOV 2026 — кто может верифицировать продукты
const VERIFY_ROLES = new Set(['superadmin', 'admin', 'commercial_dir', 'regional_manager']);


export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const t = useT();
  const user = useAuthStore((s) => s.user);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('info');

  // Кубок NMEDOV 2026 — верификация
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const canVerify = !!user && VERIFY_ROLES.has(user.role);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'info', label: t('productDetail.tabs.info'), icon: '📋' },
    { key: 'merch', label: t('productDetail.tabs.merch'), icon: '🏪' },
    { key: 'sales', label: t('productDetail.tabs.sales'), icon: '💼' },
    { key: 'hpv', label: t('productDetail.tabs.hpv'), icon: '💡' },
    { key: 'test', label: t('productDetail.tabs.test'), icon: '✅' },
  ];

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
      setError(t('productDetail.loadError'));
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
      // HPV refresh failed silently
    } finally {
      setHpvLoading(false);
    }
  }, [productId]);

  // Кубок 2026 — подтвердить контент продукта
  const handleVerify = useCallback(async () => {
    if (!productId) return;
    try {
      setVerifying(true);
      const res = await productsApi.verifyProduct(productId);
      const points = res.data.points_earned ?? 5;
      const todayCount = res.data.total_verifications_today ?? 0;
      toast.success(`+${points} баллов в Кубок! Сегодня подтверждено: ${todayCount}/2`);
      setVerifyModalOpen(false);

      // Найти следующий неподтверждённый продукт
      try {
        const list = await productsApi.getProducts(0, 1, false);
        const next = list.data.items?.[0];
        if (next && next.id !== productId) {
          navigate(`/products/${next.id}`);
        } else {
          // Все подтверждены — обновим текущую страницу с обновлённым флагом
          await loadProduct(productId);
        }
      } catch {
        await loadProduct(productId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Не удалось подтвердить продукт';
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  }, [productId, navigate]);

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

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error || t('productDetail.notFound')}</p>
          <button onClick={() => navigate('/products')} className="text-red-600 underline text-sm mt-1">
            {t('productDetail.backToList')}
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
        {t('productDetail.backToProducts')}
      </button>

      {/* Header with product image */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          {/* Product image */}
          {product.images && product.images.length > 0 ? (
            <div className="flex-shrink-0 w-24 h-24 sm:w-36 sm:h-36 rounded-xl border border-gray-200 bg-white overflow-hidden flex items-center justify-center p-2">
              <img
                src={product.images[0].url}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-24 h-24 sm:w-36 sm:h-36 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
              <span className="text-4xl opacity-30">📦</span>
            </div>
          )}

          {/* Text info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {product.brand && (
                <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded">{product.brand}</span>
              )}
              {product.category && (
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded">{product.category}</span>
              )}
              {product.subcategory && (
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">{product.subcategory}</span>
              )}
              {product.flavor && (
                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded">{product.flavor}</span>
              )}
              {product.is_active ? (
                <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded">{t('productDetail.active')}</span>
              ) : (
                <span className="text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded">{t('productDetail.inactive')}</span>
              )}
              {/* Кубок 2026 — статус верификации */}
              {product.is_verified && (
                <span
                  className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded inline-flex items-center gap-1"
                  title={product.verified_at ? `Подтверждено ${new Date(product.verified_at).toLocaleDateString('ru-RU')}` : ''}
                >
                  ✅ Подтверждено
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h1>
            {product.short_description && (
              <p className="text-sm text-gray-500 mb-2">{product.short_description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {product.price_rrp != null && (
                <p className="text-xl font-bold text-blue-600">
                  {new Intl.NumberFormat('ru-RU').format(product.price_rrp)} сум
                </p>
              )}
              {/* Кнопка верификации — только для admin/superadmin/commercial_dir/regional_manager + только для unverified */}
              {canVerify && !product.is_verified && (
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-sm transition-all"
                  title="Подтвердить контент продукта (+5 баллов в Кубок NMEDOV 2026)"
                >
                  ✅ Подтвердить контент
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs font-bold">+5</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Кубок 2026 — Modal подтверждения */}
      {verifyModalOpen && (
        <VerifyConfirmModal
          productName={product.name}
          loading={verifying}
          onConfirm={handleVerify}
          onCancel={() => setVerifyModalOpen(false)}
        />
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 pb-3 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'info' && <InfoTab product={product} />}
      {activeTab === 'merch' && <MerchTab product={product} />}
      {activeTab === 'sales' && <SalesTab product={product} />}
      {activeTab === 'hpv' && <HpvTab hpv={hpv} loading={hpvLoading} onRefresh={refreshHpv} />}
      {activeTab === 'test' && <TestTab questions={product.test_questions} />}
    </div>
  );
}

// ============================================================================
// SECTION CARD — reusable block component
// ============================================================================

function SectionCard({
  title,
  icon,
  children,
  color = 'gray',
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  color?: 'gray' | 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
}) {
  const colors = {
    gray: 'border-gray-200 bg-white',
    blue: 'border-blue-200 bg-blue-50/30',
    green: 'border-green-200 bg-green-50/30',
    purple: 'border-purple-200 bg-purple-50/30',
    orange: 'border-orange-200 bg-orange-50/30',
    red: 'border-red-200 bg-red-50/30',
    indigo: 'border-indigo-200 bg-indigo-50/30',
  };
  return (
    <div className={`rounded-xl border ${colors[color]} overflow-hidden`}>
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3 py-2">
      <span className="text-sm text-gray-500 sm:w-40 sm:flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{String(value)}</span>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="py-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{value}</p>
    </div>
  );
}

// ============================================================================
// INFO TAB — Blocks 1-5 (identification, description, commerce, logistics)
// ============================================================================

function InfoTab({ product }: { product: ProductDetail }) {
  const t = useT();
  return (
    <div className="space-y-4">
      {/* Block 1: Identification */}
      <SectionCard title={t('productDetail.identification')} icon="🏷️" color="blue">
        <div className="divide-y divide-gray-100">
          <InfoRow label={t('productDetail.brand')} value={product.brand} />
          <InfoRow label={t('productDetail.categoryLabel')} value={product.category} />
          <InfoRow label={t('productDetail.subcategory')} value={product.subcategory} />
          <InfoRow label={t('productDetail.flavor')} value={product.flavor} />
          <InfoRow label={t('productDetail.weight')} value={product.weight} />
          <InfoRow label={t('productDetail.barcode')} value={product.barcode} />
          <InfoRow label={t('productDetail.sku')} value={product.sku_code} />
        </div>
      </SectionCard>

      {/* Block 3: Description */}
      {(product.description || product.composition || product.target_audience || product.consumption_occasion) && (
        <SectionCard title={t('productDetail.descriptionTitle')} icon="📝" color="gray">
          <div className="space-y-1 divide-y divide-gray-100">
            <TextBlock label={t('productDetail.description')} value={product.description} />
            <TextBlock label={t('productDetail.composition')} value={product.composition} />
            <TextBlock label={t('productDetail.targetAudience')} value={product.target_audience} />
            <TextBlock label={t('productDetail.consumptionOccasion')} value={product.consumption_occasion} />
          </div>
        </SectionCard>
      )}

      {/* Block 4: Commerce */}
      <SectionCard title={t('productDetail.commerce')} icon="💰" color="green">
        <div className="divide-y divide-gray-100">
          <InfoRow label={t('productDetail.rrp')} value={product.price_rrp != null ? `${new Intl.NumberFormat('ru-RU').format(product.price_rrp)} сум` : null} />
          <InfoRow label={t('productDetail.distributorPrice')} value={product.distributor_price != null ? `${new Intl.NumberFormat('ru-RU').format(product.distributor_price)} сум` : null} />
          <InfoRow label={t('productDetail.margin')} value={product.margin_percentage != null ? `${product.margin_percentage}%` : null} />
          <InfoRow label={t('productDetail.minOrder')} value={product.min_order != null ? `${product.min_order} шт.` : null} />
          <InfoRow label={t('productDetail.shelfLife')} value={product.shelf_life} />
          <InfoRow label={t('productDetail.storageConditions')} value={product.storage_conditions} />
        </div>
      </SectionCard>

      {/* Block 5: Logistics */}
      {(product.units_per_box != null || product.units_per_pallet != null) && (
        <SectionCard title={t('productDetail.logistics')} icon="📦" color="gray">
          <div className="divide-y divide-gray-100">
            <InfoRow label={t('productDetail.unitsPerBox')} value={product.units_per_box} />
            <InfoRow label={t('productDetail.unitsPerPallet')} value={product.units_per_pallet} />
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ============================================================================
// MERCH TAB — Block 6 (Merchandising / Planogram)
// ============================================================================

function MerchTab({ product }: { product: ProductDetail }) {
  const t = useT();
  const hasData = product.shelf_placement || product.display_standard || product.shelf_neighbors || product.recommended_facing != null;

  if (!hasData) {
    return <EmptyState icon="🏪" text={t('productDetail.merchEmpty')} />;
  }

  return (
    <div className="space-y-4">
      <SectionCard title={t('productDetail.planogram')} icon="📐" color="indigo">
        <div className="space-y-1 divide-y divide-gray-100">
          <TextBlock label={t('productDetail.shelfPlacement')} value={product.shelf_placement} />
          <InfoRow label={t('productDetail.recommendedFacing')} value={product.recommended_facing != null ? `${product.recommended_facing} шт.` : null} />
          <TextBlock label={t('productDetail.shelfNeighbors')} value={product.shelf_neighbors} />
          <TextBlock label={t('productDetail.displayStandard')} value={product.display_standard} />
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================================
// SALES TAB — Blocks 8-9 (Competitors + Objections)
// ============================================================================

function SalesTab({ product }: { product: ProductDetail }) {
  const t = useT();
  const hasCompetitors = product.competitors && product.competitors.length > 0;
  const hasObjections = product.common_objections && product.common_objections.length > 0;
  const hasAdvantage = !!product.competitive_advantage;

  if (!hasCompetitors && !hasObjections && !hasAdvantage) {
    return <EmptyState icon="💼" text={t('productDetail.salesEmpty')} />;
  }

  return (
    <div className="space-y-4">
      {/* Competitive advantage */}
      {hasAdvantage && (
        <SectionCard title={t('productDetail.competitiveAdvantage')} icon="⚡" color="green">
          <p className="text-sm text-gray-800 leading-relaxed">{product.competitive_advantage}</p>
        </SectionCard>
      )}

      {/* Competitors */}
      {hasCompetitors && (
        <SectionCard title={t('productDetail.competitorAnalysis')} icon="🎯" color="orange">
          <div className="space-y-3">
            {product.competitors!.map((c, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-100 p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">{c.name}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-1">{t('productDetail.strengths')}</p>
                    <p className="text-xs text-gray-600">{c.strengths}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-1">{t('productDetail.weaknesses')}</p>
                    <p className="text-xs text-gray-600">{c.weaknesses}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Objections */}
      {hasObjections && (
        <SectionCard title={t('productDetail.objections')} icon="🗣️" color="purple">
          <div className="space-y-3">
            {product.common_objections!.map((o, idx) => (
              <div key={idx} className="rounded-lg border border-gray-100 overflow-hidden">
                <div className="bg-red-50 px-4 py-2.5 border-b border-red-100">
                  <p className="text-sm text-red-800 font-medium">
                    <span className="text-red-400 mr-1.5">{t('productDetail.objection')}</span>
                    &laquo;{o.objection}&raquo;
                  </p>
                </div>
                <div className="bg-green-50 px-4 py-2.5">
                  <p className="text-sm text-green-800">
                    <span className="text-green-500 mr-1.5 font-medium">{t('productDetail.response')}</span>
                    {o.response}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ============================================================================
// HPV Tab — Block 7
// ============================================================================

function HpvTab({
  hpv,
  loading,
  onRefresh,
}: {
  hpv: ProductHPV | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const t = useT();
  if (!hpv) {
    return <EmptyState icon="💡" text={t('productDetail.hpvEmpty')} sub={t('productDetail.hpvSub')} />;
  }

  const cards = [
    { letter: 'Х', title: t('productDetail.characteristic'), value: hpv.characteristic, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', letterBg: 'bg-blue-600' },
    { letter: 'П', title: t('productDetail.advantage'), value: hpv.advantage, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', letterBg: 'bg-green-600' },
    { letter: 'В', title: t('productDetail.benefit'), value: hpv.benefit, bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', letterBg: 'bg-purple-600' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          {t('productDetail.hpvVariant')} <span className="font-semibold text-gray-700">#{hpv.variant_number}</span> из 100
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('productDetail.refreshHpv')}
        </button>
      </div>
      <div className="space-y-4">
        {cards.map((card) => (
          <div key={card.title} className={`rounded-xl border p-5 ${card.bg} ${card.border}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`w-8 h-8 rounded-lg ${card.letterBg} text-white font-bold text-sm flex items-center justify-center`}>
                {card.letter}
              </span>
              <h3 className={`text-sm font-semibold ${card.text}`}>{card.title}</h3>
            </div>
            <p className={`text-sm leading-relaxed ${card.text}`}>
              {card.value || <span className="italic opacity-60">{t('productDetail.notSpecified')}</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Test Tab
// ============================================================================

function TestTab({ questions }: { questions: ProductTest[] }) {
  const t = useT();
  if (!questions || questions.length === 0) {
    return <EmptyState icon="✅" text={t('productDetail.testEmpty')} sub={t('productDetail.testSub')} />;
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
              {q.options.map((opt: string, optIdx: number) => (
                <label key={optIdx} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                  <input type="radio" name={`question-${q.id}`} value={opt} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
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

// ============================================================================
// Helpers
// ============================================================================

function EmptyState({ icon, text, sub }: { icon: string; text: string; sub?: string }) {
  return (
    <div className="text-center py-16">
      <span className="text-5xl mb-4 block">{icon}</span>
      <p className="text-gray-500 font-medium">{text}</p>
      {sub && <p className="text-gray-400 text-sm mt-1">{sub}</p>}
    </div>
  );
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}

// ============================================================================
// Кубок NMEDOV 2026 — Modal подтверждения контента
// ============================================================================

function VerifyConfirmModal({
  productName,
  loading,
  onConfirm,
  onCancel,
}: {
  productName: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — золотой gradient */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-6 py-5 text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="text-lg font-bold text-white">Подтвердить контент продукта?</h3>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-2">
              Вы подтверждаете, что весь контент продукта
            </p>
            <p className="text-base font-semibold text-gray-900 mb-2">«{productName}»</p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">актуален и корректен:</span>
              {' '}название, бренд, категория, цена, описание, состав, конкуренты, ХПВ, тесты.
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-sm font-semibold text-emerald-900">+5 баллов в Кубок NMEDOV 2026</p>
              <p className="text-xs text-emerald-700">Засчитается в ваш месячный лидерборд</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            ⚠️ Подтверждённый продукт нельзя «переподтвердить». Если данные неверны — нажмите «Отмена» и сообщите PO.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Подтверждаем…' : '✅ Да, подтвердить (+5)'}
          </button>
        </div>
      </div>
    </div>
  );
}
