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
 */
export function pickLang<T extends Record<string, unknown>>(
  obj: T | null | undefined,
  lang: Lang,
  key: string,
): string {
  if (!obj) return '';
  if (lang === 'uz') {
    const uzVal = obj[`${key}_uz`];
    if (typeof uzVal === 'string' && uzVal.trim()) return uzVal;
  }
  const ruVal = obj[`${key}_ru`];
  if (typeof ruVal === 'string') return ruVal;
  // Fallback на raw-поле без суффикса
  const raw = obj[key];
  return typeof raw === 'string' ? raw : '';
}

/**
 * Для Task: берёт `extra_data.<key>_uz` если lang='uz' и поле непустое,
 * иначе fallback на `task[key]`. У задач основное хранение — без суффикса,
 * UZ-копия — в extra_data.
 */
export function pickTaskI18n(
  task: { [k: string]: unknown; extra_data?: Record<string, unknown> | null },
  lang: Lang,
  key: 'title' | 'description',
): string {
  if (lang === 'uz' && task.extra_data) {
    const uzVal = task.extra_data[`${key}_uz`];
    if (typeof uzVal === 'string' && uzVal.trim()) return uzVal;
  }
  const raw = task[key];
  return typeof raw === 'string' ? raw : '';
}
