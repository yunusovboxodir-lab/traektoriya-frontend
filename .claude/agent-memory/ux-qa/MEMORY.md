# MEMORY.md — UX-QA (индекс)

- [Прогон 2026-07-27: отток полевых ТП](project_ux_qa_2026-07-27_field_dropoff.md) — маршрут логин→урок короткий и рабочий; самый критичный шаг (bronze-редирект) не проверен вживую из-за мока seller1
- [Готча: seller1-мок подменяет tier](project_seller1_mock_scope_gotcha.md) — demoData.ts перехватывает /api/v1/power/my → нельзя тестировать bronze-гейтинг на seller1
- [Квирки Claude_Browser в этой машине](feedback_tooling_environment_quirks.md) — document.hidden=true глушит анимации, resize на старой вкладке даёт стухший layout, preview_stop/read_network_requests ненадёжны
