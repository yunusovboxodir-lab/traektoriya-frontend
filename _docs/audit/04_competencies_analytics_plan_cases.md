# Аудит 04 — Компетенции · Аналитика · План обучения · Кейсотека

> Read-only аудит. Код не редактировался. Дата: 2026-06-28.
> Контекст: FMCG-платформа, минимализм, светлая тема «Пепел-холст» (контраст ≥4.5) + тёмная, мобайл важен.
> Зона аналитики: недавно починен баг overview (Course→LearningCourse, is_published→is_active). Этот аудит ищет ДРУГИЕ такие же баги.

Легенда: 🔴P0 (сломано/критично) · 🟡P1 (важно) · 🟢P2 (косметика).

---

## A. АНАЛИТИКА

### A1. Overview / `/analytics/overview` (analytics.py:56-195, OverviewTab.tsx)
**Статус: работает (после недавнего фикса), но остались «proxy»-метрики и фейковый график.**

- 🔴P0 — **Категории товаров — всегда фейковые.** `OverviewTab.tsx:16-24` хардкодит `FALLBACK_CATEGORIES` (Молочные/Соки/Кондитерские…). Бэкенд `/analytics/products` (analytics.py:614-706) **НЕ возвращает `categories_breakdown`**, поэтому `productStats?.categories_breakdown` всегда пуст → блок «Категории» (OverviewTab.tsx:368) показывает выдуманные категории, которых нет в N'Medov (источник истины — `nmedov_skus_final.json`, 17 брендов). Нарушение правила «не угадывать бренды». Либо отдавать реальные категории из БД, либо убрать блок.
- 🟡P1 — **`average_score` в Learning-метриках всегда 0.** `OverviewTab.tsx:256` читает `learning.average_score`, но `/analytics/learning` (analytics.py:595-606) такого поля НЕ возвращает (отдаёт `avg_completion_rate`, `by_course[].avg_score`, но не корневой `average_score`). Фолбэка нет → MetricBar «Средний балл» всегда 0%. Аналогично `active_learners`/`courses_completed` спасены фолбэками на `total_enrolled`/`total_completed` (строки 261, 265), а `average_score` — нет.
- 🟡P1 — **«Learning» в overview — это proxy на ContentItem, а не реальное обучение.** analytics.py:142-150: `total_enrolled = count(ContentItem)`, `total_completed = count(published ContentItem)`, `avg_progress = published/total`. Это НЕ записи о прохождении курсов (CourseCompletion есть в БД и используется в LMS-вкладке). Тот же класс бага, что чинили в courses: метрика считает не ту таблицу. «total_completed» по published-контенту → плашка «Нет активности» (OverviewTab.tsx:146) может НЕ показаться, хотя реальных прохождений 0.
- 🟡P1 — **`avg_completion_rate` курсов = доля выполненных задач с `course_id`** (analytics.py:108-123), а не доля завершённых курсов. Семантически вводит в заблуждение («средний % завершения курсов» считается по задачам).
- 🟢P2 — Лидерборд (OverviewTab) использует хардкод `text-gray-400/500`, `bg-white`, `border-gray-200` — на «Пепел-холст» читается, но не на токенах (контраст gray-400 на белом ≈ 3:1 < 4.5 для вторичного текста; для крупного ок). Вкладка Overview целиком вне темы (не использует `var(--...)`), в тёмной теме будет белой.

### A2. Leaderboard / `/analytics/leaderboard` (analytics.py:201-260)
**Статус: работает.**
- 🟡P1 — **Фильтры team_id/region применяются ПОСЛЕ limit** (analytics.py:222-249). Сначала берётся топ-N по всем, потом пост-фильтрация по команде/региону в Python → при `team_id` можно получить меньше N строк или пусто, хотя в команде есть лидеры за пределами топ-N. Фильтр надо вносить в SQL-WHERE до limit.
- 🟢P2 — `region_id` сравнивается с `user.region` строкой lower() (строка 248) — регион как свободная строка, хрупко.

