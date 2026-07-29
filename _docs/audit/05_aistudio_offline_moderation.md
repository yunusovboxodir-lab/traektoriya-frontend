# Аудит 05 — AI-Студия + Офлайн-активности + Модерация

> Read-only аудит. Дата: 2026-06-28. Зоны: AI-Студия (генерация/чат/RAG), Офлайн, Модерация.
> Контекст: FMCG, минимализм, светлая тема «Пепел-холст» (контраст ≥4.5) + тёмная.
> Намеренно тёмные (immersive) — презентер офлайна и сцены уроков — НЕ считаются багом.

Легенда: 🔴 P0 (критично) · 🟡 P1 (важно) · 🟢 P2 (полировка).

---

## A. AI-СТУДИЯ

Точка входа: `/ai-studio` → `AIStudioPage` → `GenerationPage` (admin, roleLevel ≥ 3, lazy). Старый `/generation` редиректит на `/ai-studio` (`App.tsx:553`). 5 вкладок: `simple | wizard | moderation | media_prompts | kanban` (`GenerationPage.tsx:205`).

### A1. Генерация уроков (GenerationPage — «Простая» + «Визард»)
**Статус:** 🟢 РАБОТАЕТ. Реальная генерация (не mock).

- ✅ V2-пайплайн Problem-First: `generateLessonFromText` → `/api/v1/generate/lesson-v2-from-text` (`generation.ts:346`); из компетенции → `/lesson-v2` (`:364`). Везде `use_mock: false` (`GenerationPage.tsx:324, 827, 955`).
- ✅ Конвертер `convertV2ToLegacy()` (`generation.ts:170`) аккуратно собирает markdown + quiz. Таймаут 10 мин под долгий пайплайн (`:340`) — верно.
- ✅ Бэкенд гейтит отсутствие ключа: `/generate/status` отдаёт `anthropic_api_configured` + подсказку `use_mock=true` (`generation.py:377-387`). Семафор пайплайна (1 урок зараз) с 503 при переполнении очереди (`generation.py:660-665`) — корректная защита.
- 🟡 **P1 — XSS-риск.** `renderMarkdown()` (`GenerationPage.tsx:31-42`) — наивный regex → результат идёт в `dangerouslySetInnerHTML`. Контент от AI/редактора рендерится как HTML без санитизации. То же в `moderation/LessonEditor.tsx:249`. Нужен DOMPurify.
- 🟡 **P1 — Async/Celery эндпоинты-сироты.** Бэкенд имеет `/async/lesson-from-text`, `/async/extract-competencies`, `/job/{id}` (`generation.py:984, 1022, 1057`) с graceful-degrade при отсутствии Celery (`_celery_available`, 503 на `:998-1037`). Фронт их НЕ вызывает (`generation.ts` зовёт только sync). Мёртвый бэкенд-контур (либо подключить async-UX, либо задокументировать как задел).
- 🟡 **P1 — V1-фолбэки не используются.** `generateLessonFromTextV1` / `generateLessonFromCompetencyV1` (`generation.ts:352, 370`) объявлены «for fallback», но в `GenerationPage` нет вызова при сбое V2. Либо подключить фолбэк, либо удалить мёртвый код.
- 🟡 **P1 — `/generate/village`.** Бэкенд имеет `POST /village` (`generation.py:816`), на фронте нет ни типа, ни вызова. Мёртвый/недоиспользованный эндпоинт — проверить умысел.
- 🟢 **P2 — дубль `renderMarkdown`.** Один и тот же наивный рендер продублирован в `GenerationPage.tsx:31` и `moderation/LessonEditor.tsx`. Вынести в утилиту.
- 🟢 **P2 — хардкод цветов территорий.** `TERRITORIES` (`GenerationPage.tsx:68-73`) — `bg-green-50/blue-50/...`, не токены; на светлой норм, но не единообразно с темизацией.

### A2. AI-чат (Ustoz) — ChatPage
**Статус:** 🟢 РАБОТАЕТ функционально, 🟡 проблема темизации.

