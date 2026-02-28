import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useT, useLangStore } from '../stores/langStore';
import { useToastStore } from '../stores/toastStore';
import { shelfApi, type ShelfAnalysis, type ShelfAnalysisDetail } from '../api/shelf';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALERT_CONFIG = {
  good:     { badge: 'bg-green-100 text-green-700',  score: 'text-green-600',  icon: '✅' },
  warning:  { badge: 'bg-amber-100 text-amber-700',  score: 'text-amber-600',  icon: '⚠️' },
  critical: { badge: 'bg-red-100 text-red-700',      score: 'text-red-600',    icon: '🔴' },
} as const;

const CRITERIA_META: Record<string, { ru: string; uz: string; max: number }> = {
  availability: { ru: 'Наличие товара',  uz: 'Mahsulot mavjudligi', max: 30 },
  positioning:  { ru: 'Расстановка',     uz: 'Joylashuv',           max: 25 },
  facings:      { ru: 'Фейсинги',        uz: 'Feysing',             max: 20 },
  price_tags:   { ru: 'Ценники',         uz: 'Narx belgilari',      max: 15 },
  cleanliness:  { ru: 'Порядок',         uz: 'Tartib',              max: 10 },
};

const CRITERIA_ORDER = ['availability', 'positioning', 'facings', 'price_tags', 'cleanliness'];
const ADMIN_ROLES = ['superadmin', 'commercial_dir', 'admin', 'supervisor'];

// ---------------------------------------------------------------------------
// AnalysisCard
// ---------------------------------------------------------------------------

interface AnalysisCardProps {
  analysis: ShelfAnalysis;
  lang: string;
  t: (key: string) => string;
  onSelect: (a: ShelfAnalysis) => void;
}

