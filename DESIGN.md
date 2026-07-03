# DESIGN.md — Traektoriya (machine layer)

> **GENERATED FILE — DO NOT EDIT DIRECTLY.**
> Source of truth: `_docs/codex/` (Codex v2.3, human-authored, 24 modules). This file is a compact, agent-readable
> extract for AI coding tools (Claude Code, Cursor, Copilot, etc). To change design rules, edit the relevant Codex
> module and recompile this file — do not patch it in place.
>
> - **Codex source version:** v2.3 (calibrated with code 2026-07-02)
> - **Compiled:** 2026-07-03
> - **Format:** loosely follows the open `DESIGN.md` convention (Google Labs / stitch-skills, April 2026). That
>   project's public repo (`google-labs-code/stitch-skills`) does not publish a fixed section spec for DESIGN.md —
>   it only references skills (`manage-design-system`, `extract-design-md`) that *consume* a DESIGN.md without
>   dictating its shape. This file therefore uses a reasonable fallback structure: Identity → Tokens → Typography
>   → Components → Patterns → Accessibility/i18n → Game Layer → Known Debt → Rules.
> - **Recompile manifest:** read `_docs/codex/00,01a,01c,01d,02,10,11,16,17` + `08` (dashboard) + actual
>   `src/styles/tokens.css`, `tailwind.config.js`, `src/index.css`, `src/styles/tactical-design.css`,
>   `src/components/ui/index.ts` → resolve discrepancies in favor of **code fact** (noted inline as ⚠️) → keep
>   ≤250 lines, English, terms with Russian originals in parentheses on first use.

---

## 1. Identity

- **Product:** Traektoriya — FMCG field-force AI training/management platform (Uzbekistan, RU + uz-Latn).
- **Design philosophy:** calm B2B product UI (forms, tables, dashboards) + a legitimized separate "game layer"
  (игровой слой) for engagement surfaces (learning map, leaderboards, splash). The two do not mix — see §7.
- **Default theme:** dark. Light theme = "Ash Canvas" (Пепел-холст), user toggle, field-use case (sunlight).
- **7 core principles** (`00_principles.md`, always in force): field context first (contrast ≥4.5:1, touch ≥44px,
  no hover-only) · one token = one decision (no hardcoded hex/px) · component over screen · semantic over visual
  (`<button>` not `<div onClick>`) · accessibility not optional (WCAG 2.1 AA min) · bilingual = equal (RU/UZ) ·
  progressive disclosure (sales_rep sees 3 actions, admin sees 30).

---

## 2. Tokens — architecture

Two-tier: `primitive` (raw values, never used directly in components) → `semantic` (only thing components
reference) → `component` (point fixes, e.g. `--button-primary-bg`). Themes override semantic only; primitives
are constant.

**Rule: never hex/rgb/hsl in components or JSX.** Always `bg-[--color-bg-accent]` / Tailwind token classes.

### Primitive palette (`src/styles/tokens.css`)
```
gold-400 #D4AF37 (brand accent, CTA only — NOT a role color)
gray-50…950 (warm neutral scale, gray-950 #050504 → gray-50 #FAFAF8)
green-500 #16A34A · red-500 #DC2626 · amber-500 #F59E0B · blue-500 #2563EB
space 0/4/8/12/16/20/24/32/40/48/64/80/96px (4px grid)
radius sm4/md8/lg12/xl16/2xl24/full9999
duration instant0/fast120/base200/slow320ms; easing-standard cubic-bezier(.4,0,.2,1); easing-emphasized (.2,0,0,1)
```

### Semantic — Dark theme (default, `:root` + `[data-theme="dark"]`)
```
bg-canvas #050504 (gray-950) · bg-surface #0E0E0B (gray-900) · bg-surface-raised #1A1A16 (gray-800)
bg-muted #1A1A16 · bg-accent gold-400 · bg-accent-hover gold-300
fg-default #FAFAF8 · fg-muted gray-300 · fg-subtle gray-400 · fg-on-accent gray-900
border-default gray-700 · border-strong gray-600 · border-accent gold-400 · border-focus blue-500
status-success-bg #052E16 / -fg #4ADE80 · status-warning-bg #422006 / -fg #FBBF24
status-danger-bg #450A0A / -fg #F87171 · status-info-bg #172554 / -fg #60A5FA
shadow-1..5: rgba(0,0,0, .4→.8), increasing blur
```

