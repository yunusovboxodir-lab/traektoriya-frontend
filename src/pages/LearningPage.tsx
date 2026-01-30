import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { salesRepCourse,type Step,type Module } from '../data/salesRepCourse';

// ============================================
// ТИПЫ
// ============================================

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

// ============================================
// ХУКИ
// ============================================

// Хук для сохранения прогресса в localStorage
function useProgress(courseId: string) {
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem(`progress_${courseId}`);
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
    localStorage.setItem(`progress_${courseId}`, JSON.stringify(progress));
  }, [progress, courseId]);

  return [progress, setProgress] as const;
}

// ============================================
// КОМПОНЕНТЫ
// ============================================

// Прогресс-бар 100 шагов
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
          const isModuleLocked = moduleSteps[0].id > currentStep && completedInModule === 0;
          
          return (
            <div 
              key={module.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                isModuleComplete 
                  ? 'border-green-500 bg-green-50' 
                  : isModuleActive 
                    ? 'border-blue-500 bg-blue-50'
                    : isModuleLocked
                      ? 'border-gray-200 bg-gray-50 opacity-60'
                      : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    isModuleComplete ? 'bg-green-500 text-white' : ''
                  }`}
                  style={{ backgroundColor: isModuleComplete ? undefined : module.color + '20' }}
                >
                  {isModuleComplete ? '✓' : module.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {language === 'ru' ? module.title : module.titleUz}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {completedInModule}/{moduleSteps.length} {language === 'ru' ? 'уроков' : 'dars'}
                  </p>
                </div>
                <div className="text-right">
                  <div 
                    className="text-lg font-bold"
                    style={{ color: module.color }}
                  >
                    {Math.round((completedInModule / moduleSteps.length) * 100)}%
                  </div>
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
                          ? 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                          : isCurrent
                            ? 'bg-blue-500 text-white animate-pulse shadow-md'
                            : isLocked
                              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                              : 'bg-white border-2 border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600'
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

// Карточка текущего урока
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
  const typeConfig = {
    theory: { icon: '📖', label: language === 'ru' ? 'Теория' : 'Nazariya', color: 'blue' },
    practice: { icon: '✍️', label: language === 'ru' ? 'Практика' : 'Amaliyot', color: 'green' },
    quiz: { icon: '❓', label: language === 'ru' ? 'Тест' : 'Test', color: 'purple' },
    video: { icon: '🎬', label: language === 'ru' ? 'Видео' : 'Video', color: 'red' },
    case_study: { icon: '💼', label: language === 'ru' ? 'Кейс' : 'Keys', color: 'orange' }
  };
  
  const config = typeConfig[step.type];
  
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
          {config.icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {language === 'ru' ? 'Шаг' : 'Qadam'} {step.id}
            </span>
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {config.label}
            </span>
            <span className="text-xs opacity-75">
              {step.duration} {language === 'ru' ? 'мин' : 'daq'}
            </span>
          </div>
          
          <h3 className="font-bold text-xl mb-2">
            {language === 'ru' ? step.title : step.titleUz}
          </h3>
          
          <div className="flex items-center gap-4">
            <span className="text-yellow-300 font-medium">
              +{step.points} ⭐
            </span>
            {step.badge && (
              <span className="text-pink-200">
                🏅 {language === 'ru' ? step.badge.title : step.badge.titleUz}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={onStart}
          className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg"
        >
          {isCompleted 
            ? (language === 'ru' ? '🔄 Повторить' : '🔄 Takrorlash')
            : (language === 'ru' ? '▶ Начать' : '▶ Boshlash')
          }
        </button>
      </div>
    </div>
  );
}

// Просмотр урока
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
  const [practiceChecks, setPracticeChecks] = useState<boolean[]>([]);
  
  const handleQuizSubmit = () => {
    setShowResults(true);
  };
  
  const isQuizCorrect = step.quiz?.every((q, i) => quizAnswers[i] === q.correctAnswer);
  const isPracticeComplete = step.practice?.checkpoints.every((_, i) => practiceChecks[i]);
  
  const canComplete = 
    step.type === 'quiz' ? showResults && isQuizCorrect :
    step.type === 'practice' ? isPracticeComplete :
    true;
  
  // Форматирование контента (простой markdown)
  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold mb-4 mt-6">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-bold mb-3 mt-5">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-bold mb-2 mt-4">{line.slice(4)}</h3>;
        }
        if (line.startsWith('> ')) {
          return (
            <blockquote key={i} className="border-l-4 border-blue-500 pl-4 py-2 my-3 bg-blue-50 rounded-r-lg">
              {line.slice(2)}
            </blockquote>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={i} className="ml-4 mb-1">• {line.slice(2)}</li>;
        }
        if (line.match(/^\d+\. /)) {
          return <li key={i} className="ml-4 mb-1">{line}</li>;
        }
        if (line.startsWith('✅') || line.startsWith('❌') || line.startsWith('□')) {
          return <p key={i} className="mb-1">{line}</p>;
        }
        if (line.trim() === '') {
          return <br key={i} />;
        }
        // Bold text
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: formatted }} />;
      });
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm opacity-75">
                {language === 'ru' ? 'Шаг' : 'Qadam'} {step.id} / 100
              </span>
              <h2 className="font-bold text-xl">
                {language === 'ru' ? step.title : step.titleUz}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Video */}
          {step.videoUrl && (
            <div className="mb-6 aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
              <a 
                href={step.videoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white hover:text-blue-400 transition"
              >
                <span className="text-5xl">▶️</span>
                <span className="text-lg">
                  {language === 'ru' ? 'Смотреть видео' : 'Videoni ko\'rish'}
                </span>
              </a>
            </div>
          )}
          
          {/* Text content */}
          <div className="prose max-w-none mb-6">
            {formatContent(language === 'ru' ? step.content : step.contentUz)}
          </div>
          
          {/* Quiz */}
          {step.quiz && step.quiz.length > 0 && (
            <div className="space-y-4 mt-8 pt-6 border-t">
              <h3 className="font-bold text-lg flex items-center gap-2">
                📝 {language === 'ru' ? 'Проверьте себя' : 'O\'zingizni tekshiring'}
              </h3>
              {step.quiz.map((q, qIndex) => (
                <div key={q.id} className="p-4 bg-gray-50 rounded-xl">
                  <p className="font-medium mb-3">
                    {qIndex + 1}. {language === 'ru' ? q.question : q.questionUz}
                  </p>
                  <div className="space-y-2">
                    {(language === 'ru' ? q.options : q.optionsUz).map((option, oIndex) => (
                      <label 
                        key={oIndex}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition border-2 ${
                          showResults
                            ? oIndex === q.correctAnswer
                              ? 'bg-green-100 border-green-500'
                              : quizAnswers[qIndex] === oIndex
                                ? 'bg-red-100 border-red-500'
                                : 'bg-white border-gray-200'
                            : quizAnswers[qIndex] === oIndex
                              ? 'bg-blue-100 border-blue-500'
                              : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={quizAnswers[qIndex] === oIndex}
                          onChange={() => {
                            const newAnswers = [...quizAnswers];
                            newAnswers[qIndex] = oIndex;
                            setQuizAnswers(newAnswers);
                          }}
                          disabled={showResults}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="flex-1">{option}</span>
                        {showResults && oIndex === q.correctAnswer && (
                          <span className="text-green-600 font-bold">✓</span>
                        )}
                      </label>
                    ))}
                  </div>
                  {showResults && q.explanation && (
                    <p className="mt-3 text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
              ))}
              
              {!showResults && (
                <button
                  onClick={handleQuizSubmit}
                  disabled={quizAnswers.length !== step.quiz.length || quizAnswers.includes(undefined as any)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  {language === 'ru' ? 'Проверить ответы' : 'Javoblarni tekshirish'}
                </button>
              )}
              
              {showResults && !isQuizCorrect && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 font-medium">
                    {language === 'ru' 
                      ? '❌ Есть ошибки. Попробуйте ещё раз!' 
                      : '❌ Xatolar bor. Qaytadan urinib ko\'ring!'}
                  </p>
                  <button
                    onClick={() => {
                      setShowResults(false);
                      setQuizAnswers([]);
                    }}
                    className="mt-2 text-red-600 hover:underline"
                  >
                    {language === 'ru' ? 'Пройти заново' : 'Qaytadan o\'tish'}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Practice */}
          {step.practice && (
            <div className="space-y-4 mt-8 pt-6 border-t">
              <h3 className="font-bold text-lg flex items-center gap-2">
                ✍️ {language === 'ru' ? 'Практическое задание' : 'Amaliy topshiriq'}
              </h3>
              <p className="text-gray-600">
                {language === 'ru' ? step.practice.instruction : step.practice.instructionUz}
              </p>
              <div className="space-y-2">
                {(language === 'ru' ? step.practice.checkpoints : step.practice.checkpointsUz).map((checkpoint, i) => (
                  <label 
                    key={i}
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition border-2 ${
                      practiceChecks[i] 
                        ? 'bg-green-50 border-green-500' 
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={practiceChecks[i] || false}
                      onChange={(e) => {
                        const newChecks = [...practiceChecks];
                        newChecks[i] = e.target.checked;
                        setPracticeChecks(newChecks);
                      }}
                      className="w-5 h-5 text-green-600 rounded"
                    />
                    <span className={practiceChecks[i] ? 'text-green-700' : ''}>{checkpoint}</span>
                    {practiceChecks[i] && <span className="ml-auto text-green-600">✓</span>}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-5 border-t bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-yellow-500">⭐</span>
            <span>{step.points} {language === 'ru' ? 'баллов за завершение' : 'ball tugatish uchun'}</span>
          </div>
          <button
            onClick={onComplete}
            disabled={!canComplete}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${
              canComplete
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {canComplete 
              ? (language === 'ru' ? '✓ Завершить урок' : '✓ Darsni tugatish')
              : (language === 'ru' ? 'Выполните задания' : 'Topshiriqlarni bajaring')
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// Статистика
function StatsPanel({ progress, totalSteps, language }: { 
  progress: UserProgress; 
  totalSteps: number;
  language: Language;
}) {
  const completionPercent = Math.round((progress.completedSteps.length / totalSteps) * 100);
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="text-3xl font-bold text-blue-600">{progress.completedSteps.length}</div>
        <div className="text-sm text-gray-500">
          {language === 'ru' ? 'Шагов пройдено' : 'Qadam o\'tildi'}
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="text-3xl font-bold text-green-600">{completionPercent}%</div>
        <div className="text-sm text-gray-500">
          {language === 'ru' ? 'Прогресс' : 'Progress'}
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="text-3xl font-bold text-yellow-600">{progress.totalPoints} ⭐</div>
        <div className="text-sm text-gray-500">
          {language === 'ru' ? 'Баллы' : 'Ballar'}
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="text-3xl font-bold text-purple-600">{progress.badges.length}</div>
        <div className="text-sm text-gray-500">
          {language === 'ru' ? 'Достижения' : 'Yutuqlar'}
        </div>
      </div>
    </div>
  );
}

// Таблица лидеров
function Leaderboard({ language }: { language: Language }) {
  // В реальном проекте данные приходят с API
  const leaders = [
    { rank: 1, name: 'Алишер К.', points: 1250, steps: 87 },
    { rank: 2, name: 'Дилшод М.', points: 1100, steps: 72 },
    { rank: 3, name: 'Саида Р.', points: 980, steps: 65 },
    { rank: 4, name: language === 'ru' ? 'Вы' : 'Siz', points: 450, steps: 30, isCurrentUser: true },
    { rank: 5, name: 'Бобур А.', points: 400, steps: 28 },
  ];
  
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <div className="p-4 border-b bg-gradient-to-r from-yellow-50 to-orange-50">
        <h3 className="font-bold text-lg flex items-center gap-2">
          🏆 {language === 'ru' ? 'Рейтинг команды' : 'Jamoa reytingi'}
        </h3>
      </div>
      <div className="divide-y">
        {leaders.map(user => (
          <div 
            key={user.rank}
            className={`flex items-center gap-4 p-4 transition ${
              user.isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
              user.rank === 1 ? 'bg-yellow-400 text-white shadow-md' :
              user.rank === 2 ? 'bg-gray-300 text-white shadow-md' :
              user.rank === 3 ? 'bg-orange-400 text-white shadow-md' :
              'bg-gray-100 text-gray-600'
            }`}>
              {user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : user.rank}
            </div>
            <div className="flex-1">
              <div className={`font-medium ${user.isCurrentUser ? 'text-blue-600' : ''}`}>
                {user.name}
              </div>
              <div className="text-sm text-gray-500">
                {user.steps}/100 {language === 'ru' ? 'шагов' : 'qadam'}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">{user.points}</div>
              <div className="text-sm text-gray-400">
                {language === 'ru' ? 'баллов' : 'ball'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Достижения
function Achievements({ badges, language }: { badges: string[]; language: Language }) {
  const allBadges = [
    { id: 'first_step', icon: '🎉', title: language === 'ru' ? 'Первый шаг' : 'Birinchi qadam' },
    { id: 'product_expert_1', icon: '🎓', title: language === 'ru' ? 'Знаток' : 'Bilimdon' },
    { id: 'module_1_complete', icon: '🏆', title: language === 'ru' ? 'Модуль 1' : '1-modul' },
    { id: 'distribution_master', icon: '📦', title: language === 'ru' ? 'Дистрибуция' : 'Distribyutsiya' },
    { id: 'module_3_complete', icon: '📊', title: language === 'ru' ? 'Выкладка' : 'Joylashtirish' },
    { id: 'module_5_complete', icon: '👣', title: language === 'ru' ? 'Визиты' : 'Tashriflar' },
    { id: 'week_streak', icon: '🔥', title: language === 'ru' ? '7 дней' : '7 kun' },
    { id: 'course_complete', icon: '👑', title: language === 'ru' ? 'Мастер' : 'Usta' },
  ];
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        🏅 {language === 'ru' ? 'Достижения' : 'Yutuqlar'}
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {allBadges.map(badge => (
          <div
            key={badge.id}
            className={`p-3 rounded-xl text-center transition ${
              badges.includes(badge.id)
                ? 'bg-yellow-50 border-2 border-yellow-300 shadow-sm'
                : 'bg-gray-50 opacity-40 grayscale'
            }`}
          >
            <div className="text-2xl mb-1">{badge.icon}</div>
            <div className="text-xs font-medium">{badge.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Админ панель
function AdminPanel({ language }: { language: Language }) {
  const agents = [
    { name: 'Алишер К.', progress: 87, points: 1250, lastActive: '2 часа назад', status: 'active' },
    { name: 'Дилшод М.', progress: 72, points: 1100, lastActive: '5 часов назад', status: 'active' },
    { name: 'Саида Р.', progress: 65, points: 980, lastActive: 'Вчера', status: 'inactive' },
    { name: 'Бобур А.', progress: 28, points: 400, lastActive: '3 дня назад', status: 'inactive' },
    { name: 'Жамшид Т.', progress: 15, points: 150, lastActive: '1 неделю назад', status: 'at_risk' },
  ];
  
  return (
    <div className="space-y-6">
      {/* Статистика команды */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">
          📊 {language === 'ru' ? 'Статистика команды' : 'Jamoa statistikasi'}
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="text-3xl font-bold text-blue-600">25</div>
            <div className="text-sm text-gray-500">
              {language === 'ru' ? 'Всего агентов' : 'Jami agentlar'}
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="text-3xl font-bold text-green-600">18</div>
            <div className="text-sm text-gray-500">
              {language === 'ru' ? 'Активных' : 'Faol'}
            </div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
            <div className="text-3xl font-bold text-yellow-600">67%</div>
            <div className="text-sm text-gray-500">
              {language === 'ru' ? 'Ср. прогресс' : 'O\'rtacha progress'}
            </div>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <div className="text-3xl font-bold text-purple-600">5</div>
            <div className="text-sm text-gray-500">
              {language === 'ru' ? 'Завершили курс' : 'Kursni tugatdi'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Таблица агентов */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-bold text-lg">
            👥 {language === 'ru' ? 'Прогресс агентов' : 'Agentlar progressi'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-600">
                  {language === 'ru' ? 'Агент' : 'Agent'}
                </th>
                <th className="text-left p-4 font-medium text-gray-600">
                  {language === 'ru' ? 'Прогресс' : 'Progress'}
                </th>
                <th className="text-left p-4 font-medium text-gray-600">
                  {language === 'ru' ? 'Баллы' : 'Ballar'}
                </th>
                <th className="text-left p-4 font-medium text-gray-600">
                  {language === 'ru' ? 'Последняя активность' : 'Oxirgi faollik'}
                </th>
                <th className="text-left p-4 font-medium text-gray-600">
                  {language === 'ru' ? 'Статус' : 'Status'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {agents.map((agent, i) => (
                <tr key={i} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-medium">{agent.name}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            agent.progress >= 70 ? 'bg-green-500' :
                            agent.progress >= 40 ? 'bg-yellow-500' : 'bg-red-400'
                          }`}
                          style={{ width: `${agent.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{agent.progress}%</span>
                    </div>
                  </td>
                  <td className="p-4">{agent.points} ⭐</td>
                  <td className="p-4 text-gray-500">{agent.lastActive}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      agent.status === 'active' ? 'bg-green-100 text-green-700' :
                      agent.status === 'inactive' ? 'bg-gray-100 text-gray-600' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {agent.status === 'active' ? (language === 'ru' ? 'Активен' : 'Faol') :
                       agent.status === 'inactive' ? (language === 'ru' ? 'Неактивен' : 'Nofaol') :
                       (language === 'ru' ? 'Риск' : 'Xavf')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ============================================

export function LearningPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('learner');
  const [language, setLanguage] = useState<Language>('ru');
  const [activeStep, setActiveStep] = useState<Step | null>(null);
  const [progress, setProgress] = useProgress(salesRepCourse.id);
  
  const course = salesRepCourse;
  
  // Текущий шаг для отображения
  const currentStepData = course.steps.find(s => s.id === progress.currentStep) || course.steps[0];
  
  // Обработчик завершения урока
  const handleCompleteStep = () => {
    if (!activeStep) return;
    
    // Обновляем прогресс
    setProgress(prev => {
      const newCompletedSteps = prev.completedSteps.includes(activeStep.id)
        ? prev.completedSteps
        : [...prev.completedSteps, activeStep.id];
      
      const newBadges = activeStep.badge && !prev.badges.includes(activeStep.badge.id)
        ? [...prev.badges, activeStep.badge.id]
        : prev.badges;
      
      return {
        ...prev,
        completedSteps: newCompletedSteps,
        currentStep: Math.max(prev.currentStep, activeStep.id + 1),
        totalPoints: prev.completedSteps.includes(activeStep.id) 
          ? prev.totalPoints 
          : prev.totalPoints + activeStep.points,
        badges: newBadges,
        lastActivity: new Date().toISOString()
      };
    });
    
    setActiveStep(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/dashboard" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← {language === 'ru' ? 'Назад' : 'Orqaga'}
              </Link>
              <h1 className="text-xl font-bold">
                📚 {language === 'ru' ? course.title : course.titleUz}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Переключатель языка */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('ru')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    language === 'ru' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                  }`}
                >
                  🇷🇺 Рус
                </button>
                <button
                  onClick={() => setLanguage('uz')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    language === 'uz' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                  }`}
                >
                  🇺🇿 O'zb
                </button>
              </div>
              
              {/* Переключатель режима */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('learner')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    viewMode === 'learner' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                  }`}
                >
                  📖 {language === 'ru' ? 'Обучение' : 'Ta\'lim'}
                </button>
                <button
                  onClick={() => setViewMode('admin')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    viewMode === 'admin' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                  }`}
                >
                  ⚙️ {language === 'ru' ? 'Админ' : 'Admin'}
                </button>
              </div>
              
              {/* Баллы */}
              <div className="text-right pl-4 border-l">
                <div className="text-sm text-gray-500">
                  {language === 'ru' ? 'Ваши баллы' : 'Sizning ballaringiz'}
                </div>
                <div className="text-xl font-bold text-yellow-600">
                  {progress.totalPoints} ⭐
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'learner' ? (
          <>
            {/* Stats */}
            <StatsPanel 
              progress={progress} 
              totalSteps={course.totalSteps}
              language={language}
            />
            
            {/* Текущий урок */}
            <div className="mb-6">
              <CurrentLessonCard
                step={currentStepData}
                isCompleted={progress.completedSteps.includes(currentStepData.id)}
                onStart={() => setActiveStep(currentStepData)}
                language={language}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Progress Maze */}
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
              
              {/* Sidebar */}
              <div className="space-y-6">
                <Leaderboard language={language} />
                <Achievements badges={progress.badges} language={language} />
              </div>
            </div>
          </>
        ) : (
          <AdminPanel language={language} />
        )}
      </main>
      
      {/* Lesson Viewer Modal */}
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
