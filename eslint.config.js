import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import i18next from 'eslint-plugin-i18next'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// ============================================================================
// ESLint config — Phase 0 (2026-05-16) + Phase 4.2 (2026-07-02)
//
// Добавлены классы правил из Кодекса:
//
// 1. no-literal-string (eslint-plugin-i18next) — запрет хардкод RU/UZ литералов
//    в JSX (см. _docs/codex/10_bilingual.md + 14_ai_assistant_rules.md).
//    Уровень `warn` — на 2026-07-02 живой прогон даёт 846 нарушений в src/.
//    Поднять до `error` только после отдельной чистки (см. _docs/codex/10_bilingual.md).
//    Число зафиксировано как гейт регресса: если warn-count вырастет — стоп.
//
// 2. no-restricted-syntax (regex на hex-цвета) — частичный заменитель
//    no-hardcoded-color. Ловит `style={{ color: '#xxx' }}` и className с hex.
//    Полное правило (включая var(--color-*) проверки) — отдельный плагин в Phase 1.
//    См. _docs/codex/01_foundations.md §11 «Что нельзя делать».
//    2026-07-02: живой прогон — 160 нарушений (исторический долг, warn).
//
// 3. jsx-a11y/recommended (Phase 4.2, 2026-07-02) — доступность (aria-*, alt,
//    интерактивные роли и т.д.). Подключено на уровне `warn` целиком, т.к. в
//    коде есть исторические нарушения (не блокируем существующие PR сразу).
//    TODO: поднять до `error` после отдельной чистки a11y-долга.
//
// 4. no-restricted-syntax «tactical-шрифты вне игрового слоя» (Кодекс 01d
//    Brand-overlay + 17_game_layer.md) — Cinzel/Unbounded/JetBrains Mono и
//    динамическая инъекция fonts.googleapis.com разрешены ТОЛЬКО в
//    whitelisted tactical/gamification-зонах (см. блок overrides ниже).
//    Кодекс описывает идеальную структуру `src/features/gamification/**` —
//    в реальности проекта такой директории нет (плоская структура
//    src/pages + src/components/tactical), поэтому whitelist привязан к
//    ФАКТИЧЕСКИМ путям 2026-07-02. При появлении src/features/** —
//    актуализировать список.
//    Ограничение: no-restricted-syntax ловит JS/JSX AST (Property fontFamily,
//    строковые литералы), НЕ CSS-классы/CSS-файлы (*.css вне области ESLint
//    для JS-парсера) — глобальные *.css (tactical-design.css, tokens.css)
//    сознательно не покрываются этим гейтом, это разрешённый источник токенов.
//    Уровень `warn` — по ТЗ (не блокировать сразу).
// ============================================================================

// Пути, где tactical-эстетика (Cinzel/Unbounded/JetBrains Mono, glow, motion)
// разрешена Кодексом 01d_brand_overlay.md. Приведено к РЕАЛЬНОЙ структуре
// репозитория (src/features/gamification/** из Кодекса — не существует).
const TACTICAL_WHITELIST_GLOBS = [
  '**/src/components/tactical/**',
  '**/src/pages/TacticalLearningPage.tsx',
  '**/src/pages/Championship2026Page.tsx',
  '**/src/pages/HallOfFame2025Page.tsx',
  '**/src/components/layout/TacticalLayout.tsx',
  // Ниже — whitelist-зоны из Кодекса, которых пока физически нет в коде.
  // Оставлены на случай появления (лендинги/сплэш/кейсотека-featured):
  '**/src/pages/Landing*.tsx',
  '**/src/pages/Splash*.tsx',
  '**/src/features/gamification/**',
  '**/src/features/cup/**',
  '**/src/features/leaderboard/**',
  '**/src/features/case-studio/featured/**',
]

const TACTICAL_FONT_RULE = {
  selector:
    'Property[key.name="fontFamily"] Literal[value=/Cinzel|Unbounded|JetBrains Mono/]',
  message:
    'Tactical-шрифты (Cinzel/Unbounded/JetBrains Mono) разрешены только в игровом слое ' +
    '(src/components/tactical/**, TacticalLearningPage, Championship2026Page, HallOfFame2025Page). ' +
    'См. _docs/codex/01d_brand_overlay.md.',
}

const TACTICAL_FONTS_GOOGLEAPIS_RULE = {
  selector: 'Literal[value=/fonts\\.googleapis\\.com/]',
  message:
    'Динамическая инъекция Google Fonts разрешена только в игровом слое ' +
    '(см. _docs/codex/01d_brand_overlay.md). Продуктовый UI использует Inter из index.css.',
}

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    plugins: {
      i18next,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Phase 4.2: весь jsx-a11y/recommended набор понижен до warn —
      // в коде есть исторические нарушения, не блокируем PR сразу.
      // Поднять до error после чистки (см. TODO выше).
      ...Object.fromEntries(
        Object.entries(jsxA11y.flatConfigs.recommended.rules).map(([rule]) => [
          rule,
          'warn',
        ])
      ),

      // P0-2c (1): запрет хардкод RU/UZ литералов в JSX
      'i18next/no-literal-string': ['warn', {
        markupOnly: true,
        ignoreAttribute: [
          'data-testid', 'data-cy', 'data-id', 'id', 'key', 'href', 'src',
          'type', 'aria-hidden', 'role', 'className', 'style', 'name',
          'placeholder',  // некоторые placeholder остаются — Phase 2 разберём
        ],
      }],
      // P0-2c (2) + Phase 4.2 (3): hex-цвета + tactical-шрифты вне игрового слоя
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
        TACTICAL_FONT_RULE,
        TACTICAL_FONTS_GOOGLEAPIS_RULE,
      ],
    },
  },
  // Whitelist игрового слоя: tactical-шрифты разрешены, отключаем оба
  // селектора no-restricted-syntax именно для tactical-строк (hex-правила
  // выше остаются активными — tactical-зона не освобождена от токенов цвета).
  {
    files: TACTICAL_WHITELIST_GLOBS,
    rules: {
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
        // tactical-font и fonts.googleapis правила намеренно ОПУЩЕНЫ — разрешено в игровом слое
      ],
    },
  },
])
