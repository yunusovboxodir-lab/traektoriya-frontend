/**
 * Плюрализация числительных.
 *
 * RU: 3 формы (1 сотрудник / 2 сотрудника / 5 сотрудников) по правилам русского.
 * UZ: 1 форма (узбекский не склоняет существительное по числу: 1 xodim / 5 xodim).
 *
 * Использование:
 *   pluralRu(n, ['сотрудник', 'сотрудника', 'сотрудников'])
 *   plural(n, lang, { ru: ['сотрудник','сотрудника','сотрудников'], uz: 'xodim' })
 */

/** Возвращает индекс формы (0/1/2) для русского числительного. */
function ruPluralIndex(n: number): 0 | 1 | 2 {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return 2;
  if (n1 > 1 && n1 < 5) return 1;
  if (n1 === 1) return 0;
  return 2;
}

/** RU-плюрал: одна из трёх форм по правилам русского языка. */
export function pluralRu(n: number, forms: [string, string, string]): string {
  return forms[ruPluralIndex(n)];
}

/**
 * Билингвальная плюрализация. Возвращает только слово (без числа).
 * uz — либо одна форма-строка, либо [форма] (узбекский не склоняет).
 */
export function plural(
  n: number,
  lang: 'ru' | 'uz',
  forms: { ru: [string, string, string]; uz: string },
): string {
  return lang === 'uz' ? forms.uz : pluralRu(n, forms.ru);
}