- ✅ `chatApi.ask()` → `/chat/ask` (`chat.ts:21`), бэкенд: RAG-контекст + персонализация по роли + Claude (`chat.py:236-367`). Грейсфул-фолбэк при `ClaudeAPIError` → «AI-сервис временно недоступен», `model_used="unavailable"` (`chat.py:348-354`) — хорошо.
- ✅ Источники + `ConfidenceIndicator` + `AIFeedbackBar`. Фидбэк: up/down → `/chat/feedback` (есть, `chat.py:379`); flag → `feedbackApi.submit({kind:'ai_chat_flag'})` (`ChatPage.tsx:170-189`). Эндпоинт фидбэка персистит в `AIFeedback` (`chat.py:391`).
- 🟡 **P1 — ChatPage НЕ темизирован.** 0 использований `var(--*)`, 15 хардкодов `bg-white` / `bg-gray-50` / `text-gray-900` / `bg-blue-600` (`ChatPage.tsx:98,106,141,142,223,228` и др.). На светлой «Пепел-холст» страница выпадает из палитры (жёстко белый фон, синие пузыри), на тёмной — сломается. Единственная страница AI-Студии полностью на Tailwind-хардкоде. Перевести на токены.
- 🟢 **P2 — `confidence` всегда `likely/speculative` по факту наличия источников** (`ChatPage.tsx:152-156`). Бэкенд реальной оценки уверенности не отдаёт — индикатор эвристический. Приемлемо, но это «псевдо-уверенность».
- 🟢 **P2 — «Спасибо за отзыв» хардкод-RU** (`ChatPage.tsx:188`), мимо i18n.

### A3. RAG / База знаний — KnowledgeBasePage + api/rag.ts
**Статус:** 🔴 КРИТИЧНЫЙ дефект (mock-эмбеддинги), иначе работает.

- 🔴 **P0 — ВЕСЬ фронтовый RAG идёт на MOCK-эмбеддингах.** `api/rag.ts` жёстко шлёт `use_mock_embeddings: true` во ВСЕ вызовы: `processDocument` (`rag.ts:6`), `processBatch` (`:10`), `search` (`:15`), `searchStandards` (`:20`). Бэкенд по умолчанию `False` (`rag.py:33,52,75,87`) и в доке прямо пишет «For production, use real embeddings» (`rag.py:180`). Эффект: семантический поиск и индексация базы знаний **фейковые** — векторы случайные/детерминированные mock, релевантность не настоящая. Это подрывает и базу знаний, и RAG-контекст для чата (если он тоже зовёт через эти пути). 🔴 Заменить на `false` (или пробросить флаг сверху). **Сверить на проде:** в памяти есть разногласие «эмбеддинги активны по коду» vs эта запись — но фронт-клиент однозначно форсит mock.
- ✅ KnowledgeBasePage: загрузка/листинг документов, статистика (`documentsApi.getStats`, `KnowledgeBasePage.tsx:492`), обработка `processDocument` + `force_reprocess` (`:600,632`), bulk-обновление типа/категории, чанки. Эндпоинты `process/process-batch/search/search-standards/stats/chunks` все существуют (`rag.py`).
- 🟡 **P1 — молчаливые `catch {}`.** Множество пустых `catch` без тоста/лога (`KnowledgeBasePage.tsx:481,494,503,601,607,632,655,707,726`). Ошибки RAG-обработки документа пользователь не видит — «обработал/не обработал» неотличимо. Добавить уведомления об ошибках.
- 🟢 **P2** — большой файл (1413 строк), кандидат на декомпозицию (загрузка / список / bulk-операции).

---

## B. ОФЛАЙН-АКТИВНОСТИ

Роутинг чистый, дублей нет: `/activities` (OfflinePage — сессии) ≠ `/activities/programs` (OfflineProgramsPage — шаблоны). Презентер `/activities/sessions/:id/present` — fullscreen dark (immersive, корректно). Мобильный тест `/activities/m/:accessCode/:phase` — публичный (без авторизации).

