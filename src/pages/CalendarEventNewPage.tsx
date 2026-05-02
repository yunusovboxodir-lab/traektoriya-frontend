/**
 * Module 15: Calendar Event New — форма создания события календаря.
 *
 * Маршрут: /training-plan/calendar/new
 * Доступ: superadmin / commercial_dir / admin / trainer.
 *
 * Поля (CalendarEventCreateIn):
 *  - event_code (slug, обязательно)
 *  - event_type (offline_training / online_block / pulse_check / attestation
 *    / championship / field_trip)
 *  - program_id (опц., только для offline_training — селектор офлайн-программ)
 *  - title_ru + title_uz
 *  - target_role (sales_rep / supervisor / regional_manager / commercial_dir / all)
 *  - target_region (текст)
 *  - start_date + end_date
 *  - duration_minutes
 *  - location
 *  - readiness (ready / created / template)
 *  - competencies (через запятую)
 *  - notes
 *
 * Авто-расчёт:
 *  - week_number = ISO-week числа от start_date
 *  - half_of_month = first (1-15) | second (16+)
 *  - При выборе program — title_ru/title_uz/duration пред-заполняются из неё
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingPlanApi } from '../api/trainingPlan';
import { offlineProgramsApi } from '../api/offlinePrograms';
import type { EventType, TargetRole, Readiness } from '../types/trainingPlan';
import type { Program } from '../types/offlineProgram';

const EVENT_TYPE_OPTIONS: { value: EventType; label: string; icon: string }[] = [
  { value: 'offline_training', label: 'Офлайн-тренинг', icon: '🎓' },
  { value: 'online_block', label: 'Онлайн-блок', icon: '💻' },
  { value: 'pulse_check', label: 'Pulse-срез', icon: '📊' },
  { value: 'attestation', label: 'Аттестация', icon: '📋' },
  { value: 'championship', label: 'Кубок / соревнование', icon: '🏆' },
  { value: 'field_trip', label: 'Командировка', icon: '✈️' },
];

const TARGET_ROLE_OPTIONS: { value: TargetRole; label: string }[] = [
  { value: 'sales_rep', label: 'ТП — Торговый представитель' },
  { value: 'supervisor', label: 'СВ — Супервайзер' },
  { value: 'regional_manager', label: 'РМ — Региональный менеджер' },
  { value: 'commercial_dir', label: 'КД — Коммерческий директор' },
  { value: 'all', label: 'Все роли' },
];

const READINESS_OPTIONS: { value: Readiness; label: string }[] = [
  { value: 'ready', label: '✅ Готов' },
  { value: 'created', label: '🔨 Создан черновик' },
  { value: 'template', label: '✍️ Только шаблон' },
];

function isoWeek(dateStr: string): number {
  // ISO-week number из YYYY-MM-DD
  if (!dateStr) return 0;
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return 0;
  // ISO algorithm
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

function halfOfMonth(dateStr: string): 'first' | 'second' | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return undefined;
  return d.getDate() <= 15 ? 'first' : 'second';
}

export function CalendarEventNewPage() {
  const navigate = useNavigate();

  const [eventCode, setEventCode] = useState('');
  const [eventType, setEventType] = useState<EventType>('offline_training');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programId, setProgramId] = useState<string>('');
  const [titleRu, setTitleRu] = useState('');
  const [titleUz, setTitleUz] = useState('');
  const [targetRole, setTargetRole] = useState<TargetRole>('sales_rep');
  const [targetRegion, setTargetRegion] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [readiness, setReadiness] = useState<Readiness | ''>('');
  const [competenciesText, setCompetenciesText] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем активные офлайн-программы (для селектора при offline_training)
  useEffect(() => {
    offlineProgramsApi
      .list({ is_active: true })
      .then((res) => {
        const list = (res.data?.programs || []).filter(
          (p) => p.target_role === targetRole || targetRole === 'all',
        );
        setPrograms(list);
      })
      .catch(() => setPrograms([]));
  }, [targetRole]);

  // При выборе программы — пред-заполняем title и duration
  useEffect(() => {
    if (!programId) return;
    const prog = programs.find((p) => p.id === programId);
    if (!prog) return;
    if (!titleRu) setTitleRu(prog.title);
    if (!titleUz && prog.title_uz) setTitleUz(prog.title_uz);
    if (!durationMinutes) setDurationMinutes(prog.duration_minutes);
  }, [programId]); // eslint-disable-line react-hooks/exhaustive-deps

  const week = useMemo(() => (startDate ? isoWeek(startDate) : 0), [startDate]);
  const half = useMemo(() => halfOfMonth(startDate), [startDate]);

  const competencies = useMemo(
    () => competenciesText.split(',').map((c) => c.trim()).filter(Boolean),
    [competenciesText],
  );

  const handleSubmit = async () => {
    setError(null);
    if (eventCode.trim().length < 3) {
      setError('Код события: минимум 3 символа');
      return;
    }
    if (titleRu.trim().length < 5) {
      setError('Заголовок: минимум 5 символов');
      return;
    }
    if (!startDate) {
      setError('Дата начала обязательна');
      return;
    }
    if (endDate && endDate < startDate) {
      setError('Дата окончания не может быть раньше начала');
      return;
    }

    setSubmitting(true);
    try {
      await trainingPlanApi.createEvent({
        event_code: eventCode.trim(),
        event_type: eventType,
        program_id: programId || null,
        title_ru: titleRu.trim(),
        title_uz: titleUz.trim() || null,
        target_role: targetRole,
        target_region: targetRegion.trim() || null,
        start_date: startDate,
        end_date: endDate || null,
        week_number: week || null,
        half_of_month: half,
        duration_minutes: typeof durationMinutes === 'number' ? durationMinutes : null,
        location: location.trim() || null,
        readiness: (readiness || null) as Readiness | null,
        competencies: competencies.length > 0 ? competencies : null,
        notes: notes.trim() || null,
      });
      // Возвращаемся на главную плана — событие появится в календаре
      navigate('/training-plan');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err?.response?.data?.detail || err?.message || 'Ошибка');
      setSubmitting(false);
    }
  };

  const isOfflineTraining = eventType === 'offline_training';

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate('/training-plan')}
        className="text-sm text-stone-600 hover:text-stone-900 mb-4"
      >
        ← К плану обучения
      </button>

      <h1 className="text-2xl font-serif text-stone-800 mb-2">Новое событие в календаре</h1>
      <p className="text-stone-600 mb-6">
        Запланируй тренинг, аттестацию, онлайн-блок или другое событие.
      </p>

      <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-5">
        {/* Event type */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Тип события
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setEventType(opt.value)}
                className={`p-3 rounded border text-left transition-colors ${
                  eventType === opt.value
                    ? 'border-stone-800 bg-stone-50'
                    : 'border-stone-200 hover:border-stone-400'
                }`}
              >
                <div className="text-xl mb-1">{opt.icon}</div>
                <div className="text-sm font-medium text-stone-800">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Event code */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Код события (slug)
          </label>
          <input
            type="text"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value)}
            placeholder="2026-W22-RM-COACHING"
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm font-mono"
            maxLength={50}
          />
          <p className="text-xs text-stone-600 mt-1">
            Формат: год-неделя-роль-тема. Используется для ссылок и фильтрации.
          </p>
        </div>

        {/* Target role */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Для какой роли
          </label>
          <select
            value={targetRole}
            onChange={(e) => {
              setTargetRole(e.target.value as TargetRole);
              setProgramId(''); // сбрасываем программу при смене роли
            }}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
          >
            {TARGET_ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Program selector — только для offline_training */}
        {isOfflineTraining && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Программа (опц.)
            </label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            >
              <option value="">— Без привязки к программе —</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon ? `${p.icon} ` : ''}
                  {p.title} ({p.duration_minutes} мин)
                </option>
              ))}
            </select>
            {programs.length === 0 && targetRole !== 'all' && (
              <p className="text-xs text-amber-700 mt-1">
                Для этой роли нет активных офлайн-программ. Можно создать без привязки.
              </p>
            )}
            {programId && (
              <p className="text-xs text-stone-600 mt-1">
                Заголовок и длительность авто-заполнятся (можно перезаписать).
              </p>
            )}
          </div>
        )}

        {/* Title RU + UZ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Заголовок RU
            </label>
            <input
              type="text"
              value={titleRu}
              onChange={(e) => setTitleRu(e.target.value)}
              placeholder='«Полевые коучинги по DSPM»'
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
              maxLength={500}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Заголовок UZ (опц.)
            </label>
            <input
              type="text"
              value={titleUz}
              onChange={(e) => setTitleUz(e.target.value)}
              placeholder='«Dalada DSPM kouching»'
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
              maxLength={500}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Дата начала
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Дата окончания (опц.)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        {startDate && (
          <div className="text-xs text-stone-600">
            ISO-неделя: <strong>{week}</strong> · {' '}
            {half === 'first' ? '1-я половина месяца' : '2-я половина месяца'}
          </div>
        )}

        {/* Duration + Location */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Длительность (мин)
            </label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) =>
                setDurationMinutes(e.target.value ? parseInt(e.target.value, 10) : '')
              }
              placeholder="120"
              min={0}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Локация
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ташкент / офис"
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Регион / зона охвата
          </label>
          <input
            type="text"
            value={targetRegion}
            onChange={(e) => setTargetRegion(e.target.value)}
            placeholder="Навои + Бухара"
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
          />
        </div>

        {/* Readiness */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Готовность контента
          </label>
          <select
            value={readiness}
            onChange={(e) => setReadiness(e.target.value as Readiness | '')}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
          >
            <option value="">— Не указано —</option>
            {READINESS_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Competencies */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Компетенции (через запятую)
          </label>
          <input
            type="text"
            value={competenciesText}
            onChange={(e) => setCompetenciesText(e.target.value)}
            placeholder="DSPM, Полевой коучинг, Возражения"
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
          />
          {competencies.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {competencies.map((c) => (
                <span
                  key={c}
                  className="px-2 py-0.5 text-xs rounded-full border bg-blue-50 text-blue-700 border-blue-200"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Заметки
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Дополнительные детали для тренера и участников"
            rows={3}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => navigate('/training-plan')}
            className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50"
          >
            {submitting ? 'Создаю…' : 'Создать событие'}
          </button>
        </div>
      </div>
    </div>
  );
}
