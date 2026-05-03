/**
 * inferKpiTags — извлекает 1–2 KPI-тэга из названия курса.
 *
 * compass_artifact L&D 2026 §2.5 требует, чтобы каждое обучение было привязано
 * к одному из бизнес-KPI: sell-out / АКБ / доля полки / DSPM / переговоры.
 * Пока в БД нет явного поля `kpi_tags`, делаем эвристическую привязку через
 * ключевые слова в названии (RU + UZ). Если backend позже добавит поле —
 * заменим эту функцию на простой read.
 */
import type { BiText } from './bilingual';

export type KpiTag = 'dspm' | 'sellout' | 'akb' | 'pitch';

interface KpiMeta {
  icon: string;
  label: { ru: string; uz: string };
  color: 'rm' | 'success' | 'sv' | 'tp';
}

export const KPI_META: Record<KpiTag, KpiMeta> = {
  dspm:    { icon: '🎯', label: { ru: 'DSPM',     uz: 'DSPM'        }, color: 'rm' },
  sellout: { icon: '📈', label: { ru: 'Sell-out', uz: 'Sell-out'    }, color: 'success' },
  akb:     { icon: '🏪', label: { ru: 'АКБ',      uz: 'AKB'         }, color: 'sv' },
  pitch:   { icon: '💬', label: { ru: 'Питч',     uz: 'Pitch'       }, color: 'tp' },
};

// Ключевые слова RU + UZ → KPI. Длинные слова сначала (чтобы «выкладк»
// сматчилось до того как сматчится «прода»).
const KEYWORDS: Array<{ tag: KpiTag; words: string[] }> = [
  // DSPM / выкладка / полка / планограмма
  { tag: 'dspm', words: [
    'dspm', 'выкладк', 'выклад', 'полк', 'планограм', 'мерчандайз', 'фейсинг',
    'joylash', 'tokcha', 'planogramm',
  ]},
  // Sell-out / закрытие сделки
  { tag: 'sellout', words: [
    'sell-out', 'sell out', 'sellout', 'продаж', 'закры', 'сделк', 'оборот',
    'отгруз', 'sotuv', 'tushum', 'aylanma',
  ]},
  // АКБ / точки / визиты / маршрут
  { tag: 'akb', words: [
    'акб', 'актив', 'клиент', 'точк', 'магазин', 'визит', 'маршрут', 'beat',
    'mijoz', "do'kon", 'tashrif', 'marshrut',
  ]},
  // Питч / переговоры / возражения / аргументация
  { tag: 'pitch', words: [
    'питч', 'pitch', 'переговор', 'возражен', 'аргумент', 'диалог', 'продажн',
    "muzokar", "e'tiroz", 'dalil', 'pitching',
  ]},
];

/** Вытягивает до 2-х KPI-тэгов из BiText title (ru + uz). */
export function inferKpiTags(title: BiText | string | null | undefined): KpiTag[] {
  if (!title) return [];
  const text = (typeof title === 'string'
    ? title
    : `${title.ru ?? ''} ${title.uz ?? ''}`
  ).toLowerCase();
  if (!text.trim()) return [];

  const tags: KpiTag[] = [];
  for (const { tag, words } of KEYWORDS) {
    if (words.some((w) => text.includes(w))) {
      tags.push(tag);
      if (tags.length >= 2) break;
    }
  }
  return tags;
}
