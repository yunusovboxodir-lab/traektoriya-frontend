import { useState, useCallback } from 'react';
import type { BlockSortingData } from '../../../api/learning';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';
import { BlockCard } from './BlockCard';

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
    <BlockCard accent={accent} accentSoft={accentSoft} label={<>{'\u{1F522}'} {t.blocks.sortOrder}</>}>
        <div className="text-sm font-bold mb-1">{bl(data.title, lang)}</div>
        <div className={`text-[11px] mb-3 ${allDone ? 'text-status-success-fg font-semibold' : 'text-fg-subtle'}`}>
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
                    ? 'border-status-success-fg bg-status-success-bg'
                    : isError
                      ? 'border-status-danger-fg bg-status-danger-bg'
                      : 'border-transparent bg-bg-muted'
                  }
                  ${isPlaced ? 'pointer-events-none' : ''}
                `}
              >
                <span
                  className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                    ${isPlaced ? 'bg-status-success-fg text-bg-canvas' : 'bg-bg-muted text-fg-muted'}`}
                >
                  {isPlaced ? item.correctPosition : '?'}
                </span>
                <span className="text-[13px]">{bl(item.label, lang)}</span>
              </div>
            );
          })}
        </div>
    </BlockCard>
  );
}
