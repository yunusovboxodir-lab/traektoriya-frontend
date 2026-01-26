import { useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'https://web-production-c2613.up.railway.app';

interface AnalysisResult {
  category: string;
  overall_score: number;
  alert_level: string;
  metrics: {
    share_of_shelf: {
      our_brands_count: number;
      competitors_count: number;
      percentage: number;
      kpi_met: boolean;
    };
    golden_shelf_compliance: {
      score: number;
      issues: string[];
    };
    price_tags: {
      present: number;
      missing: number;
      score: number;
    };
    depth_score: number;
    planogram_compliance: number;
  };
  detected_products: {
    our_brands: Array<{ name: string; count: number; shelf_level: string }>;
    competitors: Array<{ name: string; count: number; shelf_level: string }>;
  };
  violations: string[];
  recommendations: Array<{
    priority: string;
    action: string;
    expected_improvement: string;
  }>;
  summary: {
    positive: string;
    negative: string;
    instant_advice: string;
  };
  processing_time_ms: number;
}

export function PlanogramPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('chocolate_paste');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      // Получаем токен
      const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123',
          employee_id: 'admin'
        })
      });
      const loginData = await loginRes.json();
      const token = loginData.access_token;

      // Отправляем фото на анализ
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('store_name', storeName || 'Тестовый магазин');
      formData.append('category', category);

      const analysisRes = await fetch(`${API_URL}/api/v1/planogram/analyze`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!analysisRes.ok) {
        throw new Error(`Ошибка анализа: ${analysisRes.status}`);
      }

      const analysisData = await analysisRes.json();
      setResult(analysisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAlertBadge = (level: string) => {
    const styles: Record<string, string> = {
      good: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800'
    };
    const labels: Record<string, string> = {
      good: '✅ Отлично',
      warning: '⚠️ Внимание',
      critical: '🔴 Критично'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[level] || styles.critical}`}>
        {labels[level] || level}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">← Назад</Link>
          <h1 className="text-xl font-bold">Planogram AI</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Левая колонка - загрузка */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">📷 Загрузить фото полки</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название магазина
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Например: YTT Xiva billur sovda"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Категория товара
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="chocolate_paste">🍫 Шоколадная паста</option>
                    <option value="noodles">🍜 Лапша</option>
                    <option value="bars">🍬 Батончики</option>
                    <option value="cookies">🍪 Печенье и вафли</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Фото полки
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                {previewUrl && (
                  <div className="mt-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full rounded-lg border"
                    />
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isLoading}
                  className={`w-full py-3 rounded-lg font-medium text-white transition ${
                    !selectedFile || isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? '🔄 Анализируем... (~30 сек)' : '🚀 Анализировать'}
                </button>

                {error && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Правая колонка - результат */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Общая оценка */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">📊 Результат анализа</h2>
                    {getAlertBadge(result.alert_level)}
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className={`text-5xl font-bold ${getScoreColor(result.overall_score)}`}>
                      {result.overall_score}
                    </div>
                    <div className="text-gray-500">
                      <div>из 100 баллов</div>
                      <div className="text-sm">Время: {(result.processing_time_ms / 1000).toFixed(1)} сек</div>
                    </div>
                  </div>
                </div>

                {/* Найденные бренды */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold mb-3">🏷️ Обнаруженные товары</h3>
                  
                  <div className="space-y-2">
                    <div className="font-medium text-green-700">Наши бренды:</div>
                    {result.detected_products.our_brands.length > 0 ? (
                      result.detected_products.our_brands.map((brand, i) => (
                        <div key={i} className="flex justify-between bg-green-50 p-2 rounded">
                          <span>{brand.name}</span>
                          <span className="font-medium">{brand.count} шт.</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm">Не обнаружено</div>
                    )}
                    
                    {result.detected_products.competitors.length > 0 && (
                      <>
                        <div className="font-medium text-red-700 mt-3">Конкуренты:</div>
                        {result.detected_products.competitors.map((brand, i) => (
                          <div key={i} className="flex justify-between bg-red-50 p-2 rounded">
                            <span>{brand.name}</span>
                            <span className="font-medium">{brand.count} шт.</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Метрики */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold mb-3">📈 Метрики</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-500">SOS (доля полки)</div>
                      <div className="text-xl font-bold">{result.metrics.share_of_shelf.percentage}%</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-500">Золотая полка</div>
                      <div className="text-xl font-bold">{result.metrics.golden_shelf_compliance.score}%</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-500">Ценники</div>
                      <div className="text-xl font-bold">{result.metrics.price_tags.score}%</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-500">Планограмма</div>
                      <div className="text-xl font-bold">{result.metrics.planogram_compliance}%</div>
                    </div>
                  </div>
                </div>

                {/* Мгновенный совет */}
                {result.summary.instant_advice && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <h3 className="font-bold mb-2">💡 Совет агенту</h3>
                    <p>{result.summary.instant_advice}</p>
                  </div>
                )}

                {/* Рекомендации */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold mb-3">📋 Рекомендации</h3>
                  <div className="space-y-3">
                    {result.recommendations.slice(0, 5).map((rec, i) => (
                      <div key={i} className={`p-3 rounded border-l-4 ${
                        rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                        rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-green-500 bg-green-50'
                      }`}>
                        <div className="font-medium">{rec.action}</div>
                        <div className="text-sm text-gray-600 mt-1">{rec.expected_improvement}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
                <div className="text-6xl mb-4">📸</div>
                <p>Загрузите фото полки для анализа</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}