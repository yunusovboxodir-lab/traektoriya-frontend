/**
 * Module 15: Field Trip Detail — детали отчёта о командировке.
 *
 * Маршрут: /training-plan/field-trips/:tripId
 * Доступ: superadmin / commercial_dir / admin / trainer.
 *
 * Показывает:
 *  - Trip code + период + города
 *  - Транспорт (билеты с ценами)
 *  - Участники (по ролям)
 *  - PRE/POST с ростом п.п.
 *  - Narrative + Next steps
 *  - Связанные события (linked_event_ids)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trainingPlanApi } from '../api/trainingPlan';
import type { CalendarEvent, FieldTripReport } from '../types/trainingPlan';

const ROLE_LABELS: Record<string, string> = {
  tp: 'ТП',
  sv: 'СВ',
  rm: 'РМ',
  managers: 'Управляющие',
  tp_sv: 'ТП + СВ',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${(v * 100).toFixed(0)}%`;
}

function formatGrowth(pre: number | null, post: number | null): string {
  if (pre === null || post === null) return '—';
  const pp = (post - pre) * 100;
  const sign = pp >= 0 ? '+' : '';
  return `${sign}${pp.toFixed(0)} п.п.`;
}

function formatUZS(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('ru-RU').format(amount) + ' сум';
}

export function FieldTripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<FieldTripReport | null>(null);
  const [linkedEvents, setLinkedEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    // Загружаем все командировки и находим нужную (нет single-GET endpoint)
    trainingPlanApi
      .listFieldTrips({ limit: 500 })
      .then(async (res) => {
        const found = (res.data || []).find((t) => t.id === tripId);
        if (!found) {
          setError('Командировка не найдена');
          return;
        }
        setTrip(found);
        // Подгружаем связанные события
        if (found.linked_event_ids && found.linked_event_ids.length > 0) {
          const events: CalendarEvent[] = [];
          for (const eid of found.linked_event_ids) {
            try {
              const ev = await trainingPlanApi.getEvent(eid);
              events.push(ev.data);
            } catch {
              // skip missing
            }
          }
          setLinkedEvents(events);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tripId]);

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6 text-stone-600">Загрузка…</div>;
  }
  if (error) {
    return <div className="max-w-4xl mx-auto p-6 text-red-600">Ошибка: {error}</div>;
  }
  if (!trip) {
    return <div className="max-w-4xl mx-auto p-6">Командировка не найдена</div>;
  }

  const totalParticipants = Object.values(trip.participants_summary || {})
    .reduce((s, n) => s + (n || 0), 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => navigate('/training-plan')}
        className="text-sm text-stone-600 hover:text-stone-900 mb-4"
      >
        ← К плану обучения
      </button>

      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="px-2 py-0.5 text-xs rounded-full border bg-blue-50 text-blue-700 border-blue-200">
            Командировка
          </span>
          <span className="font-mono text-xs text-stone-600">{trip.trip_code}</span>
        </div>

        <h1 className="text-2xl font-serif text-stone-800 mb-2">
          {trip.cities.join(' · ')}
        </h1>
        <div className="text-stone-600 mb-4">
          {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
        </div>

        {/* Grid stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Stat label="Участников" value={totalParticipants.toString()} />
          <Stat
            label="PRE → POST"
            value={
              trip.pre_avg !== null && trip.post_avg !== null
                ? `${formatPct(trip.pre_avg)} → ${formatPct(trip.post_avg)}`
                : '—'
            }
          />
          <Stat
            label="Рост"
            value={formatGrowth(trip.pre_avg, trip.post_avg)}
            highlight
          />
          <Stat label="Расход" value={formatUZS(trip.total_cost_uzs)} />
        </div>

        {/* Participants breakdown */}
        {trip.participants_summary && Object.keys(trip.participants_summary).length > 0 && (
          <div className="text-sm text-stone-700">
            <span className="font-medium">Состав: </span>
            {Object.entries(trip.participants_summary).map(([role, count], i) => (
              <span key={role}>
                {i > 0 && ' · '}
                {ROLE_LABELS[role] || role} ({count})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Narrative */}
      {trip.narrative && (
        <div className="bg-white border border-stone-200 rounded-lg p-5 mb-4">
          <h2 className="font-medium text-stone-800 mb-2">Что произошло</h2>
          <p className="text-stone-700 whitespace-pre-wrap">{trip.narrative}</p>
        </div>
      )}

      {/* Next steps */}
      {trip.next_steps && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 mb-4">
          <h2 className="font-medium text-emerald-900 mb-2">Следующие шаги</h2>
          <p className="text-emerald-900 whitespace-pre-wrap">{trip.next_steps}</p>
        </div>
      )}

      {/* Transport */}
      {trip.transport && trip.transport.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-lg p-5 mb-4">
          <h2 className="font-medium text-stone-800 mb-3">Транспорт и билеты</h2>
          <div className="space-y-2">
            {trip.transport.map((t, idx) => {
              const type = (t.type as string) || 'transport';
              const from = (t.from as string) || '';
              const to = (t.to as string) || '';
              const ticket = (t.ticket_no as string) || '';
              const cost = (t.cost_uzs as number) || null;
              const date = (t.date as string) || '';
              return (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-stone-50 border border-stone-200 rounded"
                >
                  <div className="text-sm">
                    <span className="capitalize font-medium">{type}</span>
                    {from && to && (
                      <span className="text-stone-700"> · {from} → {to}</span>
                    )}
                    {date && <span className="text-stone-600 ml-2">{formatDate(date)}</span>}
                    {ticket && (
                      <div className="text-xs text-stone-600 mt-0.5 font-mono">№ {ticket}</div>
                    )}
                  </div>
                  {cost && (
                    <div className="text-sm font-medium text-stone-900">{formatUZS(cost)}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Linked events */}
      {linkedEvents.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-lg p-5">
          <h2 className="font-medium text-stone-800 mb-3">
            Связанные события ({linkedEvents.length})
          </h2>
          <div className="space-y-2">
            {linkedEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex justify-between items-start p-3 bg-stone-50 border border-stone-200 rounded"
              >
                <div className="flex-1">
                  <div className="font-medium text-stone-800 text-sm">{ev.title_ru}</div>
                  <div className="text-xs text-stone-600 mt-0.5">
                    {formatDate(ev.start_date)}
                    {ev.target_role && ` · ${ev.target_role.toUpperCase()}`}
                    {ev.location && ` · ${ev.location}`}
                  </div>
                </div>
                {ev.actual_participants_count !== null && (
                  <div className="text-right text-sm">
                    <div className="text-stone-700">{ev.actual_participants_count} чел</div>
                    {ev.growth_pct !== null && (
                      <div className="text-emerald-700 font-medium">
                        +{ev.growth_pct.toFixed(0)} п.п.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-stone-50 border border-stone-200 rounded p-3">
      <div className="text-xs text-stone-600 mb-1">{label}</div>
      <div
        className={`font-medium ${
          highlight ? 'text-emerald-700 text-lg' : 'text-stone-800'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
