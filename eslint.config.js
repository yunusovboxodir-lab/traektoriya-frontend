import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import i18next from 'eslint-plugin-i18next'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// ============================================================================
// ESLint config — Phase 0 (2026-05-16)
//
// Добавлены два класса правил из Кодекса:
//
// 1. no-literal-string (eslint-plugin-i18next) — запрет хардкод RU/UZ литералов
//    в JSX (см. _docs/codex/10_bilingual.md + 14_ai_assistant_rules.md).
//    Уровень `warn` чтобы не блокировать существующий код в Phase 0.
//    В Phase 2 (полная локализация) поднимем до `error`.
//
// 2. no-restricted-syntax (regex на hex-цвета) — частичный заменитель
//    no-hardcoded-color. Ловит `style={{ color: '#xxx' }}` и className с hex.
//    Полное правило (включая var(--color-*) проверки) — отдельный плагин в Phase 1.
//    См. _docs/codex/01_foundations.md §11 «Что нельзя делать».
// ============================================================================

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      i18next,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // P0-2c (1): запрет хардкод RU/UZ литералов в JSX
      'i18next/no-literal-string': ['warn', {
        markupOnly: true,
        ignoreAttribute: [
          'data-testid', 'data-cy', 'data-id', 'id', 'key', 'href', 'src',
          'type', 'aria-hidden', 'role', 'className', 'style', 'name',
          'placeholder',  // некоторые placeholder остаются — Phase 2 разберём
        ],
      }],
      // P0-2c (2): запрет hex-цветов в style и className
      'no-restricted-syntax': ['warn',
        {
          selector: 'JSXAttribute[name.name="style"] Literal[value=/#[0-9a-fA-F]{3,8}/]',
          message:
            'Не хардкодить hex-цвета в style. Используй Tailwind-классы (bg-bg-surface, text-fg-default) или CSS-токены (--color-*). См. _docs/codex/01_foundations.md',
        },
        {
          selector: 'JSXAttribute[name.name="className"] Literal[value=/#[0-9a-fA-F]{3,8}/]',
          message:
            'Не хардкодить hex-цвета в className. Используй Tailwind-классы из tokens. См. _docs/codex/01_foundations.md',
        },
        {
          selector: 'Property[key.name=/^(color|backgroundColor|borderColor|fill|stroke)$/] Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message:
            'Хардкод hex-цвета в style-объекте. Используй CSS-токены (var(--color-bg-surface)) или Tailwind-классы. См. _docs/codex/01_foundations.md',
        },
      ],
    },
  },
])
