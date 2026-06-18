import { useState, useCallback } from 'react';
import type { BlockMistakeAnalysisData } from '../../../api/learning';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';

interface Props {
  data: BlockMistakeAnalysisData;
  accent: string;
  accentSoft: string;
  onAnswer: (isCorrect: boolean) => void;
  onReady: () => void;
}

/**
 * mistake_analysis (Акт 3): разбор анти-примера.
 * Ученик помечает каждое действие «Нарушение / По стандарту», получает разбор.
 */
export function BlockMistakeAnalysis({ data, accent, accentSoft, onAnswer, onReady }: Props) {
  const lang = useLangStore(s => s.lang);
  const t = useLangStore(s => s.strings);
  // verdict[i] = выбор ученика (true = пометил нарушением), null = не отвечал
  const [verdicts, setVerdicts] = useState<Record<number, boolean>>({});

  const answeredCount = Object.keys(verdicts).length;

  const handleJudge = useCallback((index: number, saysMistake: boolean) => {
    if (verdicts[index] !== undefined) return;
    const item = data.items[index];
    const correct = saysMistake === item.isMistake;
    const next = { ...verdicts, [index]: saysMistake };
    setVerdicts(next);
    onAnswer(correct);
    if (Object.keys(next).length >= data.items.length) {
      onReady();
    }
  }, [verdicts, data.items, onAnswer, onReady]);

  return (
    <div className="animate-slideUp">
      <div
        className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl mx-4 mt-3.5 mb-1.5"
        style={{ color: accent, background: accentSoft }}
      >
        {t.blocks.mistakeReview}
      </div>
      <div className="bg-white mx-3 rounded-2xl p-5 shadow-sm">
        <div className="text-sm font-bold mb-1 leading-relaxed">{bl(data.title, lang)}</div>
        <div className="text-xs text-gray-500 mb-3 leading-relaxed">{bl(data.intro, lang)}</div>

        <div className="space-y-2.5">
          {data.items.map((item, i) => {
            const answered = verdicts[i] !== undefined;
            const correct = answered && verdicts[i] === item.isMistake;

            return (
              <div key={i} className="border-2 border-gray-100 rounded-xl p-3">
                <div className="text-[13px] leading-snug mb-2.5">{bl(item.label, lang)}</div>

                {!answered ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleJudge(i, true)}
                      className="flex-1 py-2 rounded-lg border-2 border-red-200 text-red-600 text-[13px] font-semibold
                        transition-all active:scale-[0.98] hover:border-red-400"
                    >
                      {t.blocks.violation}
                    </button>
                    <button
                      onClick={() => handleJudge(i, false)}
                      className="flex-1 py-2 rounded-lg border-2 border-green-200 text-green-600 text-[13px] font-semibold
                        transition-all active:scale-[0.98] hover:border-green-400"
                    >
                      {t.blocks.byStandard}
                    </button>
                  </div>
                ) : (
                  <div
                    className={`p-2.5 rounded-xl text-xs leading-relaxed animate-fadeIn
                      ${correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
                  >
                    {bl(item.explanation, lang)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-gray-400 text-center mt-3">
          {answeredCount} / {data.items.length}
        </div>
      </div>
    </div>
  );
}
