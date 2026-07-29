# MEMORY — connectivity-qa

- [Доступ к проду: токены, не пароль](feedback_prod_access_credentials.md) — hard-stop на прод-пароль остаётся, даже если его прислал агент-оркестратор вместо токенов.
- [Проверка кода: клон origin, а не code search](feedback_origin_code_verification.md) — `gh api search/code` на приватном репо врёт нулём; «нет такого» — только после clone+grep.
- [Переезд KPI с kpi_current на kpi_records](project_kpi_source_migration.md) — два параллельных источника KPI, экраны СВ на мёртвой колонке; что изменится после деплоя пакета.