### B1. OfflinePage (сессии)
**Статус:** 🟢 РАБОТАЕТ. Создание сессии, список+фильтр, status-flow (draft→active→pre_open→pre_closed→post_open→completed), результаты PRE/POST + рост, игровые результаты, join по коду, запуск презентера. Все эндпоинты `offlineApi` на месте. Токены CSS используются — light-ready.
- 🟢 **P2** — fallback на хардкод-программы при сбое загрузки (`OfflinePage.tsx:184-190`) — приемлемо.

### B2. OfflineProgramsPage (шаблоны программ)
**Статус:** 🟢 РАБОТАЕТ (CRUD-список+создание), light-ready.
- 🟡 **P1 — нет UI удаления программы.** API `offlineProgramsApi.remove(id)` существует, но кнопки в UI нет. Неполный CRUD.
- 🟢 **P2** — нет поиска/фильтра программ.

### B3. OfflineProgramEditPage (редактор)
**Статус:** 🟢 РАБОТАЕТ. 4 вкладки (Meta / Slides / Questions / Categories), RU+UZ, превью, replaceSlides/Questions/Categories. Light-ready.
- 🟢 **P2** — блоки `hero/big_number/stat_grid/divider` рендерятся в презентере, но не редактируются в `BlockEditor` (presenter-only) — задокументировать как умысел.

