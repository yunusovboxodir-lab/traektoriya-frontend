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
import { useT } from '../stores/langStore';
import type { CalendarEvent, FieldTripReport } from '../types/trainingPlan';
import { SkeletonCard } from '@/components/ui';

type TFn = ReturnType<typeof useT>;

const ROLE_LABEL_KEYS: Record<string, string> = {
  tp: 'fieldTrips.roles.tp',
  sv: 'fieldTrips.roles.sv',
  rm: 'fieldTrips.roles.rm',
  managers: 'fieldTrips.roles.managers',
  tp_sv: 'fieldTrips.roles.tp_sv',
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

function formatGrowth(pre: number | null, post: number | null, t: TFn): string {
  if (pre === null || post === null) return '—';
  const pp = (post - pre) * 100;
  const sign = pp >= 0 ? '+' : '';
  return t('calendar.pp', { n: `${sign}${pp.toFixed(0)}` });
}

function formatUZS(amount: number | null | undefined, t: TFn): string {
  if (amount === null || amount === undefined) return '—';
  return t('fieldTrips.uzs', { n: new Intl.NumberFormat('ru-RU').format(amount) });
}

export function FieldTripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const t = useT();
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
        const found = (res.data || []).find((item) => item.id === tripId);
        if (!found) {
          setError(t('fieldTrips.detail.notFound'));
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
  }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6"><SkeletonCard lines={4} /></div>;
  }
  if (error) {
    return <div className="max-w-4xl mx-auto p-6 text-red-600">{t('common.error')}: {error}</div>;
  }
  if (!trip) {
    return <div className="max-w-4xl mx-auto p-6">{t('fieldTrips.detail.notFound')}</div>;
  }

  const totalParticipants = Object.values(trip.participants_summary || {})
    .reduce((s, n) => s + (n || 0), 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => navigate('/training-plan')}
        className="text-sm text-stone-600 hover:text-stone-900 mb-4"
      >
        {t('calendar.backToPlan')}
      </button>

      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="px-2 py-0.5 text-xs rounded-full border bg-blue-50 text-blue-700 border-blue-200">
            {t('fieldTrips.detail.badge')}
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
          <Stat label={t('calendar.detail.participants')} value={totalParticipants.toString()} />
          <Stat
            label="PRE → POST"
            value={
              trip.pre_avg !== null && trip.post_avg !== null
                ? `${formatPct(trip.pre_avg)} → ${formatPct(trip.post_avg)}`
                : '—'
            }
          />
          <Stat
            label={t('calendar.detail.growth')}
            value={formatGrowth(trip.pre_avg, trip.post_avg, t)}
            highlight
          />
          <Stat label={t('fieldTrips.detail.cost')} value={formatUZS(trip.total_cost_uzs, t)} />
        </div>

        {/* Participants breakdown */}
        {trip.participants_summary && Object.keys(trip.participants_summary).length > 0 && (
          <div className="text-sm text-stone-700">
            <span className="font-medium">{t('fieldTrips.detail.composition')}: </span>
            {Object.entries(trip.participants_summary).map(([role, count], i) => (
              <span key={role}>
                {i > 0 && ' · '}
                {ROLE_LABEL_KEYS[role] ? t(ROLE_LABEL_KEYS[role]) : role} ({count})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Narrative */}
      {trip.narrative && (
        <div className="bg-white border border-stone-200 rounded-lg p-5 mb-4">
          <h2 className="font-medium text-stone-800 mb-2">{t('fieldTrips.detail.narrativeTitle')}</h2>
          <p className="text-stone-700 whitespace-pre-wrap">{trip.narrative}</p>
        </div>
      )}

      {/* Next steps */}
      {trip.next_steps && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 mb-4">
          <h2 className="font-medium text-emerald-900 mb-2">{t('fieldTrips.nextSteps')}</h2>
          <p className="text-emerald-900 whitespace-pre-wrap">{trip.next_steps}</p>
        </div>
      )}

      {/* Transport */}
      {trip.transport && trip.transport.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-lg p-5 mb-4">
          <h2 className="font-medium text-stone-800 mb-3">{t('fieldTrips.detail.transportTitle')}</h2>
          <div className="space-y-2">
            {trip.transport.map((row, idx) => {
              const type = (row.type as string) || 'transport';
              const from = (row.from as string) || '';
              const to = (row.to as string) || '';
              const ticket = (row.ticket_no as string) || '';
              const cost = (row.cost_uzs as number) || null;
              const date = (row.date as string) || '';
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
                      <div className="text-xs text-stone-600 mt-0.5 font-mono">{t('fieldTrips.detail.ticketNo', { n: ticket })}</div>
                    )}
                  </div>
                  {cost && (
                    <div className="text-sm font-medium text-stone-900">{formatUZS(cost, t)}</div>
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
            {t('fieldTrips.detail.linkedEvents', { n: linkedEvents.length })}
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
                    <div className="text-stone-700">{t('fieldTrips.detail.people', { n: ev.actual_participants_count })}</div>
                    {ev.growth_pct !== null && (
                      <div className="text-emerald-700 font-medium">
                        {t('calendar.pp', { n: `+${ev.growth_pct.toFixed(0)}` })}
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
