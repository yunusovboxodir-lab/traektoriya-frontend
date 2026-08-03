# 06 — Сквозной аудит: Дизайн-система / Светлая тема / Навигация-Мобайл / Auth-Роутинг / Безопасность

> Read-only аудит. Код НЕ редактировался. Дата: 2026-06-28. Модель: Opus 4.8.
> Зона: фронт `D:\Траектория\traektoriya-new`, бэк `D:\Траектория\traektoriya-rag-backend`.
> Приоритеты: 🔴P0 (блокер/безопасность) · 🟡P1 (важно) · 🟢P2 (улучшение).

---

## 1) ДИЗАЙН-СИСТЕМА / ТЕМА

### 🔴/🟡 Главная проблема: ДВА несвязанных набора токенов

Платформа держит **две независимые системы дизайн-токенов**, и они НЕ соединены друг с другом:

| Набор | Где | Имена | Кто реально потребляет |
|-------|-----|-------|------------------------|
| «Новый» (Кодекс) | `src/styles/tokens.css` | `--color-bg-canvas`, `--color-fg-default`, `--color-role-manager`, `--color-border-default`, `--shadow-2`… | **почти никто из живых компонентов** |
| «Легаси» (Tactical) | `src/index.css` + `src/styles/tactical-design.css` | `--bg-surface`, `--text-muted`, `--text-primary`, `--color-rm`, `--danger`, `--border`, `--font-body`… | StatusBar, MobileBottomNav, MobileProfileDrawer, весь tactical UI |

