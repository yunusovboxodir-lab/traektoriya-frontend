/**
 * Module 15: Field Trip New — форма создания нового отчёта о командировке.
 *
 * Маршрут: /training-plan/field-trips/new
 * Доступ: superadmin / commercial_dir / admin / trainer.
 *
 * Поля:
 *  - trip_code (slug) + start_date + end_date
 *  - cities (мультиввод через запятую)
 *  - participants_summary (динамический список ролей с количеством)
 *  - pre_avg / post_avg (опц., 0-100% → 0.0-1.0)
 *  - total_cost_uzs (опц.)
 *  - transport (динамический список билетов)
 *  - narrative + next_steps
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingPlanApi } from '../api/trainingPlan';

interface TransportRow {
  type: string;
  from: string;
  to: string;
  ticket_no: string;
  cost_uzs: number | null;
  date: string;
}

interface ParticipantRow {
  role: string;
  count: number;
}

const ROLE_OPTIONS = [
  { value: 'tp', label: 'ТП' },
  { value: 'sv', label: 'СВ' },
  { value: 'rm', label: 'РМ' },
  { value: 'managers', label: 'Управляющие дилера' },
  { value: 'tp_sv', label: 'ТП + СВ (смешанный)' },
];

export function FieldTripNewPage() {
  const navigate = useNavigate();

  const [tripCode, setTripCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [citiesText, setCitiesText] = useState('');
  const [participants, setParticipants] = useState<ParticipantRow[]>([
    { role: 'tp', count: 0 },
  ]);
  const [preAvgInput, setPreAvgInput] = useState(''); // в процентах 0-100
  const [postAvgInput, setPostAvgInput] = useState('');
  const [totalCostInput, setTotalCostInput] = useState('');
  const [transport, setTransport] = useState<TransportRow[]>([]);
  const [narrative, setNarrative] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cities = useMemo(
    () => citiesText.split(',').map((c) => c.trim()).filter(Boolean),
    [citiesText],
  );

  const participantsSummary = useMemo(() => {
    const out: Record<string, number> = {};
    for (const p of participants) {
      if (p.role && p.count > 0) {
        out[p.role] = (out[p.role] || 0) + p.count;
      }
    }
    return out;
  }, [participants]);

  const handleAddParticipant = () => {
    setParticipants([...participants, { role: 'tp', count: 0 }]);
  };
  const handleUpdateParticipant = (idx: number, field: 'role' | 'count', value: string | number) => {
    const next = [...participants];
    next[idx] = { ...next[idx], [field]: field === 'count' ? Number(value) : String(value) };
    setParticipants(next);
  };
  const handleRemoveParticipant = (idx: number) => {
    setParticipants(participants.filter((_, i) => i !== idx));
  };

  const handleAddTransport = () => {
    setTransport([
      ...transport,
      { type: 'train', from: '', to: '', ticket_no: '', cost_uzs: null, date: '' },
    ]);
  };
  const handleUpdateTransport = (
    idx: number,
    field: keyof TransportRow,
    value: string | number | null,
  ) => {
    const next = [...transport];
    next[idx] = { ...next[idx], [field]: value };
    setTransport(next);
  };
  const handleRemoveTransport = (idx: number) => {
    setTransport(transport.filter((_, i) => i !== idx));
  };

  const parsePctInput = (val: string): number | null => {
    if (!val.trim()) return null;
    const n = parseFloat(val);
    if (Number.isNaN(n)) return null;
    if (n > 1) return n / 100; // 78 → 0.78
    return n;
  };

  const handleSubmit = async () => {
    setError(null);

    if (tripCode.trim().length < 3) {
      setError('trip_code: минимум 3 символа');
      return;
    }
    if (!startDate || !endDate) {
      setError('Укажи start_date и end_date');
      return;
    }
    if (cities.length === 0) {
      setError('Укажи хотя бы один город');
      return;
    }

    const preAvg = parsePctInput(preAvgInput);
    const postAvg = parsePctInput(postAvgInput);
    const totalCost = totalCostInput ? parseInt(totalCostInput.replace(/\s/g, ''), 10) : null;

    setSubmitting(true);
    try {
      const filteredTransport = transport
        .filter((t) => t.type && (t.from || t.to || t.ticket_no))
        .map((t) => ({
          type: t.type,
          from: t.from || undefined,
          to: t.to || undefined,
          ticket_no: t.ticket_no || undefined,
          cost_uzs: t.cost_uzs ?? undefined,
          date: t.date || undefined,
        }));

      const res = await trainingPlanApi.createFieldTrip({
        trip_code: tripCode.trim(),
        start_date: startDate,
        end_date: endDate,
        cities,
        transport: filteredTransport.length > 0 ? filteredTransport : null,
        total_cost_uzs: totalCost,
        participants_summary: participantsSummary,
        pre_avg: preAvg,
        post_avg: postAvg,
        narrative: narrative.trim() || null,
        next_steps: nextSteps.trim() || null,
      });
      navigate(`/training-plan/field-trips/${res.data.id}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err?.response?.data?.detail || err?.message || 'Ошибка');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate('/training-plan')}
        className="text-sm text-stone-600 hover:text-stone-900 mb-4"
      >
        ← К плану обучения
      </button>

      <h1 className="text-2xl font-serif text-stone-800 mb-2">
        Новый отчёт о командировке
      </h1>
      <p className="text-stone-600 mb-6">
        Зафиксируй маршрут, участников, PRE/POST-замеры и наблюдения.
      </p>

      <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-5">
        {/* Trip code */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Код командировки (slug)
          </label>
          <input
            type="text"
            value={tripCode}
            onChange={(e) => setTripCode(e.target.value)}
            placeholder="2026-05-Samarkand"
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm font-mono"
            maxLength={50}
          />
          <p className="text-xs text-stone-600 mt-1">
            Уникальный код: год-месяц-город. Используется для ссылок.
          </p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Начало</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Конец</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Cities */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Города (через запятую)
          </label>
          <input
            type="text"
            value={citiesText}
            onChange={(e) => setCitiesText(e.target.value)}
            placeholder="Самарканд, Джизах"
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
          />
          {cities.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {cities.map((c) => (
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

        {/* Participants */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Участники
          </label>
          <div className="space-y-2 mb-2">
            {participants.map((p, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select
                  value={p.role}
                  onChange={(e) => handleUpdateParticipant(idx, 'role', e.target.value)}
                  className="border border-stone-300 rounded px-2 py-1.5 text-sm flex-1"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={p.count}
                  onChange={(e) => handleUpdateParticipant(idx, 'count', e.target.value)}
                  min={0}
                  className="w-24 border border-stone-300 rounded px-2 py-1.5 text-sm"
                  placeholder="Кол-во"
                />
                {participants.length > 1 && (
                  <button
                    onClick={() => handleRemoveParticipant(idx)}
                    className="text-stone-500 hover:text-red-600 px-2"
                    aria-label="Удалить"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={handleAddParticipant}
            className="text-sm text-stone-600 hover:text-stone-900 underline"
          >
            + Добавить роль
          </button>
        </div>

        {/* PRE/POST */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              PRE средний (%)
            </label>
            <input
              type="text"
              value={preAvgInput}
              onChange={(e) => setPreAvgInput(e.target.value)}
              placeholder="52"
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              POST средний (%)
            </label>
            <input
              type="text"
              value={postAvgInput}
              onChange={(e) => setPostAvgInput(e.target.value)}
              placeholder="78"
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        {preAvgInput && postAvgInput && (
          <div className="text-sm text-emerald-700">
            Рост:{' '}
            {((parsePctInput(postAvgInput) || 0) - (parsePctInput(preAvgInput) || 0)) > 0 ? '+' : ''}
            {(((parsePctInput(postAvgInput) || 0) - (parsePctInput(preAvgInput) || 0)) * 100).toFixed(0)} п.п.
          </div>
        )}

        {/* Cost */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Общий расход (сум, опц.)
          </label>
          <input
            type="text"
            value={totalCostInput}
            onChange={(e) => setTotalCostInput(e.target.value)}
            placeholder="740 000"
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
          />
        </div>

        {/* Transport */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Транспорт (опц.)
          </label>
          {transport.length > 0 && (
            <div className="space-y-2 mb-2">
              {transport.map((t, idx) => (
                <div key={idx} className="bg-stone-50 border border-stone-200 rounded p-3 space-y-2">
                  <div className="flex gap-2 items-center">
                    <select
                      value={t.type}
                      onChange={(e) => handleUpdateTransport(idx, 'type', e.target.value)}
                      className="border border-stone-300 rounded px-2 py-1 text-sm w-28"
                    >
                      <option value="train">Поезд</option>
                      <option value="plane">Самолёт</option>
                      <option value="car">Машина</option>
                      <option value="bus">Автобус</option>
                    </select>
                    <input
                      type="text"
                      value={t.from}
                      onChange={(e) => handleUpdateTransport(idx, 'from', e.target.value)}
                      placeholder="Откуда"
                      className="border border-stone-300 rounded px-2 py-1 text-sm flex-1"
                    />
                    <span className="text-stone-500">→</span>
                    <input
                      type="text"
                      value={t.to}
                      onChange={(e) => handleUpdateTransport(idx, 'to', e.target.value)}
                      placeholder="Куда"
                      className="border border-stone-300 rounded px-2 py-1 text-sm flex-1"
                    />
                    <button
                      onClick={() => handleRemoveTransport(idx)}
                      className="text-stone-500 hover:text-red-600 px-2"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={t.ticket_no}
                      onChange={(e) => handleUpdateTransport(idx, 'ticket_no', e.target.value)}
                      placeholder="№ билета"
                      className="border border-stone-300 rounded px-2 py-1 text-sm flex-1 font-mono"
                    />
                    <input
                      type="number"
                      value={t.cost_uzs ?? ''}
                      onChange={(e) =>
                        handleUpdateTransport(
                          idx, 'cost_uzs',
                          e.target.value ? parseInt(e.target.value, 10) : null,
                        )
                      }
                      placeholder="Сумма (сум)"
                      className="border border-stone-300 rounded px-2 py-1 text-sm w-32"
                    />
                    <input
                      type="date"
                      value={t.date}
                      onChange={(e) => handleUpdateTransport(idx, 'date', e.target.value)}
                      className="border border-stone-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={handleAddTransport}
            className="text-sm text-stone-600 hover:text-stone-900 underline"
          >
            + Добавить билет
          </button>
        </div>

        {/* Narrative */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Что произошло (наблюдения тренера)
          </label>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="Что обсуждали, какие ошибки нашли, что сработало хорошо..."
            rows={5}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
          />
        </div>

        {/* Next steps */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Следующие шаги
          </label>
          <textarea
            value={nextSteps}
            onChange={(e) => setNextSteps(e.target.value)}
            placeholder="Что СВ должен сделать на следующей неделе. Что на следующий тренинг."
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
            {submitting ? 'Сохраняю…' : 'Создать отчёт'}
          </button>
        </div>
      </div>
    </div>
  );
}
