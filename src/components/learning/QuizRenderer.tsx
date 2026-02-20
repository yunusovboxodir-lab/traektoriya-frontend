import { QuizSingleChoice } from './QuizSingleChoice';
import { QuizDragDrop, type DragDropQuestion } from './QuizDragDrop';
import { QuizMatching, type MatchingQuestion } from './QuizMatching';
import { QuizHotspot, type HotspotQuestion } from './QuizHotspot';
import { useLangStore, type Lang } from '../../stores/langStore';
import type { BilingualText } from '../../api/learning';

/** Pick the right language from a bilingual value or return plain string as-is. */
function bl(v: string | BilingualText | undefined | null, lang: Lang): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return (lang === 'uz' && v.uz) ? v.uz : v.ru;
}

// ─── Union type for all quiz questions ──────────────────
export type QuizQuestion =
  | {
      question: string | BilingualText;
      type: 'single_choice';
      options: (string | BilingualText)[];
      correct_answer: number;
      explanation?: string | BilingualText;
    }
  | DragDropQuestion
  | MatchingQuestion
  | HotspotQuestion;

// ─── Props ──────────────────────────────────────────────
interface QuizRendererProps {
  questions: QuizQuestion[];
  answers: Record<number, number>;
  interactiveResults?: Record<number, boolean>;
  onSingleChoiceAnswer: (questionIndex: number, answerIndex: number) => void;
  onInteractiveResult: (questionIndex: number, isCorrect: boolean) => void;
  submitted: boolean;
}

export function QuizRenderer({
  questions,
  answers,
  onSingleChoiceAnswer,
  onInteractiveResult,
  submitted,
}: QuizRendererProps) {
  const lang = useLangStore((s) => s.lang);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg">
          ?
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Проверка знаний</h3>
          <p className="text-xs text-gray-400">
            {questions.length} вопрос{questions.length > 1 ? (questions.length < 5 ? 'а' : 'ов') : ''}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, qi) => {
          switch (q.type) {
            case 'single_choice':
              return (
                <QuizSingleChoice
                  key={qi}
                  question={bl(q.question, lang)}
                  options={q.options.map(o => bl(o, lang))}
                  questionIndex={qi}
                  selectedAnswer={answers[qi]}
                  onAnswer={onSingleChoiceAnswer}
                  submitted={submitted}
                  correctAnswer={submitted ? q.correct_answer : undefined}
                  explanation={bl(q.explanation, lang)}
                />
              );
            case 'drag_drop':
              return (
                <QuizDragDrop
                  key={qi}
                  data={q}
                  lang={lang}
                  questionIndex={qi}
                  onResult={onInteractiveResult}
                />
              );
            case 'matching':
              return (
                <QuizMatching
                  key={qi}
                  data={q}
                  lang={lang}
                  questionIndex={qi}
                  onResult={onInteractiveResult}
                />
              );
            case 'hotspot':
              return (
                <QuizHotspot
                  key={qi}
                  data={q}
                  lang={lang}
                  questionIndex={qi}
                  onResult={onInteractiveResult}
                />
              );
            default:
              return (
                <p key={qi} className="text-gray-500 text-sm">
                  Неизвестный тип вопроса
                </p>
              );
          }
        })}
      </div>
    </div>
  );
}

// ─── Scoring utility ────────────────────────────────────
export function calculateQuizScore(
  questions: QuizQuestion[],
  singleChoiceAnswers: Record<number, number>,
  interactiveResults: Record<number, boolean>,
): number {
  if (questions.length === 0) return 0;

  let correct = 0;
  questions.forEach((q, i) => {
    if (q.type === 'single_choice') {
      if (singleChoiceAnswers[i] === q.correct_answer) correct++;
    } else {
      // drag_drop, matching, hotspot — use interactive results
      if (interactiveResults[i]) correct++;
    }
  });

  return Math.round((correct / questions.length) * 100);
}

// Check if all questions answered
export function allQuestionsAnswered(
  questions: QuizQuestion[],
  singleChoiceAnswers: Record<number, number>,
  interactiveResults: Record<number, boolean>,
): boolean {
  return questions.every((q, i) => {
    if (q.type === 'single_choice') {
      return singleChoiceAnswers[i] !== undefined;
    }
    return interactiveResults[i] !== undefined;
  });
}