### A3. Learning analytics / `/analytics/learning` (analytics.py:457-608)
**Статус: работает, но N+1 и proxy.**
- 🟡P1 — **N+1 по территориям** (analytics.py:494-526): на каждый регион — отдельный запрос user_ids + count задач + avg score. По числу регионов. Не баг, но на росте базы медленно (нет кэша на под-запросы, хотя весь результат кэшируется 10 мин).
- 🟡P1 — `by_course` строится из легаси-таблицы **`Course`** (analytics.py:529-537, outerjoin ContentItem), а не `LearningCourse`. Это ровно тот легаси-источник, что давал courses=0 в overview. Таблица `Course` на проде пустая → `by_course` почти всегда пуст. `avg_score` берётся из `CourseCompletion.quiz_score` по `course_id`, который тут = `Course.id`, а completions ссылаются на `LearningCourse.id` → join не сматчится, avg_score всегда 0. **Легаси-таблица + несуществующая связь.**
- 🟢P2 — `difficult_steps` (analytics.py:576-593) сортирует ContentItem по `difficulty_level` (просто «сложность поля»), не по реальной частоте ошибок. Название обещает «трудные шаги», по факту — самые помеченные сложными. Полу-заглушка.

### A4. Products / `/analytics/products` (analytics.py:614-706)
**Статус: работает.** Реальные агрегаты (attempts/pass_rate/avg) из ProductTestResult — без заглушек. Единственное — не отдаёт `categories_breakdown` (см. A1 🔴).

### A5. LMS Dashboard / Effectiveness / ROI (analytics.py:959-1441, LmsTab/EffectivenessTab/RoiTab)
**Статус: работает, метрики реальные.**
- ✅ LMS dashboard (analytics.py:959+) считает по реальным `LearningResponse`/`CourseCompletion`/`PainCluster`/`ContentInsight`, поля модели существуют (проверено: `business_risk`, `competency_id`, `quiz_score`, `time_spent_sec`, `attempt_number`). FILTER-агрегация оптимизирована. ROI-сервис (learning_roi_service.py) — честная помесячная KPI-дельта по OfflineTestResult + CourseCompletion, без заглушек.
- 🟡P1 — **EffectivenessTab: хардкод KPI-таблиц как fallback** (EffectivenessTab.tsx:9-87) дублирует `_KPI_MAPPING` из бэка (analytics.py:1336-1380). Бэк отдаёт mapping через `/lms/kpi-mapping`, но `LmsDashboard` (`getLmsDashboard`) **не содержит `kpi_mapping`** — фронт его не запрашивает (analytics.ts:21-22 не зовёт kpi-mapping в dashboard). Значит `dashboard?.kpi_mapping` всегда undefined → всегда используется хардкод-фолбэк. Источник истины задвоен; ShelfScan-веса в нём («40% AI») для замороженного продукта.
- 🟢P2 — LmsTab/EffectivenessTab/RoiTab целиком на хардкод-классах (`bg-white`, `text-gray-*`, `bg-indigo-600`, `bg-blue-50`) — вне системы тем, в тёмной теме сломаются. Эмодзи в UI (LmsTab.tsx:103,223; категории иконками) — нарушение правила «NO emoji в UI».
- 🟢P2 — RoiTab: `recentMonths` строит список месяцев от прошлого; при пустой БД покажет честный empty-state (RoiTab.tsx:116) — ок.

### A6. Export / `/analytics/export` (analytics.py:768-879)
**Статус: работает.** xlsx через openpyxl, KPI/tasks/overview. Корректный outerjoin, лимит 2000 на задачи. Замечаний нет.

### A7. ReportsPage (ReportsPage.tsx) — встроена во вкладку «Репорты»
**Статус: работает, ОБРАЗЦОВО по теме.** Полностью на дизайн-токенах (`bg-bg-surface`, `text-fg-*`, `border-border-*`, `bg-status-*`), тёмная/светлая обе ок. ErrorBoundary нет, но try/catch + toast на всех мутациях (update/createTask/delete). Эмодзи в бейджах типов (🐞💡❓, строки 19-21) — мелкое нарушение «NO emoji».
- 🟢P2 — Деталь репорта подгружает «текущие данные» по context_data и при ошибке тихо падает в fallback context_data (ReportsPage.tsx:77) — это осознанный fallback, ок.

---

## B. КОМПЕТЕНЦИИ

### B1. CompetenciesPage (вкладки Пульс/Оценка/Матрица/Профили)
**Статус: работает.** Role-гейтинг: Профили только admin/superadmin (CompetenciesPage.tsx:33). Вкладки на токенах (`var(--bg-overlay)`, `var(--text-*)`) — тема ок. Активная вкладка хардкодит `#FBBF24` (золото, строка 73) — намеренно, ок.

