import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { learningApi } from '../api/learning';
import { toast } from '../stores/toastStore';
import { useT } from '../stores/langStore';

// ===========================================
// ИНТЕРФЕЙСЫ
// ===========================================
interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  points?: number;
}

interface QuizItem {
  id: string;
  title: string;
  content_type: string;
  content_data?: {
    questions?: QuizQuestion[];
    passing_score?: number;
    time_limit_minutes?: number | null;
  };
  difficulty?: string;
  duration_minutes?: number;
}

type QuizStage = 'start' | 'quiz' | 'results';

// ===========================================
// СТРАНИЦА ПРОХОЖДЕНИЯ ТЕСТА
// ===========================================
export function QuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const t = useT();

  // Данные квиза из router state
  const quizItem = (location.state as { quiz?: QuizItem })?.quiz;
  const courseId = (location.state as { courseId?: string })?.courseId;

  const questions: QuizQuestion[] = quizItem?.content_data?.questions || [];
  const passingScore = quizItem?.content_data?.passing_score || 70;
  const timeLimit = quizItem?.content_data?.time_limit_minutes || null;

  // Состояние
  const [stage, setStage] = useState<QuizStage>('start');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(timeLimit ? timeLimit * 60 : 0);
  const [startTime] = useState(Date.now());
  const [score, setScore] = useState(0);

  // Таймер
  useEffect(() => {
    if (stage !== 'quiz' || !timeLimit) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, timeLimit]);

  const finishQuiz = useCallback(async () => {
    // Подсчёт баллов
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer) correct++;
    });
    const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    setScore(pct);
    setStage('results');

    // Отправить результат через Learning API
    if (courseId) {
      try {
        const resp = await learningApi.completeCourse(courseId, {
          quiz_score: pct,
          time_spent_seconds: Math.round((Date.now() - startTime) / 1000),
        });
        if (resp.data.level_up) {
          toast.success(t('quiz.levelUp', { from: resp.data.level_up.from, to: resp.data.level_up.to }));
        }
      } catch {
        toast.error(t('quiz.saveError'));
      }
    }
  }, [answers, questions, quizItem, courseId, passingScore, startTime]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };


  // Если нет данных квиза
  if (!quizItem || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
        <div className="rounded-2xl shadow-lg p-8 text-center max-w-md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-6xl mb-4">❓</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('quiz.notFound')}</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{t('quiz.notFoundDesc')}</p>
          <Link to="/learning" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition">
            📚 {t('quiz.toCourses')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-surface)' }}>
      {/* Шапка */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link to="/learning" className="text-white/80 hover:text-white transition text-sm flex items-center gap-1 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">К курсам</span>
            </Link>
            <h1 className="text-base sm:text-xl font-bold truncate">📝 {quizItem.title}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {stage === 'quiz' && timeLimit && (
              <span className={`px-3 py-1 rounded-lg font-mono font-bold ${timeLeft < 60 ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`}>
                ⏱ {formatTime(timeLeft)}
              </span>
            )}
            <span className="text-white/80 text-sm hidden sm:inline">{user?.full_name}</span>
            <button onClick={handleLogout} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition">{t('quiz.logout')}</button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* =================== СТАРТОВЫЙ ЭКРАН =================== */}
        {stage === 'start' && (
          <div className="rounded-2xl shadow-lg p-8 text-center max-w-lg mx-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{quizItem.title}</h2>
            <div className="flex flex-wrap justify-center gap-2 my-4">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                📋 {t('quiz.questions', { count: questions.length })}
              </span>
              {quizItem.difficulty && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  📊 {t('quiz.difficulty.' + quizItem.difficulty) || quizItem.difficulty}
                </span>
              )}
              {timeLimit && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  ⏱ {timeLimit} мин
                </span>
              )}
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                ✅ {t('quiz.passing', { score: passingScore })}
              </span>
            </div>
            <button
              onClick={() => { setStage('quiz'); setTimeLeft(timeLimit ? timeLimit * 60 : 0); }}
              className="mt-6 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg transition"
            >
              {t('quiz.startTest')} 🚀
            </button>
          </div>
        )}

        {/* =================== ПРОХОЖДЕНИЕ ТЕСТА =================== */}
        {stage === 'quiz' && (
          <div>
            {/* Прогресс */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                <span>{t('quiz.questionOf', { current: currentQ + 1, total: questions.length })}</span>
                <span>{t('quiz.answeredOf', { answered: Object.keys(answers).length, total: questions.length })}</span>
              </div>
              <div className="w-full rounded-full h-2.5" style={{ background: 'var(--bg-overlay)' }}>
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Вопрос */}
            <div className="rounded-2xl shadow-lg p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                {currentQ + 1}. {questions[currentQ].question}
              </h3>

              <div className="space-y-3">
                {questions[currentQ].options.map((opt, oi) => {
                  const letter = String.fromCharCode(65 + oi);
                  const isSelected = answers[currentQ] === letter;

                  return (
                    <button
                      key={oi}
                      onClick={() => setAnswers(prev => ({ ...prev, [currentQ]: letter }))}
                      className={`w-full text-left p-4 rounded-xl border-2 transition font-medium ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                          : ''
                      }`}
                      style={!isSelected ? { borderColor: 'var(--border)', color: 'var(--text-primary)' } : {}}
                    >
                      <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg mr-2 sm:mr-3 font-bold text-xs sm:text-sm" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}>
                        {letter}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Навигация */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
                disabled={currentQ === 0}
                className="flex-1 py-3 border-2 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                ← {t('quiz.prev')}
              </button>
              {currentQ < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ(prev => prev + 1)}
                  disabled={!answers[currentQ]}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {t('quiz.next')} →
                </button>
              ) : (
                <button
                  onClick={finishQuiz}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition"
                >
                  ✅ {t('quiz.finishTest')}
                </button>
              )}
            </div>

            {/* Точки навигации */}
            <div className="mt-6 flex justify-center gap-1.5 sm:gap-2 flex-wrap">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold transition ${
                    i === currentQ
                      ? 'bg-indigo-600 text-white'
                      : answers[i]
                        ? 'bg-green-200 text-green-800'
                        : ''
                  }`}
                  style={!(i === currentQ) && !answers[i] ? { background: 'var(--bg-overlay)', color: 'var(--text-secondary)' } : {}}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* =================== РЕЗУЛЬТАТЫ =================== */}
        {stage === 'results' && (
          <div className="space-y-6">
            {/* Круг с результатом */}
            <div className="rounded-2xl shadow-lg p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="relative w-40 h-40 mx-auto mb-6">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-overlay)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={score >= passingScore ? '#22c55e' : '#ef4444'}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 314} 314`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{score}%</span>
                </div>
              </div>

              <h2 className={`text-2xl font-bold ${score >= passingScore ? 'text-green-600' : 'text-red-600'}`}>
                {score >= passingScore ? '🎉 ' + t('quiz.passed') : '📖 ' + t('quiz.notPassed')}
              </h2>

              <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                {t('quiz.youScored', { correct: questions.filter((q, i) => answers[i] === q.correct_answer).length, total: questions.length })}
                {' '}({score}%)
              </p>

              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {t('quiz.timeTaken')}: {formatTime(Math.round((Date.now() - startTime) / 1000))}
              </p>
            </div>

            {/* Разбор ответов */}
            <div className="rounded-2xl shadow-lg p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                <svg className="inline w-5 h-5 mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                {t('quiz.reviewTitle')}
              </h3>
              <div className="space-y-4">
                {questions.map((q, i) => {
                  const isCorrect = answers[i] === q.correct_answer;
                  return (
                    <div key={i} className={`p-4 rounded-xl border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{isCorrect ? '✅' : '❌'}</span>
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{i + 1}. {q.question}</p>
                          <p className="text-sm mt-1">
                            <span style={{ color: 'var(--text-muted)' }}>{t('quiz.yourAnswer')} </span>
                            <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                              {answers[i] || t('quiz.noAnswer')}
                            </span>
                            {!isCorrect && (
                              <>
                                <span className="mx-2" style={{ color: 'var(--text-muted)' }}>|</span>
                                <span className="text-green-700 font-medium">{t('quiz.correctAnswer', { answer: q.correct_answer })}</span>
                              </>
                            )}
                          </p>
                          {q.explanation && (
                            <p className="text-sm text-blue-700 mt-2 bg-blue-50 p-2 rounded-lg">
                              💡 {q.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStage('start');
                  setAnswers({});
                  setCurrentQ(0);
                  setScore(0);
                }}
                className="flex-1 py-3 border-2 rounded-xl font-medium transition"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                🔄 {t('quiz.retake')}
              </button>
              <Link
                to="/learning"
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-center hover:bg-indigo-700 transition"
              >
                📚 {t('quiz.backToCourse')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