### Semantic — Light theme "Ash Canvas" / Пепел-холст (owner decision 2026-06-27, opt-in via `[data-theme="light"]`)
```
bg-canvas #ECEDE8 (ash canvas) · bg-surface #FBFBF8 (warm near-white cards) · bg-surface-raised #FFFFFF
bg-muted #E4E5DF · bg-accent gold-400 · bg-accent-hover gold-500
fg-default #1F2A33 (denim-slate) · fg-muted #45525E · fg-subtle #5C6772 · fg-on-accent gray-900
border-default #DEE0D8 · border-strong #C9CABF · border-accent gold-400 · border-focus blue-500
status-*: success #DCFCE7/green-600 · warning #FEF3C7/amber-600 · danger #FEE2E2/red-600 · info #DBEAFE/blue-600
shadows: lighter alpha (.04→.12)
```
⚠️ Code fact: light theme is only *partially* implemented via `tokens.css`. Most components read the **legacy**
parallel system in `index.css` (`--bg-primary`, `--text-primary`) with its own Ash Canvas remap
(`index.css:101-147`, same hex family, different variable names). Check which system the component you're
touching actually reads before assuming `tokens.css` alone renders the page (see §2 fragmentation note below).

### Role colors (`--color-role-*`, R4 decision 2026-05-16 — gold freed for brand only)
| Role | Dark | Light |
|---|---|---|
| sales_rep (ТП) | `#A78BFA` violet | `#7C3AED` |
| supervisor (СВ) | `#2DD4BF` teal | `#0891B2` |
| regional_manager (РМ) | `#6366F1` indigo | `#4F46E5` |
| commercial_dir (КД) | gold-600 (muted gold) | gold-700 |
| admin | `#4B5563` | `#374151` |
| superadmin | `#1F2937` | `#111827` |

**Gold rule:** `--color-gold-400` is used ONLY for `bg-accent` (primary CTA/active nav), `border-accent`
(focus/active), `fg-on-accent` pairing, and brand/marketing. Never use `gold-*` as a role color.

### Component tokens (point-fix, `tokens.css`)
`--button-primary-bg/-bg-hover/-fg`, `--input-border/-border-focus/-bg-disabled`, `--card-bg/-border/-shadow`.
New component token justified only if value used ≥3× and no semantic token fits.

### ⚠️ Known token-system fragmentation (code fact, audit 2026-07-02)
THREE live parallel systems, not one: **Canon** `tokens.css` (`--color-bg-surface`, `--color-fg-default`,
this section) — underused, ~438 semantic-class refs, `bg-bg-surface` in only 11 files. **Legacy** `index.css`
(`--bg-primary`, `--text-primary`, `--color-rm/-sv/-tp`, `--level-*`) — still the majority load-bearing system;
light theme partly lives here via its own `[data-theme="light"]` block. **Game layer** `tactical-design.css`
(`--bg-0/1/2`, `--brass`, `--cyan`, `--teal`) — not an independent palette, pure aliases onto *legacy*
(`--brass: var(--color-rm)`), established 2026-05-03. Do not invent new `--bg-*/--brass` values; repaint the HUD
by editing `index.css`, not `tactical-design.css`. Canon↔legacy unification is backlog, no assigned date;
tactical-as-alias-over-legacy is the **accepted target architecture** (2026-07-02), not debt to fix.

⚠️ Also: `tokens.css:97` still declares `--font-sans: 'Inter'` — **stale**, contradicts §3 (Golos Text is canon,
2026-07-02 decision). Trust §3, not this line, when generating code.

---

## 3. Typography

**Golos Text is canon** for product UI body text (owner decision 2026-07-02, overriding an earlier Inter-migration
plan that was never executed in code). Reason: UX data readability (AAA target) beats an abstract "more complete
Cyrillic support" argument for Inter; migration risk not worth it.

| Token | Family | Where |
|---|---|---|
| `--font-sans` (`--font-body` in legacy `index.css`) | **Golos Text**, self-hosted via Google Fonts `index.html` | ALL product body text, weights 400–700 |
| `--font-display` | Manrope | optional product hero display |
| `--font-mono` | JetBrains Mono | decorative/large only — see rule below |
| `--font-tactical-display` | **Unbounded** | game-layer hero/display headings only |
| `--font-tactical-serif` | **Cinzel** | logo / splash / login hero ONLY — never uz-Latn body (missing `ʻ` glyph) |

🔴 **Hard rule:** JetBrains Mono is FORBIDDEN on numeric data <14px (map stats, KPI numbers, metrics). At that
size the narrow face becomes visual noise, not readability. Use `--font-sans` (Golos) with
`font-variant-numeric: tabular-nums` instead. ≥14px or decorative context (tags, panel-codes) → Mono is fine.
An ESLint gate for this is planned (Phase 4.2, not yet built) — known violations exist in `tactical-design.css`
(9–11px Mono on `sb-meta`, `metric-label`, etc.) — see §7 known debt.

**Font whitelist enforcement:** Unbounded/Cinzel usage outside whitelisted game-layer folders (§7) is blocked by
a planned ESLint rule `no-tactical-fonts-outside-overlay` (not yet implemented).

