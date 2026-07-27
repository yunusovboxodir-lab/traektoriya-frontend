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
import type { LearningPulseData, LearningPulseRoleId, LearningPulseViewerScope } from '../../api/analytics';
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
  resolveViewerScope,
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

  // Срез, под которым бэк отдал данные (org/region/team) — задача владельца
  // 2026-07-28: экран открыт также СВ/РМ. Не хук, обычный derived-const — можно
  // объявлять до ранних return'ов ниже и использовать после них.
  const viewerScope: LearningPulseViewerScope = data ? resolveViewerScope(data) : 'org';

  // СВ (viewer_scope='team') видит ровно одну свою команду — город и дилер у
  // него единственные, показывать их как отдельный выбор не имеет смысла
  // (шум). Подставляем их автоматически поверх raw-состояния `drill`, чтобы
  // drill-down у СВ открывался сразу на уровне списка сотрудников команды —
  // без лишнего кадра с карточками «1 город» → «1 дилер».
  const effectiveDrill = useMemo<DrillState>(() => {
    if (!data || viewerScope !== 'team') return drill;
    if (drill.city || drill.dealer || drill.team) return drill;
    const city = data.hierarchy.cities[0];
    const dealer = city?.dealers[0];
    const team = dealer?.teams[0];
    if (!city || !dealer || !team) return drill;
    return { ...drill, city: city.name, dealer: dealer.name, team: team.name };
  }, [data, viewerScope, drill]);

  const scoped = useMemo(() => (data ? scopedPeople(data, effectiveDrill) : []), [data, effectiveDrill]);
  const summary = useMemo(
    () => (data ? summaryFor(data, effectiveDrill) : { pulse: 0, axes: [], count: 0 }),
    [data, effectiveDrill],
  );
  const statusKey = pulseStatusKey(summary.pulse);
  const statusColor = pulseStatusColorVar(statusKey);
  const roleColorVar = ROLE_COLOR_VAR[effectiveDrill.role];
  const roleFullLabel = t(`analytics.pulseDash.roleFull.${effectiveDrill.role}`);

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

  const {
    eyebrow, title, subtitle,
  } = buildHeaderInfo(t, data, effectiveDrill, scoped.length, summary.count, roleFullLabel, viewerScope);

  // -- Breadcrumbs --
  // СВ (viewer_scope='team') видит только свою команду — уровни «компания/город/
  // дилер» для него не выбор, а шум (задача владельца 2026-07-28): показываем
  // только «команда» и, если открыта, «сотрудник».
  const crumbs: Crumb[] = [];
  if (viewerScope !== 'team') {
    crumbs.push({
      key: 'company',
      label: viewerScope === 'region' ? t('analytics.pulseDash.myRegion') : t('analytics.pulseDash.companyName'),
      onSelect: () => patch({ city: null, dealer: null, team: null, person: null }),
    });
  }
  if (effectiveDrill.city && viewerScope !== 'team') {
    crumbs.push({ key: 'city', label: effectiveDrill.city, onSelect: () => patch({ dealer: null, team: null, person: null }) });
  }
  if (effectiveDrill.dealer && viewerScope !== 'team') {
    crumbs.push({
      key: 'dealer',
      label: t('analytics.pulseDash.breadcrumbDealer', { name: effectiveDrill.dealer }),
      onSelect: () => patch({ team: null, person: null }),
    });
  }
  if (effectiveDrill.team) {
    crumbs.push({ key: 'team', label: effectiveDrill.team, onSelect: () => patch({ person: null }) });
  }
  if (effectiveDrill.person) {
    crumbs.push({ key: 'person', label: effectiveDrill.person.full_name || effectiveDrill.person.employee_id });
  }

  const axesTitle = effectiveDrill.person
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
            {ROLE_ORDER.filter((r) => {
              if (r !== 'regional_manager') return true;
              // РМ в переключателе — только на уровне всей компании (org):
              // - у самого РМ (region) он там один — нет смысла листать «роли»;
              // - у СВ (team) РМ не входит в его команду.
              if (viewerScope !== 'org') return false;
              return !effectiveDrill.city;
            }).map((r) => {
              const isActive = effectiveDrill.role === r;
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
      <DrillList data={data} drill={effectiveDrill} scoped={scoped} lang={lang} onPatch={patch} onSetDrill={setDrill} />

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
