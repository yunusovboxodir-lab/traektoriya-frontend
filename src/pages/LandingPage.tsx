import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface CalculatorData {
  employees: number;
  currentConversion: number;
  avgCheck: number;
}

interface Module {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  metrics: string[];
}

// Палитра платформы (см. src/index.css)
const C = {
  bgPrimary: '#0D0F14',
  bgSurface: '#141720',
  bgCard: '#1A1F2E',
  bgElevated: '#20263A',
  border: '#252B3B',
  borderStrong: '#323A50',
  textPrimary: '#E8EAF0',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  gold: '#C8A84B',
  goldDim: '#8a7332',
  teal: '#2DD4BF',
  purple: '#A78BFA',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
};

export function LandingPage() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState(0);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const [calculatorData, setCalculatorData] = useState<CalculatorData>({
    employees: 50,
    currentConversion: 15,
    avgCheck: 500000,
  });

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

    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // ROI калькулятор — оценочные коэффициенты, не привязанные к конкретному клиенту
  const calculateROI = () => {
    const { employees, currentConversion, avgCheck } = calculatorData;
    const improvedConversion = currentConversion * 1.4;
    const monthlyGain =
      ((employees * (improvedConversion - currentConversion)) / 100) * avgCheck * 20;
    const annualGain = monthlyGain * 12;
    return { improvedConversion, monthlyGain, annualGain };
  };
  const roi = calculateROI();

  // 8 модулей платформы — актуальный стек 2026
  const modules: Module[] = [
    {
      id: 'shelfscan',
      icon: '📸',
      title: 'ShelfScan',
      subtitle: 'AI-анализ выкладки',
      description:
        'ТП фотографирует полку → Claude Vision (Opus + Extended Thinking) анализирует за 30 секунд → оценка 0-100 по 5 критериям с GPS и timestamp.',
      metrics: ['30 сек анализ', '5 критериев', 'GPS + время'],
    },
    {
      id: 'lms',
      icon: '🎓',
      title: 'Smart LMS',
      subtitle: 'Микро-обучение по Bloom',
      description:
        'AI-генератор уроков (4-шаговый pipeline: Outline → Content → Exercises → Quality Gate) создаёт персональные курсы 15-30 мин с упражнениями 10 типов.',
      metrics: ['10 типов задач', 'Bloom revised', 'RU + UZ'],
    },
    {
      id: 'pulse',
      icon: '📊',
      title: 'Pulse-движок',
      subtitle: 'Сквозные KPI',
      description:
        'Единая формула: AI-оценка (40%) + LMS (30%) + CRM (30%). Автоматические рейтинги real-time. Аналитика месяц / квартал / полугодие / год.',
      metrics: ['Авторасчёт', 'Real-time', '4 горизонта'],
    },
    {
      id: 'consultant',
      icon: '🤖',
      title: 'AI-консультант',
      subtitle: '24/7 RAG-ассистент',
      description:
        'RAG (pgvector + BGE-M3) поверх корпоративных стандартов. Ответ на любой вопрос за 5 секунд: продукты, скрипты, ХПВ, регламенты.',
      metrics: ['5 сек ответ', '24/7', 'RAG-grounded'],
    },
    {
      id: 'activities',
      icon: '🎯',
      title: 'Активности',
      subtitle: 'Оффлайн-программы',
      description:
        'Тренинги в зале с QR-проектором: ADKAR, ДСПМ, 7 Qadam, РМ-Детектив. PRE/POST-тесты на телефоне → live-дашборд роста ДО/ПОСЛЕ.',
      metrics: ['QR на проекторе', 'PRE → POST', 'Live-дашборд'],
    },
    {
      id: 'training-plan',
      icon: '🗺️',
      title: 'Smart Training Plan',
      subtitle: 'Календарь обучения',
      description:
        'AI планирует обучение команды на квартал — связывает GAP-компетенции, оффлайн-сессии и микро-курсы в единый календарь с напоминаниями.',
      metrics: ['GAP-driven', 'Календарь', 'Auto-reminders'],
    },
    {
      id: 'casebook',
      icon: '📚',
      title: 'Кейсотека',
      subtitle: 'Библиотека ситуаций',
      description:
        'Реальные кейсы регионов с разбором по фреймворкам (5 Whys, Pyramid, Декомпозиция). Тренеры публикуют, команды решают, AI оценивает ответы.',
      metrics: ['Фреймворки', 'AI-оценка', 'Совместный разбор'],
    },
    {
      id: 'competency',
      icon: '🧭',
      title: 'Матрица компетенций',
      subtitle: 'GAP-анализ',
      description:
        'JD → AI извлекает компетенции → профиль должности. Personal GAP (target − current) и team heatmap. Авто-назначение микро-уроков на закрытие GAP.',
      metrics: ['JD → профиль', 'GAP heatmap', 'Auto-assign'],
    },
  ];

  const problems = [
    { icon: '🔍', problem: 'Нет контроля полевого персонала', solution: 'AI-фото анализ с GPS' },
    { icon: '📉', problem: 'Тренинги забываются за 2-3 дня', solution: 'Персональные курсы по ошибкам' },
    { icon: '❓', problem: 'Размытые KPI, субъективная оценка', solution: 'Автоматический расчёт KPI' },
    { icon: '⏰', problem: 'Долгий онбординг новичков', solution: 'AI-консультант 24/7 + кейсотека' },
    { icon: '📋', problem: 'Разрыв между полем и офисом', solution: 'Real-time дашборд + Pulse' },
    { icon: '🎯', problem: 'Тимбилдинг без замера эффекта', solution: 'PRE/POST + рост ДО/ПОСЛЕ' },
  ];

  const stats = [
    { value: '30', unit: 'сек', label: 'AI-анализ фото' },
    { value: '8', unit: '', label: 'модулей платформы' },
    { value: '24/7', unit: '', label: 'RAG-ассистент' },
    { value: '2', unit: '', label: 'языка (RU + UZ)' },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.bgPrimary, color: C.textPrimary }}>
      {/* Navigation */}
      <nav
        className="fixed top-0 w-full backdrop-blur-md z-50"
        style={{ background: 'rgba(13,15,20,0.85)', borderBottom: `1px solid ${C.border}` }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDim} 100%)` }}
            >
              <span style={{ color: C.bgPrimary }} className="font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold">Traektoriya</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#modules" style={{ color: C.textSecondary }} className="hover:opacity-80 transition">
              Модули
            </a>
            <a href="#problems" style={{ color: C.textSecondary }} className="hover:opacity-80 transition">
              Проблемы
            </a>
            <a href="#calculator" style={{ color: C.textSecondary }} className="hover:opacity-80 transition">
              ROI
            </a>
            <a href="#contact" style={{ color: C.textSecondary }} className="hover:opacity-80 transition">
              Контакты
            </a>
          </div>
          <button
            onClick={() => navigate('/login')}
            style={{ background: C.gold, color: C.bgPrimary }}
            className="px-5 py-2 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Войти
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="pt-24 pb-16 relative overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at top right, rgba(200,168,75,0.08) 0%, ${C.bgPrimary} 50%, ${C.bgPrimary} 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
                style={{ background: 'rgba(200,168,75,0.10)', border: `1px solid rgba(200,168,75,0.30)` }}
              >
                <span style={{ background: C.gold }} className="w-2 h-2 rounded-full animate-pulse" />
                <span style={{ color: C.gold }} className="text-sm font-medium">
                  AI-платформа управления FMCG
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Управляйте полевым персоналом с помощью{' '}
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDim} 100%)` }}
                >
                  AI
                </span>
              </h1>

              <p style={{ color: C.textSecondary }} className="text-xl mb-8 leading-relaxed">
                Восемь интегрированных модулей: контроль выкладки, обучение, KPI, оффлайн-тренинги
                и аналитика. Одна платформа для всей команды — от ТП до CEO.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#contact"
                  style={{
                    background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDim} 100%)`,
                    color: C.bgPrimary,
                    boxShadow: `0 8px 32px rgba(200,168,75,0.25)`,
                  }}
                  className="px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition text-center"
                >
                  Запросить демо
                </a>
                <button
                  onClick={() => navigate('/login')}
                  style={{ border: `1px solid ${C.borderStrong}`, color: C.textPrimary }}
                  className="px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/5 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  Войти в платформу
                </button>
              </div>

              <div
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-10"
                style={{ borderTop: `1px solid ${C.border}` }}
              >
                {stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold">
                      {stat.value}
                      <span style={{ color: C.gold }}>{stat.unit}</span>
                    </div>
                    <div style={{ color: C.textMuted }} className="text-sm mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock Dashboard */}
            <div className="relative hidden lg:block">
              <div
                className="rounded-2xl p-4"
                style={{
                  background: C.bgSurface,
                  border: `1px solid ${C.border}`,
                  boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                }}
              >
                <div className="rounded-xl overflow-hidden" style={{ background: C.bgPrimary }}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div style={{ color: C.textMuted }} className="text-sm">
                          Дашборд супервайзера
                        </div>
                        <div className="text-xl font-semibold">Команда: 12 ТП</div>
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-sm font-semibold"
                        style={{ background: 'rgba(74,222,128,0.12)', color: C.success }}
                      >
                        ● Live
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: 'Средний KPI', value: '78%', color: C.gold },
                        { label: 'Визиты сегодня', value: '47/60', color: C.success },
                        { label: 'Обучение', value: '92%', color: C.teal },
                      ].map((card, i) => (
                        <div
                          key={i}
                          className="rounded-lg p-3"
                          style={{ background: C.bgCard, border: `1px solid ${C.border}` }}
                        >
                          <div style={{ color: C.textMuted }} className="text-xs mb-1">
                            {card.label}
                          </div>
                          <div style={{ color: card.color }} className="text-lg font-bold">
                            {card.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      className="rounded-lg p-3"
                      style={{ background: C.bgCard, border: `1px solid ${C.border}` }}
                    >
                      <div style={{ color: C.textMuted }} className="text-xs mb-2">
                        Топ сотрудники
                      </div>
                      {[
                        { name: 'ТП #1', kpi: 94, color: C.success },
                        { name: 'ТП #2', kpi: 89, color: C.success },
                        { name: 'ТП #3', kpi: 76, color: C.warning },
                      ].map((emp, i, arr) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1.5"
                          style={{
                            borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span style={{ color: emp.color }}>●</span>
                            <span className="text-sm">{emp.name}</span>
                          </div>
                          <span style={{ color: C.gold }} className="font-medium">
                            {emp.kpi}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <div
                className="absolute -top-4 -right-4 rounded-xl p-3"
                style={{
                  background: C.bgCard,
                  border: `1px solid ${C.gold}40`,
                  boxShadow: `0 8px 32px rgba(200,168,75,0.20)`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📸</span>
                  <div>
                    <div style={{ color: C.textMuted }} className="text-xs">
                      Новый анализ
                    </div>
                    <div style={{ color: C.gold }} className="text-sm font-semibold">
                      Оценка: 87/100
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="absolute -bottom-4 -left-4 rounded-xl p-3"
                style={{
                  background: C.bgCard,
                  border: `1px solid ${C.success}40`,
                  boxShadow: `0 8px 32px rgba(74,222,128,0.15)`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎓</span>
                  <div>
                    <div style={{ color: C.textMuted }} className="text-xs">
                      Курс назначен
                    </div>
                    <div style={{ color: C.success }} className="text-sm font-semibold">
                      +5% к KPI
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems */}
      <section className="py-20" id="problems" data-animate style={{ background: C.bgSurface }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Знакомые проблемы?</h2>
            <p style={{ color: C.textSecondary }} className="text-xl">
              6 критических болей FMCG-дистрибуции, которые решает Traektoriya
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((item, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                  isVisible.problems ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{
                  background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  transitionDelay: `${i * 80}ms`,
                }}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <div style={{ color: C.danger }} className="text-xs font-bold mb-2 tracking-widest">
                  ПРОБЛЕМА
                </div>
                <h3 className="text-lg font-semibold mb-3">{item.problem}</h3>
                <div style={{ color: C.gold }} className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{item.solution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules — 8 модулей платформы */}
      <section className="py-20" id="modules" style={{ background: C.bgPrimary }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div
              className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest mb-4"
              style={{ background: 'rgba(200,168,75,0.12)', color: C.gold }}
            >
              ЧТО ВНУТРИ
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">8 модулей в одной платформе</h2>
            <p style={{ color: C.textSecondary }} className="text-xl max-w-2xl mx-auto">
              От AI-фото-анализа до оффлайн-тренингов — каждый модуль усиливает остальные.
              Выберите модуль, чтобы увидеть детали.
            </p>
          </div>

          {/* Module cards grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {modules.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setActiveModule(i)}
                className="rounded-xl p-4 text-left transition-all"
                style={{
                  background: activeModule === i ? C.bgCard : C.bgSurface,
                  border: `1px solid ${activeModule === i ? C.gold : C.border}`,
                  boxShadow: activeModule === i ? `0 8px 24px rgba(200,168,75,0.15)` : 'none',
                }}
              >
                <div className="text-3xl mb-2">{m.icon}</div>
                <div className="font-bold text-sm mb-1">{m.title}</div>
                <div style={{ color: C.textMuted }} className="text-xs">
                  {m.subtitle}
                </div>
              </button>
            ))}
          </div>

          {/* Active module detail */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
            }}
          >
            <div className="grid lg:grid-cols-2">
              <div className="p-8 lg:p-12">
                <div
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4"
                  style={{ background: 'rgba(200,168,75,0.12)', color: C.gold }}
                >
                  {modules[activeModule].subtitle}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  {modules[activeModule].icon} {modules[activeModule].title}
                </h3>
                <p style={{ color: C.textSecondary }} className="text-lg mb-8 leading-relaxed">
                  {modules[activeModule].description}
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {modules[activeModule].metrics.map((m, i) => (
                    <div
                      key={i}
                      className="text-center p-3 rounded-xl"
                      style={{ background: C.bgElevated, border: `1px solid ${C.border}` }}
                    >
                      <div style={{ color: C.gold }} className="font-bold text-sm">
                        {m}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Module mock */}
              <div
                className="p-8 flex items-center justify-center min-h-[400px]"
                style={{ background: `linear-gradient(135deg, ${C.bgSurface} 0%, ${C.bgPrimary} 100%)` }}
              >
                <ModuleMock moduleId={modules[activeModule].id} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI */}
      <section className="py-20" id="calculator" style={{ background: C.bgSurface }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Рассчитайте ROI</h2>
            <p style={{ color: C.textSecondary }} className="text-xl">
              Оценочный калькулятор на основе среднего эффекта внедрения
            </p>
          </div>

          <div
            className="rounded-3xl p-8"
            style={{ background: C.bgCard, border: `1px solid ${C.border}` }}
          >
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label style={{ color: C.textSecondary }} className="text-sm mb-2 block">
                    Количество торговых представителей
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    value={calculatorData.employees}
                    onChange={(e) =>
                      setCalculatorData({ ...calculatorData, employees: +e.target.value })
                    }
                    className="w-full"
                    style={{ accentColor: C.gold }}
                  />
                  <div className="text-2xl font-bold mt-2">{calculatorData.employees}</div>
                </div>

                <div>
                  <label style={{ color: C.textSecondary }} className="text-sm mb-2 block">
                    Текущая конверсия визитов в заказы (%)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={calculatorData.currentConversion}
                    onChange={(e) =>
                      setCalculatorData({ ...calculatorData, currentConversion: +e.target.value })
                    }
                    className="w-full"
                    style={{ accentColor: C.gold }}
                  />
                  <div className="text-2xl font-bold mt-2">{calculatorData.currentConversion}%</div>
                </div>

                <div>
                  <label style={{ color: C.textSecondary }} className="text-sm mb-2 block">
                    Средний чек заказа (сум)
                  </label>
                  <input
                    type="range"
                    min="100000"
                    max="2000000"
                    step="50000"
                    value={calculatorData.avgCheck}
                    onChange={(e) =>
                      setCalculatorData({ ...calculatorData, avgCheck: +e.target.value })
                    }
                    className="w-full"
                    style={{ accentColor: C.gold }}
                  />
                  <div className="text-2xl font-bold mt-2">
                    {calculatorData.avgCheck.toLocaleString('ru-RU')} сум
                  </div>
                </div>
              </div>

              <div
                className="rounded-2xl p-6"
                style={{
                  background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDim} 100%)`,
                  color: C.bgPrimary,
                }}
              >
                <div className="text-sm mb-2 opacity-80">Прогноз с Traektoriya</div>

                <div className="mb-6">
                  <div className="text-sm opacity-70">Новая конверсия</div>
                  <div className="text-3xl font-bold">
                    {roi.improvedConversion.toFixed(1)}%
                    <span className="text-lg ml-2 opacity-80">
                      (+{(roi.improvedConversion - calculatorData.currentConversion).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-sm opacity-70">Дополнительно в месяц</div>
                  <div className="text-3xl font-bold">
                    {Math.round(roi.monthlyGain).toLocaleString('ru-RU')} сум
                  </div>
                </div>

                <div className="pt-4" style={{ borderTop: '1px solid rgba(13,15,20,0.25)' }}>
                  <div className="text-sm opacity-70">Дополнительно в год</div>
                  <div className="text-4xl font-bold">
                    {Math.round(roi.annualGain).toLocaleString('ru-RU')} сум
                  </div>
                </div>
              </div>
            </div>

            <p style={{ color: C.textMuted }} className="text-xs mt-6 text-center">
              ⚠️ Оценочный расчёт. Реальный эффект зависит от качества внедрения, дисциплины
              команды и текущих процессов.
            </p>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20" style={{ background: C.bgPrimary }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Для всех уровней команды</h2>
            <p style={{ color: C.textSecondary }} className="text-xl">
              Каждая роль видит то, что нужно именно ей
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                role: 'Торговый представитель',
                device: '📱 Mobile + TG',
                access: 'Свои задачи и KPI',
                color: C.purple,
              },
              {
                role: 'Супервайзер',
                device: '📱 + 💻',
                access: 'Команда + GAP',
                color: C.teal,
              },
              {
                role: 'Региональный менеджер',
                device: '💻 Веб',
                access: 'Регион + Pulse',
                color: C.gold,
              },
              {
                role: 'Топ-менеджмент',
                device: '💻 Дашборд',
                access: 'Сквозная аналитика',
                color: C.success,
              },
            ].map((r, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 text-center transition-transform hover:-translate-y-1"
                style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderTopColor: r.color, borderTopWidth: 4 }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl"
                  style={{ background: `${r.color}20`, color: r.color }}
                >
                  {r.device.split(' ')[0]}
                </div>
                <h3 className="font-semibold mb-1">{r.role}</h3>
                <div style={{ color: C.textMuted }} className="text-sm mb-2">
                  {r.device}
                </div>
                <div style={{ color: r.color }} className="font-medium">
                  {r.access}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20"
        id="contact"
        style={{ background: `radial-gradient(ellipse at center, rgba(200,168,75,0.12) 0%, ${C.bgPrimary} 70%)` }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Готовы увидеть в действии?</h2>
          <p style={{ color: C.textSecondary }} className="text-xl mb-8">
            Запросите демонстрацию и узнайте, как Traektoriya поможет вашей команде
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              style={{
                background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDim} 100%)`,
                color: C.bgPrimary,
                boxShadow: `0 8px 32px rgba(200,168,75,0.30)`,
              }}
              className="px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition"
            >
              Запросить демо
            </button>
            <button
              style={{ border: `2px solid ${C.gold}`, color: C.gold }}
              className="px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/5 transition"
            >
              Связаться с нами
            </button>
          </div>

          <div className="mt-12 pt-8" style={{ borderTop: `1px solid ${C.border}` }}>
            <div style={{ color: C.textMuted }} className="text-sm">
              Узбекистан, Ташкент
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8" style={{ background: C.bgSurface, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDim} 100%)` }}
              >
                <span style={{ color: C.bgPrimary }} className="font-bold text-sm">
                  T
                </span>
              </div>
              <span className="text-lg font-bold">Traektoriya</span>
            </div>
            <div style={{ color: C.textMuted }} className="text-sm">
              © 2026 Traektoriya. AI-платформа управления полевым персоналом.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ===========================================================================