### Scale (8pt grid, base 16px)
`text-xs 12/16 · sm 14/20 · base 16/24 (default) · lg 18/28 · xl 20/28 · 2xl 24/32 (h5) · 3xl 30/36 (h4) ·
4xl 36/40 (h3) · 5xl 48/52 (h2, page headers) · 6xl 60/64 (h1, hero only)`

**Rules:** one `<h1>` per page via `<PageHeader>`, never global CSS on `h1` tag · weights only 400/500/600/700 ·
unitless line-height · letter-spacing `-0.01em` for headings ≥24px · `uz-Latn`: `hyphens: auto; word-break:
break-word` · input font-size ≥16px on mobile (prevents iOS zoom).

**Motion:** `--duration-instant/fast120/base200/slow320`; animate only `opacity`/`transform`, never
`width/height/top/left`; `prefers-reduced-motion` must be respected everywhere including game layer.

---

## 4. Components (`src/components/ui/`, barrel `index.ts`)

All built on canon tokens (`tokens.css` via Tailwind `theme.extend`), Radix Primitives under the hood (free a11y),
Lucide icons (no emoji in system UI), Sonner for toasts.

**Implemented and exported (fact, `src/components/ui/index.ts`):**
- AI-UX: `AIBadge`, `ConfidenceIndicator`, `AIFeedbackBar`
- Forms: `Button`, `Input`, `Label`, `FormField`, `Select`, `Checkbox`, `Switch`
- Surfaces: `Card`(+Header/Body/Footer/Title/Description), `Modal`(+Content/Header/Body/Footer/Title/
  Description/Trigger/Close), `EmptyState`, `PageHeader`, `Skeleton`(+Line/Avatar/Card/TableRow),
  `ToastContainer`+`toast`
- Data/Nav: `Badge`, `Tabs`(+List/Trigger/Content), `DropdownMenu` (full Radix submenu set), `Tooltip`(+Provider/
  Trigger/Content), `Table`(+Header/Body/Footer/Row/Head/Cell/Caption), `RowActions`, `Collapsible`
- Also present but not yet in barrel-documented list: `ErrorBoundary.tsx`

**Rule for new components:** check this list + shadcn/ui + Atlassian Design first. If truly new, update
`_docs/codex/02a/02b/02c` spec BEFORE writing code. Never create a duplicate of an existing `ui/` component.

---

## 5. Key patterns

