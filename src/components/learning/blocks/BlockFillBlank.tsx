import { useState, useCallback } from 'react';
import type { BlockFillBlankData } from '../../../api/learning';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';

interface Props {
  data: BlockFillBlankData;
  accent: string;
  accentSoft: string;
  onAnswer: (isCorrect: boolean) => void;
  onReady: () => void;
}

export function BlockFillBlank({ data, accent, accentSoft, onAnswer, onReady }: Props) {
  const lang = useLangStore(s => s.lang);
  const t = useLangStore(s => s.strings);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Find the index of the correct answer
  const correctIdx = data.options.findIndex(
    opt => bl(opt, lang) === bl(data.correctAnswer, lang)
  );

  const handleSelect = useCallback((index: number) => {
    if (selectedIdx !== null) return;

    const correct = index === correctIdx;
    setSelectedIdx(index);
    setIsCorrect(correct);
    onAnswer(correct);
    onReady();
  }, [selectedIdx, correctIdx, onAnswer, onReady]);

  return (
    <div className="animate-slideUp">
      <div
        className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl mx-4 mt-3.5 mb-1.5"
        style={{ color: accent, background: accentSoft }}
      >
        {'\u270F\uFE0F'} {t.blocks.fillBlank}
      </div>
      <div className="bg-white mx-3 rounded-2xl p-5 shadow-sm">
        <div className="text-[15px] leading-[1.8] mb-3.5">
          {bl(data.sentenceBefore, lang)}
          <span
            className="inline-block min-w-[70px] border-b-[3px] text-center font-bold px-1.5 py-0.5 mx-1 transition-colors"
            style={{
              borderColor: selectedIdx === null ? accent : isCorrect ? '#22c55e' : '#ef4444',
              color: selectedIdx === null ? accent : isCorrect ? '#16a34a' : '#dc2626',
            }}
          >
            {selectedIdx !== null ? bl(data.correctAnswer, lang) : '___'}
          </span>
          {bl(data.sentenceAfter, lang)}
        </div>

        <div className="flex flex-wrap gap-2">
          {data.options.map((opt, idx) => {
            let optClass = 'border-gray-200 bg-gray-50';
            if (selectedIdx !== null) {
              if (idx === correctIdx) optClass = 'border-green-500 bg-green-50 text-green-600';
              else if (idx === selectedIdx) optClass = 'border-red-500 bg-red-50 text-red-600';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={selectedIdx !== null}
                className={`px-4 py-2.5 rounded-full border-2 text-[13px] font-semibold transition-all
                  active:scale-95 disabled:pointer-events-none ${optClass}`}
              >
                {bl(opt, lang)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
