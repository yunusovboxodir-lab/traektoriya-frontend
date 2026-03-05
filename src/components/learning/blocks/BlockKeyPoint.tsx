import type { BlockKeyPointData } from '../../../api/learning';

interface Props {
  data: BlockKeyPointData;
  accent: string;
  accentSoft: string;
  onReady: () => void;
}

export function BlockKeyPoint({ data, accent, accentSoft, onReady }: Props) {
  // Key points are always "ready" — no interaction needed
  // The parent auto-enables "Далее" immediately
  onReady();

  return (
    <div className="animate-slideUp">
      <div
        className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl mx-4 mt-3.5 mb-1.5"
        style={{ color: accent, background: accentSoft }}
      >
        {'\u{1F4A1}'} КЛЮЧЕВАЯ МЫСЛЬ
      </div>
      <div className="bg-white mx-3 rounded-2xl p-5 shadow-sm">
        <div className="text-4xl text-center mb-2.5">{data.icon}</div>
        <div className="text-[17px] font-extrabold text-center mb-2">{data.title}</div>

        {data.body && (
          <div className="text-[13px] leading-relaxed text-gray-500 text-center">{data.body}</div>
        )}

        {/* Variant: number */}
        {data.variant === 'number' && data.number && (
          <>
            <div className="text-[32px] font-black text-center my-2" style={{ color: accent }}>
              {data.number}
            </div>
            {data.numberCaption && (
              <div className="text-[13px] leading-relaxed text-gray-500 text-center">{data.numberCaption}</div>
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
                {chip}
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
                  dangerouslySetInnerHTML={{ __html: step.text }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Footnote */}
        {data.footnote && (
          <div className="text-center mt-3 text-[11px] text-gray-400">{data.footnote}</div>
        )}

        {/* Callout (green box) */}
        {data.callout && (
          <div className="mt-3 bg-green-50 rounded-xl px-3 py-2.5 text-left text-xs text-green-800 leading-relaxed"
               dangerouslySetInnerHTML={{ __html: data.callout }}
          />
        )}
      </div>
    </div>
  );
}
