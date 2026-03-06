import type { BlockKeyPointData } from '../../../api/learning';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';

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
    <div className="animate-slideUp">
      <div
        className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl mx-4 mt-3.5 mb-1.5"
        style={{ color: accent, background: accentSoft }}
      >
        {'\u{1F4A1}'} {t.blocks.keyPoint}
      </div>
      <div className="bg-white mx-3 rounded-2xl p-5 shadow-sm">
        <div className="text-4xl text-center mb-2.5">{data.icon}</div>
        <div className="text-[17px] font-extrabold text-center mb-2">{bl(data.title, lang)}</div>

        {data.body && (
          <div className="text-[13px] leading-relaxed text-gray-500 text-center">{bl(data.body, lang)}</div>
        )}

        {/* Variant: number */}
        {data.variant === 'number' && data.number && (
          <>
            <div className="text-[32px] font-black text-center my-2" style={{ color: accent }}>
              {bl(data.number, lang)}
            </div>
            {data.numberCaption && (
              <div className="text-[13px] leading-relaxed text-gray-500 text-center">{bl(data.numberCaption, lang)}</div>
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
          <div className="text-center mt-3 text-[11px] text-gray-400">{bl(data.footnote, lang)}</div>
        )}

        {/* Callout (green box) */}
        {data.callout && (
          <div className="mt-3 bg-green-50 rounded-xl px-3 py-2.5 text-left text-xs text-green-800 leading-relaxed"
               dangerouslySetInnerHTML={{ __html: bl(data.callout, lang) }}
          />
        )}
      </div>
    </div>
  );
}