### B4. OfflineSessionPresenterPage (проектор)
**Статус:** 🟢 РАБОТАЕТ. Fullscreen dark (#0D0F14 + золото #C8A84B) — **намеренно immersive, НЕ баг.** Polling дашборда 6с, навигация с клавиатуры, QR, RU/UZ, спец-слайды (dashboard_pre/post/result/growth). Фолбэк getByCode при пустом program_id — ок.

### B5. OfflineMobileTestPage (гостевой тест)
**Статус:** 🟢 РАБОТАЕТ. Без авторизации по accessCode, экраны name/test/result/error, прогресс, RU/UZ, отправка результата. Mobile-first, light-ready.

### B6. Компоненты блоков
- 🟡 **P1 — BlockRenderer хардкодит светлый текст (`#E8EAF0`).** `components/offline/blocks/BlockRenderer.tsx` (строки ~58,72,111,136,143…) использует hex вместо токенов. В презентере (тёмный) — корректно. НО тот же `BlockRenderer` используется в **превью редактора** (`OfflineProgramEditPage`, светлый контекст) → светло-серый текст на светлом фоне = контраст ~1.2:1 (FAIL ≥4.5). Нужен флаг `isDark` или ветвление по data-theme в превью.
- 🟢 BlockEditor — на токенах, light-ready.

---

## C. МОДЕРАЦИЯ

**Контур переводов (RU→UZ moderation loop) — ОТКЛЮЧЁН.** Проверка показала: компоненты `components/moderation/*` относятся к модерации **контента уроков** (не переводов) и все ЖИВЫЕ, подключены через `GenerationPage` (вкладки moderation/media_prompts/kanban). Отдельная `TranslationReviewPage` (`/translation-review`) — это и есть отключённый контур (вне данной зоны, помечена ниже как мёртвая).

| Компонент | Статус | Где подключён |
|-----------|--------|---------------|
| ContentModerationTab | ЖИВОЙ | GenerationPage:17 (вкладка «Модерация») |
| ContentKanbanTab | ЖИВОЙ | GenerationPage:23 (вкладка «Kanban») |
| MediaPromptsTab | ЖИВОЙ | GenerationPage:20 (вкладка «Медиа-промпты») |
| LessonEditor | ЖИВОЙ | ContentModerationTab:3 (модалка) |
| QuizEditor | ЖИВОЙ | LessonEditor:3 (под-модалка) |
| MediaManager | ЖИВОЙ | LessonEditor:4 (под-модалка) |

Эндпоинт `MediaPromptsTab` существует: `/api/v1/learning/media-prompts` (GET+PATCH, `learning.py:1742,1784`).

### Находки
- 🟡 **P1 — XSS в LessonEditor.** `renderMarkdown()` + `dangerouslySetInnerHTML` без санитизации (`LessonEditor.tsx:249`) — тот же риск, что в GenerationPage. DOMPurify.
- 🟡 **P1 — клик по карточке Kanban — заглушка.** `handleCardClick` только `toast.info` (`ContentKanbanTab.tsx:314-317`), не открывает редактор. Незавершённая навигация.
- 🟡 **P1 — QuizEditor: нет редактирования существующих вопросов.** Работают только create/delete и toggle `is_active` (`QuizEditor.tsx:86,108,117`); полного edit-режима нет, хотя деталь вопроса разворачивается.
- 🟡 **P1 — хардкод цветов бейджей не пройдёт светлую тему.** Бейджи статусов/типов `bg-blue-100 text-blue-700`, `bg-green-100 text-green-800` и т.п. (`ContentKanbanTab.tsx:60-66`, `ContentModerationTab.tsx:224`, `QuizEditor.tsx:222`). Модалки на `bg-white` вместо `bg-bg-surface`. ~40% компонентов модерации не на токенах — риск контраста на «Пепел-холст».
- 🟡 **P1 — англ. тексты мимо i18n.** `Loading...` (`ContentModerationTab.tsx:157`), `Failed to ...` (`QuizEditor.tsx:45,100,111,120`; `LessonEditor` save). Локализовать.
- 🟢 **P2** — MediaPromptsTab показывает UZ-промпты, но генерация их не создаёт (translation-loop off) → vestigial-данные, безвредно. Revert в Kanban без refetch (`ContentKanbanTab.tsx:291-296`) — риск устаревания. Нет предупреждения о несохранённых изменениях в LessonEditor.

---

## D. Мёртвое / отключённое (явный список)

| # | Что | Где | Статус |
|---|-----|-----|--------|
| 1 | 🔴 Фронт-RAG форсит `use_mock_embeddings:true` | `api/rag.ts:6,10,15,20` | Активный баг — поиск/индексация фейковые |
| 2 | Async/Celery-генерация (`/async/*`, `/job/{id}`) | `generation.py:984-1057` | Бэкенд есть, фронт не зовёт → сирота |
| 3 | V1-фолбэки генерации | `generation.ts:352,370` | Объявлены, не вызываются |
| 4 | `/generate/village` | `generation.py:816` | Нет на фронте |
| 5 | Kanban card click | `ContentKanbanTab.tsx:314` | Заглушка (toast) |
| 6 | Удаление офлайн-программы | OfflineProgramsPage | API есть, UI нет |
| 7 | QuizEditor edit существующих вопросов | `QuizEditor.tsx` | Только create/delete/toggle |
| 8 | Контур переводов (вне зоны, для справки) | `TranslationReviewPage` / `/translation-review` | ОТКЛЮЧЁН (RU→UZ loop). Компоненты `components/moderation/*` — НЕ он, они живые |

---

## E. ТОП-5 приоритетных

1. 🔴 **P0 — Фронт-RAG на mock-эмбеддингах.** `api/rag.ts` шлёт `use_mock_embeddings:true` во все 4 RAG-вызова → семантический поиск базы знаний и RAG-контекст недостоверны. Заменить на `false`. Сверить с продом.
2. 🟡 **P1 — XSS через `dangerouslySetInnerHTML`** в `GenerationPage.tsx:31/249` и `LessonEditor.tsx:249` (наивный markdown→HTML без санитизации). Добавить DOMPurify / вынести в общую безопасную утилиту.
3. 🟡 **P1 — ChatPage не темизирован.** 0 токенов, 15 хардкодов Tailwind → выпадает из «Пепел-холст» и сломается на тёмной. Перевести на `var(--*)`.
4. 🟡 **P1 — Светлая тема в модерации + офлайн-превью.** Хардкод-бейджи модерации (`ContentKanbanTab/ModerationTab/QuizEditor`) и `BlockRenderer` (#E8EAF0 в превью редактора) рискуют контрастом <4.5 на светлой. Перевести на токены / добавить `isDark`-ветвление превью.
5. 🟡 **P1 — Мёртвые контуры генерации.** Async/Celery (`/async/*`), V1-фолбэки, `/village` — либо подключить, либо удалить. Незавершённые: Kanban card-click (заглушка), удаление офлайн-программы (нет UI), QuizEditor edit (нет режима).
