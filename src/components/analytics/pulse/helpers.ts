/**
 * Пульс обучения — общая логика (без JSX).
 *
 * Ключевое решение (задача владельца, 2026-07-27): иерархия и связи людей
 * берутся из полей API (`city`/`dealer`/`team`/`hierarchy`), НЕ из разбора
 * префиксов ФИО, как было в одобренном HTML-прототипе (тот подход — временный
 * костыль демо-данных, на бэке уже решено правильно).
 */
import type {
  LearningPulseData,
  LearningPulsePerson,
  LearningPulsePersonAxis,
  LearningPulseRoleAxis,
  LearningPulseRoleId,
  LearningPulseViewerScope,
} from '../../../api/analytics';

/** `scope.viewer_scope` от бэка; поля нет (старый бэк) → ведём себя как 'org'. */
export function resolveViewerScope(data: LearningPulseData): LearningPulseViewerScope {
  return data.scope.viewer_scope ?? 'org';
}

/** Цель по каждой оси компетенций (Кодекс: 60% от максимума). */
export const PULSE_GOAL_PCT = 60;

/** Порядок ролей в переключателе — фиксированный (ТП · СВ · РМ). */
export const ROLE_ORDER: LearningPulseRoleId[] = ['sales_rep', 'supervisor', 'regional_manager'];

/** Цвет активной роли — R4: ТП violet, СВ teal, РМ indigo (gold только бренд/CTA). */
export const ROLE_COLOR_VAR: Record<LearningPulseRoleId, string> = {
  sales_rep: 'var(--color-tp)',
  supervisor: 'var(--color-sv)',
  // index.css: --color-rm унаследован от золота (устаревшее пре-R4 значение).
  // Индиго для РМ живёт в tokens.css (R4, 2026-05-16) — единственный источник.
  regional_manager: 'var(--color-role-manager)',
};

/** Короткий ключ роли для `common.roles.abbreviations.*` (ТП/СВ/РМ). */
export function roleAbbrevKey(role: LearningPulseRoleId): 'tp' | 'sv' | 'rm' {
  if (role === 'sales_rep') return 'tp';
  if (role === 'supervisor') return 'sv';
  return 'rm';
}

// ---------------------------------------------------------------------------
// Drill-down state
// ---------------------------------------------------------------------------

export interface DrillState {
  role: LearningPulseRoleId;
  city: string | null;
  dealer: string | null;
  team: string | null;
  person: LearningPulsePerson | null;
}

export const INITIAL_DRILL_STATE: DrillState = {
  role: 'sales_rep',
  city: null,
  dealer: null,
  team: null,
  person: null,
};

export interface ScopeFilter {
  role: LearningPulseRoleId;
  city?: string | null;
  dealer?: string | null;
  team?: string | null;
}

/** Список людей выбранной роли, отфильтрованный по city/dealer/team (если заданы). */
export function scopedPeople(data: LearningPulseData, filter: ScopeFilter): LearningPulsePerson[] {
  let list = data.people.filter((p) => p.role === filter.role);
  if (filter.city) list = list.filter((p) => p.city === filter.city);
  if (filter.dealer) list = list.filter((p) => p.dealer === filter.dealer);
  if (filter.team) list = list.filter((p) => p.team === filter.team);
  return list;
}

// ---------------------------------------------------------------------------
// Агрегация осей компетенций
// ---------------------------------------------------------------------------

export interface DisplayAxis {
  key: string;
  name: string;
  nameUz?: string;
  /** 0..100 */
  pct: number;
  coursesCompleted: number;
  coursesTotal: number;
}

