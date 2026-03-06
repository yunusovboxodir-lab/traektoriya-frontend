import { useState, useCallback } from 'react';
import type { BlockQuizData } from '../../../api/learning';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';

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
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSelect = useCallback((index: number) => {
    if (selected !== null) return;
    const opt = data.options[index];
    const correct = opt.isCorrect;
    setSelected(index);
    setIsCorrect(correct);
    onAnswer(correct);
    onReady();
  }, [selected, data.options, onAnswer, onReady]);

  return (
    <div className="animate-slideUp">
      <div
        className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl mx-4 mt-3.5 mb-1.5"
        style={{ color: accent, background: accentSoft }}
      >
        {'\u2705'} {t.blocks.finalQuestion}
      </div>
      <div className="bg-white mx-3 rounded-2xl p-5 shadow-sm">
        <div className="text-sm font-bold mb-3 leading-relaxed">{bl(data.question, lang)}</div>

        <div className="space-y-1.5">
          {data.options.map((opt, i) => {
            let optClass = 'border-gray-200';
            let letterClass = 'bg-gray-200 text-gray-600';

            if (selected !== null) {
              if (opt.isCorrect) {
                optClass = 'border-green-500 bg-green-50';
                letterClass = 'bg-green-500 text-white';
              } else if (i === selected && !opt.isCorrect) {
                optClass = 'border-red-500 bg-red-50';
                letterClass = 'bg-red-500 text-white';
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
          <div
            className={`mt-2 p-2.5 rounded-xl text-xs leading-relaxed animate-fadeIn
              ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
          >
            {bl(data.options[selected].explanation, lang)}
          </div>
        )}
      </div>
    </div>
  );
}
