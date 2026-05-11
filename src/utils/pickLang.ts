/**
 * Хелперы для bilingual-полей (RU/UZ).
 *
 * Используется в Кейсотеке (title_ru/title_uz прямо в объекте) и
 * в задачах Кубка (UZ-версии лежат в extra_data.title_uz / description_uz).
 */

type Lang = 'ru' | 'uz';

/**
 * Берёт `<key>_uz` если lang='uz' и поле непустое, иначе fallback на `<key>_ru`.
 * Используется для CaseScenario, CaseCategory и других прямых bilingual-полей.
 *
 * Тип obj — unknown, чтобы не конфликтовать с строгими типами моделей.
 */
export function pickLang(obj: unknown, lang: Lang, key: string): string {
  if (!obj || typeof obj !== 'object') return '';
  const record = obj as Record<string, unknown>;
  if (lang === 'uz') {
    const uzVal = record[`${key}_uz`];
    if (typeof uzVal === 'string' && uzVal.trim()) return uzVal;
  }
  const ruVal = record[`${key}_ru`];
  if (typeof ruVal === 'string') return ruVal;
  const raw = record[key];
  return typeof raw === 'string' ? raw : '';
}

/**
 * Для Task: берёт `extra_data.<key>_uz` если lang='uz' и поле непустое,
 * иначе fallback на `task[key]`. У задач основное хранение — без суффикса,
 * UZ-копия — в extra_data.
 */
export function pickTaskI18n(task: unknown, lang: Lang, key: 'title' | 'description'): string {
  if (!task || typeof task !== 'object') return '';
  const t = task as { [k: string]: unknown; extra_data?: unknown };
  if (lang === 'uz' && t.extra_data && typeof t.extra_data === 'object') {
    const ed = t.extra_data as Record<string, unknown>;
    const uzVal = ed[`${key}_uz`];
    if (typeof uzVal === 'string' && uzVal.trim()) return uzVal;
  }
  const raw = t[key];
  return typeof raw === 'string' ? raw : '';
}
