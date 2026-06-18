import { useState, useCallback } from 'react';
import type { BlockFieldTaskData } from '../../../api/learning';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';

interface Props {
  data: BlockFieldTaskData;
  accent: string;
  accentSoft: string;
  onReady: () => void;
}

/**
 * field_task: полевое задание (перенос знания в поведение).
 * Не оценивается. «Беру в работу» разблокирует переход; задача создаётся
 * на бэке при завершении урока (complete_course → модуль «Задачи»).
 */
export function BlockFieldTask({ data, accent, accentSoft, onReady }: Props) {
  const lang = useLangStore(s => s.lang);
  const t = useLangStore(s => s.strings);
  const [taken, setTaken] = useState(false);

  const handleTake = useCallback(() => {
    setTaken(true);
    onReady();
  }, [onReady]);

  return (
    <div className="animate-slideUp">
      <div
        className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl mx-4 mt-3.5 mb-1.5"
        style={{ color: accent, background: accentSoft }}
      >
        {t.blocks.fieldTask}
      </div>
      <div className="bg-white mx-3 rounded-2xl p-5 shadow-sm">
        <div className="text-sm font-bold mb-2 leading-relaxed">{bl(data.title, lang)}</div>
        <div className="text-[13px] leading-relaxed mb-3">{bl(data.task, lang)}</div>

        {data.checklist?.length > 0 && (
          <div className="mb-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              {t.blocks.checklist}
            </div>
            <div className="space-y-1.5">
              {data.checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-[13px] leading-snug">
                  <span
                    className="w-4 h-4 rounded border-2 shrink-0 mt-0.5"
                    style={{ borderColor: accent }}
                  />
                  <span>{bl(item, lang)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.reviewer && (
          <div className="text-xs text-gray-500 border-t border-gray-100 pt-2.5 mb-3">
            {t.blocks.reviewedBy}: {bl(data.reviewer, lang)}
          </div>
        )}

        <button
          onClick={handleTake}
          disabled={taken}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-100
            ${taken ? 'bg-green-50 text-green-700 border border-green-300' : 'text-white'}`}
          style={taken ? undefined : { background: accent }}
        >
          {taken ? t.blocks.taskAccepted : t.blocks.takeToWork}
        </button>
      </div>
    </div>
  );
}
