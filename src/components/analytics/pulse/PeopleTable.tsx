/**
 * PeopleTable — таблица сотрудников выбранной команды (последний уровень
 * drill-down перед карточкой одного человека).
 */
import { useT } from '../../../stores/langStore';
import type { LearningPulsePerson } from '../../../api/analytics';
import { activityStatusOf, fmt1 } from './helpers';

interface PeopleTableProps {
  people: LearningPulsePerson[];
  onSelect: (person: LearningPulsePerson) => void;
}

export function PeopleTable({ people, onSelect }: PeopleTableProps) {
  const t = useT();

  if (people.length === 0) {
    return (
      <p className="text-sm py-3" style={{ color: 'var(--text-muted)' }}>
        {t('analytics.pulseDash.noEmployeesInCut')}
      </p>
    );
  }

  const sorted = [...people].sort((a, b) => b.pulse - a.pulse || b.active_minutes - a.active_minutes);

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
      <table className="w-full text-sm min-w-[680px]">
        <thead>
          <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              {t('analytics.pulseDash.table.employee')}
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              {t('analytics.pulseDash.table.roleCity')}
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              {t('analytics.pulseDash.table.lastLogin')}
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              {t('analytics.pulseDash.table.activeTime')}
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              {t('analytics.pulseDash.table.courses')}
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              {t('analytics.pulseDash.table.pulse')}
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              {t('analytics.pulseDash.table.status')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const status = activityStatusOf(p);
            const roleAbbrevKey =
              p.role === 'sales_rep' ? 'tp' : p.role === 'supervisor' ? 'sv' : 'rm';
            return (
              <tr
                key={p.user_id}
                tabIndex={0}
                role="button"
                aria-label={p.full_name || p.employee_id}
                onClick={() => onSelect(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(p);
                  }
                }}
                className="cursor-pointer"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: status.colorVar }}
                    />
                    <div className="min-w-0">
                      <div className="font-medium truncate max-w-[160px]" style={{ color: 'var(--text-primary)' }}>
                        {p.full_name || p.employee_id}
                      </div>
                      <div className="text-xs truncate max-w-[160px]" style={{ color: 'var(--text-muted)' }}>
                        {p.employee_id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                  {t(`common.roles.abbreviations.${roleAbbrevKey}`)} · {p.city}
                </td>
                <td
                  className="px-4 py-3 text-right whitespace-nowrap"
                  style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {p.last_login || '—'}
                </td>
                <td
                  className="px-4 py-3 text-right whitespace-nowrap"
                  style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {p.active_minutes} {t('analytics.pulseDash.minutesShort')}
                </td>
                <td
                  className="px-4 py-3 text-right whitespace-nowrap"
                  style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {p.courses_completed}
                </td>
                <td
                  className="px-4 py-3 text-right font-semibold whitespace-nowrap"
                  style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {fmt1(p.pulse * 100)}%
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs font-semibold" style={{ color: status.colorVar }}>
                    {t(`analytics.pulseDash.activityStatus.${status.key}`)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
