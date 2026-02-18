import { lazy, type ComponentType } from 'react';

/**
 * Drop-in замена для React.lazy() с авто-перезагрузкой при ошибке загрузки чанка.
 *
 * Когда Vite генерирует новые чанки после деплоя, а браузер ещё держит старый index.html,
 * lazy import фейлится с "Failed to fetch dynamically imported module".
 *
 * lazyWithRetry ловит эту ошибку и перезагружает страницу ОДИН раз (чтобы подхватить
 * свежий index.html). SessionStorage флаг предотвращает бесконечный reload.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((error: Error) => {
      const isChunkError =
        error.message?.includes('Failed to fetch dynamically imported module') ||
        error.message?.includes('Loading chunk') ||
        error.message?.includes('Loading CSS chunk') ||
        error.name === 'ChunkLoadError';

      if (isChunkError) {
        const key = `chunk_reload_${window.location.pathname}`;
        const alreadyReloaded = sessionStorage.getItem(key);

        if (!alreadyReloaded) {
          sessionStorage.setItem(key, '1');
          window.location.reload();
          // Возвращаем pending promise — React не упадёт до завершения reload
          return new Promise<{ default: T }>(() => {});
        }

        // Уже перезагружались — убираем флаг, пробрасываем ошибку в ErrorBoundary
        sessionStorage.removeItem(key);
      }

      throw error;
    })
  );
}