- **Quest-first dashboard** (owner decision 2026-07-02): TP's feed order top→bottom MUST be: (1)
  `DailyQuestsWidget` (today's action, auto-hides if empty) → (2) personal progress/Power (`StatusBar →
  PowerBadge`, outside feed) → (3) `LearningRankWidget` (leaderboard) LAST. Rationale: showing "you're last" before
  "do this today" demotivates the users who need the feed most. ⚠️ Code fact: `DashboardPage.tsx` (2026-06-25
  revision) still renders `LearningRankWidget` BEFORE `DailyQuestsWidget` — reversed order, open code task.
  Supervisor dashboard is a team-cut view (`SupervisorDashboardPage.tsx`), NOT the TP feed — supervisor is
  excluded from their own team's learning leaderboard (management role ≠ competing learner).
- **Single navigation registry** (`src/config/navigation.ts`, `NAV_REGISTRY`): one array feeds three surfaces
  (desktop dropdown `StatusBar`, mobile tabs `MobileBottomNav`, mobile drawer `MobileProfileDrawer`) via shared
  visibility functions (`isNavVisible`, `visibleDesktopItems`, etc). Never hardcode a nav item locally per-page or
  per-surface — add once to `NAV_REGISTRY`. RBAC via `ROLE_RANK` (superadmin5/commercial_dir4/admin3/
  regional_manager2/supervisor2/sales_rep1); `group:'admin'` needs rank≥3, `superAdminOnly` needs strict
  superadmin/admin. `unlockTier` links to progressive-disclosure "chests" — feature-flagged, not active for all
  sections by default.
- **Fail-loud i18n (RU/uz-Latn)**: no i18next — custom Zustand `langStore`, flat `src/i18n/{ru,uz}.json`, 1034
  keys synced 1:1. Dev: `console.warn` on missing key. Prod: error + telemetry, `CRITICAL_NAMESPACES` (auth,
  common.actions, errors) escalate harder. Never render a raw i18n key in UI. uz-Latn modifier apostrophe is
  `ʻ` (U+02BB) — NOT `'` (U+0027) or `ʼ` (U+02BC). ⚠️ Code fact: `src/i18n/uz.json` currently has 253/1034 (24%)
  violations using `'` instead of `ʻ` — known debt, lint script `scripts/uz_qa_lint.py` was lost (not committed).
  UZ strings run ~25–30% longer than RU — budget layout width accordingly; test top-20 longest UZ strings at
  360px viewport.
- **Touch zones ≥44px**: mandatory for all field-flow interactive elements (create visit, photo, save report);
  ≥48px for primary sticky field CTAs; desktop admin tables may go down to 24×24 (WCAG 2.2 AA floor). Named
  tokens `--size-tap-min:44px` / `--size-tap-cta:48px` are **proposed, not yet in `tokens.css`** (code task).
- **`:focus-visible` mandatory**: `outline: 2px solid var(--color-border-focus); outline-offset: 2px`. ⚠️ Code
  fact: this snippet DOES exist in `src/index.css:156-159` (contradicts an earlier Codex claim it was fully
  missing) — but `tactical-design.css:1270` still has a bare `outline: none` on game-layer form-like inputs
  without a `:focus-visible` replacement. Treat game-layer focus as incomplete.

---

## 6. Accessibility & i18n baseline

WCAG 2.1 AA is the floor everywhere, including the game layer. Contrast ≥4.5:1 body / ≥3:1 large text / AAA
(7:1) target for KPI, errors, prices. `aria-label` mandatory on icon-only buttons. Modals: focus trap +
`aria-labelledby`. Toasts: `role="status"`/`role="alert"`. `<html lang>` must track active locale — ⚠️ code fact:
currently hardcoded `lang="ru"` in `index.html:7`, does not switch with `langStore` (2-line fix pending).
`eslint-plugin-jsx-a11y` is NOT installed (known gap). `color-contrast` Lighthouse rule is currently OFF in
`lighthouserc.json` (known gap, ticket needed to re-enable).

---

## 7. Game layer (Tactical / HUD) — игровой слой

Legitimized second visual system (owner decision 2026-07-02) — HUD aesthetic: brass/gold, sharp corners, glow,
scanlines, status-bar. NOT tech debt to unify away; deliberately kept as its own layer over the legacy palette.

**Whitelisted zones (tactical allowed):** `src/components/tactical/**` (learning map, StatusBar, PowerBadge,
HeroPanel, Panel, AwardsPanel, RecsPanel, TacticalShell/TacticalPanel), `src/features/gamification/**`,
`src/features/cup/**`, `src/features/leaderboard/**`, `src/pages/Landing*`, `src/pages/Splash*` + login hero,
case-studio featured cards. `DashboardPage.tsx` is deliberately wrapped whole in `<TacticalShell>` — the TP home
is part of the game loop, not business analytics.

**Forbidden zones (calm B2B mandatory):** all forms, tables/lists (AdminUsers, RolesPage, Reports, KPI,
visits/trips), executive dashboards (SupervisorDashboardPage KPI/Team tabs), AI Studio, Notification Center,
settings, sync-queue, training plan (business side). `.tactical-root`/`.tactical-page` CSS classes must only be
applied inside whitelisted zones — applying them elsewhere is a bug, not a style choice.

**Two-seam rule** (from ux-qa run 2026-07-02) — the only two places calm-B2B and game-layer visually touch, both
have mandatory treatment:
1. Learning-map header must render in dark HUD style even under light theme — never a light system header over a
   dark tactical canvas.
2. Dashboard → lesson-scene transition needs a fade/transition state (`--duration-tactical-snap` 120ms or
   `--duration-base` 200ms) — never a hard cut from light dashboard to black lesson scene.

**Known game-layer debt:** `outline:none` without `:focus-visible` replacement (`tactical-design.css:1270`);
gold-as-text `#7E6320` ≈4.3:1 borderline AA at 9–10px in light theme; JetBrains Mono on small numeric HUD data
(9–11px) in multiple spots (`sb-meta`, `metric-label`, `nd-stats`, `rec-foot`, `panel-code`) — violates §3 rule,
pending migration to `--font-sans`; learning-map mobile pins ~22px, below 44px touch minimum.

---

## 8. Anti-patterns (never do this)

`style={{color:'#xxx'}}` or `bg-[#xxx]` outside tokens.css · `<div onClick>` for actions · global CSS on `h1`
tag · `!important` to override other styles · hardcoded RU/UZ string literals in JSX · emoji in system UI
(user-generated content only) · `width:100vw/height:100vh` without `dvh` fallback · `dark:` Tailwind prefix inside
`ui/` library components (theming is token-driven, automatic) · loading Google Fonts when self-hosted exists ·
new color/spacing/radius value bypassing tokens · `gold-*` as a role color · tactical tokens/fonts imported
outside whitelisted folders (§7) · raw i18n key rendered in UI · Cinzel on any uz-Latn text.

---

*Recompile trigger: any change to `_docs/codex/00,01a,01c,01d,02,08,10,11,16,17` or to `tokens.css` /
`tailwind.config.js` / `index.css` / `tactical-design.css` / `components/ui/index.ts`. Do not hand-edit this file.*
