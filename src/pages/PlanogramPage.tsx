import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { toast } from '../stores/toastStore';

// =============================================================================
// Types — matches new ShelfScan API response
// =============================================================================

interface CriteriaItem {
  score: number;
  max: number;
  percentage: number;
  status: string;
  issues: string[];
}

interface ShelfTask {
  id: string;
  action: string;
  kpi_bonus: number;
  priority: string;
  estimated_time: number | null;
  category: string | null;
  deadline: string | null;
  bonus_if_today: number;
  bonus_if_tomorrow: number;
  bonus_if_later: number;
}

interface GoalProgress {
  goal_id: string;
  title: string;
  previous_value: number;
  new_value: number;
  target_value: number;
  percentage: number;
  remaining: number;
  status: string;
  days_left: number | null;
}

interface NudgeItem {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  action_text: string | null;
  priority: string;
}

interface AchievementItem {
  code: string;
  title: string;
  description: string;
  icon: string;
  tier: string;
  points: number;
  just_earned: boolean;
}

interface AnalysisResult {
  analysis_id: string;
  score: number;
  alert_level: string;
  criteria: Record<string, CriteriaItem> | null;
  detected_brands: string[];
  detected_products: {
    our_brands: Array<{ name: string; count: number; shelf_level: string }>;
    competitors: Array<{ name: string; count: number; shelf_level: string }>;
  };
  category: string;
  issues: Array<{ category: string; severity: string; description: string; recommendation: string }>;
  tasks: ShelfTask[];
  summary: string;
  processing_time_ms: number;
  motivation: { message: string; potential_kpi_gain: number } | null;
  goal_progress: GoalProgress | null;
  nudges: NudgeItem[];
  achievements: AchievementItem[];
  next_actions: Array<{ type: string; title: string; urgency: string }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  chocolate_paste: '🍫 Шоколадная паста',
  noodles: '🍜 Лапша',
  bars: '🍬 Батончики',
  cookies: '🍪 Печенье и вафли',
  mixed: '📦 Смешанная',
  unknown: '❓ Не определено',
};

const CRITERIA_LABELS: Record<string, string> = {
  availability: '📦 Наличие',
  positioning: '📐 Позиция',
  facings: '🔢 Фейсинги',
  price_tags: '🏷 Ценники',
  cleanliness: '✨ Чистота',
};

