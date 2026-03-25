import { useState, useEffect } from 'react';

const cache = new Map<string, object>();
const inflight = new Map<string, Promise<object>>();

export function useLottieLoader(path: string) {
  const [data, setData] = useState<object | null>(cache.get(path) || null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cache.has(path)) {
      setData(cache.get(path)!);
      return;
    }
    let cancelled = false;

    const load = inflight.get(path) || fetch(path).then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${path}: ${r.status}`);
      return r.json();
    });
    if (!inflight.has(path)) inflight.set(path, load);

    load
      .then((json) => {
        cache.set(path, json);
        inflight.delete(path);
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        inflight.delete(path);
        if (!cancelled) setError(err);
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return { data, error };
}
