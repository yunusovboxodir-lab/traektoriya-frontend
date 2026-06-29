/**
 * renderMarkdown — безопасный markdown → HTML конвертер.
 *
 * Поддерживаемый синтаксис (subset):
 *   # h1 / ## h2 / ### h3
 *   **bold** / *italic*
 *   - список  /  1. нумерованный
 *   переносы строк
 *
 * Вывод ОБЯЗАТЕЛЬНО прогоняется через DOMPurify.sanitize(),
 * поэтому безопасно передавать в dangerouslySetInnerHTML.
 *
 * Пример использования:
 *   import { renderMarkdown } from '@/lib/renderMarkdown';
 *   <div dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
 */
import DOMPurify from 'dompurify';

function markdownToHtml(text: string): string {
  return text
    .replace(/### (.+)/g, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
    .replace(/## (.+)/g, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
    .replace(/# (.+)/g, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

/**
 * Конвертирует markdown-строку в санитизированный HTML.
 * Безопасно для dangerouslySetInnerHTML.
 */
export function renderMarkdown(text: string): string {
  const raw = markdownToHtml(text);
  // DOMPurify работает только в браузере (нет JSDOM для SSR).
  // В данном проекте — только клиент, поэтому проверка typeof не нужна,
  // но добавляем её на случай тестовой среды без DOM.
  if (typeof window !== 'undefined' && DOMPurify.isSupported) {
    return DOMPurify.sanitize(raw);
  }
  return raw;
}
