import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { generationApi, type GenerateLessonResponse, type QuizQuestion } from '../api/generation';
import { coursesApi, type Course } from '../api/courses';

// ===========================================
// ПРОСТОЙ MARKDOWN РЕНДЕР
// ===========================================
function renderMarkdown(text: string): string {
  return text
    .replace(/### (.+)/g, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
    .replace(/## (.+)/g, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
    .replace(/# (.+)/g, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

// ===========================================
// СТРАНИЦА ГЕНЕРАЦИИ УРОКОВ
// ===========================================
export function GenerationPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Форма
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [courseId, setCourseId] = useState<string>('');
  const [includeQuiz, setIncludeQuiz] = useState(true);
  const [quizCount, setQuizCount] = useState(5);

  // Курсы для селектора
  const [courses, setCourses] = useState<Course[]>([]);

  // Результат
  const [result, setResult] = useState<GenerateLessonResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Квиз состояние
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizChecked, setQuizChecked] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const resp = await coursesApi.getCourses(0, 100);
      setCourses(resp.data.items || resp.data || []);
    } catch {
      // ignore
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setError('');
    setResult(null);
    setQuizAnswers({});
    setQuizChecked(false);
    setShowQuiz(false);

    try {
      const resp = await generationApi.generateLesson({
        topic: topic.trim(),
        difficulty,
        course_id: courseId || null,
        include_quiz: includeQuiz,
        quiz_count: quizCount,
        language: 'ru',
      });
      setResult(resp.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Ошибка генерации';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = `${result.lesson.title}\n\n${result.lesson.content}\n\nКлючевые моменты:\n${result.lesson.key_points.map(p => `• ${p}`).join('\n')}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setResult(null);
    setQuizAnswers({});
    setQuizChecked(false);
    setShowQuiz(false);
    setError('');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const difficultyLabels: Record<string, string> = {
    beginner: 'Начальный',
    intermediate: 'Средний',
    advanced: 'Продвинутый',
  };

  const getQuizScore = () => {
    if (!result?.lesson.quiz_questions) return { correct: 0, total: 0 };
    const qs = result.lesson.quiz_questions;
    let correct = 0;
    qs.forEach((q, i) => {
      if (quizAnswers[i] === q.correct_answer) correct++;
    });
    return { correct, total: qs.length };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-white/80 hover:text-white transition text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </Link>
            <h1 className="text-xl font-bold">🤖 AI Генерация уроков</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/80 text-sm hidden sm:inline">{user?.full_name || 'Пользователь'}</span>
            <button onClick={handleLogout} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition">
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* =================== ФОРМА =================== */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Параметры генерации</h2>

              {/* Тема */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Тема урока *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="Например: Техника СПИН продаж"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                />
              </div>

              {/* Сложность */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Уровень сложности</label>
                <div className="flex gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition ${
                        difficulty === d
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {difficultyLabels[d]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Курс */}
              {courses.length > 0 && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Привязать к курсу (опционально)</label>
                  <select
                    value={courseId}
                    onChange={e => setCourseId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Без привязки</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Квиз опции */}
              <div className="mb-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeQuiz}
                    onChange={e => setIncludeQuiz(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Включить тест</span>
                </label>
                {includeQuiz && (
                  <div className="mt-3 ml-8">
                    <label className="block text-sm text-gray-600 mb-1">Количество вопросов</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={quizCount}
                      onChange={e => setQuizCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Кнопка генерации */}
              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || isGenerating}
                className={`w-full py-4 rounded-xl font-bold text-lg transition ${
                  isGenerating
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Claude AI генерирует урок... (~30 сек)
                  </span>
                ) : (
                  '🤖 Сгенерировать урок'
                )}
              </button>

              {/* Ошибка */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  ❌ {error}
                </div>
              )}
            </div>
          </div>

          {/* =================== РЕЗУЛЬТАТ =================== */}
          <div className="space-y-6">
            {!result && !isGenerating && (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🎓</div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">Результат появится здесь</h3>
                <p className="text-gray-400 text-sm">Введите тему и нажмите «Сгенерировать урок»</p>
              </div>
            )}

            {isGenerating && (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4 animate-bounce">🤖</div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">Claude AI работает...</h3>
                <p className="text-gray-400 text-sm">Генерация урока по теме «{topic}»</p>
                <div className="mt-6 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            )}

            {result && (
              <>
                {/* Заголовок и метаданные */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">{result.lesson.title}</h2>

                  {/* Метаданные */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                      📊 {difficultyLabels[result.lesson.difficulty] || result.lesson.difficulty}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      ⏱ {result.lesson.estimated_duration_minutes} мин
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      🔤 {result.metadata.tokens_used} токенов
                    </span>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      ⚡ {result.metadata.generation_time_seconds.toFixed(1)}с
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${result.metadata.is_grounded ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {result.metadata.is_grounded ? '✅ Основан на документах' : '💡 Из знаний AI'}
                    </span>
                  </div>

                  {/* Краткое описание */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-gray-700 text-sm italic">{result.lesson.summary}</p>
                  </div>

                  {/* Контент урока */}
                  <div
                    className="prose max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(result.lesson.content) }}
                  />
                </div>

                {/* Ключевые моменты */}
                {result.lesson.key_points?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">✅ Ключевые моменты</h3>
                    <ul className="space-y-2">
                      {result.lesson.key_points.map((point, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="text-green-500 mt-1">✓</span>
                          <span className="text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* КВИЗ СЕКЦИЯ */}
                {result.lesson.quiz_questions?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <button
                      onClick={() => setShowQuiz(!showQuiz)}
                      className="w-full flex items-center justify-between text-lg font-bold text-gray-800"
                    >
                      <span>📝 Тест ({result.lesson.quiz_questions.length} вопросов)</span>
                      <svg className={`w-5 h-5 transition-transform ${showQuiz ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showQuiz && (
                      <div className="mt-6 space-y-6">
                        {result.lesson.quiz_questions.map((q: QuizQuestion, qi: number) => (
                          <div key={qi} className={`p-4 rounded-xl border-2 transition ${
                            quizChecked
                              ? quizAnswers[qi] === q.correct_answer
                                ? 'border-green-300 bg-green-50'
                                : quizAnswers[qi]
                                  ? 'border-red-300 bg-red-50'
                                  : 'border-gray-200'
                              : 'border-gray-200'
                          }`}>
                            <p className="font-medium text-gray-800 mb-3">{qi + 1}. {q.question}</p>
                            <div className="space-y-2">
                              {q.options.map((opt, oi) => {
                                const letter = String.fromCharCode(65 + oi);
                                const isSelected = quizAnswers[qi] === letter;
                                const isCorrect = letter === q.correct_answer;

                                return (
                                  <button
                                    key={oi}
                                    onClick={() => {
                                      if (!quizChecked) {
                                        setQuizAnswers(prev => ({ ...prev, [qi]: letter }));
                                      }
                                    }}
                                    className={`w-full text-left p-3 rounded-lg border transition text-sm ${
                                      quizChecked
                                        ? isCorrect
                                          ? 'border-green-500 bg-green-100 text-green-800'
                                          : isSelected && !isCorrect
                                            ? 'border-red-500 bg-red-100 text-red-800'
                                            : 'border-gray-200 text-gray-600'
                                        : isSelected
                                          ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                                          : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                                    }`}
                                  >
                                    <span className="font-bold mr-2">{letter}.</span>
                                    {opt}
                                    {quizChecked && isCorrect && <span className="float-right">✅</span>}
                                    {quizChecked && isSelected && !isCorrect && <span className="float-right">❌</span>}
                                  </button>
                                );
                              })}
                            </div>

                            {quizChecked && q.explanation && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                                💡 {q.explanation}
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Кнопка проверки / результат */}
                        {!quizChecked ? (
                          <button
                            onClick={() => setQuizChecked(true)}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                          >
                            Проверить ответы
                          </button>
                        ) : (
                          <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="text-2xl font-bold text-gray-800">
                              Результат: {getQuizScore().correct}/{getQuizScore().total}
                              {' '}({Math.round((getQuizScore().correct / getQuizScore().total) * 100)}%)
                            </p>
                            <p className={`text-sm mt-1 ${getQuizScore().correct / getQuizScore().total >= 0.7 ? 'text-green-600' : 'text-red-600'}`}>
                              {getQuizScore().correct / getQuizScore().total >= 0.7 ? '🎉 Отлично!' : '📖 Стоит повторить материал'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Кнопки действий */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCopy}
                    className="flex-1 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    {copied ? '✅ Скопировано!' : '📋 Копировать урок'}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    🔄 Сгенерировать заново
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