function AnalysisCard({ analysis, lang, t, onSelect }: AnalysisCardProps) {
  const alertKey = (analysis.alert_level ?? 'warning') as keyof typeof ALERT_CONFIG;
  const cfg = ALERT_CONFIG[alertKey] ?? ALERT_CONFIG.warning;
  const brands = analysis.products_found?.our_brands?.map(b => b.name) ?? [];

  const dateStr = new Date(analysis.created_at).toLocaleDateString(
    lang === 'uz' ? 'uz-UZ' : 'ru-RU',
    { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-gray-800 text-sm truncate">
          {analysis.outlet_name || t('shelfCorrections.unknownOutlet')}
        </span>
        <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
          {cfg.icon} {alertKey}
        </span>
      </div>

      {/* Score row */}
      <div className="flex items-end gap-3">
        <span className={`text-4xl font-bold leading-none ${cfg.score}`}>{analysis.score}</span>
        <span className="text-gray-400 text-sm mb-1">/100</span>
        {analysis.category && (
          <span className="ml-auto text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            {analysis.category}
          </span>
        )}
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {brands.slice(0, 4).map(b => (
            <span key={b} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {b}
            </span>
          ))}
          {brands.length > 4 && (
            <span className="text-xs text-gray-400">+{brands.length - 4}</span>
          )}
        </div>
      )}

      {/* Date + corrected badge */}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs text-gray-400">📅 {dateStr}</span>
        {analysis.corrected_at && (
          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
            ✅ {t('shelfCorrections.correctedBadge')}
          </span>
        )}
      </div>

      {/* Action button */}
      <button
        onClick={() => onSelect(analysis)}
        className="w-full py-2 text-sm font-medium rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
      >
        {analysis.corrected_at ? '🔍 ' : '✏️ '}
        {t('shelfCorrections.correctBtn')}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CorrectionModal
// ---------------------------------------------------------------------------

interface CorrectionModalProps {
  analysis: ShelfAnalysis;
  lang: string;
  t: (key: string) => string;
  onClose: () => void;
  onSaved: (updated: ShelfAnalysis) => void;
}

function CorrectionModal({ analysis, lang, t, onClose, onSaved }: CorrectionModalProps) {
  const addToast = useToastStore(s => s.addToast);

  const [detail, setDetail] = useState<ShelfAnalysisDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  const [correctedScore, setCorrectedScore] = useState<string>(
    analysis.corrected_score !== null ? String(analysis.corrected_score) : String(analysis.score),
  );
  const [correctedBrands, setCorrectedBrands] = useState<string[]>(
    analysis.corrected_brands ??
    analysis.products_found?.our_brands?.map(b => b.name) ??
    [],
  );
  const [brandInput, setBrandInput] = useState('');
  const [feedback, setFeedback] = useState(analysis.correction_feedback ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    shelfApi.getDetail(analysis.id)
      .then(res => setDetail(res.data))
      .catch(() => { /* detail is optional, list fields are sufficient */ })
      .finally(() => setLoadingDetail(false));
  }, [analysis.id]);

  const addBrand = () => {
    const trimmed = brandInput.trim().toUpperCase();
    if (trimmed && !correctedBrands.includes(trimmed)) {
      setCorrectedBrands(prev => [...prev, trimmed]);
    }
    setBrandInput('');
  };

  const removeBrand = (brand: string) => {
    setCorrectedBrands(prev => prev.filter(b => b !== brand));
  };

  const handleSave = async () => {
    const scoreNum = parseInt(correctedScore, 10);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      addToast('error', 'Оценка должна быть от 0 до 100');
      return;
    }
    setSaving(true);
    try {
      await shelfApi.correct(analysis.id, {
        corrected_score: scoreNum,
        corrected_brands: correctedBrands.length > 0 ? correctedBrands : undefined,
        feedback: feedback.trim() || undefined,
      });
      addToast('success', t('shelfCorrections.successMsg'));
      onSaved({
        ...analysis,
        corrected_score: scoreNum,
        corrected_brands: correctedBrands,
        correction_feedback: feedback,
        corrected_at: new Date().toISOString(),
      });
      onClose();
    } catch {
      addToast('error', 'Ошибка сохранения коррекции');
    } finally {
      setSaving(false);
    }
  };

  const alertKey = (analysis.alert_level ?? 'warning') as keyof typeof ALERT_CONFIG;
  const cfg = ALERT_CONFIG[alertKey] ?? ALERT_CONFIG.warning;

  const dateStr = new Date(analysis.created_at).toLocaleDateString(
    lang === 'uz' ? 'uz-UZ' : 'ru-RU',
    { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  );

  // Criteria to show — prefer detail.criteria, fall back to analysis.criteria_scores
  const detectedBrands: string[] = detail?.detected_brands ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              {analysis.outlet_name || t('shelfCorrections.unknownOutlet')}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{dateStr}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* ── AI Analysis ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {t('shelfCorrections.aiAnalysis')}
            </h3>

            {/* Score + badge */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-3xl font-bold ${cfg.score}`}>{analysis.score}</span>
              <span className="text-gray-400 text-lg">/100</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${cfg.badge}`}>
                {cfg.icon} {alertKey}
              </span>
            </div>

            {/* Criteria progress bars */}
            {loadingDetail ? (
              <div className="space-y-2">
                {CRITERIA_ORDER.map(k => (
                  <div key={k} className="h-6 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : detail?.criteria ? (
              <div className="space-y-2">
                {CRITERIA_ORDER.map(k => {
                  const c = detail.criteria[k];
                  if (!c) return null;
                  const meta = CRITERIA_META[k];
                  const pct = c.max > 0 ? Math.round((c.score / c.max) * 100) : 0;
                  const barColor =
                    c.status === 'ok' ? 'bg-green-500'
                    : c.status === 'warning' ? 'bg-amber-400'
                    : 'bg-red-500';
                  return (
                    <div key={k} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-36 flex-shrink-0">
                        {meta ? (lang === 'uz' ? meta.uz : meta.ru) : k}
                      </span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right flex-shrink-0">
                        {c.score}/{c.max}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : analysis.criteria_scores ? (
              <div className="space-y-2">
                {Object.entries(analysis.criteria_scores).map(([k, score]) => {
                  const meta = CRITERIA_META[k];
                  const max = meta?.max ?? 30;
                  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
                  return (
                    <div key={k} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-36 flex-shrink-0">
                        {meta ? (lang === 'uz' ? meta.uz : meta.ru) : k}
                      </span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right flex-shrink-0">
                        {score}/{max}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Detected brands */}
            {detectedBrands.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1">
                <span className="text-xs text-gray-400 mr-1">Бренды AI:</span>
                {detectedBrands.map(b => (
                  <span key={b} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {b}
                  </span>
                ))}
              </div>
            )}

            {/* Summary */}
            {analysis.summary && (
              <p className="mt-3 text-sm text-gray-400 italic">{analysis.summary}</p>
            )}
          </section>

          {/* ── Correction Form ── */}
          <section className="border-t border-gray-100 pt-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              {t('shelfCorrections.adminCorrection')}
            </h3>

            {/* Corrected score */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('shelfCorrections.correctedScore')} (0–100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={correctedScore}
                onChange={e => setCorrectedScore(e.target.value)}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Real brands */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('shelfCorrections.realBrands')}
              </label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
                {correctedBrands.map(b => (
                  <span
                    key={b}
                    className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                  >
                    {b}
                    <button
                      onClick={() => removeBrand(b)}
                      className="hover:text-red-500 ml-0.5 font-bold leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={brandInput}
                  onChange={e => setBrandInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBrand(); } }}
                  placeholder={t('shelfCorrections.addBrand')}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  onClick={addBrand}
                  className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('shelfCorrections.feedback')}
              </label>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {t('shelfCorrections.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? '...' : `💾 ${t('shelfCorrections.save')}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ShelfCorrectionPage
// ---------------------------------------------------------------------------

type FilterType = 'all' | 'pending' | 'corrected';

export function ShelfCorrectionPage() {
  const user = useAuthStore(s => s.user);
  const t = useT();
  const lang = useLangStore(s => s.lang);
  const addToast = useToastStore(s => s.addToast);

  const [analyses, setAnalyses] = useState<ShelfAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedAnalysis, setSelectedAnalysis] = useState<ShelfAnalysis | null>(null);

  // Role guard
  if (user && !ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="p-6 text-center text-gray-500 mt-20">
        Нет доступа к этой странице
      </div>
    );
  }

  useEffect(() => {
    setLoading(true);
    shelfApi.list({ limit: 100 })
      .then(res => setAnalyses(res.data.items))
      .catch(() => addToast('error', 'Ошибка загрузки анализов'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pendingCount = analyses.filter(a => !a.corrected_at).length;
  const correctedCount = analyses.filter(a => !!a.corrected_at).length;

  const filtered = analyses.filter(a => {
    if (filter === 'pending') return !a.corrected_at;
    if (filter === 'corrected') return !!a.corrected_at;
    return true;
  });

  const handleSaved = (updated: ShelfAnalysis) => {
    setAnalyses(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all',       label: t('shelfCorrections.all') },
    { key: 'pending',   label: t('shelfCorrections.pending') },
    { key: 'corrected', label: t('shelfCorrections.corrected') },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t('shelfCorrections.title')}
      </h1>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{analyses.length}</div>
          <div className="text-sm text-gray-500 mt-1">{t('shelfCorrections.all')}</div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          <div className="text-sm text-gray-500 mt-1">{t('shelfCorrections.pending')}</div>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{correctedCount}</div>
          <div className="text-sm text-gray-500 mt-1">{t('shelfCorrections.corrected')}</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {filterTabs.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              filter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
            {f.key === 'pending' && pendingCount > 0 && (
              <span className="ml-2 bg-amber-400 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          Нет анализов для отображения
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => (
            <AnalysisCard
              key={a.id}
              analysis={a}
              lang={lang}
              t={t}
              onSelect={setSelectedAnalysis}
            />
          ))}
        </div>
      )}

      {/* Correction modal */}
      {selectedAnalysis && (
        <CorrectionModal
          analysis={selectedAnalysis}
          lang={lang}
          t={t}
          onClose={() => setSelectedAnalysis(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
