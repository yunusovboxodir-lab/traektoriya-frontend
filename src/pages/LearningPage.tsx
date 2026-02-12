import { useState, useEffect, useCallback } from 'react';
import {
  learningApi,
  LEVEL_NAMES,
  LEVEL_COLORS,
  type LearningMapResponse,
  type SectionCoursesResponse,
  type CourseDetailResponse,
  type SectionMap,
  type CourseItem,
  type CourseCompleteResponse,
} from '../api/learning';
import { useToastStore } from '../stores/toastStore';

// ===========================================
// LEARNING MAP — три режима отображения:
//   1. map     — карта разделов с прогрессом
//   2. section — курсы раздела по уровням
//   3. course  — содержание курса (слайды + квиз)
// ===========================================

type View = 'map' | 'section' | 'course';

export function LearningPage() {
  const [view, setView] = useState<View>('map');
  const [mapData, setMapData] = useState<LearningMapResponse | null>(null);
  const [sectionData, setSectionData] = useState<SectionCoursesResponse | null>(null);
  const [courseData, setCourseData] = useState<CourseDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Quiz state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [completionResult, setCompletionResult] = useState<CourseCompleteResponse | null>(null);
  const [startTime] = useState(Date.now());

  const addToast = useToastStore((s) => s.addToast);

  // Load map
  const loadMap = useCallback(async () => {
    try {
      setIsLoading(true);
      const resp = await learningApi.getMap();
      setMapData(resp.data);
      setError('');
    } catch {
      setError('Не удалось загрузить карту обучения');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMap();
  }, [loadMap]);

  // Open section
  const openSection = async (sectionId: string) => {
    try {
      setIsLoading(true);
      const resp = await learningApi.getSectionCourses(sectionId);
      setSectionData(resp.data);
      setView('section');
      setError('');
    } catch {
      setError('Не удалось загрузить раздел');
    } finally {
      setIsLoading(false);
    }
  };

  // Open course
  const openCourse = async (courseId: string) => {
    try {
      setIsLoading(true);
      const resp = await learningApi.getCourseDetail(courseId);
      setCourseData(resp.data);
      setCurrentSlide(0);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setCompletionResult(null);
      setView('course');
      setError('');
    } catch {
      setError('Не удалось загрузить курс');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit quiz and complete course
  const submitQuiz = async () => {
    if (!courseData) return;
    const quiz = courseData.content.quiz || [];
    if (quiz.length === 0) return;

    let correct = 0;
    quiz.forEach((q, i) => {
      if (quizAnswers[i] === q.correct_answer) correct++;
    });
    const score = Math.round((correct / quiz.length) * 100);

    try {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const resp = await learningApi.completeCourse(courseData.course.id, {
        quiz_score: score,
        time_spent_seconds: elapsed,
      });
      setCompletionResult(resp.data);
      setQuizSubmitted(true);

      if (resp.data.level_up) {
        addToast('success', resp.data.level_up.message);
      } else if (resp.data.passed) {
        addToast('success', `Курс пройден! Результат: ${score}%`);
      } else {
        addToast('warning', `Результат: ${score}%. Попробуйте пройти ещё раз.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка при отправке результата';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const resp = (err as { response?: { status?: number } }).response;
        if (resp?.status === 409) {
          addToast('info', 'Этот курс уже пройден');
          return;
        }
      }
      addToast('error', msg);
    }
  };

  // Go back
  const goBack = () => {
    if (view === 'course') {
      if (sectionData) {
        setView('section');
      } else {
        setView('map');
      }
    } else if (view === 'section') {
      setView('map');
      loadMap(); // Refresh progress
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        <button onClick={loadMap} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Попробовать снова
        </button>
      </div>
    );
  }

  // ======== VIEW: MAP ========
  if (view === 'map' && mapData) {
    return <MapView data={mapData} onOpenSection={openSection} />;
  }

  // ======== VIEW: SECTION ========
  if (view === 'section' && sectionData) {
    return (
      <SectionView
        data={sectionData}
        onBack={goBack}
        onOpenCourse={openCourse}
      />
    );
  }

  // ======== VIEW: COURSE ========
  if (view === 'course' && courseData) {
    return (
      <CourseView
        data={courseData}
        currentSlide={currentSlide}
        setCurrentSlide={setCurrentSlide}
        quizAnswers={quizAnswers}
        setQuizAnswers={setQuizAnswers}
        quizSubmitted={quizSubmitted}
        completionResult={completionResult}
        onSubmitQuiz={submitQuiz}
        onBack={goBack}
      />
    );
  }

  return null;
}


// ============================================================
// MAP VIEW — Learning Map with sections and user progress
// ============================================================

function MapView({
  data,
  onOpenSection,
}: {
  data: LearningMapResponse;
  onOpenSection: (id: string) => void;
}) {
  const { user, sections, ai_recommendations } = data;
  const levelColor = LEVEL_COLORS[user.current_level] || '#666';

  return (
    <div>
      {/* User progress header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Карта обучения</h1>
            <p className="text-gray-500 mt-1">{user.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="px-4 py-2 rounded-full text-white font-bold text-sm"
              style={{ backgroundColor: levelColor }}
            >
              {LEVEL_NAMES[user.current_level] || user.current_level}
            </div>
            {user.level_progress.next && (
              <div className="text-sm text-gray-500">
                <span className="font-medium">{Math.round(user.level_progress.percentage_to_next)}%</span> до{' '}
                {LEVEL_NAMES[user.level_progress.next]}
              </div>
            )}
          </div>
        </div>

        {/* Level-up requirements */}
        {user.level_progress.requirements && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <RequirementBar
              label="Курсы"
              current={user.level_progress.requirements.completion.current}
              required={user.level_progress.requirements.completion.required}
              unit="%"
            />
            <RequirementBar
              label="Тесты"
              current={user.level_progress.requirements.quiz_score.current}
              required={user.level_progress.requirements.quiz_score.required}
              unit="%"
            />
            <RequirementBar
              label="Дни"
              current={user.level_progress.requirements.days.current}
              required={user.level_progress.requirements.days.required}
              unit=""
            />
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      {ai_recommendations.courses.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5 mb-6">
          <h3 className="text-lg font-bold text-purple-800 mb-3">
            AI-рекомендации для вас
          </h3>
          <div className="space-y-2">
            {ai_recommendations.courses.map((rec, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
                <span className="text-purple-500 font-bold text-sm">#{rec.priority}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{rec.title.ru}</p>
                  {rec.reason && <p className="text-sm text-gray-500">{rec.reason}</p>}
                </div>
                {rec.has_personal_intro && (
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                    Персональный
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sections grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map((section) => (
          <SectionCard
            key={section.section_id}
            section={section}
            onClick={() => section.is_unlocked && onOpenSection(section.section_id)}
          />
        ))}
      </div>
    </div>
  );
}


function RequirementBar({
  label,
  current,
  required,
  unit,
}: {
  label: string;
  current: number;
  required: number;
  unit: string;
}) {
  const pct = required > 0 ? Math.min((current / required) * 100, 100) : 0;
  const met = current >= required;

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span className={met ? 'text-green-600 font-medium' : ''}>
          {current}{unit} / {required}{unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${met ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}


function SectionCard({
  section,
  onClick,
}: {
  section: SectionMap;
  onClick: () => void;
}) {
  const locked = !section.is_unlocked;
  const progress = section.progress;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-md overflow-hidden transition ${
        locked ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer'
      }`}
    >
      {/* Color header */}
      <div
        className="h-3"
        style={{ backgroundColor: section.color || '#ccc' }}
      />
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">{section.icon || '📚'}</span>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800">{section.title.ru}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {LEVEL_NAMES[section.level_range.start]}
              {section.level_range.start !== section.level_range.end &&
                ` → ${LEVEL_NAMES[section.level_range.end]}`}
            </p>
          </div>
        </div>

        {locked ? (
          <div className="text-sm text-gray-400">
            {section.unlock_condition?.type === 'level' && (
              <span>Откроется на уровне {LEVEL_NAMES[section.unlock_condition.required_level || ''] || '...'}</span>
            )}
            {section.unlock_condition?.type === 'section' && (
              <span>Пройдите предыдущий раздел</span>
            )}
            {section.unlock_condition?.type === 'role' && (
              <span>Доступно для руководителей</span>
            )}
          </div>
        ) : progress ? (
          <div>
            {/* Progress bar */}
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{progress.completed} / {progress.total} курсов</span>
              <span>{Math.round(progress.percentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all"
                style={{
                  width: `${progress.percentage}%`,
                  backgroundColor: section.color || '#2196F3',
                }}
              />
            </div>

            {/* Level badges */}
            {section.levels && (
              <div className="flex gap-1.5 mt-3">
                {section.levels.map((lvl) => (
                  <div
                    key={lvl.level}
                    className={`flex-1 text-center text-xs py-1 rounded ${
                      lvl.is_locked
                        ? 'bg-gray-100 text-gray-400'
                        : lvl.percentage === 100
                        ? 'bg-green-100 text-green-700 font-medium'
                        : lvl.is_current_user_level
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    title={LEVEL_NAMES[lvl.level]}
                  >
                    {lvl.percentage === 100 ? '✓' : `${lvl.courses_completed}/${lvl.courses_total}`}
                  </div>
                ))}
              </div>
            )}

            {section.ai_recommended_count > 0 && (
              <div className="mt-2 text-xs text-purple-600 font-medium">
                AI рекомендует {section.ai_recommended_count} курс(ов)
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}


// ============================================================
// SECTION VIEW — courses grouped by levels
// ============================================================

function SectionView({
  data,
  onBack,
  onOpenCourse,
}: {
  data: SectionCoursesResponse;
  onBack: () => void;
  onOpenCourse: (id: string) => void;
}) {
  return (
    <div>
      {/* Header */}
      <button onClick={onBack} className="mb-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
        &larr; Назад к карте
      </button>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{data.section.title.ru}</h2>
        {data.section.description?.ru && (
          <p className="text-gray-500 mt-1">{data.section.description.ru}</p>
        )}
        <div className="mt-3 flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {data.user_progress.completed} / {data.user_progress.total} курсов
          </div>
          <div className="flex-1 max-w-xs">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${data.user_progress.percentage}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium">{Math.round(data.user_progress.percentage)}%</span>
        </div>
      </div>

      {/* Levels with courses */}
      <div className="space-y-6">
        {data.levels.map((level) => (
          <LevelBlock key={level.level} level={level} onOpenCourse={onOpenCourse} />
        ))}
      </div>
    </div>
  );
}


function LevelBlock({
  level,
  onOpenCourse,
}: {
  level: { level: string; level_name: { ru: string }; is_unlocked: boolean; is_completed: boolean; courses?: CourseItem[] | null; courses_preview_count?: number | null; unlock_message?: string | null };
  onOpenCourse: (id: string) => void;
}) {
  const levelColor = LEVEL_COLORS[level.level] || '#666';

  return (
    <div className={`rounded-xl border ${level.is_unlocked ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
      {/* Level header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: levelColor }}
        />
        <h3 className="font-bold text-gray-800">{level.level_name.ru}</h3>
        {level.is_completed && (
          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Пройден</span>
        )}
        {!level.is_unlocked && level.unlock_message && (
          <span className="text-xs text-gray-400 ml-auto">{level.unlock_message}</span>
        )}
      </div>

      {/* Courses */}
      {level.is_unlocked && level.courses ? (
        <div className="divide-y divide-gray-50">
          {level.courses.map((course) => (
            <CourseRow key={course.id} course={course} onClick={() => onOpenCourse(course.id)} />
          ))}
        </div>
      ) : !level.is_unlocked ? (
        <div className="p-4 text-center text-sm text-gray-400">
          {level.courses_preview_count
            ? `${level.courses_preview_count} курсов — откроется позже`
            : 'Раздел заблокирован'}
        </div>
      ) : null}
    </div>
  );
}


function CourseRow({
  course,
  onClick,
}: {
  course: CourseItem;
  onClick: () => void;
}) {
  const isCompleted = course.status === 'completed';
  const isRecommended = course.is_ai_recommended;

  return (
    <div
      onClick={onClick}
      className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition ${
        isRecommended ? 'bg-purple-50 hover:bg-purple-100' : ''
      }`}
    >
      {/* Status icon */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
        isCompleted
          ? 'bg-green-100 text-green-600'
          : isRecommended
          ? 'bg-purple-100 text-purple-600'
          : 'bg-gray-100 text-gray-400'
      }`}>
        {isCompleted ? '✓' : isRecommended ? '★' : '▶'}
      </div>

      {/* Course info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isCompleted ? 'text-gray-500' : 'text-gray-800'}`}>
          {course.title.ru}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{course.duration_minutes} мин</span>
          {isCompleted && course.quiz_score != null && (
            <span className="text-xs text-green-600">{course.quiz_score}%</span>
          )}
          {isRecommended && course.recommendation?.reason && (
            <span className="text-xs text-purple-500 truncate">{course.recommendation.reason}</span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <span className="text-gray-300">&rsaquo;</span>
    </div>
  );
}


// ============================================================
// COURSE VIEW — slides + quiz
// ============================================================

function CourseView({
  data,
  currentSlide,
  setCurrentSlide,
  quizAnswers,
  setQuizAnswers,
  quizSubmitted,
  completionResult,
  onSubmitQuiz,
  onBack,
}: {
  data: CourseDetailResponse;
  currentSlide: number;
  setCurrentSlide: (n: number) => void;
  quizAnswers: Record<number, number>;
  setQuizAnswers: (a: Record<number, number>) => void;
  quizSubmitted: boolean;
  completionResult: CourseCompleteResponse | null;
  onSubmitQuiz: () => void;
  onBack: () => void;
}) {
  const slides = data.content.slides || [];
  const quiz = data.content.quiz || [];
  const totalPages = slides.length + (quiz.length > 0 ? 1 : 0); // slides + quiz page
  const isQuizPage = currentSlide >= slides.length;
  const progress = totalPages > 0 ? ((currentSlide + 1) / totalPages) * 100 : 0;

  return (
    <div>
      {/* Header */}
      <button onClick={onBack} className="mb-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
        &larr; Назад
      </button>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Course title bar */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{data.course.title.ru}</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {LEVEL_NAMES[data.course.level] || data.course.level}
            </span>
            <span className="text-xs text-gray-400">{data.course.duration_minutes} мин</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 h-1">
          <div
            className="h-1 bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content area */}
        <div className="p-6 min-h-[300px]">
          {!isQuizPage && slides[currentSlide] ? (
            // Slide
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {slides[currentSlide].title}
              </h3>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                {slides[currentSlide].content}
              </p>
            </div>
          ) : isQuizPage && !quizSubmitted ? (
            // Quiz
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-6">Проверка знаний</h3>
              <div className="space-y-6">
                {quiz.map((q, qi) => (
                  <div key={qi} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-800 mb-3">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <label
                          key={oi}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                            quizAnswers[qi] === oi
                              ? 'bg-blue-100 border border-blue-300'
                              : 'bg-white border border-gray-200 hover:border-blue-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q${qi}`}
                            checked={quizAnswers[qi] === oi}
                            onChange={() => setQuizAnswers({ ...quizAnswers, [qi]: oi })}
                            className="text-blue-500"
                          />
                          <span className="text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : quizSubmitted && completionResult ? (
            // Results
            <div className="text-center py-8">
              <div className="text-6xl mb-4">
                {completionResult.passed ? '🎉' : '📖'}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {completionResult.passed ? 'Отлично!' : 'Попробуйте ещё раз'}
              </h3>
              <p className="text-lg text-gray-600 mb-4">
                Результат: <span className="font-bold">{completionResult.quiz_score}%</span>
              </p>
              <div className="flex justify-center gap-4 text-sm text-gray-500">
                <span>Уровень: {LEVEL_NAMES[completionResult.new_level]}</span>
                <span>Курсов пройдено: {completionResult.total_courses_completed}</span>
                <span>Серия: {completionResult.streak_days} дн.</span>
              </div>
              {completionResult.level_up && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-bold">{completionResult.level_up.message}</p>
                </div>
              )}
              <button
                onClick={onBack}
                className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Вернуться к разделу
              </button>
            </div>
          ) : quiz.length === 0 ? (
            // No quiz - just slides done
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-gray-800">Курс завершён</h3>
              <button
                onClick={onBack}
                className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Вернуться
              </button>
            </div>
          ) : null}
        </div>

        {/* Navigation buttons */}
        {!quizSubmitted && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-30"
            >
              &larr; Назад
            </button>

            <span className="text-sm text-gray-400 self-center">
              {currentSlide + 1} / {totalPages}
            </span>

            {isQuizPage && quiz.length > 0 ? (
              <button
                onClick={onSubmitQuiz}
                disabled={Object.keys(quizAnswers).length < quiz.length}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Завершить
              </button>
            ) : (
              <button
                onClick={() => setCurrentSlide(Math.min(totalPages - 1, currentSlide + 1))}
                disabled={currentSlide >= totalPages - 1}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-30"
              >
                Далее &rarr;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
