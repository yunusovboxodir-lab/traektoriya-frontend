import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface CalculatorData {
  employees: number;
  currentConversion: number;
  avgCheck: number;
}

interface Feature {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  metrics: string[];
  color: string;
}

export function LandingPage() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const [calculatorData, setCalculatorData] = useState<CalculatorData>({
    employees: 50,
    currentConversion: 15,
    avgCheck: 500000,
  });

  // Intersection Observer для анимаций
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // ROI Калькулятор
  const calculateROI = () => {
    const { employees, currentConversion, avgCheck } = calculatorData;
    const improvedConversion = currentConversion * 1.4; // +40%
    const monthlyGain = ((employees * (improvedConversion - currentConversion)) / 100) * avgCheck * 20;
    const annualGain = monthlyGain * 12;
    return { improvedConversion, monthlyGain, annualGain };
  };

  const roi = calculateROI();

  const features: Feature[] = [
    {
      id: 'shelfcheck',
      icon: '📸',
      title: 'AI-анализ выкладки',
      subtitle: 'ShelfScan',
      description: 'ТП фотографирует полку → AI анализирует за 30 секунд → Оценка 0-100 по 6 критериям',
      metrics: ['30 сек анализ', '95% точность', '6 критериев'],
      color: '#028090'
    },
    {
      id: 'learning',
      icon: '📚',
      title: 'Персональное обучение',
      subtitle: 'Smart LMS',
      description: 'AI анализирует ошибки и назначает персональный микро-курс. Деградирующий бонус мотивирует учиться сразу.',
      metrics: ['5-10 мин курсы', '80% в тот же день', '+15% улучшение'],
      color: '#00A896'
    },
    {
      id: 'kpi',
      icon: '📊',
      title: 'Умные KPI',
      subtitle: 'Auto Rating',
      description: 'Единая формула: KPI = AI оценка (40%) + LMS (30%) + CRM (30%). Автоматический расчёт, прозрачность для всех.',
      metrics: ['Авторасчёт', 'Real-time', 'Прозрачность'],
      color: '#02C39A'
    },
    {
      id: 'consultant',
      icon: '🤖',
      title: 'AI-консультант',
      subtitle: '24/7 Support',
      description: 'Ответ на любой вопрос за 5 секунд. База знаний: продукты, стандарты, скрипты продаж, FAQ.',
      metrics: ['5 сек ответ', '24/7', '95% без эскалации'],
      color: '#028090'
    }
  ];

  const problems = [
    { icon: '🔍', problem: 'Нет контроля полевого персонала', solution: 'AI-фото анализ с GPS' },
    { icon: '📉', problem: 'Тренинги забываются за 2-3 дня', solution: 'Персональные курсы по ошибкам' },
    { icon: '❓', problem: 'Размытые KPI, субъективная оценка', solution: 'Автоматический расчёт KPI' },
    { icon: '⏰', problem: 'Долгий онбординг новичков', solution: 'AI-консультант 24/7' },
    { icon: '📋', problem: 'Разрыв между полем и офисом', solution: 'Real-time дашборд' }
  ];

  const stats = [
    { value: '30', unit: 'сек', label: 'Анализ фото' },
    { value: '95%', unit: '', label: 'Точность AI' },
    { value: '80%', unit: '', label: 'Обучение в тот же день' },
    { value: '40%', unit: '+', label: 'Рост конверсии' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm border-b border-slate-200 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold text-slate-800">Traektoriya</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-teal-600 transition">Возможности</a>
            <a href="#calculator" className="text-slate-600 hover:text-teal-600 transition">ROI</a>
            <a href="#contact" className="text-slate-600 hover:text-teal-600 transition">Контакты</a>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="bg-teal-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-teal-700 transition"
          >
            Войти
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        
        {/* Декоративные элементы */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
                <span className="text-teal-400 text-sm font-medium">AI-powered FMCG platform</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Управляйте полевым персоналом с помощью{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                  AI
                </span>
              </h1>
              
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Автоматизация контроля, обучения и мотивации торговых представителей. 
                Одна платформа для всей команды — от ТП до CEO.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#contact"
                  className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-teal-600 hover:to-teal-700 transition shadow-lg shadow-teal-500/25 text-center"
                >
                  Запросить демо
                </a>
                <button
                  onClick={() => navigate('/login')}
                  className="border border-slate-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-800 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  Войти в платформу
                </button>
              </div>
              
              <div className="flex items-center gap-8 mt-10 pt-10 border-t border-slate-700">
                {stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-white">
                      {stat.value}<span className="text-teal-400">{stat.unit}</span>
                    </div>
                    <div className="text-slate-400 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Hero Image / Screenshot */}
            <div className="relative hidden lg:block">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                <div className="bg-slate-900 rounded-xl overflow-hidden">
                  {/* Mock Dashboard Screenshot */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-slate-400 text-sm">Дашборд супервайзера</div>
                        <div className="text-white text-xl font-semibold">Команда: 12 ТП</div>
                      </div>
                      <div className="bg-teal-500/20 text-teal-400 px-3 py-1 rounded-full text-sm">
                        Live
                      </div>
                    </div>
                    
                    {/* Mini Cards */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: 'Средний KPI', value: '78%', colorClass: 'text-teal-400' },
                        { label: 'Визиты сегодня', value: '47/60', colorClass: 'text-emerald-400' },
                        { label: 'Обучение', value: '92%', colorClass: 'text-cyan-400' }
                      ].map((card, i) => (
                        <div key={i} className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-slate-400 text-xs mb-1">{card.label}</div>
                          <div className={`${card.colorClass} text-lg font-bold`}>{card.value}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Employee List Preview */}
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="text-slate-400 text-xs mb-2">Топ сотрудники</div>
                      {[
                        { name: 'Алишер К.', kpi: 94, status: '🟢' },
                        { name: 'Дилором М.', kpi: 89, status: '🟢' },
                        { name: 'Рустам Н.', kpi: 76, status: '🟡' }
                      ].map((emp, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span>{emp.status}</span>
                            <span className="text-white text-sm">{emp.name}</span>
                          </div>
                          <span className="text-teal-400 font-medium">{emp.kpi}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg animate-bounce">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📸</span>
                  <div>
                    <div className="text-xs text-slate-500">Новый анализ</div>
                    <div className="text-sm font-semibold text-teal-600">Оценка: 87/100</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎓</span>
                  <div>
                    <div className="text-xs text-slate-500">Курс назначен</div>
                    <div className="text-sm font-semibold text-emerald-600">+5% к KPI</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-20 bg-white" id="problems" data-animate>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Знакомые проблемы?
            </h2>
            <p className="text-xl text-slate-500">
              5 критических проблем FMCG, которые решает Traektoriya
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((item, i) => (
              <div 
                key={i}
                className={`group bg-slate-50 hover:bg-white rounded-2xl p-6 border border-slate-100 hover:border-teal-200 hover:shadow-xl transition-all duration-300 ${
                  isVisible.problems ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-red-500 text-sm font-medium mb-2">ПРОБЛЕМА</div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">{item.problem}</h3>
                <div className="flex items-center gap-2 text-teal-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{item.solution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50" id="features">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Возможности платформы
            </h2>
            <p className="text-xl text-slate-500">
              4 модуля, которые работают вместе
            </p>
          </div>
          
          {/* Feature Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {features.map((f, i) => (
              <button
                key={i}
                onClick={() => setActiveFeature(i)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                  activeFeature === i
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/25'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{f.icon}</span>
                <span>{f.title}</span>
              </button>
            ))}
          </div>
          
          {/* Active Feature Detail */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="grid lg:grid-cols-2">
              {/* Feature Info */}
              <div className="p-8 lg:p-12">
                <div 
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4"
                  style={{ backgroundColor: `${features[activeFeature].color}20`, color: features[activeFeature].color }}
                >
                  {features[activeFeature].subtitle}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
                  {features[activeFeature].title}
                </h3>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  {features[activeFeature].description}
                </p>
                
                <div className="grid grid-cols-3 gap-4">
                  {features[activeFeature].metrics.map((m, i) => (
                    <div key={i} className="text-center p-4 bg-slate-50 rounded-xl">
                      <div className="text-teal-600 font-bold text-lg">{m}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Feature Screenshot Placeholder */}
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-8 flex items-center justify-center min-h-[400px]">
                <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${features[activeFeature].color}20` }}
                    >
                      {features[activeFeature].icon}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{features[activeFeature].title}</div>
                      <div className="text-sm text-slate-500">{features[activeFeature].subtitle}</div>
                    </div>
                  </div>
                  
                  {/* Mock Content */}
                  {activeFeature === 0 && (
                    <div className="space-y-3">
                      <div className="bg-slate-100 rounded-lg p-3">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-slate-600">Общая оценка</span>
                          <span className="text-teal-600 font-bold">87/100</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-teal-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                        </div>
                      </div>
                      {['Наличие товара', 'Фейсинг', 'Ценники'].map((c, i) => (
                        <div key={i} className="flex justify-between text-sm py-1">
                          <span className="text-slate-600">{c}</span>
                          <span className="text-slate-800 font-medium">{18 + i}/20</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {activeFeature === 1 && (
                    <div className="space-y-3">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <div className="text-emerald-700 font-medium text-sm">🎯 Назначен курс</div>
                        <div className="text-slate-700 mt-1">Правила выкладки категории "Напитки"</div>
                      </div>
                      <div className="flex items-center justify-between bg-slate-100 rounded-lg p-3">
                        <span className="text-sm text-slate-600">Бонус за прохождение</span>
                        <span className="text-teal-600 font-bold">+5% KPI</span>
                      </div>
                      <div className="text-center text-sm text-orange-600">
                        ⏰ Осталось: 23:45:12 (100% бонус)
                      </div>
                    </div>
                  )}
                  
                  {activeFeature === 2 && (
                    <div className="space-y-3">
                      <div className="text-center py-4">
                        <div className="text-4xl font-bold text-teal-600">78%</div>
                        <div className="text-slate-500">Итоговый KPI</div>
                      </div>
                      <div className="space-y-2">
                        {[
                          { name: 'AI оценка', value: 82, weight: '40%' },
                          { name: 'LMS', value: 75, weight: '30%' },
                          { name: 'CRM', value: 74, weight: '30%' }
                        ].map((k, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-8">{k.weight}</span>
                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                              <div 
                                className="bg-teal-500 h-2 rounded-full transition-all"
                                style={{ width: `${k.value}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-8">{k.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {activeFeature === 3 && (
                    <div className="space-y-3">
                      <div className="bg-slate-100 rounded-lg p-3">
                        <div className="text-sm text-slate-500 mb-1">Вопрос:</div>
                        <div className="text-slate-700">"Какой минимальный фейсинг для Cola?"</div>
                      </div>
                      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                        <div className="text-sm text-teal-600 mb-1">AI ответ (2 сек):</div>
                        <div className="text-slate-700">Минимальный фейсинг Cola — 4 SKU на полку. Рекомендуемый — 6 SKU для максимального KPI.</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 bg-slate-900" id="calculator">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Рассчитайте ROI
            </h2>
            <p className="text-xl text-slate-400">
              Узнайте, сколько вы можете заработать с Traektoriya
            </p>
          </div>
          
          <div className="bg-slate-800 rounded-3xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Inputs */}
              <div className="space-y-6">
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">
                    Количество торговых представителей
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    value={calculatorData.employees}
                    onChange={(e) => setCalculatorData({ ...calculatorData, employees: +e.target.value })}
                    className="w-full accent-teal-500"
                  />
                  <div className="text-white text-2xl font-bold mt-2">{calculatorData.employees}</div>
                </div>
                
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">
                    Текущая конверсия визитов в заказы (%)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={calculatorData.currentConversion}
                    onChange={(e) => setCalculatorData({ ...calculatorData, currentConversion: +e.target.value })}
                    className="w-full accent-teal-500"
                  />
                  <div className="text-white text-2xl font-bold mt-2">{calculatorData.currentConversion}%</div>
                </div>
                
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">
                    Средний чек заказа (сум)
                  </label>
                  <input
                    type="range"
                    min="100000"
                    max="2000000"
                    step="50000"
                    value={calculatorData.avgCheck}
                    onChange={(e) => setCalculatorData({ ...calculatorData, avgCheck: +e.target.value })}
                    className="w-full accent-teal-500"
                  />
                  <div className="text-white text-2xl font-bold mt-2">
                    {calculatorData.avgCheck.toLocaleString()} сум
                  </div>
                </div>
              </div>
              
              {/* Results */}
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6">
                <div className="text-teal-100 text-sm mb-2">Прогноз с Traektoriya</div>
                
                <div className="mb-6">
                  <div className="text-white/70 text-sm">Новая конверсия</div>
                  <div className="text-white text-3xl font-bold">
                    {roi.improvedConversion.toFixed(1)}%
                    <span className="text-lg text-teal-200 ml-2">
                      (+{(roi.improvedConversion - calculatorData.currentConversion).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="text-white/70 text-sm">Дополнительно в месяц</div>
                  <div className="text-white text-3xl font-bold">
                    {Math.round(roi.monthlyGain).toLocaleString()} сум
                  </div>
                </div>
                
                <div className="pt-4 border-t border-teal-400/30">
                  <div className="text-white/70 text-sm">Дополнительно в год</div>
                  <div className="text-white text-4xl font-bold">
                    {Math.round(roi.annualGain).toLocaleString()} сум
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Для всех уровней команды
            </h2>
            <p className="text-xl text-slate-500">
              Каждая роль видит то, что нужно именно ей
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { role: 'Торговый представитель', device: '📱 Мобильное', access: 'Свои задачи и KPI', bg: 'bg-teal-100', text: 'text-teal-600' },
              { role: 'Супервайзер', device: '📱 + 💻', access: 'Команда', bg: 'bg-emerald-100', text: 'text-emerald-600' },
              { role: 'Региональный менеджер', device: '💻 Веб', access: 'Весь регион', bg: 'bg-cyan-100', text: 'text-cyan-600' },
              { role: 'Топ-менеджмент', device: '💻 Дашборд', access: 'Вся компания', bg: 'bg-blue-100', text: 'text-blue-600' }
            ].map((r, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-6 text-center hover:shadow-lg transition">
                <div className={`w-16 h-16 ${r.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-2xl">{r.device.split(' ')[0]}</span>
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">{r.role}</h3>
                <div className="text-sm text-slate-500 mb-2">{r.device}</div>
                <div className={`${r.text} font-medium`}>{r.access}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-teal-600 to-teal-700" id="contact">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Готовы увидеть в действии?
          </h2>
          <p className="text-xl text-teal-100 mb-8">
            Запросите демонстрацию и узнайте, как Traektoriya поможет вашей команде
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-teal-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-100 transition"
            >
              Запросить демо
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-teal-600 transition">
              Связаться с нами
            </button>
          </div>
          
          <div className="mt-12 pt-8 border-t border-teal-500/30">
            <div className="text-white/60 text-sm">Узбекистан, Ташкент</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-lg font-bold text-white">Traektoriya</span>
            </div>
            <div className="text-slate-400 text-sm">
              © 2026 Traektoriya. AI-платформа управления полевым персоналом.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
