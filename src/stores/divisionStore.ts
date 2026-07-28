import { create } from 'zustand';

/**
 * Активная сторона платформы: Продажи или Производство.
 *
 * У платформы две независимые стороны, и цифры между ними НИКОГДА не
 * смешиваются — даже у владельца. Тот, кто видит обе (владелец, ген. директор,
 * HR-директор), смотрит их по очереди: переключатель меняет сторону, а не
 * складывает их в один отчёт.
 *
 * Выбранная сторона уходит в каждый запрос параметром `division`, поэтому все
 * средние, рейтинги и радары считаются внутри одной стороны (см. бэкенд
 * app/core/scoping.py → active_division).
 */

export type Division = 'sales' | 'production';

const STORAGE_KEY = 'trj_division';

export const DIVISION_LABELS: Record<Division, { ru: string; uz: string }> = {
  sales: { ru: 'Продажи', uz: 'Savdo' },
  production: { ru: 'Производство', uz: 'Ishlab chiqarish' },
};

function readStored(): Division | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === 'sales' || raw === 'production' ? raw : null;
}

interface DivisionState {
  /** Активная сторона. Для обычных ролей всегда равна их собственной. */
  division: Division;
  /** Стороны, доступные пользователю (из /auth/me). */
  available: Division[];
  /** Можно ли переключаться — только у ролей над доменами. */
  canSwitch: boolean;
  setDivision: (d: Division) => void;
  /** Синхронизация с профилем после логина / перезагрузки страницы. */
  syncFromUser: (userDivision?: string | null, visible?: string[] | null) => void;
  reset: () => void;
}

export const useDivisionStore = create<DivisionState>((set, get) => ({
  division: readStored() || 'sales',
  available: ['sales'],
  canSwitch: false,

  setDivision: (d) => {
    // Молча игнорируем попытку встать на недоступную сторону: бэкенд всё равно
    // ответит 403, но UI не должен доводить до ошибки.
    if (!get().available.includes(d)) return;
    localStorage.setItem(STORAGE_KEY, d);
    set({ division: d });
  },

  syncFromUser: (userDivision, visible) => {
    // `common` — домен общего контента (охрана труда, ценности компании),
    // стороной он не является и в переключатель не попадает.
    const sides = (visible || []).filter(
      (d): d is Division => d === 'sales' || d === 'production',
    );
    const own: Division = userDivision === 'production' ? 'production' : 'sales';
    const available = sides.length ? sides : [own];
    const canSwitch = available.length > 1;

    const stored = readStored();
    // Обычная роль всегда сидит в своей стороне, даже если в localStorage
    // осталась чужая (сменили роль, вошли с чужого компьютера).
    const division = canSwitch && stored && available.includes(stored) ? stored : own;

    localStorage.setItem(STORAGE_KEY, division);
    set({ division, available, canSwitch });
  },

  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ division: 'sales', available: ['sales'], canSwitch: false });
  },
}));

/** Текущая сторона вне React-компонента (для интерцептора axios). */
export const getActiveDivision = (): Division => useDivisionStore.getState().division;
