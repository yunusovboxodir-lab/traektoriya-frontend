import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Theme store — full-dark migration (TRAEKTORIYA_DESIGN_INSTRUCTIONS, 2026-05-03).
// Light theme отключена: единая тёмная палитра по всему приложению. Toggle
// убран из StatusBar. Стор оставлен для обратной совместимости (StatusBar
// читает поле `theme`, виджеты могут опираться на него), но фактически
// `theme` всегда === 'dark'.
// ---------------------------------------------------------------------------

export type Theme = 'dark';

interface ThemeState {
  theme: Theme;
}

function applyDark() {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', 'dark');
}

applyDark();

export const useThemeStore = create<ThemeState>(() => ({
  theme: 'dark',
}));
