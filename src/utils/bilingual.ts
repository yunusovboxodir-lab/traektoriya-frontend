/**
 * Bilingual text helper — resolves BilingualText | string to plain string
 * based on current language.
 *
 * Usage:
 *   bl(course.title, lang)   // returns Uzbek or Russian string
 *   bl("plain string", lang) // returns as-is
 *   bl(null, lang)           // returns ''
 */
import type { Lang } from '../stores/langStore';

/** A value that can be either a plain string or a bilingual { ru, uz } object */
export type BiText = string | { ru: string; uz?: string | null } | null | undefined;

/**
 * Resolve a BiText value to a plain string for the given language.
 * - null/undefined → ''
 * - plain string → returned as-is
 * - { ru, uz } → picks uz when lang='uz' and uz is truthy, else ru
 */
export function bl(v: BiText, lang: Lang): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return (lang === 'uz' && v.uz) ? v.uz : v.ru;
}

/**
 * Resolve an array of BiText values.
 * Useful for chips[], options[], etc.
 */
export function blArr(arr: BiText[] | undefined | null, lang: Lang): string[] {
  if (!arr) return [];
  return arr.map(v => bl(v, lang));
}