### B2. CompetencyMatrixPage (личная + командная GAP-матрица)
**Статус: работает.**
- 🟡P1 — **Команда грузится только если `user.team_id`** (CompetencyMatrixPage.tsx:124). Для admin/commercial_dir/superadmin без `team_id` вкладка «Команда» отрисуется, но `loadData` ничего не запросит → пустой экран без ошибки. Гейтинг `isSupervisor` (строка 87) включает роли без команды.
- 🟡P1 — **`manualAssess` глотает ошибку молча** (CompetencyMatrixPage.tsx:173 `catch {}`). При 403/500 модалка закрывается как при успехе, оценка не сохранена, пользователь не уведомлён.
- 🟡P1 — **Зависимость от наличия PositionProfile.** Бэк `/competency-matrix/user` (competency_matrix.py:117-121) кидает 404 «No position profile found for role» если профиля под роль нет. На проде с пустыми профилями вкладка Матрица упадёт в красный error-блок для всех. Не баг кода, но хрупкая зависимость (нет seed-профилей → раздел нерабочий).
- 🟢P2 — Хардкод светлой темы целиком (`bg-white`, `text-gray-*`, `bg-blue-600`) — в тёмной теме белые карточки. Контраст `text-gray-400` (строки 261,269,…) на белом < 4.5.
- 🟢P2 — Командный режим: N+1 на бэке (competency_matrix.py:216-218 — `analyze_user_gaps` в цикле по каждому участнику).

### B3. CompetencyProfilePage (управление профилями, admin)
Не открывалась детально в этом проходе (admin-only CRUD профилей). API competencies.ts:271-316 полный (create/update/delete/assign/from-document). Рекомендация: проверить отдельно, т.к. от профилей зависит вся Матрица (B2 🟡).

### B4. RadarChart (components/competencies/RadarChart.tsx)
**Статус: работает, чистый SVG.** Тема через токены (`var(--border)`, `var(--text-*)`, `var(--bg-card)`). Tooltip — `position: fixed`. Подписи «Пульс»/«Клик — открыть курсы» хардкод RU (строки 316,331) — не bilingual. Уровневые цвета хардкод-хексы (намеренно). Замечаний по функционалу нет.

### B5. auto-assess (competency_matrix.py:341-396)
- 🟡P1 — **Эндпоинт-заглушка.** `auto_assess_user` сканирует attempts, но тело цикла НЕ обновляет компетенции (competency_matrix.py:387-389 комментарий «skip if no direct competency link», `updated_count` всегда 0). Возвращает «levels_updated: 0 … requires assessment.competency_id (Phase 3)». Кнопка autoAssess (competencies.ts:263) дёргает мёртвый эндпоинт. Либо скрыть, либо доделать.

---

## C. ПЛАН ОБУЧЕНИЯ (TrainingPlanPage)

**Статус: работает.** Календарь/Заявки/Командировки. Role-гейтинг: `canManage` (admin/commercial_dir/trainer), `canRequest` (sv/rm/cd). Bilingual RU/UZ последовательно. try/catch + error-state на всех табах.

- 🔴P0 — **Намеренно ТЁМНАЯ страница, выпадает из «Пепел-холст».** Вся страница хардкодит dark-палитру: `text-yellow-100`, `bg-zinc-950`, `text-zinc-400`, `bg-yellow-600` (TrainingPlanPage.tsx:163,166,176,184,260-281,452-531…). Комментарий в шапке честно фиксирует «переход на dark TacticalLayout» (строка 15). В светлой теме платформы этот раздел будет тёмным островом — прямой конфликт с требованием светлой темы ≥4.5. Самая крупная UX-несостыковка зоны.
- 🟡P1 — **Роль `trainer` в гейтинге, но её нет в RBAC** (TrainingPlanPage.tsx:156). По api-conventions роли: superadmin/commercial_dir/regional_manager/admin/supervisor/sales_rep/dealer. `trainer` отсутствует → ветка для тренера мертва (см. также память «Trainer ≠ Admin» — пока одна сущность).
- 🟡P1 — **Нативные `window.prompt`/`alert`** для approve/reject заявок (TrainingPlanPage.tsx:654,667) — выбиваются из UX, на мобайле чужеродны. Reject без причины тихо отменяется (строка 660) без подсказки пользователю.
- 🟢P2 — Эмодзи в статус-бейджах и фильтрах (📅🟢🔵⭐❌, строки 104-110, 543-557) — нарушение «NO emoji».
- 🟢P2 — Календарь-грид с фикс-шириной колонок `grid-cols-[60px_110px_120px_90px_1fr_140px]` (строка 452) — на мобайле (~380px) переполнение, нет horizontal scroll-обёртки у грида (есть `overflow-hidden` на контейнере, строка 450 — обрежет).

