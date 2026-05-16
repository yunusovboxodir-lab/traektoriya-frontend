/**
 * Tailwind v3.4 config — подключает дизайн-токены из src/styles/tokens.css.
 *
 * Стратегия: расширение, не замена. Все стандартные Tailwind-классы
 * (bg-zinc-900, text-gray-500 и т.д.) продолжают работать — для совместимости
 * с существующим кодом во время strangler-fig миграции (Phase 1+).
 *
 * Новые компоненты должны использовать ТОКЕНЫ:
 *   bg-bg-surface text-fg-default border-border-default rounded-lg shadow-2
 *   bg-role-manager text-role-manager
 *   transition-colors duration-base ease-standard
 *
 * Полная спецификация: _docs/codex/01_foundations.md
 * R3 (Tailwind v3 vs v4) решено 2026-05-16 — остаёмся на v3. Миграция на v4 — после Phase 4.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- Semantic background ---
        'bg-canvas':          'var(--color-bg-canvas)',
        'bg-surface':         'var(--color-bg-surface)',
        'bg-surface-raised':  'var(--color-bg-surface-raised)',
        'bg-muted':           'var(--color-bg-muted)',
        'bg-accent':          'var(--color-bg-accent)',
        'bg-accent-hover':    'var(--color-bg-accent-hover)',

        // --- Semantic foreground ---
        'fg-default':         'var(--color-fg-default)',
        'fg-muted':           'var(--color-fg-muted)',
        'fg-subtle':          'var(--color-fg-subtle)',
        'fg-on-accent':       'var(--color-fg-on-accent)',

        // --- Semantic border ---
        'border-default':     'var(--color-border-default)',
        'border-strong':      'var(--color-border-strong)',
        'border-accent':      'var(--color-border-accent)',
        'border-focus':       'var(--color-border-focus)',

        // --- Roles (R4: золото освобождено под бренд) ---
        'role-sales':         'var(--color-role-sales)',
        'role-supervisor':    'var(--color-role-supervisor)',
        'role-manager':       'var(--color-role-manager)',
        'role-dir':           'var(--color-role-dir)',
        'role-admin':         'var(--color-role-admin)',
        'role-superadmin':    'var(--color-role-superadmin)',

        // --- Status (bg + fg парами) ---
        'status-success-bg':  'var(--color-status-success-bg)',
        'status-success-fg':  'var(--color-status-success-fg)',
        'status-warning-bg':  'var(--color-status-warning-bg)',
        'status-warning-fg':  'var(--color-status-warning-fg)',
        'status-danger-bg':   'var(--color-status-danger-bg)',
        'status-danger-fg':   'var(--color-status-danger-fg)',
        'status-info-bg':     'var(--color-status-info-bg)',
        'status-info-fg':     'var(--color-status-info-fg)',
      },
      fontFamily: {
        sans:    'var(--font-sans)',
        display: 'var(--font-display)',
        mono:    'var(--font-mono)',
      },
      borderRadius: {
        sm:    'var(--radius-sm)',
        md:    'var(--radius-md)',
        lg:    'var(--radius-lg)',
        xl:    'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full:  'var(--radius-full)',
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
        3: 'var(--shadow-3)',
        4: 'var(--shadow-4)',
        5: 'var(--shadow-5)',
      },
      transitionTimingFunction: {
        standard:   'var(--easing-standard)',
        emphasized: 'var(--easing-emphasized)',
      },
      transitionDuration: {
        instant: '0ms',
        fast:    '120ms',
        base:    '200ms',
        slow:    '320ms',
      },
    },
  },
  plugins: [],
};
