/**
 * OverviewTab — «Пульс обучения»: exec-дашборд руководителя (замена старой
 * вкладки «Обзор», задача владельца 2026-07-27).
 *
 * Перенесено из одобренного HTML-прототипа (`exec_learning_dashboard.html`)
 * максимально близко по структуре и поведению drill-down:
 *   Компания › Город › Дилер › Команда СВ › Сотрудник
 *
 * Ключевые решения:
 *  - РМ — уровень НАД городом. Внутри города кнопка РМ скрыта (остаются ТП/СВ),
 *    а РМ показывается в шапке города как «ответственный за регион».
 *  - Роль РМ на верхнем уровне раскрывается в карточки самих РМ (не в города).
 *  - Иерархия и связи людей — из полей API (city/dealer/team/hierarchy),
 *    НЕ из разбора префиксов ФИО (тот подход был временным костылём демо-данных
 *    в прототипе — на бэке уже решено правильно).
 *  - Вкладка полностью самодостаточна: сама грузит /api/v1/analytics/learning-pulse.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useT, useLangStore } from '../../stores/langStore';
import { analyticsApi } from '../../api/analytics';
import type { LearningPulseData, LearningPulseRoleId } from '../../api/analytics';
import { Breadcrumbs, type Crumb } from './pulse/Breadcrumbs';
import { AxisBars } from './pulse/AxisBars';
import { DrillList } from './pulse/DrillList';
import { buildHeaderInfo } from './pulse/buildHeaderInfo';
import {
  fmt1,
  INITIAL_DRILL_STATE,
  PULSE_GOAL_PCT,
  pulseStatusColorVar,
  pulseStatusKey,
  ROLE_COLOR_VAR,
  ROLE_ORDER,
  roleAbbrevKey,
  scopedPeople,
  summaryFor,
  type DrillState,
} from './pulse/helpers';

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="h-3 w-20 rounded mb-2" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-7 w-64 rounded mb-2" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-4 w-48 rounded" style={{ background: 'var(--bg-elevated)' }} />
        </div>
        <div className="h-10 w-20 rounded" style={{ background: 'var(--bg-elevated)' }} />
      </div>
      <div className="h-10 w-full rounded mb-6" style={{ background: 'var(--bg-elevated)' }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OverviewTab
// ---------------------------------------------------------------------------

export function OverviewTab() {
  const t = useT();
  const lang = useLangStore((s) => s.lang);

  const [data, setData] = useState<LearningPulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drill, setDrill] = useState<DrillState>(INITIAL_DRILL_STATE);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.getLearningPulse();
      setData(res.data);
    } catch {
      setError(t('analytics.pulseDash.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = useCallback((p: Partial<DrillState>) => {
    setDrill((s) => ({ ...s, ...p }));
  }, []);

  const selectRole = useCallback((role: LearningPulseRoleId) => {
    setDrill((s) => ({
      ...s,
      role,
      person: null,
      // РМ — уровень над городом: переключение на РМ поднимает наверх.
      city: role === 'regional_manager' ? null : s.city,
      dealer: role === 'regional_manager' ? null : s.dealer,
      team: role === 'regional_manager' ? null : s.team,
    }));
  }, []);

  const scoped = useMemo(() => (data ? scopedPeople(data, drill) : []), [data, drill]);
  const summary = useMemo(
    () => (data ? summaryFor(data, drill) : { pulse: 0, axes: [], count: 0 }),
    [data, drill],
  );
  const statusKey = pulseStatusKey(summary.pulse);
  const statusColor = pulseStatusColorVar(statusKey);
  const roleColorVar = ROLE_COLOR_VAR[drill.role];
  const roleFullLabel = t(`analytics.pulseDash.roleFull.${drill.role}`);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12 rounded-lg p-4" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)' }}>
        <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
        <button onClick={load} className="text-sm underline mt-1" style={{ color: 'var(--danger)' }}>
          {t('analytics.tryAgain')}
        </button>
      </div>
    );
  }

  if (!data || data.scope.people_total === 0) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
        <p className="text-sm">{t('analytics.pulseDash.emptyState')}</p>
      </div>
    );
  }

  const { eyebrow, title, subtitle } = buildHeaderInfo(t, data, drill, scoped.length, summary.count, roleFullLabel);

  // -- Breadcrumbs --
  const crumbs: Crumb[] = [
    {
      key: 'company',
      label: t('analytics.pulseDash.companyName'),
      onSelect: () => patch({ city: null, dealer: null, team: null, person: null }),
    },
  ];
  if (drill.city) {
    crumbs.push({ key: 'city', label: drill.city, onSelect: () => patch({ dealer: null, team: null, person: null }) });
  }
  if (drill.dealer) {
    crumbs.push({
      key: 'dealer',
      label: t('analytics.pulseDash.breadcrumbDealer', { name: drill.dealer }),
      onSelect: () => patch({ team: null, person: null }),
    });
  }
  if (drill.team) {
    crumbs.push({ key: 'team', label: drill.team, onSelect: () => patch({ person: null }) });
  }
  if (drill.person) {
    crumbs.push({ key: 'person', label: drill.person.full_name || drill.person.employee_id });
  }

  const axesTitle = drill.person
    ? t('analytics.pulseDash.axesTitlePerson')
    : t('analytics.pulseDash.axesTitleRole', { role: roleFullLabel, count: summary.count });

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-5 flex-wrap pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{eyebrow}</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
          <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</div>
        </div>
        <div className="text-right shrink-0">
          <div
            className="text-3xl sm:text-4xl font-bold leading-none"
            style={{ color: statusColor, fontVariantNumeric: 'tabular-nums' }}
          >
            {fmt1(summary.pulse)}
          </div>
          <div className="text-xs font-semibold mt-1" style={{ color: statusColor }}>
            {t(`analytics.pulseDash.statusLabel.${statusKey}`)}
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <Breadcrumbs items={crumbs} accentColorVar={roleColorVar} />

      {/* Role switcher + axis bars */}
      <div className="pt-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <span className="text-xs uppercase tracking-wide font-semibold" style={{ color: 'var(--text-muted)' }}>
            {axesTitle}
          </span>
          <div className="flex gap-2">
            {ROLE_ORDER.filter((r) => !(r === 'regional_manager' && drill.city)).map((r) => {
              const isActive = drill.role === r;
              const colorVar = ROLE_COLOR_VAR[r];
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => selectRole(r)}
                  className="px-4 py-2 rounded-md text-sm font-semibold min-h-[40px]"
                  style={{
                    background: isActive ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                    border: `1px solid ${isActive ? colorVar : 'var(--border)'}`,
                    color: isActive ? colorVar : 'var(--text-secondary)',
                  }}
                >
                  {t(`common.roles.abbreviations.${roleAbbrevKey(r)}`)}
                </button>
              );
            })}
          </div>
        </div>
        <AxisBars axes={summary.axes} roleColorVar={roleColorVar} lang={lang} />
      </div>

      {/* Drill-down list */}
      <DrillList data={data} drill={drill} scoped={scoped} lang={lang} onPatch={patch} onSetDrill={setDrill} />

      {/* Note */}
      <div
        className="mt-6 rounded-xl p-4 text-sm"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--color-gold-400)' }}
      >
        <b style={{ color: 'var(--text-primary)' }}>{t('analytics.pulseDash.noteHow')}</b>{' '}
        <span style={{ color: 'var(--text-secondary)' }}>
          {t('analytics.pulseDash.noteBody', { goal: PULSE_GOAL_PCT })}
        </span>
      </div>

      {/* Footer scope note */}
      <p className="mt-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        {t('analytics.pulseDash.scopeFootnote', {
          total: data.scope.people_total,
          excluded: data.scope.demo_excluded,
        })}
      </p>
    </div>
  );
}