// Mock content for each module — лёгкие визуальные превью
// ===========================================================================

function ModuleMock({ moduleId }: { moduleId: string }) {
  const wrapperStyle = {
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  };

  switch (moduleId) {
    case 'shelfscan':
      return (
        <div className="rounded-2xl p-6 w-full max-w-sm" style={wrapperStyle}>
          <div className="rounded-lg p-3 mb-3" style={{ background: C.bgElevated }}>
            <div className="flex justify-between mb-2">
              <span style={{ color: C.textSecondary }} className="text-sm">Общая оценка</span>
              <span style={{ color: C.gold }} className="font-bold">87 / 100</span>
            </div>
            <div className="w-full rounded-full h-2" style={{ background: C.border }}>
              <div className="h-2 rounded-full" style={{ width: '87%', background: C.gold }} />
            </div>
          </div>
          {['Наличие товара', 'Фейсинг', 'Ценники', 'Чистота'].map((c, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5" style={{ borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.textSecondary }}>{c}</span>
              <span className="font-medium">{[18, 19, 17, 16][i]} / 20</span>
            </div>
          ))}
        </div>
      );

    case 'lms':
      return (
        <div className="rounded-2xl p-6 w-full max-w-sm space-y-3" style={wrapperStyle}>
          <div className="rounded-lg p-3" style={{ background: 'rgba(74,222,128,0.10)', border: `1px solid rgba(74,222,128,0.30)` }}>
            <div style={{ color: C.success }} className="font-medium text-sm">🎯 Назначен курс</div>
            <div className="mt-1">Правила выкладки категории «Напитки»</div>
          </div>
          <div className="rounded-lg p-3 flex justify-between" style={{ background: C.bgElevated }}>
            <span style={{ color: C.textSecondary }} className="text-sm">Бонус за прохождение</span>
            <span style={{ color: C.gold }} className="font-bold">+5% KPI</span>
          </div>
          <div style={{ color: C.warning }} className="text-center text-sm">
            ⏰ Осталось: 23:45:12 (100% бонус)
          </div>
        </div>
      );

    case 'pulse':
      return (
        <div className="rounded-2xl p-6 w-full max-w-sm" style={wrapperStyle}>
          <div className="text-center py-4">
            <div style={{ color: C.gold }} className="text-5xl font-bold">78%</div>
            <div style={{ color: C.textMuted }} className="mt-1">Итоговый KPI</div>
          </div>
          <div className="space-y-2">
            {[
              { name: 'AI оценка', value: 82, weight: '40%' },
              { name: 'LMS', value: 75, weight: '30%' },
              { name: 'CRM', value: 74, weight: '30%' },
            ].map((k, i) => (
              <div key={i} className="flex items-center gap-2">
                <span style={{ color: C.textMuted }} className="text-xs w-8">{k.weight}</span>
                <div className="flex-1 rounded-full h-2" style={{ background: C.border }}>
                  <div className="h-2 rounded-full" style={{ width: `${k.value}%`, background: C.gold }} />
                </div>
                <span className="text-sm font-medium w-8">{k.value}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'consultant':
      return (
        <div className="rounded-2xl p-6 w-full max-w-sm space-y-3" style={wrapperStyle}>
          <div className="rounded-lg p-3" style={{ background: C.bgElevated }}>
            <div style={{ color: C.textMuted }} className="text-sm mb-1">Вопрос:</div>
            <div>«Какой минимальный фейсинг для категории напитков?»</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(200,168,75,0.10)', border: `1px solid rgba(200,168,75,0.30)` }}>
            <div style={{ color: C.gold }} className="text-sm mb-1">AI-ответ (2 сек):</div>
            <div>Минимум — 4 SKU. Рекомендуемый — 6 SKU для максимального KPI.</div>
          </div>
        </div>
      );

    case 'activities':
      return (
        <div className="rounded-2xl p-6 w-full max-w-sm" style={wrapperStyle}>
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">📱</div>
            <div className="font-bold">Код сессии</div>
            <div style={{ color: C.gold, letterSpacing: '0.4em' }} className="text-3xl font-bold mt-1">573714</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between p-2 rounded" style={{ background: C.bgElevated }}>
              <span style={{ color: C.textSecondary }} className="text-sm">Среднее ДО</span>
              <span className="font-bold">47%</span>
            </div>
            <div className="flex justify-between p-2 rounded" style={{ background: 'rgba(74,222,128,0.10)' }}>
              <span style={{ color: C.textSecondary }} className="text-sm">Среднее ПОСЛЕ</span>
              <span style={{ color: C.success }} className="font-bold">71%</span>
            </div>
            <div className="flex justify-between p-2 rounded" style={{ background: 'rgba(200,168,75,0.10)' }}>
              <span style={{ color: C.textSecondary }} className="text-sm">Рост</span>
              <span style={{ color: C.gold }} className="font-bold">+24%</span>
            </div>
          </div>
        </div>
      );

    case 'training-plan':
      return (
        <div className="rounded-2xl p-6 w-full max-w-sm space-y-2" style={wrapperStyle}>
          <div style={{ color: C.textMuted }} className="text-xs uppercase tracking-widest mb-2">
            Календарь Q2 2026
          </div>
          {[
            { week: 'Нед. 1', event: 'ADKAR (тимбилдинг)', color: C.gold },
            { week: 'Нед. 2', event: 'Микро-курс «Stockout»', color: C.teal },
            { week: 'Нед. 3', event: 'Кейсотека: 5 Whys', color: C.purple },
            { week: 'Нед. 4', event: 'Аттестация', color: C.success },
          ].map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded"
              style={{ background: C.bgElevated, borderLeft: `3px solid ${e.color}` }}
            >
              <span style={{ color: C.textMuted }} className="text-xs w-12">{e.week}</span>
              <span className="text-sm">{e.event}</span>
            </div>
          ))}
        </div>
      );

    case 'casebook':
      return (
        <div className="rounded-2xl p-6 w-full max-w-sm" style={wrapperStyle}>
          <div style={{ color: C.textMuted }} className="text-xs uppercase tracking-widest mb-3">
            Кейс #142 • 5 Whys
          </div>
          <div className="font-semibold mb-3">«Падение −23% в регионе»</div>
          <div className="space-y-1.5">
            {['Почему упало?', 'Почему меньше визитов?', 'Почему сменился СВ?', 'Корень: нет онбординга'].map((q, i) => (
              <div
                key={i}
                className="flex gap-2 text-sm p-2 rounded"
                style={{
                  background: i === 3 ? 'rgba(74,222,128,0.10)' : C.bgElevated,
                  color: i === 3 ? C.success : C.textPrimary,
                }}
              >
                <span style={{ color: C.gold }} className="font-bold">{i + 1}.</span>
                {q}
              </div>
            ))}
          </div>
        </div>
      );

    case 'competency':
      return (
        <div className="rounded-2xl p-6 w-full max-w-sm" style={wrapperStyle}>
          <div style={{ color: C.textMuted }} className="text-xs uppercase tracking-widest mb-3">
            Профиль: Региональный менеджер
          </div>
          {[
            { name: 'Стратегия', target: 4, current: 3, color: C.warning },
            { name: 'Coaching', target: 4, current: 4, color: C.success },
            { name: 'Аналитика', target: 5, current: 2, color: C.danger },
            { name: 'Лидерство', target: 4, current: 3, color: C.warning },
          ].map((c, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>{c.name}</span>
                <span style={{ color: c.color }} className="font-medium">
                  {c.current} / {c.target}
                </span>
              </div>
              <div className="rounded-full h-1.5" style={{ background: C.border }}>
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${(c.current / c.target) * 100}%`, background: c.color }}
                />
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}
