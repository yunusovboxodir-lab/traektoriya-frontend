import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesRepCourse, type Step, type Module } from '../data/salesRepCourse';
import { useAuth } from '../auth/AuthContext';

// ===========================================
// ТИПЫ
// ===========================================
interface UserProgress {
  completedSteps: number[];
  currentStep: number;
  totalPoints: number;
  badges: string[];
  streakDays: number;
  lastActivity: string;
}

type ViewMode = 'learner' | 'admin';
type Language = 'ru' | 'uz';

// ===========================================
// ХУК ПРОГРЕССА (localStorage для демо)
// TODO: Перенести на backend API
// ===========================================
function useProgress(courseId: string, visitorId: string) {
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem(`progress_${courseId}_${visitorId}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      completedSteps: [],
      currentStep: 1,
      totalPoints: 0,
      badges: [],
      streakDays: 0,
      lastActivity: new Date().toISOString()
    };
  });

  useEffect(() => {
    localStorage.setItem(`progress_${courseId}_${visitorId}`, JSON.stringify(progress));
  }, [progress, courseId, visitorId]);

  return [progress, setProgress] as const;
}

// ===========================================
// КОМПОНЕНТ: КАРТА ПРОГРЕССА
// ===========================================
function ProgressMaze({ 
  steps, 
  modules,
  completedSteps, 
  currentStep,
  onStepClick,
  language
}: {
  steps: Step[];
  modules: Module[];
  completedSteps: number[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
  language: Language;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          🗺️ {language === 'ru' ? 'Карта прогресса' : 'Progress xaritasi'}
        </h2>
        <div className="text-sm text-gray-500">
          {completedSteps.length} / {steps.length} {language === 'ru' ? 'шагов' : 'qadam'}
        </div>
      </div>
      
      {/* Общий прогресс-бар */}
      <div className="mb-6">
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-500"
            style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>0%</span>
          <span className="font-bold text-blue-600">
            {Math.round((completedSteps.length / steps.length) * 100)}%
          </span>
          <span>100%</span>
        </div>
      </div>
      
      {/* Модули */}
      <div className="space-y-4">
        {modules.map(module => {
          const moduleSteps = steps.filter(s => s.moduleId === module.id);
          const completedInModule = moduleSteps.filter(s => completedSteps.includes(s.id)).length;
          const isModuleComplete = completedInModule === moduleSteps.length;
          const isModuleActive = moduleSteps.some(s => s.id === currentStep);
          
          return (
            <div 
              key={module.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                isModuleComplete 
                  ? 'border-green-500 bg-green-50' 
                  : isModuleActive 
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">{module.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {language === 'ru' ? module.title : module.titleUz}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {completedInModule}/{moduleSteps.length} {language === 'ru' ? 'уроков' : 'dars'}
                  </p>
                </div>
                <div className="text-lg font-bold" style={{ color: module.color }}>
                  {Math.round((completedInModule / moduleSteps.length) * 100)}%
                </div>
              </div>
              
              {/* Шаги модуля */}
              <div className="flex flex-wrap gap-1.5">
                {moduleSteps.map(step => {
                  const isCompleted = completedSteps.includes(step.id);
                  const isCurrent = step.id === currentStep;
                  const isLocked = step.id > currentStep && !isCompleted;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => !isLocked && onStepClick(step.id)}
                      disabled={isLocked}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                        isCompleted 
                          ? 'bg-green-500 text-white'
                          : isCurrent
                            ? 'bg-blue-500 text-white animate-pulse'
                            : isLocked
                              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                              : 'bg-white border-2 border-gray-200 hover:border-blue-400'
                      }`}
                      title={language === 'ru' ? step.title : step.titleUz}
                    >
                      {isCompleted ? '✓' : step.id}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================
// КОМПОНЕНТ: КАРТОЧКА ТЕКУЩЕГО УРОКА
// ===========================================
function CurrentLessonCard({ 
  step, 
  isCompleted,
  onStart,
  language
}: {
  step: Step;
  isCompleted: boolean;
  onStart: () => void;
  language: Language;
}) {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
          📖
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {language === 'ru' ? 'Шаг' : 'Qadam'} {step.id}
            </span>
            <span className="text-xs opacity-75">{step.duration} мин</span>
          </div>
          <h3 className="font-bold text-xl mb-2">
            {language === 'ru' ? step.title : step.titleUz}
          </h3>
          <div className="text-yellow-300 font-medium">+{step.points} ⭐</div>
        </div>
        <button
          onClick={onStart}
          className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg"
        >
          {isCompleted ? '🔄 Повторить' : '▶ Начать'}
        </button>
      </div>
    </div>
  );
}

