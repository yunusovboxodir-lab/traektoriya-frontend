import { useState, useCallback } from 'react';
import type { BlockDialogueChoiceData } from '../../../api/learning';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';
import { BlockCard } from './BlockCard';

interface Props {
  data: BlockDialogueChoiceData;
  accent: string;
  accentSoft: string;
  onAnswer: (isCorrect: boolean) => void;
  onReady: () => void;
}

export function BlockDialogueChoice({ data, accent, accentSoft, onAnswer, onReady }: Props) {
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
    <BlockCard accent={accent} accentSoft={accentSoft} label={<>{'\u{1F4AC}'} {t.blocks.whatSay}</>}>
        {/* Situation */}
        <div className="bg-status-info-bg rounded-xl p-3 mb-3 text-[13px] leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: bl(data.situation, lang) }} />
        </div>

        {/* Options */}
        <div className="space-y-1.5">
          {data.options.map((opt, i) => {
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

        {/* Explanation */}
        {selected !== null && (
          <div
            className={`mt-2 p-2.5 rounded-xl text-xs leading-relaxed animate-fadeIn
              ${isCorrect ? 'bg-status-success-bg text-status-success-fg' : 'bg-status-danger-bg text-status-danger-fg'}`}
          >
            {bl(data.options[selected].explanation, lang)}
          </div>
        )}
    </BlockCard>
  );
}
