import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  learningApi,
  LEVEL_NAMES,
  LEVEL_COLORS,
  MODULE_ICONS,
  type LearningMapResponse,
  type LearningModule,
  type SectionCoursesResponse,
  type CourseDetailResponse,
  type CourseItem,
  type CourseCompleteResponse,
  type FlashCard,
  type FieldTask,
} from '../api/learning';
import { useToastStore } from '../stores/toastStore';
import { useT, useLangStore } from '../stores/langStore';
import { LearningMap } from '../components/learning/LearningMap';
import { QuizRenderer, calculateQuizScore, allQuestionsAnswered, type QuizQuestion } from '../components/learning/QuizRenderer';
import { FlashcardsView } from '../components/learning/FlashcardsView';
import { FieldTaskCard } from '../components/learning/FieldTaskCard';

// ===========================================
// LEARNING MAP — четыре режима отображения:
//   1. modules  — выбор модуля обучения (роль)
//   2. map      — карта разделов с прогрессом
//   3. section  — курсы раздела по уровням
//   4. course   — содержание курса (слайды + квиз)
// ===========================================

type View = 'modules' | 'map' | 'section' | 'course';

export function LearningPage() {
  const t = useT();
  const [view, setView] = useState<View>('modules');
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [selectedRole, setSelectedRole] = useState('sales_rep');
  const [mapData, setMapData] = useState<LearningMapResponse | null>(null);
  const [sectionData, setSectionData] = useState<SectionCoursesResponse | null>(null);
  const [courseData, setCourseData] = useState<CourseDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Quiz state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [interactiveResults, setInteractiveResults] = useState<Record<number, boolean>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [completionResult, setCompletionResult] = useState<CourseCompleteResponse | null>(null);
  const [flashcardsDone, setFlashcardsDone] = useState(false);
  const [fieldTaskDone, setFieldTaskDone] = useState(false);
  const [startTime] = useState(Date.now());

  const addToast = useToastStore((s) => s.addToast);

  // Load modules list
  const loadModules = useCallback(async () => {
    try {
      setIsLoading(true);
      const resp = await learningApi.getModules();
      setModules(resp.data.modules);
      setError('');
    } catch {
      setError(t('learning.errors.modules'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  // Load map for a specific role
  const loadMap = useCallback(async (role?: string) => {
    const targetRole = role || selectedRole;
    try {
      setIsLoading(true);
      const resp = await learningApi.getMap(targetRole);
      setMapData(resp.data);
      setError('');
    } catch {
      setError(t('learning.errors.map'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole]);

  // Select a module and load its map
  const selectModule = async (role: string) => {
    setSelectedRole(role);
    await loadMap(role);
    setView('map');
  };

  // Open section
  const openSection = async (sectionId: string) => {
    try {
      setIsLoading(true);
      const resp = await learningApi.getSectionCourses(sectionId);
      setSectionData(resp.data);
      setView('section');
      setError('');
    } catch {
      setError(t('learning.errors.section'));
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
      setInteractiveResults({});
      setQuizSubmitted(false);
      setCompletionResult(null);
      setFlashcardsDone(false);
      setFieldTaskDone(false);
      setView('course');
      setError('');
    } catch {
      setError(t('learning.errors.course'));
    } finally {
      setIsLoading(false);
    }
  };

  // Submit quiz and complete course
  const submitQuiz = async (quizQuestions?: QuizQuestion[]) => {
    if (!courseData) return;
    const quiz = (quizQuestions || courseData.content.quiz || []) as QuizQuestion[];
    if (quiz.length === 0) return;

    const score = calculateQuizScore(quiz, quizAnswers, interactiveResults);

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
        addToast('success', t('learning.coursePassed') + ` (${score}%)`);
      } else {
        addToast('warning', `${t('learning.tryAgainCourse')} (${score}%)`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('learning.errors.submit');
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const resp = (err as { response?: { status?: number } }).response;
        if (resp?.status === 409) {
          addToast('info', t('learning.errors.alreadyCompleted'));
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
      loadMap(selectedRole); // Refresh progress
    } else if (view === 'map') {
      setView('modules');
      loadModules(); // Refresh module counts
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-400 text-sm">{t('learning.loading')}</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        <button onClick={() => { setView('modules'); loadModules(); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          {t('learning.tryAgain')}
        </button>
      </div>
    );
  }

  // ======== VIEW: MODULES ========
  if (view === 'modules') {
    return <ModulesView modules={modules} onSelectModule={selectModule} />;
  }

  // ======== VIEW: MAP ========
  if (view === 'map' && mapData) {
    return (
      <div>
        <button onClick={goBack} className="mb-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          &larr; {t('learning.backToModules')}
        </button>
        <LearningMap data={mapData} onOpenSection={openSection} />
      </div>
    );
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
        interactiveResults={interactiveResults}
        setInteractiveResults={setInteractiveResults}
        quizSubmitted={quizSubmitted}
        completionResult={completionResult}
        flashcardsDone={flashcardsDone}
        setFlashcardsDone={setFlashcardsDone}
        fieldTaskDone={fieldTaskDone}
        setFieldTaskDone={setFieldTaskDone}
        onSubmitQuiz={submitQuiz}
        onBack={goBack}
      />
    );
  }

  return null;
}




// ============================================================
// MODULES VIEW — select learning module (role)
// ============================================================

function ModulesView({
  modules,
  onSelectModule,
}: {
  modules: LearningModule[];
  onSelectModule: (role: string) => void;
}) {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const moduleColors: Record<string, string> = {
    sales_rep: 'from-blue-500 to-blue-600',
    supervisor: 'from-indigo-500 to-indigo-600',
    regional_manager: 'from-teal-500 to-teal-600',
    top_management: 'from-amber-500 to-amber-600',
    production_worker: 'from-orange-500 to-orange-600',
    production_manager: 'from-rose-500 to-rose-600',
  };

  const moduleBgColors: Record<string, string> = {
    sales_rep: 'bg-blue-50 border-blue-200',
    supervisor: 'bg-indigo-50 border-indigo-200',
    regional_manager: 'bg-teal-50 border-teal-200',
    top_management: 'bg-amber-50 border-amber-200',
    production_worker: 'bg-orange-50 border-orange-200',
    production_manager: 'bg-rose-50 border-rose-200',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('learning.title')}</h1>
        <p className="text-gray-500 mt-1">{t('learning.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((m) => {
          const icon = MODULE_ICONS[m.icon] || m.icon;
          const isAvailable = m.is_available;

          return (
            <div
              key={m.role}
              onClick={() => isAvailable && onSelectModule(m.role)}
              className={`
                relative rounded-2xl border p-6 transition-all duration-200
                ${isAvailable
                  ? `${moduleBgColors[m.role] || 'bg-gray-50 border-gray-200'} cursor-pointer hover:shadow-lg hover:scale-[1.02]`
                  : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                }
              `}
            >
              {/* Icon & Title */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`
                  w-14 h-14 rounded-xl flex items-center justify-center text-2xl text-white
                  bg-gradient-to-br ${moduleColors[m.role] || 'from-gray-400 to-gray-500'}
                  ${!isAvailable ? 'grayscale' : ''}
                `}>
                  {icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{m.title.ru}</h3>
                  {m.title.uz && (
                    <p className="text-xs text-gray-400">{m.title.uz}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              {isAvailable ? (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{m.sections_count} {t('learning.sections')}</span>
                  <span className="text-gray-300">|</span>
                  <span>{m.courses_count} {t('learning.courses')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">{t('learning.soon')}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-500 rounded-full">{t('learning.inDevelopment')}</span>
                </div>
              )}

              {/* Arrow for available modules */}
              {isAvailable && (
                <div className="absolute top-6 right-6 text-gray-300 text-xl">&rsaquo;</div>
              )}
            </div>
          );
        })}
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
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <button onClick={onBack} className="mb-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 group">
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        {t('learning.backToMap')}
      </button>

      {/* Section Header Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 mb-6 text-white shadow-xl">
        <h2 className="text-xl font-bold mb-1">{data.section.title.ru}</h2>
        {data.section.description?.ru && (
          <p className="text-slate-300 text-sm mb-4">{data.section.description.ru}</p>
        )}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">{t('learning.progress')}</span>
              <span className="text-white font-semibold">{data.user_progress.completed}/{data.user_progress.total}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${data.user_progress.percentage}%` }}
              />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tabular-nums">
            {Math.round(data.user_progress.percentage)}%
          </div>
        </div>
      </div>

      {/* Levels with courses */}
      <div className="space-y-5">
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
  const t = useT();
  const levelColor = LEVEL_COLORS[level.level] || '#666';

  return (
    <div className={`rounded-2xl overflow-hidden border ${level.is_unlocked ? 'border-gray-200 bg-white shadow-sm' : 'border-gray-100 bg-gray-50'}`}>
      {/* Level header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
        <div
          className="w-2.5 h-2.5 rounded-full ring-4 ring-opacity-20"
          style={{ backgroundColor: levelColor, boxShadow: `0 0 0 4px ${levelColor}33` }}
        />
        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">{level.level_name.ru}</h3>
        {level.is_completed && (
          <span className="ml-auto text-xs px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full font-semibold flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
            {t('learning.completed')}
          </span>
        )}
        {!level.is_unlocked && level.unlock_message && (
          <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            {level.unlock_message}
          </span>
        )}
      </div>

      {/* Courses */}
      {level.is_unlocked && level.courses ? (
        <div className="divide-y divide-gray-50">
          {level.courses.map((course, idx) => (
            <CourseRow key={course.id} course={course} index={idx} onClick={() => onOpenCourse(course.id)} />
          ))}
        </div>
      ) : !level.is_unlocked ? (
        <div className="px-5 py-6 text-center">
          <div className="text-2xl mb-2 opacity-30">🔒</div>
          <p className="text-sm text-gray-400">
            {level.courses_preview_count
              ? t('learning.coursesLater', { count: level.courses_preview_count })
              : t('learning.sectionLocked')}
          </p>
        </div>
      ) : null}
    </div>
  );
}


function CourseRow({
  course,
  index,
  onClick,
}: {
  course: CourseItem;
  index: number;
  onClick: () => void;
}) {
  const t = useT();
  const isCompleted = course.status === 'completed';
  const isRecommended = course.is_ai_recommended;

  return (
    <div
      onClick={onClick}
      className={`px-5 py-4 flex items-center gap-4 cursor-pointer transition-all duration-150 hover:bg-gray-50 active:scale-[0.99] ${
        isRecommended && !isCompleted ? 'bg-violet-50/50 hover:bg-violet-50' : ''
      }`}
    >
      {/* Step number / status */}
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all
        ${isCompleted
          ? 'bg-emerald-100 text-emerald-600'
          : isRecommended
          ? 'bg-violet-100 text-violet-600'
          : 'bg-gray-100 text-gray-500'
        }
      `}>
        {isCompleted ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
        ) : isRecommended ? (
          <span>★</span>
        ) : (
          <span>{index + 1}</span>
        )}
      </div>

      {/* Course info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-[15px] leading-tight ${isCompleted ? 'text-gray-400' : 'text-gray-800'}`}>
          {course.title.ru}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {course.duration_minutes} {t('learning.min')}
          </span>
          {isCompleted && course.quiz_score != null && (
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              course.quiz_score >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>{course.quiz_score}%</span>
          )}
          {isRecommended && !isCompleted && (
            <span className="text-xs text-violet-500 font-medium">{t('learning.aiRecommendation')}</span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <svg className="w-5 h-5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
    </div>
  );
}


// ============================================================
// RICH CONTENT RENDERER — парсит текстовый контент в визуальные блоки
// ============================================================

function RichSlideContent({ content }: { content: string }) {
  const blocks = useMemo(() => parseContentBlocks(content), [content]);

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'bullet':
            return (
              <div key={i} className="flex items-start gap-3 pl-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                <span className="text-gray-700 leading-relaxed">{block.text}</span>
              </div>
            );
          case 'numbered':
            return (
              <div key={i} className="flex items-start gap-3 pl-1">
                <span className="w-6 h-6 rounded-lg bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{block.num}</span>
                <span className="text-gray-700 leading-relaxed">{block.text}</span>
              </div>
            );
          case 'check':
            return (
              <div key={i} className="flex items-start gap-3 bg-emerald-50 rounded-xl px-4 py-2.5">
                <span className="text-lg shrink-0">{block.icon}</span>
                <span className="text-gray-700 leading-relaxed">{block.text}</span>
              </div>
            );
          case 'cross':
            return (
              <div key={i} className="flex items-start gap-3 bg-red-50 rounded-xl px-4 py-2.5">
                <span className="text-lg shrink-0">{block.icon}</span>
                <span className="text-gray-700 leading-relaxed">{block.text}</span>
              </div>
            );
          case 'highlight':
            return (
              <div key={i} className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                <span className="text-lg shrink-0">{block.icon}</span>
                <span className="text-gray-700 leading-relaxed font-medium">{block.text}</span>
              </div>
            );
          case 'stat':
            return (
              <div key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-3 border border-blue-100">
                <span className="text-gray-700 leading-relaxed">{block.text}</span>
              </div>
            );
          case 'heading':
            return (
              <p key={i} className="text-gray-800 font-bold text-[15px] mt-2 first:mt-0">{block.text}</p>
            );
          default:
            return (
              <p key={i} className="text-gray-600 leading-relaxed">{block.text}</p>
            );
        }
      })}
    </div>
  );
}

type ContentBlock = {
  type: 'text' | 'bullet' | 'numbered' | 'check' | 'cross' | 'highlight' | 'stat' | 'heading';
  text: string;
  icon?: string;
  num?: number;
};

function parseContentBlocks(content: string): ContentBlock[] {
  const lines = content.split('\n').filter(l => l.trim());
  const blocks: ContentBlock[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // ✅ or ✓ lines → green check block
    if (/^[✅✓]\s/.test(line)) {
      blocks.push({ type: 'check', text: line.replace(/^[✅✓]\s*/, ''), icon: '✅' });
    }
    // ❌ lines → red cross block
    else if (/^❌\s/.test(line)) {
      blocks.push({ type: 'cross', text: line.replace(/^❌\s*/, ''), icon: '❌' });
    }
    // 🔴🟡🟢⚠️💡🎯🏆 → colored highlight
    else if (/^[🔴🟡🟢⚠️💡🎯🏆💰📊📈📦📍📸📐⏱️👥🏪]\s/.test(line)) {
      const icon = line.match(/^(\S+)\s/)?.[1] || '💡';
      blocks.push({ type: 'highlight', text: line.replace(/^\S+\s*/, ''), icon });
    }
    // • or - bullet points
    else if (/^[•\-–]\s/.test(line)) {
      blocks.push({ type: 'bullet', text: line.replace(/^[•\-–]\s*/, '') });
    }
    // Numbered: 1. or 1)
    else if (/^\d+[.)]\s/.test(line)) {
      const num = parseInt(line);
      blocks.push({ type: 'numbered', text: line.replace(/^\d+[.)]\s*/, ''), num });
    }
    // Lines ending with ":" are headings
    else if (/^[А-ЯA-Z].*:$/.test(line)) {
      blocks.push({ type: 'heading', text: line });
    }
    // Stat-like patterns (contain numbers with % or ≥ or +)
    else if (/[≥≤><]\s*\d|[+\-]\d+%|\d+%/.test(line) && line.length < 100) {
      blocks.push({ type: 'stat', text: line });
    }
    // Regular text
    else {
      blocks.push({ type: 'text', text: line });
    }
  }
  return blocks;
}


// ============================================================
// COURSE VIEW — visual micro-learning: slides → quiz → flashcards → field task → results
// ============================================================

type CoursePhase = 'slides' | 'quiz' | 'flashcards' | 'field_task' | 'results';

function CourseView({
  data,
  currentSlide,
  setCurrentSlide,
  quizAnswers,
  setQuizAnswers,
  interactiveResults,
  setInteractiveResults,
  quizSubmitted,
  completionResult,
  flashcardsDone,
  setFlashcardsDone,
  fieldTaskDone,
  setFieldTaskDone,
  onSubmitQuiz,
  onBack,
}: {
  data: CourseDetailResponse;
  currentSlide: number;
  setCurrentSlide: (n: number) => void;
  quizAnswers: Record<number, number>;
  setQuizAnswers: (a: Record<number, number>) => void;
  interactiveResults: Record<number, boolean>;
  setInteractiveResults: (r: Record<number, boolean>) => void;
  quizSubmitted: boolean;
  completionResult: CourseCompleteResponse | null;
  flashcardsDone: boolean;
  setFlashcardsDone: (v: boolean) => void;
  fieldTaskDone: boolean;
  setFieldTaskDone: (v: boolean) => void;
  onSubmitQuiz: (questions?: QuizQuestion[]) => void;
  onBack: () => void;
}) {
  const t = useT();
  const slides = data.content.slides || [];
  const quiz = (data.content.quiz || []) as QuizQuestion[];
  const flashcards = (data.content.spaced_repetition_cards || []) as FlashCard[];
  const fieldTask = data.content.field_task as FieldTask | null | undefined;
  const mediaPrompts = data.content.media_prompts || [];

  const hasQuiz = quiz.length > 0;
  const hasFlashcards = flashcards.length > 0;
  const hasFieldTask = !!fieldTask && !!fieldTask.title;

  // Determine current phase
  const phase: CoursePhase = useMemo(() => {
    if (currentSlide < slides.length) return 'slides';
    if (hasQuiz && !quizSubmitted) return 'quiz';
    if (quizSubmitted && hasFlashcards && !flashcardsDone) return 'flashcards';
    if (quizSubmitted && hasFieldTask && !fieldTaskDone && (flashcardsDone || !hasFlashcards)) return 'field_task';
    if (quizSubmitted) return 'results';
    // No quiz — go straight to flashcards/field_task/done
    if (!hasQuiz && hasFlashcards && !flashcardsDone) return 'flashcards';
    if (!hasQuiz && hasFieldTask && !fieldTaskDone && (flashcardsDone || !hasFlashcards)) return 'field_task';
    return 'results';
  }, [currentSlide, slides.length, hasQuiz, quizSubmitted, hasFlashcards, flashcardsDone, hasFieldTask, fieldTaskDone]);

  const totalSlidePages = slides.length + (hasQuiz ? 1 : 0);

  // Get media prompt for current slide
  const currentMediaPrompt = phase === 'slides' && slides[currentSlide]
    ? mediaPrompts.find(p => p.slide_order === slides[currentSlide].order)
    : null;

  // Gradient colors per slide index
  const slideAccents = [
    { bg: 'from-blue-500 to-indigo-600' },
    { bg: 'from-violet-500 to-purple-600' },
    { bg: 'from-emerald-500 to-teal-600' },
    { bg: 'from-amber-500 to-orange-600' },
    { bg: 'from-rose-500 to-pink-600' },
    { bg: 'from-cyan-500 to-blue-600' },
  ];
  const accent = slideAccents[currentSlide % slideAccents.length];

  const handleInteractiveResult = (qi: number, isCorrect: boolean) => {
    setInteractiveResults({ ...interactiveResults, [qi]: isCorrect });
  };

  const isAllAnswered = allQuestionsAnswered(quiz, quizAnswers, interactiveResults);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button onClick={onBack} className="mb-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 group">
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        {t('learning.back')}
      </button>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Course header with gradient */}
        <div className={`bg-gradient-to-r ${accent.bg} px-6 py-5 text-white`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium px-2.5 py-1 bg-white/20 rounded-full backdrop-blur-sm">
              {LEVEL_NAMES[data.course.level] || data.course.level}
            </span>
            <span className="text-xs text-white/80 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {data.course.duration_minutes} {t('learning.min')}
            </span>
          </div>
          <h2 className="text-lg font-bold leading-tight">{data.course.title.ru}</h2>
        </div>

        {/* Step dots + progress (only during slides & quiz) */}
        {(phase === 'slides' || phase === 'quiz') && (
          <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1">
              {Array.from({ length: totalSlidePages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => !quizSubmitted && i < slides.length && setCurrentSlide(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === currentSlide
                      ? 'w-6 h-2 bg-blue-500'
                      : i < currentSlide
                      ? 'w-2 h-2 bg-blue-300'
                      : 'w-2 h-2 bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400 tabular-nums font-medium">
              {Math.min(currentSlide + 1, totalSlidePages)}/{totalSlidePages}
            </span>
          </div>
        )}

        {/* Phase indicator for post-quiz phases */}
        {(phase === 'flashcards' || phase === 'field_task') && (
          <div className="px-6 py-2.5 border-b border-gray-100 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" title="Слайды" />
              <span className="w-2 h-2 rounded-full bg-blue-400" title="Квиз" />
              <span className={`w-2 h-2 rounded-full ${phase === 'flashcards' ? 'w-6 bg-blue-500' : 'bg-blue-400'}`} title="Карточки" />
              {hasFieldTask && (
                <span className={`w-2 h-2 rounded-full ${phase === 'field_task' ? 'w-6 bg-blue-500' : 'bg-gray-200'}`} title="Задание" />
              )}
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="px-6 py-6 min-h-[320px]">
          {/* ========= SLIDE ========= */}
          {phase === 'slides' && slides[currentSlide] && (
            <div className="animate-fadeIn">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                {slides[currentSlide].title}
              </h3>
              <RichSlideContent content={slides[currentSlide].content} />

              {/* Media from prompt (if done) */}
              {currentMediaPrompt && currentMediaPrompt.status === 'done' && currentMediaPrompt.media_url && (
                <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
                  {currentMediaPrompt.type === 'video' ? (
                    <div className="aspect-video bg-gray-900 flex items-center justify-center">
                      <a href={currentMediaPrompt.media_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">
                        {t('learning.openVideo')}
                      </a>
                    </div>
                  ) : (
                    <img src={currentMediaPrompt.media_url} alt="" className="w-full h-auto" />
                  )}
                </div>
              )}
              {currentMediaPrompt && currentMediaPrompt.status !== 'done' && (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-400">
                  🎨 {t('learning.mediaDev')}
                </div>
              )}
            </div>
          )}

          {/* ========= QUIZ (all types) ========= */}
          {phase === 'quiz' && (
            <QuizRenderer
              questions={quiz}
              answers={quizAnswers}
              interactiveResults={interactiveResults}
              onSingleChoiceAnswer={(qi, ai) => setQuizAnswers({ ...quizAnswers, [qi]: ai })}
              onInteractiveResult={handleInteractiveResult}
              submitted={false}
            />
          )}

          {/* ========= FLASHCARDS ========= */}
          {phase === 'flashcards' && (
            <FlashcardsView
              cards={flashcards}
              onComplete={() => setFlashcardsDone(true)}
            />
          )}

          {/* ========= FIELD TASK ========= */}
          {phase === 'field_task' && fieldTask && (
            <FieldTaskCard
              task={fieldTask}
              onComplete={() => setFieldTaskDone(true)}
            />
          )}

          {/* ========= RESULTS ========= */}
          {phase === 'results' && completionResult ? (
            <div className="animate-fadeIn text-center py-6">
              {/* Score ring */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke={completionResult.passed ? '#10b981' : '#f59e0b'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${completionResult.quiz_score * 3.39} 339.3`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{completionResult.quiz_score}%</span>
                  <span className="text-xs text-gray-400">{t('learning.result')}</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {completionResult.passed ? t('learning.greatJob') : t('learning.canBeBetter')}
              </h3>
              <p className="text-gray-500 mb-6">
                {completionResult.passed ? t('learning.coursePassed') : t('learning.tryAgainCourse')}
              </p>

              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-blue-50 rounded-xl py-3 px-2">
                  <p className="text-lg font-bold text-blue-600">{LEVEL_NAMES[completionResult.new_level]}</p>
                  <p className="text-[10px] text-blue-400 uppercase tracking-wide">{t('learning.level')}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl py-3 px-2">
                  <p className="text-lg font-bold text-emerald-600">{completionResult.total_courses_completed}</p>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-wide">{t('learning.passed')}</p>
                </div>
                <div className="bg-amber-50 rounded-xl py-3 px-2">
                  <p className="text-lg font-bold text-amber-600">{completionResult.streak_days} {t('learning.days')}</p>
                  <p className="text-[10px] text-amber-400 uppercase tracking-wide">{t('learning.streak')}</p>
                </div>
              </div>

              {completionResult.level_up && (
                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                  <p className="text-amber-800 font-bold flex items-center justify-center gap-2">
                    <span className="text-xl">🏆</span> {completionResult.level_up.message}
                  </p>
                </div>
              )}

              <button
                onClick={onBack}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all font-medium"
              >
                {t('learning.continueLearn')}
              </button>
            </div>
          ) : phase === 'results' && !hasQuiz ? (
            // No quiz - just slides, maybe flashcards/field_task were shown
            <div className="animate-fadeIn text-center py-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{t('learning.materialDone')}</h3>
              <p className="text-gray-500 mb-6">{t('learning.allSlidesDone')}</p>
              <button
                onClick={onBack}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                {t('learning.goBack')}
              </button>
            </div>
          ) : null}
        </div>

        {/* Navigation */}
        {phase === 'slides' && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-xl hover:bg-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              {t('learning.back')}
            </button>

            <button
              onClick={() => setCurrentSlide(currentSlide + 1)}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all"
            >
              {currentSlide === slides.length - 1 && hasQuiz ? t('learning.toQuiz') : currentSlide === slides.length - 1 ? t('learning.finish') : t('learning.next')}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}

        {phase === 'quiz' && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <button
              onClick={() => setCurrentSlide(slides.length - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-all rounded-xl hover:bg-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              {t('learning.toSlides')}
            </button>

            <button
              onClick={() => onSubmitQuiz(quiz)}
              disabled={!isAllAnswered}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all"
            >
              {t('learning.submit')}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
