/**
 * PersonCard — карточка одного сотрудника: 4 плитки статистики + (для РМ)
 * кнопки перехода в его города (переключают роль на СВ + выбранный город).
 */
import { useT } from '../../../stores/langStore';
import type { LearningPulsePerson } from '../../../api/analytics';
import { fmt1, pulseStatusColorVar, pulseStatusKey } from './helpers';

interface PersonCardProps {
  person: LearningPulsePerson;
  /** Города зоны ответственности — только для роли regional_manager. */
  zoneCities?: string[];
  onJumpToCity: (city: string) => void;
}

export function PersonCard({ person, zoneCities, onJumpToCity }: PersonCardProps) {
  const t = useT();
  const pulsePct = person.pulse;
  const statusColor = pulseStatusColorVar(pulseStatusKey(pulsePct));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {t('analytics.pulseDash.personStat.lastLogin')}
          </div>
          <div className="text-xl font-bold mt-2" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {person.last_login || '—'}
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {t('analytics.pulseDash.personStat.totalMinutes')}
          </div>
          <div className="text-xl font-bold mt-2" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {person.active_minutes}{' '}
            <small className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {t('analytics.pulseDash.minutesShort')}
            </small>
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {t('analytics.pulseDash.personStat.coursesCompleted')}
          </div>
          <div className="text-xl font-bold mt-2" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {person.courses_completed}
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {t('analytics.pulseDash.personStat.pulse')}
          </div>
          <div className="text-xl font-bold mt-2" style={{ color: statusColor, fontVariantNumeric: 'tabular-nums' }}>
            {fmt1(pulsePct)}
            <small className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>%</small>
          </div>
        </div>
      </div>

      {zoneCities && zoneCities.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('analytics.pulseDash.zoneResponsibility')}
          </span>
          {zoneCities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => onJumpToCity(city)}
              className="px-3 py-2 rounded-md text-sm font-semibold min-h-[40px]"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--color-sv)' }}
            >
              {city}
              {' →'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