// ===========================================
// КОМПОНЕНТ: ПРОСМОТР УРОКА
// ===========================================
function LessonViewer({
  step,
  onComplete,
  onClose,
  language
}: {
  step: Step;
  onComplete: () => void;
  onClose: () => void;
  language: Language;
}) {
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const isQuizCorrect = step.quiz?.every((q, i) => quizAnswers[i] === q.correctAnswer);
  const canComplete = step.type === 'quiz' ? showResults && isQuizCorrect : true;
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="p-5 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm opacity-75">Шаг {step.id} / 100</span>
              <h2 className="font-bold text-xl">
                {language === 'ru' ? step.title : step.titleUz}
              </h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30">
              ✕
            </button>
          </div>
        </div>
        
        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose max-w-none">
            {(language === 'ru' ? step.content : step.contentUz).split('\n').map((line, i) => (
              <p key={i} className="mb-2">{line}</p>
            ))}
          </div>
          
          {/* Тест */}
          {step.quiz && step.quiz.length > 0 && (
            <div className="mt-8 pt-6 border-t space-y-4">
              <h3 className="font-bold text-lg">📝 Проверьте себя</h3>
              {step.quiz.map((q, qIndex) => (
                <div key={q.id} className="p-4 bg-gray-50 rounded-xl">
                  <p className="font-medium mb-3">{qIndex + 1}. {q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((option, oIndex) => (
                      <label 
                        key={oIndex}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 ${
                          showResults
                            ? oIndex === q.correctAnswer
                              ? 'bg-green-100 border-green-500'
                              : quizAnswers[qIndex] === oIndex
                                ? 'bg-red-100 border-red-500'
                                : 'border-gray-200'
                            : quizAnswers[qIndex] === oIndex
                              ? 'bg-blue-100 border-blue-500'
                              : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="radio"
                          checked={quizAnswers[qIndex] === oIndex}
                          onChange={() => {
                            const newAnswers = [...quizAnswers];
                            newAnswers[qIndex] = oIndex;
                            setQuizAnswers(newAnswers);
                          }}
                          disabled={showResults}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {!showResults && (
                <button
                  onClick={() => setShowResults(true)}
                  disabled={quizAnswers.length !== step.quiz!.length}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:bg-gray-300"
                >
                  Проверить ответы
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Футер */}
        <div className="p-5 border-t bg-gray-50 flex justify-between">
          <span className="text-gray-500">⭐ +{step.points} баллов</span>
          <button
            onClick={onComplete}
            disabled={!canComplete}
            className={`px-8 py-3 rounded-xl font-bold ${
              canComplete
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            ✓ Завершить урок
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// КОМПОНЕНТ: СТАТИСТИКА
// ===========================================
function StatsPanel({ progress, totalSteps, language }: { 
  progress: UserProgress; 
  totalSteps: number;
  language: Language;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="text-3xl font-bold text-blue-600">{progress.completedSteps.length}</div>
        <div className="text-sm text-gray-500">{language === 'ru' ? 'Шагов' : 'Qadam'}</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="text-3xl font-bold text-green-600">
          {Math.round((progress.completedSteps.length / totalSteps) * 100)}%
        </div>
        <div className="text-sm text-gray-500">{language === 'ru' ? 'Прогресс' : 'Progress'}</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="text-3xl font-bold text-yellow-600">{progress.totalPoints} ⭐</div>
        <div className="text-sm text-gray-500">{language === 'ru' ? 'Баллы' : 'Ballar'}</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="text-3xl font-bold text-purple-600">{progress.badges.length}</div>
        <div className="text-sm text-gray-500">{language === 'ru' ? 'Значки' : 'Nishonlar'}</div>
      </div>
    </div>
  );
}

// ===========================================
// КОМПОНЕНТ: ТАБЛИЦА ЛИДЕРОВ
// ===========================================
function Leaderboard({ language, visitorId }: { language: Language; visitorId: string }) {
  // TODO: Получать с backend API
  const leaders = [
    { rank: 1, id: 'ag-001', name: 'Алишер К.', points: 1250, steps: 87 },
    { rank: 2, id: 'ag-002', name: 'Дилшод М.', points: 1100, steps: 72 },
    { rank: 3, id: 'ag-003', name: 'Саида Р.', points: 980, steps: 65 },
    { rank: 4, id: 'ag-004', name: 'Бобур А.', points: 450, steps: 30 },
    { rank: 5, id: 'ag-005', name: 'Жамшид Т.', points: 400, steps: 28 },
    { rank: 6, id: 'ag-006', name: 'Нодир Х.', points: 350, steps: 24 },
    { rank: 7, id: 'ag-007', name: 'Фарход И.', points: 200, steps: 15 },
  ];
  
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gradient-to-r from-yellow-50 to-orange-50">
        <h3 className="font-bold text-lg">🏆 {language === 'ru' ? 'Рейтинг' : 'Reyting'}</h3>
      </div>
      <div className="divide-y">
        {leaders.map(user => (
          <div 
            key={user.rank}
            className={`flex items-center gap-4 p-4 ${user.id === visitorId ? 'bg-blue-50' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              user.rank === 1 ? 'bg-yellow-400 text-white' :
              user.rank === 2 ? 'bg-gray-300 text-white' :
              user.rank === 3 ? 'bg-orange-400 text-white' : 'bg-gray-100'
            }`}>
              {user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : user.rank}
            </div>
            <div className="flex-1">
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-gray-500">{user.steps}/100</div>
            </div>
            <div className="font-bold">{user.points} ⭐</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================
// КОМПОНЕНТ: АДМИН ПАНЕЛЬ (только для СВ)
// ===========================================
function AdminPanel({ language }: { language: Language }) {
  // TODO: Получать с backend API
  const agents = [
    { id: 'ag-001', name: 'Алишер К.', progress: 87, points: 1250, status: 'active' },
    { id: 'ag-002', name: 'Дилшод М.', progress: 72, points: 1100, status: 'active' },
    { id: 'ag-003', name: 'Саида Р.', progress: 65, points: 980, status: 'inactive' },
    { id: 'ag-004', name: 'Бобур А.', progress: 28, points: 400, status: 'inactive' },
    { id: 'ag-005', name: 'Жамшид Т.', progress: 15, points: 150, status: 'at_risk' },
    { id: 'ag-006', name: 'Нодир Х.', progress: 24, points: 350, status: 'inactive' },
    { id: 'ag-007', name: 'Фарход И.', progress: 15, points: 200, status: 'at_risk' },
  ];
  
  return (
    <div className="space-y-6">
      {/* Статистика команды */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">📊 {language === 'ru' ? 'Статистика команды' : 'Jamoa statistikasi'}</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="text-3xl font-bold text-blue-600">7</div>
            <div className="text-sm text-gray-500">{language === 'ru' ? 'Агентов' : 'Agentlar'}</div>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <div className="text-3xl font-bold text-green-600">2</div>
            <div className="text-sm text-gray-500">{language === 'ru' ? 'Активных' : 'Faol'}</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-xl">
            <div className="text-3xl font-bold text-yellow-600">44%</div>
            <div className="text-sm text-gray-500">{language === 'ru' ? 'Ср. прогресс' : 'O\'rtacha'}</div>
          </div>
          <div className="p-4 bg-red-50 rounded-xl">
            <div className="text-3xl font-bold text-red-600">2</div>
            <div className="text-sm text-gray-500">{language === 'ru' ? 'В риске' : 'Xavfda'}</div>
          </div>
        </div>
      </div>
      
      {/* Таблица агентов */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-bold text-lg">👥 {language === 'ru' ? 'Агенты' : 'Agentlar'}</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">{language === 'ru' ? 'Имя' : 'Ism'}</th>
              <th className="text-left p-4">{language === 'ru' ? 'Прогресс' : 'Progress'}</th>
              <th className="text-left p-4">{language === 'ru' ? 'Баллы' : 'Ballar'}</th>
              <th className="text-left p-4">{language === 'ru' ? 'Статус' : 'Status'}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {agents.map(agent => (
              <tr key={agent.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{agent.name}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-full rounded-full ${
                          agent.progress >= 70 ? 'bg-green-500' :
                          agent.progress >= 40 ? 'bg-yellow-500' : 'bg-red-400'
                        }`}
                        style={{ width: `${agent.progress}%` }}
                      />
                    </div>
                    <span>{agent.progress}%</span>
                  </div>
                </td>
                <td className="p-4">{agent.points} ⭐</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    agent.status === 'active' ? 'bg-green-100 text-green-700' :
                    agent.status === 'inactive' ? 'bg-gray-100 text-gray-600' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {agent.status === 'active' ? '🟢 Активен' :
                     agent.status === 'inactive' ? '⚪ Неактивен' : '🔴 Риск'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===========================================
// ГЛАВНЫЙ КОМПОНЕНТ СТРАНИЦЫ
// ===========================================
export function LearningPage() {
  const { user, logout, isSupervisor } = useAuth();
  const navigate = useNavigate();
  
  const [viewMode, setViewMode] = useState<ViewMode>('learner');
  const [language, setLanguage] = useState<Language>('ru');
  const [activeStep, setActiveStep] = useState<Step | null>(null);
  const [progress, setProgress] = useProgress(salesRepCourse.id, user?.id || 'guest');
  
  // Редирект на логин если не авторизован
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  if (!user) return null;
  
  const course = salesRepCourse;
  const currentStepData = course.steps.find(s => s.id === progress.currentStep) || course.steps[0];
  
  // Обработчик завершения урока
  const handleCompleteStep = () => {
    if (!activeStep) return;
    
    setProgress(prev => {
      const newCompletedSteps = prev.completedSteps.includes(activeStep.id)
        ? prev.completedSteps
        : [...prev.completedSteps, activeStep.id];
      
      return {
        ...prev,
        completedSteps: newCompletedSteps,
        currentStep: Math.max(prev.currentStep, activeStep.id + 1),
        totalPoints: prev.completedSteps.includes(activeStep.id) 
          ? prev.totalPoints 
          : prev.totalPoints + activeStep.points,
        lastActivity: new Date().toISOString()
      };
    });
    
    setActiveStep(null);
  };
  
  // Обработчик выхода
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">📚 {language === 'ru' ? course.title : course.titleUz}</h1>
            
            <div className="flex items-center gap-4">
              {/* Язык */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('ru')}
                  className={`px-3 py-1.5 rounded-md text-sm ${language === 'ru' ? 'bg-white shadow' : ''}`}
                >
                  🇷🇺 Рус
                </button>
                <button
                  onClick={() => setLanguage('uz')}
                  className={`px-3 py-1.5 rounded-md text-sm ${language === 'uz' ? 'bg-white shadow' : ''}`}
                >
                  🇺🇿 O'zb
                </button>
              </div>
              
              {/* Режим (только для СВ) */}
              {isSupervisor && (
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('learner')}
                    className={`px-3 py-1.5 rounded-md text-sm ${viewMode === 'learner' ? 'bg-white shadow' : ''}`}
                  >
                    📖 Обучение
                  </button>
                  <button
                    onClick={() => setViewMode('admin')}
                    className={`px-3 py-1.5 rounded-md text-sm ${viewMode === 'admin' ? 'bg-white shadow' : ''}`}
                  >
                    ⚙️ Админ
                  </button>
                </div>
              )}
              
              {/* Профиль */}
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="text-right">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500">
                    {isSupervisor ? 'Супервайзер' : 'Агент'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                  title="Выйти"
                >
                  🚪
                </button>
              </div>
              
              {/* Баллы */}
              <div className="text-right pl-4 border-l">
                <div className="text-xl font-bold text-yellow-600">{progress.totalPoints} ⭐</div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Контент */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'learner' ? (
          <>
            <StatsPanel progress={progress} totalSteps={course.totalSteps} language={language} />
            
            <div className="mb-6">
              <CurrentLessonCard
                step={currentStepData}
                isCompleted={progress.completedSteps.includes(currentStepData.id)}
                onStart={() => setActiveStep(currentStepData)}
                language={language}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ProgressMaze
                  steps={course.steps}
                  modules={course.modules}
                  completedSteps={progress.completedSteps}
                  currentStep={progress.currentStep}
                  onStepClick={(stepId) => {
                    const step = course.steps.find(s => s.id === stepId);
                    if (step) setActiveStep(step);
                  }}
                  language={language}
                />
              </div>
              <div>
                <Leaderboard language={language} visitorId={user.id} />
              </div>
            </div>
          </>
        ) : (
          <AdminPanel language={language} />
        )}
      </main>
      
      {/* Модальное окно урока */}
      {activeStep && (
        <LessonViewer
          step={activeStep}
          onComplete={handleCompleteStep}
          onClose={() => setActiveStep(null)}
          language={language}
        />
      )}
    </div>
  );
}
