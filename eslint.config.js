import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import i18next from 'eslint-plugin-i18next'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import { builtinRules } from 'eslint/use-at-your-own-risk'

// Локальный псевдо-плагин: реэкспортирует core-правило `no-restricted-syntax`
// под своим именем, чтобы дать ему НЕЗАВИСИМУЮ severity от основного
// `no-restricted-syntax` (hex-цвета, остаётся warn из-за 160 исторических
// нарушений). Один и тот же ключ правила не может иметь два разных уровня
// в одном flat-config дереве — это стандартный обходной путь ESLint 9.
const localTacticalPlugin = {
  rules: {
    'no-tactical-font-outside-overlay': builtinRules.get('no-restricted-syntax'),
  },
}

// Тот же приём для гейта «пол читабельности 12px» (Кодекс 01c §3 п.7,
// 2026-07-22, эталон ShelfScan): независимая severity от прочих
// no-restricted-syntax-правил + отдельное послабление в tactical-зонах.
const localReadabilityPlugin = {
  rules: {
    'no-text-below-floor': builtinRules.get('no-restricted-syntax'),
  },
}

// Пол 12px для продуктового UI: запрещены text-[4..11px] и text-[13px]
// (13 — мимо шкалы, использовать text-sm), inline fontSize < 12 и = 13.
const READABILITY_FLOOR_RULES = [
  {
    selector: 'JSXAttribute[name.name="className"] Literal[value=/text-\\[(?:[4-9]|1[01]|13)px\\]/]',
    message:
      'Пол читабельности: текст мельче 12px запрещён, 13px — мимо шкалы. ' +
      'Используй text-xs (12) / text-sm (14). См. _docs/codex/01c_typography.md §3 п.7-9.',
  },
  {
    selector: 'Property[key.name="fontSize"] Literal[value<12]',
    message:
      'Пол читабельности: inline fontSize < 12px запрещён. Минимум 12 (подписи), контент — 14+. ' +
      'См. _docs/codex/01c_typography.md §3 п.7-9.',
  },
  {
    selector: 'Property[key.name="fontSize"] Literal[value=13]',
    message:
      'fontSize: 13 — мимо шкалы. Используй 12 (подпись) или 14 (text-sm). ' +
      'См. _docs/codex/01c_typography.md §2.',
  },
  {
    selector: 'Property[key.name="fontSize"] Literal[value=/^(?:[4-9]|1[01]|13)px$/]',
    message:
      'Пол читабельности: fontSize мельче 12px (или 13 мимо шкалы) запрещён. ' +
      'См. _docs/codex/01c_typography.md §3 п.7-9.',
  },
]

// Послабление для tactical-зон (исключения Кодекса 01c §3 п.7):
// HUD-микрометки ≥11px, подпись RingProgress ≥10px — банится только <10.
const READABILITY_FLOOR_RULES_TACTICAL = [
  {
    selector: 'JSXAttribute[name.name="className"] Literal[value=/text-\\[(?:[4-9])px\\]/]',
    message:
      'Даже в tactical-слое текст мельче 10px запрещён (Кодекс 01c §3 п.7: HUD-микрометки ≥11px, RingProgress ≥10px).',
  },
  {
    selector: 'Property[key.name="fontSize"] Literal[value<10]',
    message:
      'Даже в tactical-слое inline fontSize < 10px запрещён (Кодекс 01c §3 п.7).',
  },
  {
    selector: 'Property[key.name="fontSize"] Literal[value=/^[4-9]px$/]',
    message:
      'Даже в tactical-слое fontSize мельче 10px запрещён (Кодекс 01c §3 п.7).',
  },
]