- 🟡 **P1** — `tokens.css` объявляет полноценный semantic-слой (`--color-fg-default`, `--color-role-*` и т.д.), но **живые компоненты навигации его не используют**. Пример: `MobileBottomNav.tsx:98` берёт `var(--color-rm)`, `MobileProfileDrawer.tsx:85,114` — `var(--bg-surface)`, `var(--color-rm-bg)`. Эти имена определены в `index.css`/`tactical-design.css`, а НЕ в `tokens.css`. Значит `tokens.css` — фактически документация-призрак: его правка ничего не меняет на экране. Это прямое нарушение цели «один источник истины токенов» и источник путаницы для любого, кто откроет `tokens.css` и начнёт «чинить тему» там.
- 🟡 **P1 — двойное определение светлой темы.** Светлая палитра «Пепел-холст» задана ТРИЖДЫ, разными значениями:
  - `tokens.css:141` `[data-theme="light"]` → `--color-bg-canvas: #ECEDE8`
  - `index.css:101` `[data-theme="light"]` → `--bg-primary: #ECEDE8` (легаси-зеркало)
  - `tactical-design.css:58` `[data-theme="light"]` → `--bg-0: #ECEDE8`
  Холст совпал случайно (#ECEDE8 везде), но surface уже расходятся: `tokens.css` surface `#FBFBF8`, `index.css` `--bg-surface: #F4F5F1`. Правка темы в одном файле молча игнорируется компонентами из другого.
- 🟢 **P2 — дубли роле-цветов.** Роль-цвета заданы и в `tokens.css` (`--color-role-manager: #6366F1` dark / `#4F46E5` light) и в `index.css`/`tactical-design.css` (`--color-rm`, `--color-sv`, `--color-tp`). Используются ВТОРЫЕ. Значения близки, но не идентичны (manager `#6366F1` vs `--color-rm` dark `#C8A84B` — вообще разные: новый = индиго, легаси = латунь/золото). Налицо рассинхрон концепций R4 (золото освобождено под бренд) — легаси всё ещё рисует РМ золотом.

### Светлая тема — контраст и «протечки»

Стратегия контраста реализована как **глобальный `!important`-ремап Tailwind-классов текста** (`index.css:155-190`): `text-amber-300/400 → #8A6A20`, `text-emerald → --success`, `text-blue → --info`, и т.д. Это разумный «одно место → все страницы», но дырявый:

- 🟡 **P1 — ремап покрывает только ТЕКСТ и только оттенки 200/300/400.** `bg-amber-400`, `border-emerald-400`, `text-*-500/600` НЕ перекрываются. Пастельный фон карточки/бейджа на пепельном холсте остаётся бледным (контраст бордюра/иконки падает). Сам комментарий в коде честно пишет «фоны/бордеры не трогаем» (`index.css:153`).
- 🟡 **P1 — gradient-text не защищён.** 18 файлов используют `text-transparent` + `bg-clip-text` (градиентные заголовки), напр. `LearningRankWidget`, `BlockResults`, `QuizRenderer`, `VillageView`. Градиент рассчитан на тёмный фон; на светлой теме ремап `.text-*` его НЕ трогает (цвет лежит в `background`, а не `color`), → заголовок может слиться/побледнеть на пепле. Нужен явный `[data-theme="light"]`-гард на градиентные заголовки.
- 🟢 **P2 — точечный хардкод inline-hex.** Инлайновые `style={{ color: '#…' }}` найдены в `BlockPreviewPage` (6), `OfflineSessionPresenterPage` (11), `CaseStudioPage` (3). Большинство — намеренно тёмные immersive-экраны (карта/сцены/презентер — по ТЗ тёмные), так что это допустимо. Но проверить `CaseStudioPage` — он НЕ из immersive-набора.

### Рекомендации (дизайн)
1. Принять решение: ЛИБО мигрировать живые компоненты на `tokens.css` (semantic), ЛИБО признать `tokens.css` справочной спекой и пометить в шапке «не подключён к рантайму — реальные токены в index.css/tactical-design.css». Сейчас оба претендуют на «источник истины» → путаница.
2. Расширить light-ремап на `bg-*`/`border-*` оттенки 300/400/500 ИЛИ ввести линт-правило, запрещающее сырые Tailwind-цвета в компонентах (только семантические классы/токены).
3. Добавить `[data-theme="light"]`-правило для градиентных заголовков (`text-transparent` → сплошной тёмный токен на светлой теме).

---

## 2) НАВИГАЦИЯ / МОБАЙЛ

### 🟡 P1 — `Sidebar.tsx` = мёртвый код с ПАРАЛЛЕЛЬНЫМ конфигом навигации

`src/components/layout/Sidebar.tsx` (500 строк) **нигде не рендерится** (`<Sidebar>` / `<Sidebar ...>` — 0 вхождений в кодовой базе; импортируется лишь в barrel `layout/index.ts` и в `KnowledgeBasePage.tsx`, но не монтируется). При этом он содержит **полностью отдельный реестр навигации**:
- собственный `NAV_ITEMS_DEF` / `ADMIN_NAV_ITEMS_DEF` (`Sidebar.tsx:232-252`),
- собственную `ROLE_HIERARCHY` (`Sidebar.tsx:218-225`, дублирует `ROLE_RANK` из navigation.ts),
- собственный `ADMIN_ONLY_PAGES`, `FROZEN_PAGES`, `ROLE_COLORS`.

Это прямо подрывает цель «единый реестр `config/navigation.ts`»: реестр-то един для трёх живых меню, но Sidebar — четвёртая, забытая копия, которая разойдётся при любой правке (напр. в Sidebar всё ещё есть `nav.planogram` и `nav.dictionaryUZ`, которых нет в `NAV_REGISTRY`). Риск: кто-то «починит навигацию» в Sidebar и не поймёт, почему не работает.
**Рекомендация:** удалить `Sidebar.tsx` + экспорт из `layout/index.ts` (и проверить `KnowledgeBasePage`, который на него ссылается — вероятно тоже легаси).

### Единый реестр — оценка
- 🟢 Положительно: `config/navigation.ts` действительно единый источник для StatusBar (`visibleDesktopItems`), MobileBottomNav (`mobilePrimaryItems`), MobileProfileDrawer (`mobileDrawerItems`). `isNavVisible` централизует гейтинг. Хорошая архитектура.
- 🟡 **P1 — рассинхрон `ROLE_RANK` между файлами.** `navigation.ts:60` даёт `admin: 3`, а `Sidebar.tsx:218` и (надо проверить) другие места держат свою копию. Пока Sidebar мёртв — не критично, но это ещё один аргумент его удалить. Также `ROLE_RANK` (navigation.ts) дублирует логику с `ROLE_FORCE_DENY` (scopeStore) — две системы ролевых правил в разных файлах.
- 🟢 **P2 — «Планограмма» отсутствует в `NAV_REGISTRY`**, но маршрут `/planogram` и `pageKey 'planogram'` живут в App.tsx + scopeStore. Раздел доступен только по прямой ссылке (admin-only, frozen-продукт ShelfScan). Это, видимо, намеренно, но создаёт «висячий» маршрут без пункта меню — стоит задокументировать.
- 🟢 **P2 — двойной гейтинг admin-блока.** `isNavVisible` (navigation.ts:90) скрывает admin-группу при `!isAdmin`, и параллельно scopeStore `ROLE_FORCE_DENY` + backend role-scopes. Три слоя ролевой видимости (backend scopes → scopeStore ROLE_FORCE_DENY → navigation isNavVisible) — работает, но тяжело отлаживать; стоит свести в один документированный пайплайн.
- 🟢 **P2 — иконки = эмодзи.** `NAV_REGISTRY` использует эмодзи (🏠📚📦), а мёртвый Sidebar — inline-SVG (lucide-подобные). Кодекс v2.1 предписывает lucide-иконки. Живая навигация на эмодзи — расхождение с дизайн-системой (эмодзи рендерятся по-разному на платформах, не темизируются).

### Desktop/Mobile консистентность
- 🟢 Консистентны: оба меню читают один реестр, гейтинг общий. MobileBottomNav (`mobilePrimary`: Главная/Обучение/Задачи) + Профиль-drawer (остальное) — логично.

---

## 3) AUTH / РОУТИНГ

### Положительное
- `api/client.ts` refresh-токен реализован аккуратно: Promise-singleton (`getRefreshPromise`, `client.ts:75-84`) исключает race при параллельных 401 (старый флаг+очередь убран — отмечено в комментарии). `_retry`-гард (`client.ts:106`) от бесконечного цикла. Auth-эндпоинты исключены из refresh (`client.ts:97-99`). Это корректно.
- FormData-обработка корректна (`client.ts:24-26`): удаляется дефолтный `Content-Type: application/json`, чтобы браузер сам выставил multipart boundary.
- `VITE_API_URL` с прод-фолбэком (`client.ts:4`) — единственная точка, хардкода URL по `src/` нет (grep чист, кроме этого fallback).

### Находки
- 🟡 **P1 — нет грейс-стейта при восстановлении сессии → возможный «мигающий» редирект.** `authStore.ts:47` ставит `isAuthenticated: !!localStorage.accessToken` синхронно, а `fetchUser()` (`authStore.ts:136`) валидирует токен асинхронно. Пока `fetchMyScopes` не вернулся, `allowedPages === null` → `isPageAllowed` пускает ВСЁ (`scopeStore.ts:79,127`). На миг пользователь может увидеть раздел, к которому доступа нет, до прихода scopes. Не дыра в безопасности (бэк всё равно гейтит API), но UX-моргание. Рекомендация: вводный `isLoaded`-гейт на ProtectedRoute (показывать PageLoader пока scopes не загружены).
- 🟡 **P1 — расхождение источников правды по доступу при `allowedPages === null`.** При null scopeStore «разрешает всё» (fail-open для UX), а `fetchMyScopes` при ошибке падает в `['dashboard']` (fail-closed, `scopeStore.ts:105`). Два противоположных дефолта в одном сторе. Это сознательно («null = ещё не загружено»), но хрупко: если `fetchMyScopes` зависнет (не упадёт), пользователь надолго остаётся в fail-open. Документировать/таймаут.
- 🟢 **P2 — race в `authStore` инициализации.** На загрузке (`authStore.ts:136-139`) `fetchUser()` и `fetchMyScopes()` стартуют параллельно. `fetchUserTier` зависит от роли из `fetchUser`, но вызывается ВНУТРИ него — ок. Просто отметить: порядок гонок управляем, явных багов нет.
- 🟢 **P2 — `redirectToLogin` через `window.location.href`** (`client.ts:55`) — полная перезагрузка вместо client-side навигации. Приемлемо (сбрасывает состояние), но теряет SPA-плавность. Минор.
- 🟢 **P2 — `/dev/characters` доступен без auth** (`App.tsx:169`) — публичный dev-роут в проде. `__block_preview` корректно за `import.meta.env.DEV` (`App.tsx:357`), а `/dev/characters` — НЕТ, он всегда смонтирован.低-риск (только превью персонажей), но стоит тоже спрятать за DEV-флаг.
- 🟢 **P2 — `/activities/m/:accessCode/:phase` намеренно без auth** (`App.tsx:351-355`, гости на тренинге) — ок по дизайну, но это публичная точка входа: убедиться, что бэк валидирует `accessCode` строго и rate-limit'ит.

---

## 4) БЕЗОПАСНОСТЬ

> Детальный grep-свип обоих репо выполнен агентом-аудитором. Сводка ниже; полный список — в разделе «🔴 Security».

### 🔴 P0 — Секреты
- 🔴 **Реальный Anthropic API-ключ в `.env` бэка** — `traektoriya-rag-backend/.env:28` `ANTHROPIC_API_KEY=sk-ant-api03-…`. Файл НЕ в git (проверено `git ls-files`), но лежит открытым текстом на диске и `.env` не защищён `!`-паттерном в `.gitignore` → риск при `git add .`. **Действие владельца: отозвать ключ в console.anthropic.com и выпустить новый.**
- 🔴 **Хардкод паролей в seed-скрипте** — `traektoriya-rag-backend/_wt/pb2/scripts/seed_users.py:14` `ADMIN_PASSWORD = "admin123"` + `tp123456`/`sup12345` с прод-URL `api.traektoriya.space`. `_wt/` не в git, но если `admin123` ещё активен на текущем проде (`traektoriya.space`, вход admin/admin123 — по памяти проекта АКТИВЕН) — это P0-дыра. **Сменить прод-пароль admin.**

### 🟡 P1 — Конфиг бэка
- 🟡 **CORS fallback `["*"]` + `allow_credentials=True`** — `app/main.py:368,374`. Если `.env` без `cors_origins` → fallback на `*` с кредами (нарушение стандарта, опасная конфигурация). Заменить fallback на `raise`.
- 🟡 **`DEBUG=true` отключает `validate_production_secrets()`** — `.env:9` + `app/core/config.py:107` (`if settings.debug: return`). Если этот `.env` попадёт на прод без правки — дефолтные секреты (`SECRET_KEY=your-secret-key-change-in-production`) пройдут молча.
- 🟡 **`/docs` и `/redoc` публичны** — `app/main.py:322-348`. Полная схема 145 эндпоинтов открыта анониму. В проде → `docs_url=None`.

### 🟢 P2 — RBAC и прочее
- 🟢 **`GET /analytics/user/{user_id}`** — `app/api/v1/analytics.py:266-271` — только `get_current_user`, без проверки роли. Любой `sales_rep` может запросить статистику любого по UUID. Добавить «свои данные ИЛИ admin/supervisor». (Остальные admin-эндпоинты — users/roles/kpi/narration/translation-dict — корректно за `require_role`, проверено.)
- 🟢 **JWT в `localStorage`** — `client.ts:16,70` — XSS-уязвимость (осознанное архитектурное решение проекта). Долгосрочно httpOnly-cookie; краткосрочно — строгий CSP.
- 🟢 **`.env.production` закоммичен во фронт** — содержит только `VITE_API_URL` (не секрет), но практика опасна; в git-истории был Railway-URL.
- 🟢 **6 `console.log` с user-ID** — `AdminUsersPage.tsx:490,497,507`, `SupervisorDashboardPage.tsx:495,502`, `TeamPage.tsx:339` — TODO-заглушки, логируют только UUID (не токены/пароли). Убрать.

---

## ТОП-5 СКВОЗНЫХ НАХОДОК

1. 🟡 **Два несвязанных набора токенов** (`tokens.css` vs `index.css`/`tactical-design.css`): живые компоненты потребляют легаси, «новый» semantic-слой — призрак. Источник путаницы №1 для темы. Светлая палитра задана трижды, surface уже расходится.
2. 🟡 **`Sidebar.tsx` — мёртвый код с параллельным реестром навигации** (500 строк): подрывает «единый источник `navigation.ts`», содержит устаревшие пункты (planogram/dictionaryUZ) и дубль `ROLE_HIERARCHY`. Удалить.
3. 🟡 **Светлая тема дырявая по контрасту**: глобальный `!important`-ремап покрывает только текст 200-400, НЕ покрывает `bg-*`/`border-*` и градиентные заголовки (`text-transparent`, 18 файлов) → бледные элементы на пепельном холсте.
4. 🟡 **Гонка авторизации/scopes**: `isAuthenticated` ставится синхронно, scopes грузятся асинхронно; при `allowedPages===null` UI fail-open → краткий показ запрещённых разделов. Нужен loader-гейт.
5. 🟡 **Тройной слой ролевого гейтинга** (backend scopes → `ROLE_FORCE_DENY` → `isNavVisible`) + дубли `ROLE_RANK`/`ROLE_HIERARCHY` в разных файлах: работает, но тяжело отлаживать и легко рассинхронить.

## 🔴 БЕЗОПАСНОСТЬ — критическое (требует действия владельца)

1. 🔴 **Отозвать Anthropic API-ключ** `sk-ant-api03-…` (`traektoriya-rag-backend/.env:28`) и выпустить новый. Убедиться, что `.env` в `.gitignore`.
2. 🔴 **Сменить прод-пароль `admin`** если `admin123` ещё активен (`_wt/pb2/scripts/seed_users.py:14`; по памяти проекта вход admin/admin123 на `traektoriya.space` активен).
3. 🟡 Закрыть `/docs` в проде, убрать CORS-fallback `["*"]`+credentials, не деплоить `.env` с `DEBUG=true`.