---

## D. КЕЙСОТЕКА (Case Studio) — резюме субагента

**Статус: бэкенд аккуратный (RBAC, XP-капы, дедуп оценок, TOP-3), проблемы на фронте.**

- 🔴P0 — **`CaseStudioNewPage` и `CaseStudioMyPage` полностью вне системы тем** — сплошной хардкод `stone/white/emerald` без единой CSS-переменной. В тёмной теме — белые экраны. `MyPage` к тому же с эмодзи в UI (📚💡⭐🥇🔥🎯).
- 🔴P0 — **Счётчик просмотров — мёртвая фича.** `views_count` показывается в UI (detail + карточки), но на бэке (case_studio.py / case_studio_service.py) НИКОГДА не инкрементится — всегда 0.
- 🟡P1 — **Дыры в обработке ошибок мутаций + нативные `alert()/confirm()`** в CaseStudioDetailPage (publish/archive/delete без try/catch → 403/500 молча зависает). Авто-публикация в NewPage (publishScenario сразу после create) при сбое создаёт «фантомный» draft → дубли.
- 🟡P1 — **Семантическая путаница бейджей**: фильтр «Только с эталонами» (`only_with_etalon`) vs бейдж «+ решение» (`has_author_solution`) — разные поля, пользователь путается.
- 🟢P2 — `CaseStudioPage`, `CaseStudioDetailPage`, `CaseCategoryEditPage` сделаны по теме правильно (через токены) — эталон для починки двух «светлых» страниц. `ai_simulator_enabled` — мёртвое поле-заготовка. Лидерборд-таблица без `overflow-x-auto` (мобайл).

---

## ИТОГ: ТОП-5 проблем зоны

1. 🔴 **Аналитика показывает фейковые/нулевые метрики, выглядящие как реальные.** Категории товаров — выдуманные `FALLBACK_CATEGORIES` (не N'Medov); `average_score` в Learning всегда 0 (поля нет в API); `by_course` тянет легаси-таблицу `Course` с несматченным join (avg_score=0) — тот же класс бага, что чинили в overview. (analytics.py:142-150, 529-565; OverviewTab.tsx:16-24, 256)
2. 🔴 **«План обучения» и две страницы Кейсотеки — тёмные острова** в светлой теме «Пепел-холст»: TrainingPlanPage полностью dark (zinc/yellow), CaseStudioNewPage/MyPage хардкод stone/white. Прямой конфликт с требованием светлой темы ≥4.5; в тёмной теме «светлые» страницы белеют.
3. 🔴 **Кейсотека: счётчик просмотров (`views_count`) никогда не растёт** — мёртвая метрика в UI (всегда 0). Либо реализовать инкремент, либо убрать.
4. 🟡 **Молчаливые ошибки мутаций по всей зоне.** `manualAssess` (CompetencyMatrixPage:173), publish/archive/delete кейсов, approve/reject заявок через нативные alert/prompt — действия при 403/500 «зависают» без обратной связи; модалка оценки закрывается как при успехе.
5. 🟡 **Заглушки и задвоенные источники истины.** `auto-assess` компетенций возвращает 0 обновлений (competency_matrix.py:387, Phase-3 stub); KPI-mapping продублирован хардкодом во фронте (EffectivenessTab) при наличии бэк-эндпоинта, который фронт не зовёт; Матрица компетенций падает в 404 без seed PositionProfile.

### Список других сомнительных аналитических запросов (для проверки)
- `/analytics/learning` → `by_course` (analytics.py:529): легаси-таблица `Course` + join `CourseCompletion.course_id` (на самом деле LearningCourse.id) → avg_score всегда 0, список почти пуст. **Менять на LearningCourse, как сделали в overview.**
- `/analytics/overview` → `learning.*` (analytics.py:142-150): proxy на ContentItem published, не реальные прохождения (CourseCompletion). Проверить, не нужно ли считать по CourseCompletion.
- `/analytics/overview` → `courses.avg_completion_rate` (analytics.py:108-123): считается по Task с course_id, не по завершению курсов — переименовать или пересчитать.
- `/analytics/leaderboard`: team_id/region фильтр после limit (analytics.py:222-249) — занижает выдачу.
- `/analytics/products`: не отдаёт `categories_breakdown` → фронт рисует фейковые категории (нужно добавить реальные или убрать блок).
- `difficult_steps` (analytics.py:576): сорт по difficulty_level, не по реальным ошибкам — полу-заглушка.