// ============================================================================
// ESLint config — Phase 0 (2026-05-16) + Phase 4.2 (2026-07-02) + Phase 4.2-финал (2026-07-02/03)
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
// 4. no-restricted-syntax/tactical-font («псевдоним»-правило, тот же движок
//    no-restricted-syntax, зарегистрирован под отдельным именем через
//    локальный псевдо-плагин ниже) «tactical-шрифты вне игрового слоя»
//    (Кодекс 01d Brand-overlay + 17_game_layer.md) — Cinzel/Unbounded/
//    JetBrains Mono и динамическая инъекция fonts.googleapis.com разрешены
//    ТОЛЬКО в whitelisted tactical/gamification-зонах (см. блок overrides
//    ниже). Кодекс описывает идеальную структуру `src/features/gamification/**`
//    — в реальности проекта такой директории нет (плоская структура
//    src/pages + src/components/tactical), поэтому whitelist привязан к
//    ФАКТИЧЕСКИМ путям 2026-07-02. При появлении src/features/** —
//    актуализировать список.
//    Ограничение: селектор ловит JS/JSX AST (Property fontFamily, строковые
//    литералы), НЕ CSS-классы/CSS-файлы (*.css вне области ESLint для
//    JS-парсера) — глобальные *.css (tactical-design.css, tokens.css)
//    сознательно не покрываются этим гейтом, это разрешённый источник токенов.
//    Уровень `error` (Фаза 4.2-финал, 2026-07-02/03): после чистки 41 находки
//    (0 нарушений вне whitelist) правило поднято с warn до error — регресс
//    (новый Cinzel/Unbounded/JetBrains Mono вне whitelist-зон) теперь ломает
//    сборку. Вынесено ИЗ общего no-restricted-syntax (который остаётся warn
//    из-за 160 исторических hex-нарушений) в отдельную запись
//    `local-tactical/no-tactical-font-outside-overlay`, т.к. один и тот же
//    ключ правила в ESLint flat config не может иметь двух разных severity
//    в одном месте — используем локальный псевдо-плагин, реализующий тот же
//    ESLint core `no-restricted-syntax` под своим именем (см. LOCAL_TACTICAL_PLUGIN).
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
  // Фаза 4.2-финал (2026-07-02, чистка 41 находки): точечный whitelist для
  // файлов вне tactical-каталогов, где Unbounded остаётся ТОЛЬКО на крупных
  // (≥14px) декоративных заголовках/геймификационных элементах —
  // UX-прогон подтвердил «привычно и не мешает» (владелец, 2026-07-02).
  // PulsePage.tsx: h1 заголовка страницы (28px). LearningRankWidget.tsx:
  // h2 «Лига Чемпионов» (18px) + пьедестал ТОП-3 (цифры/аватар-инициалы
  // медалей 1/2/3, 14-36px, декор геймификации, не текстовые данные).
  // Все ЧИСЛОВЫЕ/мелкие (<14px) употребления Unbounded/JetBrains Mono в этих
  // файлах уже вычищены (см. memory.md фронт-агента) — whitelist не открывает
  // файл целиком заново, остаток проверен вручную.
  '**/src/pages/PulsePage.tsx',
  '**/src/components/dashboard/LearningRankWidget.tsx',
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
      'local-tactical': localTacticalPlugin,
      'local-readability': localReadabilityPlugin,
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
      // P0-2c (2): hex-цвета (исторический долг 160 нарушений, остаётся warn)
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
      // Phase 4.2-финал (2026-07-02/03): tactical-шрифты вне игрового слоя —
      // ERROR. Живой прогон после чистки 41 находки = 0 вне whitelist,
      // порог «поднять до error после чистки» (из Phase 4.2) выполнен.
      'local-tactical/no-tactical-font-outside-overlay': ['error',
        TACTICAL_FONT_RULE,
        TACTICAL_FONTS_GOOGLEAPIS_RULE,
      ],
      // 2026-07-22: гейт «пол читабельности 12px» (Кодекс 01c §3 п.7-9,
      // волна чистки суб-12px = 0 нарушений на момент включения) — error,
      // чтобы мелкий текст не возвращался.
      'local-readability/no-text-below-floor': ['error', ...READABILITY_FLOOR_RULES],
    },
  },
  // Whitelist игрового слоя: tactical-шрифты разрешены — правило полностью
  // отключено для этих путей. Hex-правило `no-restricted-syntax` (основной
  // блок выше) НЕ имеет override здесь и остаётся активным без изменений —
  // tactical-зона не освобождена от цветовых токенов, только от шрифтов.
  {
    files: TACTICAL_WHITELIST_GLOBS,
    rules: {
      'local-tactical/no-tactical-font-outside-overlay': 'off',
      // Tactical-исключения пола: HUD-микрометки ≥11px, RingProgress ≥10px —
      // здесь банится только текст <10px.
      'local-readability/no-text-below-floor': ['error', ...READABILITY_FLOOR_RULES_TACTICAL],
    },
  },
])
