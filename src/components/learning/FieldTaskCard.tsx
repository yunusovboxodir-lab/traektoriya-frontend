import { useLangStore, type Lang } from '../../stores/langStore';
import type { BilingualText } from '../../api/learning';

/** Pick the right language from a bilingual value or return plain string as-is. */
function bl(v: string | BilingualText | undefined | null, lang: Lang): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return (lang === 'uz' && v.uz) ? v.uz : v.ru;
}

interface FieldTask {
  title: string | BilingualText;
  description: string | BilingualText;
  criteria: (string | BilingualText)[];
  deadline_days: number;
}

interface FieldTaskCardProps {
  task: FieldTask;
  onComplete: () => void;
}

export function FieldTaskCard({ task, onComplete }: FieldTaskCardProps) {
  const lang = useLangStore((s) => s.lang);
  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-lg">
          📋
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Полевое задание</h3>
          <p className="text-xs text-gray-400">Практическое задание на маршруте</p>
        </div>
      </div>

      {/* Task card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 mb-6">
        <h4 className="text-lg font-bold text-amber-900 mb-3">{bl(task.title, lang)}</h4>
        <p className="text-sm text-amber-800 leading-relaxed mb-4">{bl(task.description, lang)}</p>

        {/* Deadline */}
        <div className="flex items-center gap-2 mb-4 text-sm text-amber-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Срок выполнения: <strong>{task.deadline_days} {task.deadline_days === 1 ? 'день' : task.deadline_days < 5 ? 'дня' : 'дней'}</strong></span>
        </div>

        {/* Criteria checklist */}
        <div className="bg-white/60 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">Критерии оценки:</p>
          <div className="space-y-2.5">
            {task.criteria.map((criterion, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded border-2 border-amber-300 bg-white flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] text-amber-400">{i + 1}</span>
                </div>
                <span className="text-sm text-amber-800">{bl(criterion, lang)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={onComplete}
        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-200 transition-all flex items-center justify-center gap-2"
      >
        <span>Понятно, выполню</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>
  );
}
