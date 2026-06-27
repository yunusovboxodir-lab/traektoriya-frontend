import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Theme store — тёмная + светлая («Пепел-холст»).
// Решение владельца 2026-06-27: тёмная = по умолчанию/основная, светлая = опция
// (переключатель в StatusBar). Выбор сохраняется в localStorage.
// Применяется через <html data-theme="dark|light">. Палитра — tokens.css +
// легаси-переопределение в index.css ([data-theme="light"]).
// ---------------------------------------------------------------------------

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'traektoriya-theme';

function getInitial(): Theme {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  }
  return 'dark'; // тёмная — основная
}

function apply(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

const initial = getInitial();
apply(initial);

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initial,
  setTheme: (t) => {
    apply(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* private mode */ }
    set({ theme: t });
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}));
