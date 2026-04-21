/**
 * Мини-шина событий для инвалидации кэша Пульса.
 *
 * Зачем: PulseWidget и CompetencyMatrixPage кэшируют данные пользователя.
 * После завершения курса/теста бэкенд запускает пересчёт асинхронно (Celery),
 * поэтому фронт должен перезагрузить данные. Проще всего — опубликовать событие.
 */

type PulseListener = () => void;

const listeners = new Set<PulseListener>();

/** Подписаться на инвалидацию. Возвращает функцию отписки. */
export function onPulseInvalidate(listener: PulseListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Опубликовать инвалидацию — все подписчики перезагрузят данные. */
export function emitPulseInvalidate(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // Подписчики не должны падать друг на друга
    }
  });
}
