import { FlaskConical } from 'lucide-react';
import { QuizSingleChoice } from './QuizSingleChoice';
import { QuizDragDrop, type DragDropQuestion } from './QuizDragDrop';
import { QuizMatching, type MatchingQuestion } from './QuizMatching';
import { QuizHotspot, type HotspotQuestion } from './QuizHotspot';
import { useLangStore } from '../../stores/langStore';
import { bl } from '../../utils/bilingual';
import type { BilingualText } from '../../api/learning';

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

  // TRJ-049 BADGE BETA (2026-05-18) — все quiz-блоки сейчас в beta-режиме:
  // выявлены случаи противоречия между контентом урока и ответами теста (отчёт РМ).
  // Pipeline исправляется (см. _docs/codex/03_patterns_ai.md §1 «AI никогда не публикует напрямую»).
  // Badge — честное признание + защита доверия пользователя до системного фикса.
  const titleText = lang === 'uz' ? 'Bilimlarni tekshirish' : 'Проверка знаний';
  const betaLabel = lang === 'uz' ? 'BETA' : 'БЕТА';
  const betaDisclaimer = lang === 'uz'
    ? 'Savollar AI tomonidan yaratilgan va tekshiruv jarayonida. Agar javob notoʻgʻri tuyulsa — bizga xabar bering.'
    : 'Вопросы сгенерированы AI и проверяются командой обучения. Если ответ кажется неверным — сообщите нам.';
  const questionsCount = lang === 'uz'
    ? `${questions.length} ta savol`
    : `${questions.length} вопрос${questions.length > 1 ? (questions.length < 5 ? 'а' : 'ов') : ''}`;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg" aria-hidden="true">
          ?
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-gray-900">{titleText}</h3>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-300"
              role="status"
              title={betaDisclaimer}
            >
              <FlaskConical size={10} strokeWidth={2.5} aria-hidden="true" />
              {betaLabel}
            </span>
          </div>
          <p className="text-xs text-gray-400">{questionsCount}</p>
        </div>
      </div>

      {/* Beta disclaimer — раскрывается полностью для контекста, не скрыт за tooltip */}
      <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
        <FlaskConical size={14} strokeWidth={2} className="text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs text-amber-900 leading-relaxed">{betaDisclaimer}</p>
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
