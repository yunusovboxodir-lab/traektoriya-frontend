/**
 * Форматирование дат с ручными названиями месяцев для UZ (латиница).
 *
 * Почему не Intl.DateTimeFormat('uz-UZ', ...): у браузеров/Node ICU-данные
 * для локали uz-UZ с форматом month:'short' часто ломаются и дают артефакты
 * вида «M07 2» вместо «2-iyul». RU остаётся на стандартном Intl (ru-RU
 * работает корректно везде). Формат UZ — «day-month» (2-iyul), это принятый
 * в узбекском языке порядок числительного дня перед месяцем.
 */

type Lang = 'ru' | 'uz';

const UZ_MONTHS_SHORT = [
  'yan', 'fev', 'mar', 'apr', 'may', 'iyun',
  'iyul', 'avg', 'sen', 'okt', 'noy', 'dek',
];

const UZ_MONTHS_LONG = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];

/**
 * Короткая дата: «2 июл» (RU) / «2-iyul» (UZ).
 */
export function formatDateShort(date: Date | string, lang: Lang): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  if (lang === 'uz') {
    return `${d.getDate()}-${UZ_MONTHS_SHORT[d.getMonth()]}`;
  }
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/**
 * Длинная дата: «2 июля 2026» (RU) / «2-iyul 2026-yil» (UZ).
 */
export function formatDateLong(date: Date | string, lang: Lang): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  if (lang === 'uz') {
    return `${d.getDate()}-${UZ_MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}-yil`;
  }
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}
