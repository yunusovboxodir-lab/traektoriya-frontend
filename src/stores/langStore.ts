import { create } from 'zustand';
import ruStrings from '../i18n/ru.json';
import uzStrings from '../i18n/uz.json';
import { api } from '../api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Lang = 'ru' | 'uz';

type Strings = typeof ruStrings;

interface LangState {
  lang: Lang;
  strings: Strings;
  setLang: (lang: Lang) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'language';
const LANGS: Record<Lang, Strings> = { ru: ruStrings, uz: uzStrings };

/** Синхронизирует <html lang="..."> с текущим языком (a11y + SEO). */
function applyHtmlLang(lang: Lang): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang === 'uz' ? 'uz-Latn' : 'ru';
}

function getInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'ru' || stored === 'uz') return stored;
  return 'uz'; // default for Uzbekistan users
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useLangStore = create<LangState>((set) => {
  const initial = getInitialLang();
  applyHtmlLang(initial);

  return {
    lang: initial,
    strings: LANGS[initial],

    setLang: (lang: Lang) => {
      localStorage.setItem(STORAGE_KEY, lang);
      applyHtmlLang(lang);
      set({ lang, strings: LANGS[lang] });

      // Sync with backend (fire-and-forget)
      const token = localStorage.getItem('accessToken');
      if (token) {
        api.put('/api/v1/settings/me', { language: lang }).catch(() => {});
      }
    },
  };
});

/**
 * Применяет язык из user.telegram_lang при логине/восстановлении сессии.
 * Не дёргает backend (мы получили язык от backend и так).
 * Не перезаписывает ручной выбор пользователя (если localStorage уже стоит).
 */
export function applyUserLang(userLang: string | null | undefined): void {
  const lang = userLang === 'uz' ? 'uz' : userLang === 'ru' ? 'ru' : null;
  if (!lang) return;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'ru' || stored === 'uz') return; // уважаем ручной выбор
  localStorage.setItem(STORAGE_KEY, lang);
  applyHtmlLang(lang);
  useLangStore.setState({ lang, strings: LANGS[lang] });
}

// ---------------------------------------------------------------------------
// TRJ-022 (Phase 0, 2026-05-16) — i18n production fail-loud
//
// Когда t() возвращает сам ключ (translation missing), это баг — пользователь
// видит сырой ключ типа `dictionary.title` вместо текста. Аудит C4 поймал 3
// таких случая. Здесь мы это ловим и сигналим:
//   - dev: console.warn (виден в DevTools)
//   - prod: console.error + опциональный POST на /api/v1/telemetry/missing-i18n
//     (silent fail если эндпоинт ещё не реализован)
//   - critical namespaces (auth/common.actions/errors): дополнительная отметка
//     с тегом critical=true для будущей Sentry/Telegram alert-интеграции
//
// Дедупликация — каждый ключ репортится один раз за сессию (anti-flood).
//
// См. _docs/codex/10_bilingual.md §10 «production fail-loud» и TRJ-022.
// ---------------------------------------------------------------------------

const CRITICAL_NAMESPACES = ['auth', 'common.actions', 'errors'];
const reportedKeys = new Set<string>();

function isCriticalKey(key: string): boolean {
  return CRITICAL_NAMESPACES.some((ns) => key.startsWith(ns + '.') || key === ns);
}

function reportMissingKey(key: string, lang: Lang): void {
  const dedupeKey = `${lang}:${key}`;
  if (reportedKeys.has(dedupeKey)) return;
  reportedKeys.add(dedupeKey);

  const critical = isCriticalKey(key);
  const message = `[i18n] Missing key: ${key} (lang=${lang})${critical ? ' [CRITICAL]' : ''}`;

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(message);
  } else if (critical) {
    // eslint-disable-next-line no-console
    console.error(message);
  } else {
    // eslint-disable-next-line no-console
    console.warn(message);
  }

  // Опциональная отправка в backend для централизованного логирования.
  // Эндпоинт может ещё не существовать — silent failure, это допустимо.
  if (!import.meta.env.DEV) {
    fetch('/api/v1/telemetry/missing-i18n', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, lang, critical, url: window.location.pathname }),
      keepalive: true,
    }).catch(() => {
      /* silent: telemetry endpoint может ещё не существовать */
    });
  }
}

// ---------------------------------------------------------------------------
// Translation helper — use in components: const t = useT();
// ---------------------------------------------------------------------------

/**
 * Get a nested value from an object by dot-path.
 * t('nav.dashboard') → strings.nav.dashboard
 * Если ключ не найден — вызывается reportMissingKey (TRJ-022) и возвращается сам key.
 */
function getByPath(obj: Record<string, unknown>, path: string, lang: Lang): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      reportMissingKey(path, lang);
      return path;
    }
    current = (current as Record<string, unknown>)[part];
  }
  if (typeof current !== 'string') {
    reportMissingKey(path, lang);
    return path;
  }
  return current;
}

/**
 * React hook: returns t(key) function that resolves translation by dot-path.
 * Supports simple interpolation: t('team.shown', { filtered: 5, total: 10 })
 */
export function useT() {
  const lang = useLangStore((s) => s.lang);
  const strings = useLangStore((s) => s.strings);

  return (key: string, params?: Record<string, string | number>): string => {
    let value = getByPath(strings as unknown as Record<string, unknown>, key, lang);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return value;
  };
}
