import { useState, useCallback, useRef, useEffect } from 'react';
import {
  generationApi,
  type GenerateLessonResponse,
  type GeneratedLesson,
  type QuizQuestion,
  type ExtractionResponse,
} from '../api/generation';
import { documentsApi, type DocumentResponse } from '../api/documents';
import { ragApi } from '../api/rag';

// ===========================================================================
// Helpers
// ===========================================================================

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
}

const DIFFICULTY_MAP: Record<number, string> = {
  1: 'Начальный',
  2: 'Средний',
  3: 'Продвинутый',
  4: 'Экспертный',
};

const BLOOM_COLORS: Record<string, string> = {
  knowledge: 'bg-blue-100 text-blue-700',
  comprehension: 'bg-cyan-100 text-cyan-700',
  application: 'bg-green-100 text-green-700',
  analysis: 'bg-yellow-100 text-yellow-700',
  synthesis: 'bg-orange-100 text-orange-700',
  evaluation: 'bg-red-100 text-red-700',
};

const KSA_LABELS: Record<string, string> = {
  knowledge: 'Знания',
  skill: 'Навыки',
  attitude: 'Установки',
};

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt'];

function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

// ===========================================================================
// Inline SVG Icons
// ===========================================================================

function IconSparkles({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function IconUploadCloud({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.572 5.345A3.75 3.75 0 0117.25 19.5H6.75z" />
    </svg>
  );
}

function IconCheck({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

// ===========================================================================
// Moderation statuses (client-side for step 5)
// ===========================================================================
type ModerationStatus = 'draft' | 'review' | 'approved';

interface ModerationLesson {
  lesson: GeneratedLesson;
  metadata?: { model?: string; tokens_used?: number; generation_time_seconds?: number };
  competencyName: string;
  status: ModerationStatus;
  isEditing: boolean;
  editContent: string;
}

const MODERATION_STYLES: Record<ModerationStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Черновик', bg: 'bg-gray-100', text: 'text-gray-700' },
  review: { label: 'На проверке', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  approved: { label: 'Утверждён', bg: 'bg-green-100', text: 'text-green-700' },
};

// ===========================================================================
// MAIN COMPONENT
// ===========================================================================

export function GenerationPage() {
  const [activeTab, setActiveTab] = useState<'simple' | 'wizard'>('simple');

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Генерация</h1>
        <p className="text-sm text-gray-500 mt-1">
          Создание учебных материалов с помощью искусственного интеллекта
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('simple')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'simple'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Быстрая генерация
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('wizard')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'wizard'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Из должностной инструкции
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'simple' ? <SimpleGeneration /> : <WizardGeneration />}
    </div>
  );
}

// ===========================================================================
// TAB 1: SIMPLE GENERATION
// ===========================================================================

function SimpleGeneration() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState(2);
  const [includeQuiz, setIncludeQuiz] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GenerateLessonResponse | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizChecked, setQuizChecked] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setError('');
    setResult(null);
    setQuizAnswers({});
    setQuizChecked(false);
    setShowQuiz(false);

    try {
      const resp = await generationApi.generateLessonFromText({
        topic: topic.trim(),
        difficulty,
        use_mock: false,
      });
      setResult(resp.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg = e.response?.data?.detail || e.message || 'Ошибка генерации';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsGenerating(false);
    }
  };

  const lesson = result?.lesson || (result as unknown as GeneratedLesson);
  const quizQuestions: QuizQuestion[] = lesson?.quiz_questions || result?.quiz_questions || [];

  const handleCopy = async () => {
    if (!lesson) return;
    const text = `${lesson.title || ''}\n\n${lesson.content || ''}\n\n${
      lesson.key_points?.length ? 'Ключевые моменты:\n' + lesson.key_points.map((p) => `• ${p}`).join('\n') : ''
    }`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getQuizScore = () => {
    let correct = 0;
    quizQuestions.forEach((q, i) => {
      if (quizAnswers[i] === String(q.correct_answer)) correct++;
    });
    return { correct, total: quizQuestions.length };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ---------- LEFT: FORM ---------- */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Параметры генерации</h2>

          {/* Topic */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Тема урока *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Например: Техника СПИН продаж"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>

          {/* Difficulty */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Уровень сложности</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                    difficulty === d
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {DIFFICULTY_MAP[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Quiz toggle */}
          <div className="mb-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeQuiz}
                onChange={(e) => setIncludeQuiz(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Включить тест</span>
            </label>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!topic.trim() || isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Генерация... (~30 сек)
              </>
            ) : (
              <>
                <IconSparkles className="w-5 h-5" />
                Сгенерировать урок
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* ---------- RIGHT: RESULT ---------- */}
      <div className="space-y-6">
        {!result && !isGenerating && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <IconSparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-1">Результат появится здесь</h3>
            <p className="text-sm text-gray-400">Введите тему и нажмите «Сгенерировать урок»</p>
          </div>
        )}

        {isGenerating && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">AI генерирует урок...</h3>
            <p className="text-sm text-gray-400">Тема: «{topic}»</p>
          </div>
        )}

        {result && lesson && (
          <>
            {/* Title & content */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">{lesson.title}</h2>

              {/* Metadata badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {lesson.difficulty && (
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {DIFFICULTY_MAP[Number(lesson.difficulty)] || lesson.difficulty}
                  </span>
                )}
                {lesson.estimated_duration_minutes && (
                  <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {lesson.estimated_duration_minutes} мин
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  lesson.is_grounded ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {lesson.is_grounded ? 'На основе документов' : 'Из знаний AI'}
                </span>
              </div>

              {/* Summary */}
              {lesson.summary && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600 italic">
                  {Array.isArray(lesson.summary) ? lesson.summary.join(' ') : lesson.summary}
                </div>
              )}

              {/* Content */}
              <div
                className="prose max-w-none text-gray-700 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(lesson.content || '') }}
              />
            </div>

            {/* Key points */}
            {lesson.key_points && lesson.key_points.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Ключевые моменты</h3>
                <ul className="space-y-2">
                  {lesson.key_points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <IconCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quiz */}
            {includeQuiz && quizQuestions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <button
                  type="button"
                  onClick={() => setShowQuiz(!showQuiz)}
                  className="w-full flex items-center justify-between text-base font-semibold text-gray-900"
                >
                  <span>Тест ({quizQuestions.length} вопросов)</span>
                  <svg className={`w-5 h-5 transition-transform ${showQuiz ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showQuiz && (
                  <div className="mt-5 space-y-5">
                    {quizQuestions.map((q, qi) => (
                      <div
                        key={qi}
                        className={`p-4 rounded-lg border-2 ${
                          quizChecked
                            ? quizAnswers[qi] === String(q.correct_answer)
                              ? 'border-green-300 bg-green-50'
                              : quizAnswers[qi]
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-200'
                            : 'border-gray-200'
                        }`}
                      >
                        <p className="font-medium text-gray-800 mb-3 text-sm">
                          {qi + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, oi) => {
                            const letter = String.fromCharCode(65 + oi);
                            const isSelected = quizAnswers[qi] === letter;
                            const isCorrect = letter === String(q.correct_answer);
                            return (
                              <button
                                key={oi}
                                type="button"
                                onClick={() => {
                                  if (!quizChecked) setQuizAnswers((p) => ({ ...p, [qi]: letter }));
                                }}
                                className={`w-full text-left p-2.5 rounded-lg border text-sm transition ${
                                  quizChecked
                                    ? isCorrect
                                      ? 'border-green-500 bg-green-100 text-green-800'
                                      : isSelected && !isCorrect
                                        ? 'border-red-500 bg-red-100 text-red-800'
                                        : 'border-gray-200 text-gray-600'
                                    : isSelected
                                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                }`}
                              >
                                <span className="font-semibold mr-2">{letter}.</span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {quizChecked && q.explanation && (
                          <div className="mt-3 p-2.5 bg-blue-50 rounded-lg text-xs text-blue-800">
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}

                    {!quizChecked ? (
                      <button
                        type="button"
                        onClick={() => setQuizChecked(true)}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
                      >
                        Проверить ответы
                      </button>
                    ) : (
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-xl font-bold text-gray-800">
                          {getQuizScore().correct}/{getQuizScore().total} (
                          {Math.round((getQuizScore().correct / Math.max(getQuizScore().total, 1)) * 100)}%)
                        </p>
                        <p className={`text-sm mt-1 ${
                          getQuizScore().correct / Math.max(getQuizScore().total, 1) >= 0.7
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {getQuizScore().correct / Math.max(getQuizScore().total, 1) >= 0.7
                            ? 'Отлично!'
                            : 'Стоит повторить материал'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 py-2.5 bg-white border border-gray-200 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                {copied ? 'Скопировано!' : 'Копировать урок'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setQuizAnswers({});
                  setQuizChecked(false);
                  setShowQuiz(false);
                  setError('');
                }}
                className="flex-1 py-2.5 bg-white border border-gray-200 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                Сгенерировать заново
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// TAB 2: WIZARD (5 STEPS)
// ===========================================================================

const WIZARD_STEPS = [
  { num: 1, label: 'Загрузка ДИ' },
  { num: 2, label: 'Компетенции' },
  { num: 3, label: 'Источники' },
  { num: 4, label: 'Генерация' },
  { num: 5, label: 'Модерация' },
];

function WizardGeneration() {
  const [step, setStep] = useState(1);

  // Step 1: Upload
  const [uploadedDoc, setUploadedDoc] = useState<DocumentResponse | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Competencies
  const [extraction, setExtraction] = useState<ExtractionResponse | null>(null);
  const [selectedCompetencies, setSelectedCompetencies] = useState<Set<number>>(new Set());
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');

  // Step 3: Sources (documents from KB with type "standard")
  const [kbDocuments, setKbDocuments] = useState<DocumentResponse[]>([]);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [isLoadingSources, setIsLoadingSources] = useState(false);

  // Step 4: Generation
  const [generatedLessons, setGeneratedLessons] = useState<ModerationLesson[]>([]);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [genError, setGenError] = useState('');

  // Step 5: Moderation (uses generatedLessons state)

  // ---- Step 1: Upload ----
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = Array.from(e.dataTransfer.files).find(isAcceptedFile);
    if (file) {
      setUploadFile(file);
      setUploadError('');
    }
  }, []);
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isAcceptedFile(file)) {
      setUploadFile(file);
      setUploadError('');
    }
    e.target.value = '';
  }, []);

  const handleUploadAndProcess = useCallback(async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    setUploadError('');
    try {
      const res = await documentsApi.upload(uploadFile, 'job_description');
      const doc = res.data;
      setUploadedDoc(doc);
      // Trigger RAG processing
      try {
        await ragApi.processDocument(doc.id);
      } catch {
        // Non-critical
      }
      setStep(2);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string };
      const detail = e.response?.data?.detail;
      const msg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg).join('; ')
          : e.message || 'Ошибка загрузки';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  }, [uploadFile]);

  // ---- Step 2: Extract Competencies ----
  useEffect(() => {
    if (step === 2 && uploadedDoc && !extraction && !isExtracting) {
      extractCompetencies();
    }
  }, [step, uploadedDoc]); // eslint-disable-line react-hooks/exhaustive-deps

  const extractCompetencies = async () => {
    if (!uploadedDoc) return;
    setIsExtracting(true);
    setExtractError('');
    try {
      const resp = await generationApi.extractCompetencies({
        document_id: uploadedDoc.id,
        save_to_db: true,
        use_mock: false,
      });
      setExtraction(resp.data);
      // Select all by default
      const allIdxs = new Set<number>();
      resp.data.competencies.forEach((_, i) => allIdxs.add(i));
      setSelectedCompetencies(allIdxs);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string };
      const detail = e.response?.data?.detail;
      const msg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg).join('; ')
          : e.message || 'Ошибка извлечения компетенций';
      setExtractError(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  const toggleCompetency = useCallback((idx: number) => {
    setSelectedCompetencies((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const toggleAllCompetencies = useCallback(() => {
    if (!extraction) return;
    setSelectedCompetencies((prev) => {
      if (prev.size === extraction.competencies.length) return new Set();
      const all = new Set<number>();
      extraction.competencies.forEach((_, i) => all.add(i));
      return all;
    });
  }, [extraction]);

  // ---- Step 3: Load KB documents (standards) ----
  useEffect(() => {
    if (step === 3 && kbDocuments.length === 0) {
      loadSources();
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSources = async () => {
    setIsLoadingSources(true);
    try {
      const res = await documentsApi.list({ document_type: 'standard', limit: 50 });
      setKbDocuments(res.data.documents || []);
    } catch {
      // ignore
    } finally {
      setIsLoadingSources(false);
    }
  };

  const toggleSource = useCallback((docId: string) => {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  }, []);

  // ---- Step 4: Generate lessons ----
  const handleGenerateLessons = useCallback(async () => {
    if (!extraction) return;
    const selected = extraction.competencies.filter((_, i) => selectedCompetencies.has(i));
    if (selected.length === 0) return;

    setIsGeneratingBatch(true);
    setGenError('');
    setGeneratedLessons([]);
    setGenerationProgress({ current: 0, total: selected.length });

    const results: ModerationLesson[] = [];

    for (let i = 0; i < selected.length; i++) {
      const comp = selected[i];
      setGenerationProgress({ current: i + 1, total: selected.length });

      try {
        const resp = await generationApi.generateLessonFromCompetency({
          competency_id: comp.id || '',
          difficulty: comp.suggested_difficulty || 2,
          use_rag_context: selectedSources.size > 0,
          save_to_db: true,
          use_mock: false,
        });

        const lessonData = resp.data.lesson || (resp.data as unknown as GeneratedLesson);
        results.push({
          lesson: lessonData,
          metadata: resp.data.metadata,
          competencyName: comp.name,
          status: 'draft',
          isEditing: false,
          editContent: lessonData.content || '',
        });
      } catch (err: unknown) {
        const e = err as { message?: string };
        results.push({
          lesson: {
            title: `Ошибка: ${comp.name}`,
            content: e.message || 'Не удалось сгенерировать',
          } as GeneratedLesson,
          competencyName: comp.name,
          status: 'draft',
          isEditing: false,
          editContent: '',
        });
      }

      setGeneratedLessons([...results]);
    }

    setIsGeneratingBatch(false);
    setStep(5);
  }, [extraction, selectedCompetencies, selectedSources]);

  // ---- Step 5: Moderation actions ----
  const setLessonStatus = useCallback((idx: number, status: ModerationStatus) => {
    setGeneratedLessons((prev) => prev.map((l, i) => (i === idx ? { ...l, status } : l)));
  }, []);

  const toggleLessonEdit = useCallback((idx: number) => {
    setGeneratedLessons((prev) =>
      prev.map((l, i) =>
        i === idx ? { ...l, isEditing: !l.isEditing, editContent: l.isEditing ? l.editContent : l.lesson.content || '' } : l,
      ),
    );
  }, []);

  const saveLessonEdit = useCallback((idx: number) => {
    setGeneratedLessons((prev) =>
      prev.map((l, i) =>
        i === idx
          ? { ...l, lesson: { ...l.lesson, content: l.editContent }, isEditing: false }
          : l,
      ),
    );
  }, []);

  const updateEditContent = useCallback((idx: number, content: string) => {
    setGeneratedLessons((prev) => prev.map((l, i) => (i === idx ? { ...l, editContent: content } : l)));
  }, []);

  // ============ Render ============

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl">
          {WIZARD_STEPS.map((s, i) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      isDone
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isDone ? <IconCheck className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={`text-xs mt-1.5 whitespace-nowrap ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                    {s.label}
                  </span>
                </div>
                {i < WIZARD_STEPS.length - 1 && (
                  <div className={`w-12 sm:w-20 h-0.5 mx-2 mt-[-18px] ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      {step === 1 && (
        <StepUpload
          uploadFile={uploadFile}
          isDragOver={isDragOver}
          isUploading={isUploading}
          uploadError={uploadError}
          fileInputRef={fileInputRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileChange={handleFileChange}
          onRemoveFile={() => setUploadFile(null)}
          onUpload={handleUploadAndProcess}
        />
      )}

      {step === 2 && (
        <StepCompetencies
          extraction={extraction}
          isExtracting={isExtracting}
          extractError={extractError}
          selectedCompetencies={selectedCompetencies}
          onToggle={toggleCompetency}
          onToggleAll={toggleAllCompetencies}
          onRetry={extractCompetencies}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <StepSources
          documents={kbDocuments}
          selectedSources={selectedSources}
          isLoading={isLoadingSources}
          onToggle={toggleSource}
          onNext={() => {
            setStep(4);
            // Auto-start generation
            setTimeout(() => handleGenerateLessons(), 100);
          }}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && (
        <StepGenerate
          progress={generationProgress}
          isGenerating={isGeneratingBatch}
          lessons={generatedLessons}
          error={genError}
          onNext={() => setStep(5)}
        />
      )}

      {step === 5 && (
        <StepModeration
          lessons={generatedLessons}
          onSetStatus={setLessonStatus}
          onToggleEdit={toggleLessonEdit}
          onSaveEdit={saveLessonEdit}
          onUpdateContent={updateEditContent}
          onBack={() => setStep(4)}
        />
      )}
    </div>
  );
}

// ===========================================================================
// STEP 1: Upload ДИ
// ===========================================================================

function StepUpload({
  uploadFile,
  isDragOver,
  isUploading,
  uploadError,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onRemoveFile,
  onUpload,
}: {
  uploadFile: File | null;
  isDragOver: boolean;
  isUploading: boolean;
  uploadError: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onUpload: () => void;
}) {
  return (
    <div className="max-w-xl">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Загрузка должностной инструкции</h2>
        <p className="text-sm text-gray-500 mb-5">
          Загрузите файл ДИ для автоматического извлечения компетенций и генерации курса
        </p>

        {/* Drop zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg px-4 py-10 cursor-pointer transition-colors ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }`}
        >
          <IconUploadCloud className={`w-12 h-12 mb-3 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className="text-sm text-gray-600 text-center">Перетащите файл сюда или нажмите для выбора</p>
          <p className="text-xs text-gray-400 mt-1">PDF, DOCX, DOC, TXT</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={onFileChange}
            className="hidden"
          />
        </div>

        {/* Selected file */}
        {uploadFile && (
          <div className="mt-4 flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{uploadFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(uploadFile.size)}</p>
              </div>
            </div>
            <button type="button" onClick={onRemoveFile} className="text-gray-400 hover:text-red-500 p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {uploadError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{uploadError}</div>
        )}

        <button
          type="button"
          onClick={onUpload}
          disabled={!uploadFile || isUploading}
          className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Загрузка и обработка...
            </>
          ) : (
            'Загрузить и продолжить'
          )}
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// STEP 2: Competencies
// ===========================================================================

function StepCompetencies({
  extraction,
  isExtracting,
  extractError,
  selectedCompetencies,
  onToggle,
  onToggleAll,
  onRetry,
  onNext,
  onBack,
}: {
  extraction: ExtractionResponse | null;
  isExtracting: boolean;
  extractError: string;
  selectedCompetencies: Set<number>;
  onToggle: (idx: number) => void;
  onToggleAll: () => void;
  onRetry: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  if (isExtracting) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-1">Извлечение компетенций...</h3>
          <p className="text-sm text-gray-400">AI анализирует должностную инструкцию</p>
        </div>
      </div>
    );
  }

  if (extractError) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 text-sm">{extractError}</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onBack} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Назад
            </button>
            <button type="button" onClick={onRetry} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!extraction) return null;

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Матрица компетенций</h2>
            {extraction.role_name && (
              <p className="text-sm text-gray-500 mt-0.5">Должность: {extraction.role_name}</p>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {selectedCompetencies.size} из {extraction.competencies.length} выбрано
          </span>
        </div>

        {/* Select all toggle */}
        <div className="mb-4">
          <button
            type="button"
            onClick={onToggleAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {selectedCompetencies.size === extraction.competencies.length ? 'Снять все' : 'Выбрать все'}
          </button>
        </div>

        {/* Competency list */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {extraction.competencies.map((comp, idx) => {
            const isSelected = selectedCompetencies.has(idx);
            return (
              <div
                key={idx}
                onClick={() => onToggle(idx)}
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(idx)}
                  className="w-4 h-4 text-blue-600 rounded mt-1 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm">{comp.name}</p>
                  {comp.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{comp.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {comp.category && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{comp.category}</span>
                    )}
                    {comp.bloom_level && (
                      <span className={`px-2 py-0.5 rounded text-xs ${BLOOM_COLORS[comp.bloom_level] || 'bg-gray-100 text-gray-600'}`}>
                        {comp.bloom_level}
                      </span>
                    )}
                    {comp.ksa_type && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                        {KSA_LABELS[comp.ksa_type] || comp.ksa_type}
                      </span>
                    )}
                    {comp.suggested_difficulty && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        {DIFFICULTY_MAP[comp.suggested_difficulty]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
          <button type="button" onClick={onBack} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            Назад
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={selectedCompetencies.size === 0}
            className="px-6 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Далее: Источники
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// STEP 3: Sources
// ===========================================================================

function StepSources({
  documents,
  selectedSources,
  isLoading,
  onToggle,
  onNext,
  onBack,
}: {
  documents: DocumentResponse[];
  selectedSources: Set<string>;
  isLoading: boolean;
  onToggle: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Выбор источников из Базы знаний</h2>
        <p className="text-sm text-gray-500 mb-5">
          Выберите стандарты и документы, которые AI будет использовать для обоснования уроков (RAG)
        </p>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="text-base font-medium mb-1">Стандарты не найдены</p>
            <p className="text-sm">Загрузите документы типа «Стандарт» в Базу знаний</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {documents.map((doc) => {
              const isSelected = selectedSources.has(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => onToggle(doc.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(doc.id)}
                    className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.original_filename}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatFileSize(doc.file_size)}
                      {doc.status === 'processed' || doc.status === 'completed' ? (
                        <span className="text-green-600 ml-2">Проиндексирован</span>
                      ) : (
                        <span className="text-yellow-600 ml-2">{doc.status}</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          Выбор источников необязателен. Без источников AI будет генерировать из собственных знаний.
          {selectedSources.size > 0 && ` Выбрано: ${selectedSources.size} документов.`}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
          <button type="button" onClick={onBack} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            Назад
          </button>
          <button
            type="button"
            onClick={onNext}
            className="px-6 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Начать генерацию
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// STEP 4: Generation
// ===========================================================================

function StepGenerate({
  progress,
  isGenerating,
  lessons,
  error,
  onNext,
}: {
  progress: { current: number; total: number };
  isGenerating: boolean;
  lessons: ModerationLesson[];
  error: string;
  onNext: () => void;
}) {
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Генерация уроков</h2>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              {isGenerating
                ? `Генерация урока ${progress.current} из ${progress.total}...`
                : progress.total > 0
                  ? `Готово: ${progress.current} из ${progress.total}`
                  : 'Запуск генерации...'}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${isGenerating ? 'bg-blue-600' : 'bg-green-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Lesson results as they come in */}
        {lessons.length > 0 && (
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {lessons.map((l, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  l.lesson.title?.startsWith('Ошибка') ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'
                }`}>
                  {l.lesson.title?.startsWith('Ошибка') ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <IconCheck className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{l.lesson.title}</p>
                  <p className="text-xs text-gray-500">{l.competencyName}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {!isGenerating && lessons.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={onNext}
              className="px-6 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Перейти к модерации
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// STEP 5: Moderation
// ===========================================================================

function StepModeration({
  lessons,
  onSetStatus,
  onToggleEdit,
  onSaveEdit,
  onUpdateContent,
  onBack,
}: {
  lessons: ModerationLesson[];
  onSetStatus: (idx: number, status: ModerationStatus) => void;
  onToggleEdit: (idx: number) => void;
  onSaveEdit: (idx: number) => void;
  onUpdateContent: (idx: number, content: string) => void;
  onBack: () => void;
}) {
  const approvedCount = lessons.filter((l) => l.status === 'approved').length;
  const reviewCount = lessons.filter((l) => l.status === 'review').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Модерация уроков</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Проверьте, отредактируйте и утвердите сгенерированные уроки
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            Утверждено: {approvedCount}
          </span>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            На проверке: {reviewCount}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {lessons.map((lesson, idx) => {
          const style = MODERATION_STYLES[lesson.status];
          return (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-semibold text-gray-500">#{idx + 1}</span>
                  <h3 className="text-sm font-medium text-gray-900 truncate">{lesson.lesson.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-500">{lesson.competencyName}</span>
                </div>
              </div>

              {/* Content */}
              <div className="px-5 py-4">
                {lesson.isEditing ? (
                  <div>
                    <textarea
                      value={lesson.editContent}
                      onChange={(e) => onUpdateContent(idx, e.target.value)}
                      rows={12}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => onSaveEdit(idx)}
                        className="px-4 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        Сохранить
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleEdit(idx)}
                        className="px-4 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="prose max-w-none text-sm text-gray-700 leading-relaxed max-h-60 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(lesson.lesson.content || '') }}
                  />
                )}
              </div>

              {/* Actions */}
              {!lesson.isEditing && (
                <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => onToggleEdit(idx)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Редактировать
                  </button>
                  {lesson.status !== 'review' && (
                    <button
                      type="button"
                      onClick={() => onSetStatus(idx, 'review')}
                      className="px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100"
                    >
                      На проверку
                    </button>
                  )}
                  {lesson.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => onSetStatus(idx, 'approved')}
                      className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
                    >
                      Утвердить
                    </button>
                  )}
                  {lesson.status !== 'draft' && (
                    <button
                      type="button"
                      onClick={() => onSetStatus(idx, 'draft')}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
                    >
                      Вернуть в черновик
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom navigation */}
      <div className="flex justify-between mt-6">
        <button type="button" onClick={onBack} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
          Назад к генерации
        </button>
        <div className="text-sm text-gray-500 self-center">
          {approvedCount === lessons.length && lessons.length > 0
            ? 'Все уроки утверждены!'
            : `${approvedCount} из ${lessons.length} утверждено`}
        </div>
      </div>
    </div>
  );
}
