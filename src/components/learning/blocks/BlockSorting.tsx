import { useState, useCallback } from 'react';
import type { BlockSortingData } from '../../../api/learning';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';

interface Props {
  data: BlockSortingData;
  accent: string;
  accentSoft: string;
  onAnswer: (isCorrect: boolean) => void;
  onReady: () => void;
}

export function BlockSorting({ data, accent, accentSoft, onAnswer, onReady }: Props) {
  const lang = useLangStore(s => s.lang);
  const t = useLangStore(s => s.strings);
  const [step, setStep] = useState(0);
  const [placedItems, setPlacedItems] = useState<Set<number>>(new Set());
  const [errorItem, setErrorItem] = useState<number | null>(null);
  const [allDone, setAllDone] = useState(false);

  const handleClick = useCallback((itemIndex: number) => {
    if (allDone || placedItems.has(itemIndex)) return;

    const item = data.items[itemIndex];
    const expectedPosition = step + 1;

    if (item.correctPosition === expectedPosition) {
      onAnswer(true);
      const newPlaced = new Set(placedItems);
      newPlaced.add(itemIndex);
      setPlacedItems(newPlaced);
      setStep(step + 1);
      setErrorItem(null);

      if (newPlaced.size === data.items.length) {
        setAllDone(true);
        onReady();
      }
    } else {
      onAnswer(false);
      setErrorItem(itemIndex);
      setTimeout(() => setErrorItem(null), 500);
    }
  }, [allDone, placedItems, step, data.items, onAnswer, onReady]);

  return (
    <div className="animate-slideUp">
      <div
        className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl mx-4 mt-3.5 mb-1.5"
        style={{ color: accent, background: accentSoft }}
      >
        {'\u{1F522}'} {t.blocks.sortOrder}
      </div>
      <div className="bg-white mx-3 rounded-2xl p-5 shadow-sm">
        <div className="text-sm font-bold mb-1">{bl(data.title, lang)}</div>
        <div className={`text-[11px] mb-3 ${allDone ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
          {allDone ? `\u2705 ${t.blocks.correctOrder}` : (bl(data.subtitle, lang) || t.blocks.tapInOrder)}
        </div>

        <div className="space-y-1.5">
          {data.items.map((item, i) => {
            const isPlaced = placedItems.has(i);
            const isError = errorItem === i;

            return (
              <div
                key={i}
                onClick={() => handleClick(i)}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 border-2 transition-all cursor-pointer select-none active:scale-[0.98]
                  ${isPlaced
                    ? 'border-green-500 bg-green-50'
                    : isError
                      ? 'border-red-500 bg-red-50'
                      : 'border-transparent bg-gray-50'
                  }
                  ${isPlaced ? 'pointer-events-none' : ''}
                `}
              >
                <span
                  className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                    ${isPlaced ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {isPlaced ? item.correctPosition : '?'}
                </span>
                <span className="text-[13px]">{bl(item.label, lang)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
