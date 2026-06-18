import { useState, useCallback } from 'react';
import type { BlockSwipeCardsData } from '../../../api/learning';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';
import { BlockCard } from './BlockCard';

interface Props {
  data: BlockSwipeCardsData;
  accent: string;
  accentSoft: string;
  onAnswer: (isCorrect: boolean) => void;
  onReady: () => void;
}

export function BlockSwipeCards({ data, accent, accentSoft, onAnswer, onReady }: Props) {
  const lang = useLangStore(s => s.lang);
  const t = useLangStore(s => s.strings);
  const [cardIndex, setCardIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const handleAnswer = useCallback((userAnswer: boolean) => {
    if (answered) return;
    const card = data.cards[cardIndex];
    const isCorrect = userAnswer === card.answer;
    setAnswered(true);
    setLastCorrect(isCorrect);
    onAnswer(isCorrect);

    setTimeout(() => {
      const nextIdx = cardIndex + 1;
      if (nextIdx >= data.cards.length) {
        setAllDone(true);
        onReady();
      } else {
        setCardIndex(nextIdx);
        setAnswered(false);
        setLastCorrect(false);
      }
    }, 2000);
  }, [answered, cardIndex, data.cards, onAnswer, onReady]);

  const card = data.cards[cardIndex];

  return (
    <BlockCard accent={accent} accentSoft={accentSoft} label={<>{'\u{1F446}'} {t.blocks.trueOrFalse}</>}>
        <div className="text-[11px] text-fg-subtle text-center mb-3">
          {t.blocks.evaluate} ({cardIndex + 1}/{data.cards.length})
        </div>

        {allDone ? (
          <div className="text-center py-4 text-sm font-bold text-status-success-fg">
            {'\u2705'} {t.blocks.allCardsDone}
          </div>
        ) : (
          <>
            <div
              className={`rounded-xl p-5 text-center text-[15px] font-medium leading-relaxed min-h-[70px] flex items-center justify-center mb-3 border-2 transition-all duration-300
                ${answered
                  ? lastCorrect
                    ? 'bg-status-success-bg border-status-success-fg'
                    : 'bg-status-danger-bg border-status-danger-fg'
                  : 'bg-bg-muted border-transparent'
                }`}
            >
              {bl(card.text, lang)}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => handleAnswer(false)}
                disabled={answered}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-status-danger-bg text-status-danger-fg disabled:opacity-50 active:scale-95 transition-transform"
              >
                {'\u2715'} {t.blocks.false}
              </button>
              <button
                onClick={() => handleAnswer(true)}
                disabled={answered}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-status-success-bg text-status-success-fg disabled:opacity-50 active:scale-95 transition-transform"
              >
                {'\u2713'} {t.blocks.true}
              </button>
            </div>

            {answered && (
              <div
                className={`mt-2 text-center p-2.5 rounded-xl text-xs font-semibold animate-fadeIn
                  ${lastCorrect ? 'bg-status-success-bg text-status-success-fg' : 'bg-status-danger-bg text-status-danger-fg'}`}
              >
                {lastCorrect ? '\u2705 ' : '\u274C '}{bl(card.feedback, lang)}
              </div>
            )}
          </>
        )}
    </BlockCard>
  );
}
