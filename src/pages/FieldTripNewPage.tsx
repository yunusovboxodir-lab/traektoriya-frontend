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
import { useT } from '../stores/langStore';

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
  { value: 'tp', labelKey: 'fieldTrips.roles.tp' },
  { value: 'sv', labelKey: 'fieldTrips.roles.sv' },
  { value: 'rm', labelKey: 'fieldTrips.roles.rm' },
  { value: 'managers', labelKey: 'fieldTrips.roleOptions.managers' },
  { value: 'tp_sv', labelKey: 'fieldTrips.roleOptions.tp_sv' },
];

export function FieldTripNewPage() {
  const navigate = useNavigate();
  const t = useT();

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
      setError(t('fieldTrips.new.valCodeMin'));
      return;
    }
    if (!startDate || !endDate) {
      setError(t('fieldTrips.new.valDatesRequired'));
      return;
    }
    if (cities.length === 0) {
      setError(t('fieldTrips.new.valCityRequired'));
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
      setError(err?.response?.data?.detail || err?.message || t('common.error'));
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate('/training-plan')}
        className="text-sm text-stone-600 hover:text-stone-900 mb-4"
      >
        {t('calendar.backToPlan')}
      </button>

      <h1 className="text-2xl font-serif text-stone-800 mb-2">
        {t('fieldTrips.new.title')}
      </h1>
      <p className="text-stone-600 mb-6">
        {t('fieldTrips.new.subtitle')}
      </p>

      <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-5">
        {/* Trip code */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            {t('fieldTrips.new.tripCode')}
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
            {t('fieldTrips.new.tripCodeHint')}
          </p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">{t('fieldTrips.new.start')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">{t('fieldTrips.new.end')}</label>
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
            {t('fieldTrips.new.cities')}
          </label>
          <input
            type="text"
            value={citiesText}
            onChange={(e) => setCitiesText(e.target.value)}
            placeholder={t('fieldTrips.new.citiesPlaceholder')}
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
            {t('fieldTrips.new.participants')}
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
                      {t(r.labelKey)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={p.count}
                  onChange={(e) => handleUpdateParticipant(idx, 'count', e.target.value)}
                  min={0}
                  className="w-24 border border-stone-300 rounded px-2 py-1.5 text-sm"
                  placeholder={t('fieldTrips.new.countPlaceholder')}
                />
                {participants.length > 1 && (
                  <button
                    onClick={() => handleRemoveParticipant(idx)}
                    className="text-stone-500 hover:text-red-600 px-2"
                    aria-label={t('common.actions.delete')}
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
            {t('fieldTrips.new.addRole')}
          </button>
        </div>

        {/* PRE/POST */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              {t('calendar.preAvgPct')}
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
              {t('calendar.postAvgPct')}
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
            {t('calendar.growthPp', {
              n: `${((parsePctInput(postAvgInput) || 0) - (parsePctInput(preAvgInput) || 0)) > 0 ? '+' : ''}${(((parsePctInput(postAvgInput) || 0) - (parsePctInput(preAvgInput) || 0)) * 100).toFixed(0)}`,
            })}
          </div>
        )}

        {/* Cost */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            {t('fieldTrips.new.cost')}
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
            {t('fieldTrips.new.transport')}
          </label>
          {transport.length > 0 && (
            <div className="space-y-2 mb-2">
              {transport.map((row, idx) => (
                <div key={idx} className="bg-stone-50 border border-stone-200 rounded p-3 space-y-2">
                  <div className="flex gap-2 items-center">
                    <select
                      value={row.type}
                      onChange={(e) => handleUpdateTransport(idx, 'type', e.target.value)}
                      className="border border-stone-300 rounded px-2 py-1 text-sm w-28"
                    >
                      <option value="train">{t('fieldTrips.transportTypes.train')}</option>
                      <option value="plane">{t('fieldTrips.transportTypes.plane')}</option>
                      <option value="car">{t('fieldTrips.transportTypes.car')}</option>
                      <option value="bus">{t('fieldTrips.transportTypes.bus')}</option>
                    </select>
                    <input
                      type="text"
                      value={row.from}
                      onChange={(e) => handleUpdateTransport(idx, 'from', e.target.value)}
                      placeholder={t('fieldTrips.new.fromPlaceholder')}
                      className="border border-stone-300 rounded px-2 py-1 text-sm flex-1"
                    />
                    <span className="text-stone-500">→</span>
                    <input
                      type="text"
                      value={row.to}
                      onChange={(e) => handleUpdateTransport(idx, 'to', e.target.value)}
                      placeholder={t('fieldTrips.new.toPlaceholder')}
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
                      value={row.ticket_no}
                      onChange={(e) => handleUpdateTransport(idx, 'ticket_no', e.target.value)}
                      placeholder={t('fieldTrips.new.ticketNoPlaceholder')}
                      className="border border-stone-300 rounded px-2 py-1 text-sm flex-1 font-mono"
                    />
                    <input
                      type="number"
                      value={row.cost_uzs ?? ''}
                      onChange={(e) =>
                        handleUpdateTransport(
                          idx, 'cost_uzs',
                          e.target.value ? parseInt(e.target.value, 10) : null,
                        )
                      }
                      placeholder={t('fieldTrips.new.amountPlaceholder')}
                      className="border border-stone-300 rounded px-2 py-1 text-sm w-32"
                    />
                    <input
                      type="date"
                      value={row.date}
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
            {t('fieldTrips.new.addTicket')}
          </button>
        </div>

        {/* Narrative */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            {t('fieldTrips.new.narrative')}
          </label>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder={t('fieldTrips.new.narrativePlaceholder')}
            rows={5}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
          />
        </div>

        {/* Next steps */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            {t('fieldTrips.nextSteps')}
          </label>
          <textarea
            value={nextSteps}
            onChange={(e) => setNextSteps(e.target.value)}
            placeholder={t('fieldTrips.new.nextStepsPlaceholder')}
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
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50"
          >
            {submitting ? t('calendar.saving') : t('fieldTrips.new.create')}
          </button>
        </div>
      </div>
    </div>
  );
}
