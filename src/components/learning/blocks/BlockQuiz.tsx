import { useState, useCallback, useMemo } from 'react';
import type { BlockQuizData, QuizQuestionItem } from '../../../api/learning';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';
import { BlockCard } from './BlockCard';

interface Props {
  data: BlockQuizData;
  accent: string;
  accentSoft: string;
  onAnswer: (isCorrect: boolean) => void;
  onReady: () => void;
}

export function BlockQuiz({ data, accent, accentSoft, onAnswer, onReady }: Props) {
  const lang = useLangStore(s => s.lang);
  const t = useLangStore(s => s.strings);

  // Нормализация: v2 questions[] ИЛИ legacy одиночный question+options
  const questions: QuizQuestionItem[] = useMemo(() => {
    if (Array.isArray(data.questions) && data.questions.length > 0) return data.questions;
    if (data.question && data.options) return [{ question: data.question, options: data.options }];
    return [];
  }, [data]);

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const q = questions[qIndex];
  const isLastQ = qIndex === questions.length - 1;

  const handleSelect = useCallback((index: number) => {
    if (selected !== null || !q) return;
    setSelected(index);
    onAnswer(q.options[index].isCorrect);
    if (isLastQ) onReady();  // последний вопрос отвечен — разблокировать «Далее»
  }, [selected, q, isLastQ, onAnswer, onReady]);

  const handleNextQ = useCallback(() => {
    setQIndex(qIndex + 1);
    setSelected(null);
  }, [qIndex]);

  if (!q) return <div className="p-4 text-center text-fg-subtle">—</div>;

  return (
    <BlockCard accent={accent} accentSoft={accentSoft} label={<>{'✅'} {t.blocks.finalQuestion}</>}>
        {questions.length > 1 && (
          <div className="text-[11px] text-fg-subtle mb-1.5">
            {t.blocks.question} {qIndex + 1} {t.blocks.of} {questions.length}
          </div>
        )}
        <div className="text-sm font-bold mb-3 leading-relaxed">{bl(q.question, lang)}</div>

        <div className="space-y-1.5">
          {q.options.map((opt, i) => {
            let optClass = 'border-border-default';
            let letterClass = 'bg-bg-muted text-fg-muted';

            if (selected !== null) {
              if (opt.isCorrect) {
                optClass = 'border-status-success-fg bg-status-success-bg';
                letterClass = 'bg-status-success-fg text-bg-canvas';
              } else if (i === selected && !opt.isCorrect) {
                optClass = 'border-status-danger-fg bg-status-danger-bg';
                letterClass = 'bg-status-danger-fg text-bg-canvas';
              }
            }

            return (
              <div
                key={i}
                onClick={() => handleSelect(i)}
                className={`flex items-start gap-2.5 p-3 border-2 rounded-xl cursor-pointer text-[13px] leading-snug
                  transition-all active:scale-[0.98] ${optClass} ${selected !== null ? 'pointer-events-none' : ''}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${letterClass}`}>
                  {opt.letter}
                </span>
                <span>{bl(opt.text, lang)}</span>
              </div>
            );
          })}
        </div>

        {selected !== null && (
          <>
            <div
              className={`mt-2 p-2.5 rounded-xl text-xs leading-relaxed animate-fadeIn
                ${q.options[selected].isCorrect ? 'bg-status-success-bg text-status-success-fg' : 'bg-status-danger-bg text-status-danger-fg'}`}
            >
              {bl(q.options[selected].explanation, lang)}
            </div>
            {!isLastQ && (
              <button
                onClick={handleNextQ}
                className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold bg-bg-accent text-fg-on-accent transition-all active:scale-[0.98]"
              >
                {t.blocks.continueStep}
              </button>
            )}
          </>
        )}
    </BlockCard>
  );
}
