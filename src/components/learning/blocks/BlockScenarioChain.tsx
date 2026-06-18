import { useState, useCallback } from 'react';
import type { BlockScenarioChainData } from '../../../api/learning';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';
import { BlockCard } from './BlockCard';

interface Props {
  data: BlockScenarioChainData;
  accent: string;
  accentSoft: string;
  onAnswer: (isCorrect: boolean) => void;
  onReady: () => void;
}

/**
 * scenario_chain (Акт 4): многоходовый кейс. Выбор меняет следующую сцену;
 * в финале история героя замыкается. Каждый шаг — отдельный «онответ».
 */
export function BlockScenarioChain({ data, accent, accentSoft, onAnswer, onReady }: Props) {
  const lang = useLangStore(s => s.lang);
  const t = useLangStore(s => s.strings);
  const [stepIndex, setStepIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [showFinale, setShowFinale] = useState(false);

  const step = data.steps[stepIndex];
  const isLastStep = stepIndex === data.steps.length - 1;

  const handlePick = useCallback((index: number) => {
    if (picked !== null) return;
    const opt = step.options[index];
    setPicked(index);
    onAnswer(opt.isCorrect);
  }, [picked, step, onAnswer]);

  const handleContinue = useCallback(() => {
    if (isLastStep) {
      setShowFinale(true);
      onReady();
    } else {
      setStepIndex(stepIndex + 1);
      setPicked(null);
    }
  }, [isLastStep, stepIndex, onReady]);

  return (
    <BlockCard accent={accent} accentSoft={accentSoft} label={t.blocks.solveCase}>
        <div className="text-sm font-bold mb-1 leading-relaxed">{bl(data.title, lang)}</div>
        <div className="text-xs text-fg-muted mb-3 leading-relaxed">{bl(data.intro, lang)}</div>

        {!showFinale ? (
          <>
            <div className="text-[11px] text-fg-subtle mb-2">{stepIndex + 1} / {data.steps.length}</div>
            <div
              className="rounded-xl p-3 mb-3 text-[13px] leading-relaxed"
              style={{ background: accentSoft }}
            >
              {bl(step.scene, lang)}
            </div>

            <div className="space-y-1.5">
              {step.options.map((opt, i) => {
                let optClass = 'border-border-default';
                if (picked !== null) {
                  if (opt.isCorrect) optClass = 'border-status-success-fg bg-status-success-bg';
                  else if (i === picked) optClass = 'border-status-danger-fg bg-status-danger-bg';
                }
                return (
                  <div
                    key={i}
                    onClick={() => handlePick(i)}
                    className={`p-3 border-2 rounded-xl cursor-pointer text-[13px] leading-snug
                      transition-all active:scale-[0.98] ${optClass} ${picked !== null ? 'pointer-events-none' : ''}`}
                  >
                    {bl(opt.text, lang)}
                  </div>
                );
              })}
            </div>

            {picked !== null && (
              <>
                <div
                  className={`mt-2 p-2.5 rounded-xl text-xs leading-relaxed animate-fadeIn
                    ${step.options[picked].isCorrect ? 'bg-status-success-bg text-status-success-fg' : 'bg-status-danger-bg text-status-danger-fg'}`}
                >
                  {bl(step.options[picked].outcome, lang)}
                </div>
                <button
                  onClick={handleContinue}
                  className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold bg-bg-accent text-fg-on-accent transition-all active:scale-[0.98]"
                >
                  {isLastStep ? t.blocks.finalStep : t.blocks.continueStep}
                </button>
              </>
            )}
          </>
        ) : (
          <div className="rounded-xl p-4 text-[13px] leading-relaxed font-semibold bg-status-success-bg text-status-success-fg border-2 border-status-success-fg animate-fadeIn">
            {bl(data.finale, lang)}
          </div>
        )}
    </BlockCard>
  );
}
