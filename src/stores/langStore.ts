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

function getInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'ru' || stored === 'uz') return stored;
  return 'uz'; // default for Uzbekistan users
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useLangStore = create<LangState>((set) => ({
  lang: getInitialLang(),
  strings: LANGS[getInitialLang()],

  setLang: (lang: Lang) => {
    localStorage.setItem(STORAGE_KEY, lang);
    set({ lang, strings: LANGS[lang] });

    // Sync with backend (fire-and-forget)
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.put('/api/v1/settings/me', { language: lang }).catch(() => {});
    }
  },
}));

// ---------------------------------------------------------------------------
// Translation helper — use in components: const t = useT();
// ---------------------------------------------------------------------------

/**
 * Get a nested value from an object by dot-path.
 * t('nav.dashboard') → strings.nav.dashboard
 */
function getByPath(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : path;
}

/**
 * React hook: returns t(key) function that resolves translation by dot-path.
 * Supports simple interpolation: t('team.shown', { filtered: 5, total: 10 })
 */
export function useT() {
  const strings = useLangStore((s) => s.strings);

  return (key: string, params?: Record<string, string | number>): string => {
    let value = getByPath(strings as unknown as Record<string, unknown>, key);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return value;
  };
}
