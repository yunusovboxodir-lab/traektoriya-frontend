# `src/components/ui/` — базовая UI-библиотека Traektoriya

> **Phase 0 (2026-05-16):** структура создана, компоненты добавляются в Phase 1.

Все компоненты в этой папке строятся на **shadcn/ui** + **Radix Primitives** + **Lucide icons** и используют **только токены** из `src/styles/tokens.css` (через Tailwind utility classes).

## Правила

1. **Никаких хардкод-цветов** — только `bg-bg-surface`, `text-fg-default`, `border-border-default` и т.п. (см. `tailwind.config.js` colors).
2. **Никаких эмодзи** в системном UI — только `<Icon />` из `lucide-react`.
3. **`<h1>` строго один на страницу** — через `<PageHeader>`. Никаких глобальных CSS на тег.
4. **Все строки UI** — через `t('namespace.key')` из `react-i18next`. Не хардкодить русские/узбекские литералы.
5. **Touch-target ≥44px** для интерактивов в mobile-flow.
6. **Radix даёт a11y бесплатно** — `aria-label`, focus trap, keyboard nav уже работают.

## Использование `cn()`

```tsx
import { cn } from '@/lib/utils';

<button className={cn('bg-bg-surface text-fg-default', isActive && 'bg-bg-accent')}>
  Click
</button>
```

## Когда нужен новый компонент

1. Существующего нет здесь.
2. Логика не покрывается комбинацией существующих + props.
3. **Иначе** — использовать существующий + className extensions.

Перед созданием — открыть [_docs/codex/02_components.md](../../../_docs/codex/02_components.md), проверить:
- Есть ли спецификация → следовать ей.
- Нет ли у shadcn/ui (https://ui.shadcn.com/docs/components) — если есть, можно `npx shadcn@latest add <component>`.

## Стартовый набор (Phase 1)

| # | Компонент | Phase | Спецификация |
|---|---|---|---|
| 1 | Button | 1 | 02_components.md#button |
| 2 | Input + Label + FormField | 1 | 02_components.md#input |
| 3 | Card | 1 | 02_components.md#card |
| 4 | Modal / Dialog | 1 | 02_components.md#modal |
| 5 | Toast (Sonner) | 1 | 02_components.md#toast |
| 6 | Tabs | 1 | 02_components.md#tabs |
| 7 | Badge / Chip | 1 | 02_components.md#badge |
| 8 | EmptyState | 1 | 02_components.md#emptystate |
| 9 | PageHeader | 1 | 02_components.md#pageheader |
| 10 | Table | 1 | 02_components.md#table |
| 11 | DropdownMenu | 1 | 02_components.md#dropdownmenu |
| 12 | Tooltip | 1 | 02_components.md#tooltip |

## AI-ассистенту

Перед генерацией компонента сюда — **обязательно** прочитать `_docs/codex/14_ai_assistant_rules.md` (15-пункт чек-лист).
