import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { quizApi } from '../api/quiz';

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

  const finishQuiz = useCallback(() => {
    // Подсчёт баллов
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer) correct++;
    });
    const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    setScore(pct);
    setStage('results');

    // Отправить результат
    if (quizItem?.id && courseId) {
      const answersMap: Record<string, string> = {};
      questions.forEach((q, i) => {
        answersMap[q.id || `q${i}`] = answers[i] || '';
      });
      quizApi.submitResult({
        content_item_id: quizItem.id,
        course_id: courseId,
        answers: answersMap,
        score: pct,
        time_spent_seconds: Math.round((Date.now() - startTime) / 1000),
        passed: pct >= passingScore,
      });
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

  const difficultyLabels: Record<string, string> = {
    beginner: 'Начальный',
    intermediate: 'Средний',
    advanced: 'Продвинутый',
  };

  // Если нет данных квиза
  if (!quizItem || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">❓</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Тест не найден</h2>
          <p className="text-gray-500 mb-6">Данные теста не загружены. Вернитесь к курсу и попробуйте снова.</p>
          <Link to="/learning" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition">
            📚 К курсам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/learning" className="text-white/80 hover:text-white transition text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              К курсам
            </Link>
            <h1 className="text-xl font-bold">📝 {quizItem.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            {stage === 'quiz' && timeLimit && (
              <span className={`px-3 py-1 rounded-lg font-mono font-bold ${timeLeft < 60 ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`}>
                ⏱ {formatTime(timeLeft)}
              </span>
            )}
            <span className="text-white/80 text-sm hidden sm:inline">{user?.full_name}</span>
            <button onClick={handleLogout} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition">Выйти</button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* =================== СТАРТОВЫЙ ЭКРАН =================== */}
        {stage === 'start' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-lg mx-auto">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{quizItem.title}</h2>
            <div className="flex flex-wrap justify-center gap-2 my-4">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                📋 {questions.length} вопросов
              </span>
              {quizItem.difficulty && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  📊 {difficultyLabels[quizItem.difficulty] || quizItem.difficulty}
                </span>
              )}
              {timeLimit && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  ⏱ {timeLimit} мин
                </span>
              )}
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                ✅ Проходной: {passingScore}%
              </span>
            </div>
            <button
              onClick={() => { setStage('quiz'); setTimeLeft(timeLimit ? timeLimit * 60 : 0); }}
              className="mt-6 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg transition"
            >
              Начать тест 🚀
            </button>
          </div>
        )}

        {/* =================== ПРОХОЖДЕНИЕ ТЕСТА =================== */}
        {stage === 'quiz' && (
          <div>
            {/* Прогресс */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Вопрос {currentQ + 1} из {questions.length}</span>
                <span>{Object.keys(answers).length} из {questions.length} отвечено</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Вопрос */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
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
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 mr-3 font-bold text-sm">
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
                className="flex-1 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Предыдущий
              </button>
              {currentQ < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ(prev => prev + 1)}
                  disabled={!answers[currentQ]}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Следующий →
                </button>
              ) : (
                <button
                  onClick={finishQuiz}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition"
                >
                  ✅ Завершить тест
                </button>
              )}
            </div>

            {/* Точки навигации */}
            <div className="mt-6 flex justify-center gap-2 flex-wrap">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition ${
                    i === currentQ
                      ? 'bg-indigo-600 text-white'
                      : answers[i]
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
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
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="relative w-40 h-40 mx-auto mb-6">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={score >= passingScore ? '#22c55e' : '#ef4444'}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 314} 314`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-800">{score}%</span>
                </div>
              </div>

              <h2 className={`text-2xl font-bold ${score >= passingScore ? 'text-green-600' : 'text-red-600'}`}>
                {score >= passingScore ? '🎉 Тест пройден!' : '📖 Не пройден'}
              </h2>

              <p className="text-gray-600 mt-2">
                Вы набрали: {questions.filter((q, i) => answers[i] === q.correct_answer).length} из {questions.length}
                {' '}({score}%)
              </p>

              <p className="text-gray-400 text-sm mt-1">
                Время: {formatTime(Math.round((Date.now() - startTime) / 1000))}
              </p>
            </div>

            {/* Разбор ответов */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Разбор ответов</h3>
              <div className="space-y-4">
                {questions.map((q, i) => {
                  const isCorrect = answers[i] === q.correct_answer;
                  return (
                    <div key={i} className={`p-4 rounded-xl border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{isCorrect ? '✅' : '❌'}</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{i + 1}. {q.question}</p>
                          <p className="text-sm mt-1">
                            <span className="text-gray-500">Ваш ответ: </span>
                            <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                              {answers[i] || 'Нет ответа'}
                            </span>
                            {!isCorrect && (
                              <>
                                <span className="text-gray-400 mx-2">|</span>
                                <span className="text-green-700 font-medium">Правильно: {q.correct_answer}</span>
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
                className="flex-1 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                🔄 Пройти заново
              </button>
              <Link
                to="/learning"
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-center hover:bg-indigo-700 transition"
              >
                📚 Вернуться к курсу
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
