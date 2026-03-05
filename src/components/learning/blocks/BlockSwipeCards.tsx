import { useState, useCallback } from 'react';
import type { BlockSwipeCardsData } from '../../../api/learning';

interface Props {
  data: BlockSwipeCardsData;
  accent: string;
  accentSoft: string;
  onAnswer: (isCorrect: boolean) => void;
  onReady: () => void;
}

export function BlockSwipeCards({ data, accent, accentSoft, onAnswer, onReady }: Props) {
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
    <div className="animate-slideUp">
      <div
        className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl mx-4 mt-3.5 mb-1.5"
        style={{ color: accent, background: accentSoft }}
      >
        {'\u{1F446}'} ПРАВДА ИЛИ ЛОЖЬ
      </div>
      <div className="bg-white mx-3 rounded-2xl p-5 shadow-sm">
        <div className="text-[11px] text-gray-400 text-center mb-3">
          Оцени — правда или ложь? ({cardIndex + 1}/{data.cards.length})
        </div>

        {allDone ? (
          <div className="text-center py-4 text-sm font-bold text-green-600">
            {'\u2705'} Все карточки пройдены!
          </div>
        ) : (
          <>
            <div
              className={`rounded-xl p-5 text-center text-[15px] font-medium leading-relaxed min-h-[70px] flex items-center justify-center mb-3 border-2 transition-all duration-300
                ${answered
                  ? lastCorrect
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                  : 'bg-gray-50 border-transparent'
                }`}
            >
              {card.text}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => handleAnswer(false)}
                disabled={answered}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-50 text-red-600 disabled:opacity-50 active:scale-95 transition-transform"
              >
                {'\u2715'} Ложь
              </button>
              <button
                onClick={() => handleAnswer(true)}
                disabled={answered}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-green-50 text-green-600 disabled:opacity-50 active:scale-95 transition-transform"
              >
                {'\u2713'} Правда
              </button>
            </div>

            {answered && (
              <div
                className={`mt-2 text-center p-2.5 rounded-xl text-xs font-semibold animate-fadeIn
                  ${lastCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
              >
                {lastCorrect ? '\u2705 ' : '\u274C '}{card.feedback}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