export function avgOf(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Форматирование пульса/процента с одним знаком после запятой. */
export function fmt1(v: number): string {
  return (Math.round(v * 10) / 10).toFixed(1);
}

/** Клиентская агрегация осей по списку людей (используется при драм-дауне ниже уровня роли). */
export function aggregateAxes(people: { axes: LearningPulsePersonAxis[] }[]): DisplayAxis[] {
  const order: string[] = [];
  const acc = new Map<string, { vals: number[]; cc: number; ct: number; nameUz?: string }>();
  people.forEach((p) => {
    (p.axes || []).forEach((a) => {
      let entry = acc.get(a.name);
      if (!entry) {
        entry = { vals: [], cc: 0, ct: a.courses_total, nameUz: a.name_uz };
        acc.set(a.name, entry);
        order.push(a.name);
      }
      entry.vals.push(a.pct);
      entry.cc += a.courses_completed;
      if (a.courses_total > entry.ct) entry.ct = a.courses_total;
      if (!entry.nameUz && a.name_uz) entry.nameUz = a.name_uz;
    });
  });
  return order.map((name) => {
    const e = acc.get(name);
    if (!e) return { key: name, name, pct: 0, coursesCompleted: 0, coursesTotal: 0 };
    return {
      key: name,
      name,
      nameUz: e.nameUz,
      pct: avgOf(e.vals),
      coursesCompleted: e.cc,
      coursesTotal: e.ct,
    };
  });
}

/** Оси, присланные бэком уже агрегированными по всей роли (уровень компании, без драм-дауна). */
export function roleAxesToDisplay(axes: LearningPulseRoleAxis[]): DisplayAxis[] {
  return axes.map((a) => ({
    key: a.competency_id || a.name,
    name: a.name,
    nameUz: a.name_uz,
    pct: a.avg_pct,
    coursesCompleted: a.courses_completed,
    coursesTotal: a.courses_total,
  }));
}

export interface PulseSummary {
  /** 0..100 */
  pulse: number;
  axes: DisplayAxis[];
  count: number;
}

/**
 * Сводка (большой пульс + шкалы осей) для текущего состояния drill-down.
 * На уровне компании (без city/dealer/team/person) используем готовую
 * агрегацию бэка (`data.roles`) — она рассчитана по ВСЕЙ роли и не требует
 * пересчёта на клиенте. При любом сужении (город/дилер/команда/сотрудник)
 * считаем на клиенте из `people[].axes`, т.к. бэк не отдаёт такие срезы.
 */
export function summaryFor(data: LearningPulseData, state: DrillState): PulseSummary {
  if (state.person) {
    return {
      pulse: state.person.pulse,
      axes: aggregateAxes([state.person]),
      count: 1,
    };
  }

  const atTop = !state.city && !state.dealer && !state.team;
  if (atTop) {
    const roleSummary = data.roles.find((r) => r.role === state.role);
    if (roleSummary) {
      return {
        pulse: roleSummary.avg_pulse,
        axes: roleAxesToDisplay(roleSummary.axes),
        count: roleSummary.count,
      };
    }
  }

  const ppl = scopedPeople(data, state);
  return {
    pulse: avgOf(ppl.map((p) => p.pulse)),
    axes: aggregateAxes(ppl),
    count: ppl.length,
  };
}

// ---------------------------------------------------------------------------
// Статусы (Норма / Внимание / Критично / Нет обучения)
// ---------------------------------------------------------------------------

export type PulseStatusKey = 'normal' | 'attention' | 'critical' | 'none';

export function pulseStatusKey(pct: number): PulseStatusKey {
  if (pct >= PULSE_GOAL_PCT) return 'normal';
  if (pct >= PULSE_GOAL_PCT / 2) return 'attention';
  if (pct > 0) return 'critical';
  return 'none';
}

export function pulseStatusColorVar(key: PulseStatusKey): string {
  if (key === 'normal') return 'var(--success)';
  if (key === 'attention') return 'var(--warning)';
  return 'var(--danger)';
}

// ---------------------------------------------------------------------------
// Статус активности отдельного сотрудника (для таблицы)
// ---------------------------------------------------------------------------

export type ActivityStatusKey =
  | 'studying'
  | 'enteredNotFinished'
  | 'peeked'
  | 'enteredNoActivity'
  | 'neverEntered';

export function activityStatusOf(p: {
  courses_completed: number;
  active_minutes: number;
  last_login: string | null;
}): { key: ActivityStatusKey; colorVar: string } {
  if (p.courses_completed > 0) return { key: 'studying', colorVar: 'var(--success)' };
  if (p.active_minutes >= 15) return { key: 'enteredNotFinished', colorVar: 'var(--warning)' };
  if (p.active_minutes > 0) return { key: 'peeked', colorVar: 'var(--danger)' };
  if (p.last_login) return { key: 'enteredNoActivity', colorVar: 'var(--danger)' };
  return { key: 'neverEntered', colorVar: 'var(--danger)' };
}

// ---------------------------------------------------------------------------
// Уровень (level_ru от бэка — RU-строка; сопоставляем с существующими
// ключами словаря pulse.trainee/practitioner/expert/master, которые уже
// двуязычны). Неизвестное значение — показываем как есть (не литерал JSX).
// ---------------------------------------------------------------------------

const LEVEL_KEY_BY_RU: Record<string, string> = {
  'Стажёр': 'trainee',
  'Практик': 'practitioner',
  'Эксперт': 'expert',
  'Мастер': 'master',
};

export function levelDictKey(levelRu: string): string | null {
  const key = LEVEL_KEY_BY_RU[levelRu.trim()];
  return key ? `pulse.${key}` : null;
}

// ---------------------------------------------------------------------------
// Иерархия РМ ↔ города (из hierarchy.cities[].rm_name)
// ---------------------------------------------------------------------------

/** rm_name -> список городов, за которые он отвечает. */
export function rmZones(data: LearningPulseData): Record<string, string[]> {
  const zones: Record<string, string[]> = {};
  data.hierarchy.cities.forEach((c) => {
    if (!c.rm_name) return;
    if (!zones[c.rm_name]) zones[c.rm_name] = [];
    zones[c.rm_name].push(c.name);
  });
  return zones;
}

export function rmNameOfCity(data: LearningPulseData, city: string): string | null {
  return data.hierarchy.cities.find((c) => c.name === city)?.rm_name ?? null;
}