export function PlanogramPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError('Файл слишком большой (макс. 20 МБ)');
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 20 * 1024 * 1024) {
        setError('Файл слишком большой (макс. 20 МБ)');
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
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
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const response = await api.post('/api/v1/shelf/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      const data = response.data?.data || response.data;
      setResult(data);

      // Show toast for achievements
      if (data.achievements?.length > 0) {
        for (const a of data.achievements) {
          toast.success(`${a.icon} Достижение: ${a.title} (+${a.points} pts)`);
        }
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(axiosErr?.response?.data?.detail || axiosErr?.message || 'Ошибка анализа');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (s: number) => s >= 85 ? 'text-green-600' : s >= 70 ? 'text-yellow-600' : 'text-red-600';
  const getScoreBg = (s: number) => s >= 85 ? 'bg-green-50 border-green-200' : s >= 70 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

  const alertBadge = (level: string) => {
    const styles: Record<string, string> = { good: 'bg-green-100 text-green-800', warning: 'bg-yellow-100 text-yellow-800', critical: 'bg-red-100 text-red-800' };
    const labels: Record<string, string> = { good: '✅ Отлично', warning: '⚠️ Внимание', critical: '🔴 Критично' };
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[level] || styles.critical}`}>{labels[level] || level}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm sm:text-base shrink-0">← Назад</Link>
          <h1 className="text-lg sm:text-xl font-bold">ShelfScan AI</h1>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">v2 + Goal-Driven</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT — Upload */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">📷 Загрузить фото полки</h2>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${selectedFile ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <input id="fileInput" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                {previewUrl ? (
                  <div>
                    <img src={previewUrl} alt="Preview" className="max-h-80 mx-auto rounded-lg shadow-md" />
                    <p className="mt-3 text-sm text-gray-500">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-5xl mb-3">📸</div>
                    <p className="text-gray-600 font-medium">Перетащите фото сюда</p>
                    <p className="text-gray-400 text-sm mt-1">или нажмите для выбора</p>
                  </div>
                )}
              </div>
              <button onClick={handleAnalyze} disabled={!selectedFile || isLoading} className={`w-full mt-4 py-3 rounded-lg font-medium text-white transition ${!selectedFile || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Анализируем... (~30 сек)
                  </span>
                ) : '🚀 Анализировать'}
              </button>
              {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}
            </div>
          </div>

          {/* RIGHT — Results */}
          <div className="space-y-5">
            {result ? (
              <>
                {/* Score Card */}
                <div className={`rounded-xl p-6 shadow-sm border ${getScoreBg(result.score)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">📊 Результат</h2>
                    {alertBadge(result.alert_level)}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className={`text-6xl font-bold ${getScoreColor(result.score)}`}>{result.score}</div>
                    <div className="text-gray-600">
                      <div className="text-lg">из 100</div>
                      <div className="text-sm text-gray-400">Время: {(result.processing_time_ms / 1000).toFixed(1)} сек</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                    <span className="text-sm text-gray-500">Категория:</span>
                    <span className="font-medium">{CATEGORY_LABELS[result.category] || result.category}</span>
                  </div>
                </div>

                {/* Criteria */}
                {result.criteria && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold mb-3">📈 Критерии</h3>
                    <div className="space-y-3">
                      {Object.entries(result.criteria).map(([key, c]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xs sm:text-sm w-20 sm:w-28 shrink-0">{CRITERIA_LABELS[key] || key}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${c.percentage >= 80 ? 'bg-green-500' : c.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${c.percentage}%` }} />
                          </div>
                          <span className="text-sm font-bold w-14 text-right">{c.score}/{c.max}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detected Products */}
                {result.detected_products && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold mb-3">🏷️ Товары</h3>
                    <div className="space-y-2">
                      <div className="font-medium text-green-700 text-sm">Наши бренды:</div>
                      {(result.detected_products.our_brands || []).map((b, i) => (
                        <div key={i} className="flex justify-between bg-green-50 p-2.5 rounded-lg text-sm">
                          <span className="font-medium">{b.name}</span>
                          <span className="font-bold text-green-700">{b.count} шт.</span>
                        </div>
                      ))}
                      {(result.detected_products.competitors || []).length > 0 && (
                        <>
                          <div className="font-medium text-red-700 text-sm mt-3">Конкуренты:</div>
                          {result.detected_products.competitors.map((b, i) => (
                            <div key={i} className="flex justify-between bg-red-50 p-2.5 rounded-lg text-sm">
                              <span>{b.name}</span>
                              <span className="font-medium text-red-700">{b.count} шт.</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Tasks with KPI Bonus */}
                {result.tasks.length > 0 && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold mb-3">📋 Задачи (+{result.tasks.reduce((s, t) => s + t.bonus_if_today, 0).toFixed(0)}% KPI)</h3>
                    <div className="space-y-3">
                      {result.tasks.map((t) => (
                        <div key={t.id} className={`p-4 rounded-lg border-l-4 ${t.priority === 'high' ? 'border-red-500 bg-red-50' : t.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' : 'border-green-500 bg-green-50'}`}>
                          <div className="font-medium text-sm">{t.action}</div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className="font-bold text-blue-600">+{t.bonus_if_today}% сегодня</span>
                            <span>+{t.bonus_if_tomorrow}% завтра</span>
                            {t.estimated_time && <span>~{t.estimated_time} мин</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Goal Progress */}
                {result.goal_progress && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <h3 className="font-bold mb-2">🎯 Прогресс по цели</h3>
                    <p className="text-sm text-gray-700 mb-2">«{result.goal_progress.title}»</p>
                    <div className="bg-white rounded-full h-5 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${result.goal_progress.percentage}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>{result.goal_progress.previous_value}% → {result.goal_progress.new_value}%</span>
                      <span>Цель: {result.goal_progress.target_value}%</span>
                    </div>
                    {result.goal_progress.days_left !== null && (
                      <p className="text-xs text-gray-400 mt-1">Осталось дней: {result.goal_progress.days_left}</p>
                    )}
                  </div>
                )}

                {/* Achievements */}
                {result.achievements.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5">
                    <h3 className="font-bold mb-3">🏅 Новые достижения!</h3>
                    {result.achievements.map((a) => (
                      <div key={a.code} className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                        <span className="text-3xl">{a.icon}</span>
                        <div>
                          <div className="font-bold text-sm">{a.title}</div>
                          <div className="text-xs text-gray-500">{a.description} — +{a.points} pts</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nudges */}
                {result.nudges.length > 0 && (
                  <div className="space-y-2">
                    {result.nudges.map((n) => (
                      <div key={n.id} className={`rounded-xl p-4 border ${n.type === 'alert' ? 'bg-red-50 border-red-200' : n.type === 'celebration' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="font-medium text-sm">{n.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{n.message}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Motivation */}
                {result.motivation && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5">
                    <h3 className="font-bold mb-2">💪 Мотивация</h3>
                    <p className="text-sm text-gray-700">{result.motivation.message}</p>
                    {result.motivation.potential_kpi_gain > 0 && (
                      <p className="text-sm font-bold text-purple-700 mt-2">Потенциал: +{result.motivation.potential_kpi_gain}% KPI</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl p-12 shadow-sm text-center text-gray-500">
                <div className="text-6xl mb-4">📸</div>
                <p className="text-lg">Загрузите фото полки для анализа</p>
                <p className="text-sm mt-2 text-gray-400">AI оценит выкладку, даст задачи с KPI-бонусом и обновит цели</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
