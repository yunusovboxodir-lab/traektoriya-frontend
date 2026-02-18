import { useEffect } from 'react';
import { useGoalsStore } from '../../stores/goalsStore';
import { Link } from 'react-router-dom';

const TYPE_ICONS: Record<string, string> = {
  reminder: '🔔',
  suggestion: '💡',
  alert: '⚠️',
  celebration: '🎉',
};

const PRIORITY_BORDER: Record<string, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-orange-400',
  medium: 'border-l-blue-400',
  low: 'border-l-gray-300',
};

export function NudgesWidget() {
  const nudges = useGoalsStore((s) => s.nudges);
  const fetchNudges = useGoalsStore((s) => s.fetchNudges);
  const markNudgeRead = useGoalsStore((s) => s.markNudgeRead);

  useEffect(() => {
    fetchNudges(true, 3);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Уведомления</h2>
        </div>
        <Link
          to="/goals"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Показать все
        </Link>
      </div>

      {nudges.length === 0 ? (
        <p className="text-sm text-gray-400">Нет новых уведомлений</p>
      ) : (
        <div className="space-y-3">
          {nudges.map((nudge) => (
            <div
              key={nudge.id}
              className={`flex items-start gap-3 p-3 rounded-lg border-l-4 bg-gray-50 ${
                PRIORITY_BORDER[nudge.priority] || PRIORITY_BORDER.medium
              }`}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">
                {TYPE_ICONS[nudge.type] || '🔔'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{nudge.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{nudge.message}</p>
                {nudge.action_url && (
                  <Link
                    to={nudge.action_url}
                    className="inline-block mt-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {nudge.action_text || 'Перейти'}
                  </Link>
                )}
              </div>
              <button
                onClick={() => markNudgeRead(nudge.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Отметить прочитанным"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
