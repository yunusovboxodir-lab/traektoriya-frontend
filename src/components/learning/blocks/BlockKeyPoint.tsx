import type { BlockKeyPointData } from '../../../api/learning';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';
import { BlockCard } from './BlockCard';

interface Props {
  data: BlockKeyPointData;
  accent: string;
  accentSoft: string;
  onReady: () => void;
}

export function BlockKeyPoint({ data, accent, accentSoft, onReady }: Props) {
  const lang = useLangStore(s => s.lang);
  const t = useLangStore(s => s.strings);

  // Key points are always "ready" — no interaction needed
  // The parent auto-enables "Далее" immediately
  onReady();

  return (
    <BlockCard accent={accent} accentSoft={accentSoft} label={<>{'\u{1F4A1}'} {t.blocks.keyPoint}</>}>
        <div className="text-4xl text-center mb-2.5">{data.icon}</div>
        <div className="text-[17px] font-extrabold text-center mb-2">{bl(data.title, lang)}</div>

        {data.body && (
          <div className="text-[13px] leading-relaxed text-fg-muted text-center">{bl(data.body, lang)}</div>
        )}

        {/* Variant: number */}
        {data.variant === 'number' && data.number && (
          <>
            <div className="text-[32px] font-black text-center my-2" style={{ color: accent }}>
              {bl(data.number, lang)}
            </div>
            {data.numberCaption && (
              <div className="text-[13px] leading-relaxed text-fg-muted text-center">{bl(data.numberCaption, lang)}</div>
            )}
          </>
        )}

        {/* Variant: chips */}
        {data.variant === 'chips' && data.chips && (
          <div className="flex flex-wrap gap-1.5 justify-center mt-3">
            {data.chips.map((chip, i) => (
              <span
                key={i}
                className="px-3 py-2 rounded-2xl text-xs font-semibold"
                style={{ background: accentSoft, color: accent }}
              >
                {bl(chip, lang)}
              </span>
            ))}
          </div>
        )}

        {/* Variant: steps */}
        {data.variant === 'steps' && data.steps && (
          <div className="text-left mt-3 space-y-2.5">
            {data.steps.map((step) => (
              <div key={step.num} className="flex items-center gap-2.5">
                <span
                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-extrabold shrink-0"
                  style={{ background: accentSoft, color: accent }}
                >
                  {step.num}
                </span>
                <span
                  className="text-[13px]"
                  dangerouslySetInnerHTML={{ __html: bl(step.text, lang) }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Footnote */}
        {data.footnote && (
          <div className="text-center mt-3 text-[11px] text-fg-subtle">{bl(data.footnote, lang)}</div>
        )}

        {/* Callout */}
        {data.callout && (
          <div className="mt-3 bg-status-success-bg text-status-success-fg rounded-xl px-3 py-2.5 text-left text-xs leading-relaxed"
               dangerouslySetInnerHTML={{ __html: bl(data.callout, lang) }}
          />
        )}
    </BlockCard>
  );
}
