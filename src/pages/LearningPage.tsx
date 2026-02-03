import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { 
  territories, 
  modules, 
  getModulesByTerritory,
  products,
  productCategories,
  getProductsByCategory,
  type Territory,
  type Module,
  type Product,
  QUIZ_PASS_THRESHOLD
} from '../data';

// ===========================================
// ТИПЫ
// ===========================================
type Language = 'ru' | 'uz';
type ViewMode = 'map' | 'library';

interface UserProgress {
  completedSteps: number[];
  unlockedProducts: string[];
  totalPoints: number;
  badges: string[];
  lastActivity: string;
}

// ===========================================
// ХУК ПРОГРЕССА
// ===========================================
function useProgress(visitorId: string) {
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem(`progress_160_${visitorId}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      completedSteps: [],
      unlockedProducts: [],
      totalPoints: 0,
      badges: [],
      lastActivity: new Date().toISOString()
    };
  });

  useEffect(() => {
    localStorage.setItem(`progress_160_${visitorId}`, JSON.stringify(progress));
  }, [progress, visitorId]);

  return [progress, setProgress] as const;
}

// ===========================================
// КОМПОНЕНТ: КАРТОЧКА ТЕРРИТОРИИ
// ===========================================
function TerritoryCard({ 
  territory, 
  unlockedCount,
  isExpanded,
  onToggle,
  onModuleClick,
  language 
}: {
  territory: Territory;
  unlockedCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onModuleClick: (module: Module) => void;
  language: Language;
}) {
  const territoryModules = getModulesByTerritory(territory.id);
  const isCompleted = unlockedCount >= territory.requiredCards;
  const progress = Math.min((unlockedCount / territory.requiredCards) * 100, 100);

  return (
    <div className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
      isExpanded ? 'ring-2 ring-offset-2' : ''
    }`} style={{ 
      borderColor: territory.color,
      boxShadow: isExpanded ? `0 0 20px ${territory.color}40` : undefined
    }}>
      {/* Заголовок территории */}
      <div 
        className={`p-5 cursor-pointer bg-gradient-to-r ${territory.gradient}`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{territory.icon}</div>
            <div>
              <h3 className="font-bold text-xl">
                {language === 'ru' ? territory.title : territory.titleUz}
              </h3>
              <p className="text-sm opacity-80">
                {language === 'ru' 
                  ? `Шаги ${territory.stepsRange[0]}-${territory.stepsRange[1]}`
                  : `Qadamlar ${territory.stepsRange[0]}-${territory.stepsRange[1]}`
                }
              </p>
            </div>
          </div>
          <div className="text-right flex items-center gap-4">
            {isCompleted ? (
              <div className="text-4xl">⭐</div>
            ) : (
              <div className="text-sm">
                <div className="font-bold text-lg">{unlockedCount}/{territory.requiredCards}</div>
                <div className="opacity-80">{language === 'ru' ? 'карточек' : 'kartochka'}</div>
              </div>
            )}
            <div className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </div>
        </div>
        
        {/* Прогресс-бар */}
        <div className="mt-4 h-2 bg-white/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Модули (раскрывающиеся) */}
      {isExpanded && (
        <div className="bg-white p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {territoryModules.map(module => (
              <button
                key={module.id}
                onClick={() => onModuleClick(module)}
                className="flex items-center gap-3 p-4 rounded-xl border-2 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
              >
                <div className="text-2xl">{module.icon}</div>
                <div className="flex-1">
                  <div className="font-medium">
                    {language === 'ru' ? module.title : module.titleUz}
                  </div>
                  <div className="text-xs text-gray-500">
                    {language === 'ru' 
                      ? `Шаги ${module.stepsRange[0]}-${module.stepsRange[1]}`
                      : `Qadamlar ${module.stepsRange[0]}-${module.stepsRange[1]}`
                    }
                  </div>
                </div>
                <div className="text-gray-400">→</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// КОМПОНЕНТ: КАРТА КОМПЕТЕНЦИЙ
// ===========================================
function CompetencyMap({ 
  unlockedProducts,
  language,
  onModuleClick
}: {
  unlockedProducts: string[];
  language: Language;
  onModuleClick: (module: Module) => void;
}) {
  const [expandedTerritory, setExpandedTerritory] = useState<number | null>(1);
  const unlockedCount = unlockedProducts.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          🗺️ {language === 'ru' ? 'Карта Компетенций' : 'Kompetensiya Xaritasi'}
        </h2>
        <div className="text-sm text-gray-500">
          {language === 'ru' 
            ? `Разблокировано ${unlockedCount}/26 карточек`
            : `${unlockedCount}/26 kartochka ochilgan`
          }
        </div>
      </div>

      {territories.map(territory => (
        <TerritoryCard
          key={territory.id}
          territory={territory}
          unlockedCount={unlockedCount}
          isExpanded={expandedTerritory === territory.id}
          onToggle={() => setExpandedTerritory(
            expandedTerritory === territory.id ? null : territory.id
          )}
          onModuleClick={onModuleClick}
          language={language}
        />
      ))}
    </div>
  );
}

// ===========================================
// КОМПОНЕНТ: КАРТОЧКА ПРОДУКТА
// ===========================================
function ProductCard({ 
  product, 
  isUnlocked,
  onStartQuiz,
  language 
}: {
  product: Product;
  isUnlocked: boolean;
  onStartQuiz: () => void;
  language: Language;
}) {
  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all ${
      isUnlocked 
        ? 'border-green-400 bg-green-50' 
        : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg'
    }`}>
      {/* Заголовок */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-bold">
              {language === 'ru' ? product.name : product.nameUz}
            </h4>
            <p className="text-xs text-gray-500">{product.sku}</p>
          </div>
          {isUnlocked ? (
            <span className="text-2xl">✅</span>
          ) : (
            <span className="text-2xl">🔒</span>
          )}
        </div>

        {/* Информация */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">{language === 'ru' ? 'Бренд:' : 'Brend:'}</span>
            <span className="font-medium">{product.brand}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{language === 'ru' ? 'Вес:' : 'Vazn:'}</span>
            <span className="font-medium">{product.weight}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{language === 'ru' ? 'Цена:' : 'Narx:'}</span>
            <span className="font-medium text-green-600">{product.price.toLocaleString()} сум</span>
          </div>
        </div>

        {/* USP */}
        {isUnlocked && (
          <div className="mt-3 p-2 bg-blue-50 rounded-lg text-xs">
            <div className="font-medium text-blue-800 mb-1">
              {language === 'ru' ? 'Преимущество:' : 'Afzallik:'}
            </div>
            <div className="text-blue-600">
              {language === 'ru' ? product.usp : product.uspUz}
            </div>
          </div>
        )}

        {/* Бейджи */}
        <div className="flex gap-2 mt-3">
          {product.isBestseller && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
              ⭐ Бестселлер
            </span>
          )}
          {product.isNew && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              🆕 Новинка
            </span>
          )}
        </div>
      </div>

      {/* Кнопка */}
      <div className="p-3 bg-gray-50 border-t">
        {isUnlocked ? (
          <button
            onClick={onStartQuiz}
            className="w-full py-2 text-sm text-green-600 font-medium"
          >
            👁️ {language === 'ru' ? 'Просмотреть' : 'Ko\'rish'}
          </button>
        ) : (
          <button
            onClick={onStartQuiz}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            🧪 {language === 'ru' ? 'Пройти тест' : 'Testni topshirish'}
          </button>
        )}
      </div>
    </div>
  );
}

// ===========================================
// КОМПОНЕНТ: БИБЛИОТЕКА ПРОДУКТОВ
// ===========================================
function ProductLibrary({ 
  unlockedProducts,
  onStartQuiz,
  language 
}: {
  unlockedProducts: string[];
  onStartQuiz: (product: Product) => void;
  language: Language;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : getProductsByCategory(selectedCategory as any);

  const unlockedCount = unlockedProducts.length;

  return (
    <div>
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          📚 {language === 'ru' ? 'Библиотека Продуктов' : 'Mahsulotlar Kutubxonasi'}
        </h2>
        <div className="text-sm">
          <span className="text-green-600 font-bold">{unlockedCount}</span>
          <span className="text-gray-400"> / 26</span>
        </div>
      </div>

      {/* Общий прогресс */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
        <div className="flex items-center justify-between mb-2">
          <span>{language === 'ru' ? 'Прогресс разблокировки' : 'Ochish jarayoni'}</span>
          <span className="font-bold">{Math.round((unlockedCount / 26) * 100)}%</span>
        </div>
        <div className="h-3 bg-white/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${(unlockedCount / 26) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs opacity-80">
          <span>🌱 7</span>
          <span>⚔️ 13</span>
          <span>🎯 20</span>
          <span>👑 26</span>
        </div>
      </div>

      {/* Фильтр по категориям */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          📦 {language === 'ru' ? 'Все' : 'Hammasi'} ({products.length})
        </button>
        {productCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {cat.icon} {language === 'ru' ? cat.title : cat.titleUz} ({getProductsByCategory(cat.id).length})
          </button>
        ))}
      </div>

      {/* Сетка продуктов */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            isUnlocked={unlockedProducts.includes(product.id)}
            onStartQuiz={() => onStartQuiz(product)}
            language={language}
          />
        ))}
      </div>
    </div>
  );
}

// ===========================================
// КОМПОНЕНТ: ТЕСТ ПО ПРОДУКТУ
// ===========================================
function ProductQuizModal({ 
  product, 
  onComplete, 
  onClose,
  language 
}: {
  product: Product;
  onComplete: (passed: boolean) => void;
  onClose: () => void;
  language: Language;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const questions = product.quiz;
  const question = questions[currentQuestion];
  const correctCount = answers.filter((a, i) => a === questions[i].correctAnswer).length;
  const passed = correctCount >= QUIZ_PASS_THRESHOLD;

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(() => setShowResults(true), 300);
    }
  };

  const handleFinish = () => {
    onComplete(passed);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden">
        {/* Заголовок */}
        <div className="p-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">
                {language === 'ru' ? 'Тест по продукту' : 'Mahsulot testi'}
              </p>
              <h3 className="font-bold text-lg">
                {language === 'ru' ? product.name : product.nameUz}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          
          {/* Прогресс */}
          {!showResults && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{language === 'ru' ? 'Вопрос' : 'Savol'} {currentQuestion + 1}/5</span>
                <span>{language === 'ru' ? 'Нужно 4 из 5' : '5 tadan 4 tasi kerak'}</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all"
                  style={{ width: `${((currentQuestion + 1) / 5) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Контент */}
        <div className="p-6">
          {!showResults ? (
            <>
              {/* Вопрос */}
              <h4 className="font-bold text-lg mb-4">
                {language === 'ru' ? question.question : question.questionUz}
              </h4>

              {/* Варианты ответа */}
              <div className="space-y-3">
                {(language === 'ru' ? question.options : question.optionsUz).map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={answers.length > currentQuestion}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      answers[currentQuestion] === index
                        ? answers[currentQuestion] === question.correctAnswer
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <span className="font-medium mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Результаты */
            <div className="text-center">
              <div className={`text-6xl mb-4 ${passed ? 'animate-bounce' : ''}`}>
                {passed ? '🎉' : '😔'}
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {passed 
                  ? (language === 'ru' ? 'Отлично!' : 'Ajoyib!')
                  : (language === 'ru' ? 'Попробуйте ещё раз' : 'Yana urinib ko\'ring')
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'ru' 
                  ? `Правильных ответов: ${correctCount} из 5`
                  : `To'g'ri javoblar: 5 tadan ${correctCount} ta`
                }
              </p>
              
              {passed && (
                <div className="p-4 bg-green-50 rounded-xl mb-4">
                  <p className="text-green-700 font-medium">
                    ✅ {language === 'ru' 
                      ? 'Карточка разблокирована!'
                      : 'Kartochka ochildi!'
                    }
                  </p>
                </div>
              )}

              <button
                onClick={handleFinish}
                className={`w-full py-3 rounded-xl font-bold text-white ${
                  passed 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {passed 
                  ? (language === 'ru' ? 'Продолжить' : 'Davom etish')
                  : (language === 'ru' ? 'Попробовать снова' : 'Yana urinish')
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// КОМПОНЕНТ: ПРОСМОТР ПРОДУКТА
// ===========================================
function ProductViewModal({ 
  product, 
  onClose,
  language 
}: {
  product: Product;
  onClose: () => void;
  language: Language;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="p-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">{product.brand}</p>
              <h3 className="font-bold text-lg">
                {language === 'ru' ? product.name : product.nameUz}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="p-6 space-y-4">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">SKU</div>
              <div className="font-medium">{product.sku}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">
                {language === 'ru' ? 'Вес' : 'Vazn'}
              </div>
              <div className="font-medium">{product.weight}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">
                {language === 'ru' ? 'РРЦ' : 'TChN'}
              </div>
              <div className="font-bold text-green-600">{product.price.toLocaleString()} сум</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">
                {language === 'ru' ? 'Срок годности' : 'Saqlash muddati'}
              </div>
              <div className="font-medium">{product.shelfLife}</div>
            </div>
          </div>

          {/* USP */}
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="text-sm font-medium text-blue-800 mb-2">
              💎 {language === 'ru' ? 'Уникальное преимущество (USP)' : 'Noyob afzallik (USP)'}
            </div>
            <div className="text-blue-700">
              {language === 'ru' ? product.usp : product.uspUz}
            </div>
          </div>

          {/* Целевая аудитория */}
          <div className="p-4 bg-purple-50 rounded-xl">
            <div className="text-sm font-medium text-purple-800 mb-2">
              🎯 {language === 'ru' ? 'Целевая аудитория' : 'Maqsadli auditoriya'}
            </div>
            <div className="text-purple-700">
              {language === 'ru' ? product.targetAudience : product.targetAudienceUz}
            </div>
          </div>

          {/* Скрипт продаж */}
          <div className="p-4 bg-orange-50 rounded-xl">
            <div className="text-sm font-medium text-orange-800 mb-2">
              💬 {language === 'ru' ? 'Скрипт продажи' : 'Savdo skripti'}
            </div>
            <div className="text-orange-700 italic">
              "{language === 'ru' ? product.salesScript : product.salesScriptUz}"
            </div>
          </div>

          {/* Условия хранения */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-sm font-medium text-gray-700 mb-2">
              🌡️ {language === 'ru' ? 'Условия хранения' : 'Saqlash shartlari'}
            </div>
            <div className="text-gray-600">
              {language === 'ru' ? product.storageConditions : product.storageConditionsUz}
            </div>
          </div>
        </div>

        {/* Кнопка закрытия */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition"
          >
            {language === 'ru' ? 'Закрыть' : 'Yopish'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ===========================================
export function LearningPage() {
  const { user, logout, isSupervisor } = useAuth();
  const navigate = useNavigate();
  
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [language, setLanguage] = useState<Language>('ru');
  const [progress, setProgress] = useProgress(user?.id || 'guest');
  const [quizProduct, setQuizProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  // Редирект если не авторизован
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  // Обработчик начала теста
  const handleStartQuiz = (product: Product) => {
    if (progress.unlockedProducts.includes(product.id)) {
      setViewProduct(product);
    } else {
      setQuizProduct(product);
    }
  };

  // Обработчик завершения теста
  const handleQuizComplete = (passed: boolean) => {
    if (passed && quizProduct) {
      setProgress(prev => ({
        ...prev,
        unlockedProducts: [...prev.unlockedProducts, quizProduct.id],
        totalPoints: prev.totalPoints + 50,
        lastActivity: new Date().toISOString()
      }));
    }
    setQuizProduct(null);
  };

  // Обработчик выхода
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unlockedCount = progress.unlockedProducts.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Логотип и название */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">🗺️</span>
              <div>
                <h1 className="font-bold text-lg">
                  {language === 'ru' ? '160 шагов к эксперту' : '160 qadam ekspertga'}
                </h1>
                <p className="text-xs text-gray-500">N'Medov Training Platform</p>
              </div>
            </div>

            {/* Навигация */}
            <div className="flex items-center gap-4">
              {/* Переключатель режима */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    viewMode === 'map' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                  }`}
                >
                  🗺️ {language === 'ru' ? 'Карта' : 'Xarita'}
                </button>
                <button
                  onClick={() => setViewMode('library')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    viewMode === 'library' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                  }`}
                >
                  📚 {language === 'ru' ? 'Продукты' : 'Mahsulotlar'}
                </button>
              </div>

              {/* Язык */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('ru')}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    language === 'ru' ? 'bg-white shadow' : ''
                  }`}
                >
                  🇷🇺
                </button>
                <button
                  onClick={() => setLanguage('uz')}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    language === 'uz' ? 'bg-white shadow' : ''
                  }`}
                >
                  🇺🇿
                </button>
              </div>

              {/* Профиль */}
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="text-right">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500">
                    {isSupervisor 
                      ? (language === 'ru' ? 'Супервайзер' : 'Supervayzer')
                      : (language === 'ru' ? 'Агент' : 'Agent')
                    }
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                  title={language === 'ru' ? 'Выйти' : 'Chiqish'}
                >
                  🚪
                </button>
              </div>

              {/* Баллы */}
              <div className="flex items-center gap-2 pl-4 border-l">
                <span className="text-2xl">⭐</span>
                <span className="font-bold text-lg">{progress.totalPoints}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Статистика */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{unlockedCount}/26</div>
              <div className="text-xs opacity-80">
                {language === 'ru' ? 'Карточек' : 'Kartochka'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{progress.completedSteps.length}/160</div>
              <div className="text-xs opacity-80">
                {language === 'ru' ? 'Уроков' : 'Darslar'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {territories.filter(t => unlockedCount >= t.requiredCards).length}/4
              </div>
              <div className="text-xs opacity-80">
                {language === 'ru' ? 'Звёзд' : 'Yulduzlar'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{progress.totalPoints}</div>
              <div className="text-xs opacity-80">
                {language === 'ru' ? 'Баллов' : 'Ball'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'map' ? (
          <CompetencyMap
            unlockedProducts={progress.unlockedProducts}
            language={language}
            onModuleClick={(module) => {
              // TODO: Открыть модуль
              console.log('Open module:', module);
            }}
          />
        ) : (
          <ProductLibrary
            unlockedProducts={progress.unlockedProducts}
            onStartQuiz={handleStartQuiz}
            language={language}
          />
        )}
      </main>

      {/* Модальное окно теста */}
      {quizProduct && (
        <ProductQuizModal
          product={quizProduct}
          onComplete={handleQuizComplete}
          onClose={() => setQuizProduct(null)}
          language={language}
        />
      )}

      {/* Модальное окно просмотра продукта */}
      {viewProduct && (
        <ProductViewModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
          language={language}
        />
      )}
    </div>
  );
}
