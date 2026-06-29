/**
 * Module 15: Smart Training Plan — главная страница.
 *
 * Три вкладки:
 *  - Календарь: события 2026-2027 (план + факт), таблица Неделя × Город × Формат
 *  - Заявки: свои + ожидающие моего решения
 *  - Командировки: история выездов тренера
 *
 * Доступ:
 *  - Все аутентифицированные видят календарь
 *  - sales_rep — только свои события
 *  - supervisor / regional_manager — могут подать заявку
 *  - commercial_dir / admin / superadmin — управляют событиями и утверждают
 *
 * UX-перестройка 2026-05-13: переход на dark TacticalLayout, bilingual (RU/UZ),
 * KPI cards в шапке, calendar grid «Неделя × Город × Формат», chip-фильтры.
 */
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingPlanApi } from '../api/trainingPlan';
import { useAuthStore } from '../stores/authStore';
import { useLangStore } from '../stores/langStore';
import { pickLang } from '../utils/pickLang';
import type {
  CalendarEvent,
  EventStatus,
  EventType,
  FieldTripReport,
  TargetRole,
  TrainingRequest,
} from '../types/trainingPlan';
import { SkeletonCard, SkeletonTableRow } from '@/components/ui';

type Tab = 'calendar' | 'requests' | 'field-trips';
type Lang = 'ru' | 'uz';

const ROLE_LABELS_RU: Record<string, string> = {
  sales_rep: 'ТП',
  supervisor: 'СВ',
  regional_manager: 'РМ',
  commercial_dir: 'КД',
  all: 'Все',
};
const ROLE_LABELS_UZ: Record<string, string> = {
  sales_rep: 'TP',
  supervisor: 'SV',
  regional_manager: 'RM',
  commercial_dir: 'TD',
  all: 'Hammasi',
};
function roleLabel(role: string, lang: Lang): string {
  return (lang === 'uz' ? ROLE_LABELS_UZ : ROLE_LABELS_RU)[role] ?? role;
}

const EVENT_TYPE_LABELS_RU: Record<EventType, string> = {
  offline_training: 'Офлайн',
  online_block: 'Онлайн',
  pulse_check: 'Pulse-срез',
  attestation: 'Аттестация',
  championship: 'Кубок',
  field_trip: 'Командировка',
};
const EVENT_TYPE_LABELS_UZ: Record<EventType, string> = {
  offline_training: 'Oflayn',
  online_block: 'Onlayn',
  pulse_check: 'Pulse-kesim',
  attestation: 'Attestatsiya',
  championship: 'Kubok',
  field_trip: 'Xizmat safari',
};
function eventTypeLabel(t: EventType, lang: Lang): string {
  return (lang === 'uz' ? EVENT_TYPE_LABELS_UZ : EVENT_TYPE_LABELS_RU)[t] ?? t;
}

// Тип каналу из xlsx: онлайн / офлайн / гибрид (для chip-фильтра)
type ChannelFilter = 'all' | 'online' | 'offline' | 'hybrid';
function eventChannel(et: EventType): 'online' | 'offline' | 'hybrid' {
  if (et === 'online_block' || et === 'pulse_check') return 'online';
  if (et === 'attestation' || et === 'championship') return 'hybrid';
  return 'offline'; // offline_training, field_trip
}

const STATUS_LABELS_RU: Record<EventStatus, string> = {
  planned: 'Запланировано',
  confirmed: 'Подтверждено',
  in_progress: 'Идёт',
  completed: 'Завершено',
  cancelled: 'Отменено',
  rescheduled: 'Перенесено',
};
const STATUS_LABELS_UZ: Record<EventStatus, string> = {
  planned: "Rejada",
  confirmed: 'Tasdiqlandi',
  in_progress: 'Ketmoqda',
  completed: 'Yakunlandi',
  cancelled: 'Bekor qilindi',
  rescheduled: "Ko'chirildi",
};
function statusLabel(s: EventStatus, lang: Lang): string {
  return (lang === 'uz' ? STATUS_LABELS_UZ : STATUS_LABELS_RU)[s] ?? s;
}

// Иконки + инлайн-стили для бейджей статусов (через CSS-переменные, theme-aware)
const STATUS_BADGE_STYLE: Record<EventStatus, React.CSSProperties> = {
  planned:     { background: 'var(--info-bg)',    color: 'var(--info)',    border: '1px solid var(--info)' },
  confirmed:   { background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)' },
  in_progress: { background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning)' },
  completed:   { background: 'var(--bg-overlay)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
  cancelled:   { background: 'var(--danger-bg)',  color: 'var(--danger)',  border: '1px solid var(--danger)' },
  rescheduled: { background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning)' },
};
const STATUS_ICON: Record<EventStatus, string> = {
  planned: 'К', confirmed: 'П', in_progress: 'И', completed: 'З', cancelled: 'О', rescheduled: 'Пр',
};

// Канальные цвета — семантические (синий/оранжевый/фиолетовый), работают в обоих темах
// border-l оставляем через Tailwind (цвет левой полосы, не текст — контраст не требуется)
const CHANNEL_COLORS: Record<'online' | 'offline' | 'hybrid', { border: string; badgeStyle: React.CSSProperties }> = {
  online:  { border: 'border-l-blue-500',   badgeStyle: { background: 'var(--info-bg)',    color: 'var(--info)' } },
  offline: { border: 'border-l-orange-500', badgeStyle: { background: 'var(--warning-bg)', color: 'var(--warning)' } },
  hybrid:  { border: 'border-l-purple-500', badgeStyle: { background: 'var(--color-tp-bg)', color: 'var(--color-tp)' } },
};

function formatDate(iso: string | null, lang: Lang): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
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

function isoWeek(dateIso: string): number {
  // ISO week number (1-53)
  const d = new Date(dateIso);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ---------------------------------------------------------------------------
// TrainingPlanPage (root)
// ---------------------------------------------------------------------------

export function TrainingPlanPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const lang = useLangStore((s) => s.lang);
  const [tab, setTab] = useState<Tab>('calendar');

  const canManage = !!(user && ['superadmin', 'admin', 'commercial_dir', 'trainer'].includes(user.role));
  const canRequest = !!(user && ['supervisor', 'regional_manager', 'commercial_dir'].includes(user.role));

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <div role="heading" aria-level={1} className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {lang === 'uz' ? "O'qish rejasi" : 'План обучения'}
          </div>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {lang === 'uz'
              ? '2026-2027 yillik kalendar, arizalar, xizmat safarlari'
              : 'Календарь 2026-2027, заявки на тренинги, командировки'}
          </p>
        </div>
        <div className="flex gap-2">
          {canRequest && (
            <button
              onClick={() => navigate('/training-plan/requests/new')}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--warning)', color: 'var(--text-inverse)' }}
            >
              {lang === 'uz' ? 'Ariza berish' : 'Подать заявку'}
            </button>
          )}
          {canManage && (
            <button
              onClick={() => navigate('/training-plan/calendar/new')}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', background: 'var(--bg-overlay)' }}
            >
              {lang === 'uz' ? "Hodisa yaratish" : 'Создать событие'}
            </button>
          )}
          {canManage && tab === 'field-trips' && (
            <button
              onClick={() => navigate('/training-plan/field-trips/new')}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: 'var(--success)', color: 'var(--text-inverse)' }}
            >
              {lang === 'uz' ? '+ Safar hisoboti' : '+ Отчёт о командировке'}
            </button>
          )}
          <button
            onClick={() => navigate('/case-studio')}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ border: '1px solid var(--color-tp-border)', color: 'var(--color-tp)', background: 'var(--color-tp-bg)' }}
          >
            {lang === 'uz' ? 'Keyslar bazasi' : 'Кейсотека'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-6" style={{ borderBottom: '1px solid var(--border)' }}>
        {(
          [
            { key: 'calendar' as Tab, ru: 'Календарь', uz: 'Kalendar' },
            { key: 'requests' as Tab, ru: 'Заявки', uz: 'Arizalar' },
            { key: 'field-trips' as Tab, ru: 'Командировки', uz: 'Safarlar' },
          ]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="pb-3 -mb-px text-sm font-medium border-b-2 transition-colors"
            style={
              tab === t.key
                ? { borderColor: 'var(--warning)', color: 'var(--text-primary)' }
                : { borderColor: 'transparent', color: 'var(--text-muted)' }
            }
          >
            {lang === 'uz' ? t.uz : t.ru}
          </button>
        ))}
      </div>

      {tab === 'calendar' && <CalendarTab lang={lang} />}
      {tab === 'requests' && <RequestsTab canApprove={canManage} lang={lang} />}
      {tab === 'field-trips' && <FieldTripsTab lang={lang} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Cards (для Calendar tab)
// ---------------------------------------------------------------------------

function KPICards({ events, lang }: { events: CalendarEvent[]; lang: Lang }) {
  const total = events.length;
  const byChannel = useMemo(() => {
    const r = { online: 0, offline: 0, hybrid: 0 };
    for (const e of events) r[eventChannel(e.event_type)]++;
    return r;
  }, [events]);

  const completed = events.filter((e) => e.status === 'completed' && e.pre_avg_score != null && e.post_avg_score != null);
  const avgPre = completed.length
    ? completed.reduce((s, e) => s + (e.pre_avg_score ?? 0), 0) / completed.length
    : null;
  const avgPost = completed.length
    ? completed.reduce((s, e) => s + (e.post_avg_score ?? 0), 0) / completed.length
    : null;
  const avgGrowth = completed.length
    ? completed.reduce((s, e) => s + (e.growth_pct ?? 0), 0) / completed.length
    : null;

  const cards = [
    { label: lang === 'uz' ? "Hammasi" : 'Всего', value: total.toString(), border: 'border-l-zinc-500' },
    { label: 'Online', value: byChannel.online.toString(), border: 'border-l-blue-500' },
    { label: lang === 'uz' ? 'Oflayn' : 'Offline', value: byChannel.offline.toString(), border: 'border-l-orange-500' },
    { label: lang === 'uz' ? 'Gibrid' : 'Hybrid', value: byChannel.hybrid.toString(), border: 'border-l-purple-500' },
    { label: 'PRE', value: avgPre != null ? formatPct(avgPre) : '—', border: 'border-l-zinc-500' },
    { label: 'POST', value: avgPost != null ? formatPct(avgPost) : '—', border: 'border-l-zinc-500' },
    {
      label: lang === 'uz' ? "O'sish" : 'Рост',
      value: avgGrowth != null ? `${avgGrowth >= 0 ? '+' : ''}${avgGrowth.toFixed(0)} п.п.` : '—',
      border: 'border-l-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`${c.border} border-l-4 rounded-lg p-3`}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="text-[10px] uppercase tracking-wider font-mono" style={{ color: 'var(--text-muted)' }}>{c.label}</div>
          <div className="text-2xl font-bold font-mono mt-1" style={{ color: 'var(--text-primary)' }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar Tab
// ---------------------------------------------------------------------------

function CalendarTab({ lang }: { lang: Lang }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<ChannelFilter>('all');
  const [filterRole, setFilterRole] = useState<TargetRole | ''>('');
  const [filterStatus, setFilterStatus] = useState<EventStatus | ''>('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    trainingPlanApi
      .listEvents({
        target_role: filterRole || undefined,
        status: filterStatus || undefined,
        limit: 300,
      })
      .then((res) => {
        if (!cancelled) {
          setEvents(res.data || []);
          setError(null);
        }
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filterRole, filterStatus]);

  const filtered = useMemo(() => {
    if (channel === 'all') return events;
    return events.filter((e) => eventChannel(e.event_type) === channel);
  }, [events, channel]);

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of filtered) {
      const month = e.start_date.slice(0, 7);
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(e);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.start_date.localeCompare(b.start_date));
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div>
      <KPICards events={events} lang={lang} />

      {/* Chip-фильтры */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-1.5 items-center">
          <span className="text-xs uppercase tracking-wider font-mono mr-1" style={{ color: 'var(--text-muted)' }}>
            {lang === 'uz' ? 'Kanal' : 'Канал'}:
          </span>
          {(['all', 'online', 'offline', 'hybrid'] as ChannelFilter[]).map((c) => {
            const labels: Record<ChannelFilter, string> = {
              all: lang === 'uz' ? 'Hammasi' : 'Все',
              online: 'Online',
              offline: lang === 'uz' ? 'Oflayn' : 'Offline',
              hybrid: lang === 'uz' ? 'Gibrid' : 'Hybrid',
            };
            const active = channel === c;
            return (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className="px-3 py-1 text-xs rounded-full border transition-colors"
                style={
                  active
                    ? { background: 'var(--warning)', color: 'var(--text-inverse)', borderColor: 'var(--warning)' }
                    : { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                }
              >
                {labels[c]}
              </button>
            );
          })}
        </div>

        <div className="flex gap-1.5 items-center">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono mr-1">
            {lang === 'uz' ? 'Rol' : 'Роль'}:
          </span>
          {/* QW-5 (Sprint 0, 2026-05-16): убран literal 'all' — это была вторая
              кнопка «Все» подряд, путала пользователей. Пустая строка '' = «не
              фильтровать» (бэкенд сам матчит target_role IN [role, 'all']). См.
              внутренний UI/UX-аудит, баг S2. */}
          {(['', 'sales_rep', 'supervisor', 'regional_manager', 'commercial_dir'] as const).map((r) => {
            const active = filterRole === r;
            const label =
              r === '' ? (lang === 'uz' ? 'Hammasi' : 'Все') : roleLabel(r, lang);
            return (
              <button
                key={r || 'none'}
                onClick={() => setFilterRole(r as TargetRole | '')}
                className="px-3 py-1 text-xs rounded-full border transition-colors"
                style={
                  active
                    ? { background: 'var(--warning)', color: 'var(--text-inverse)', borderColor: 'var(--warning)', fontWeight: 600 }
                    : { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-1.5 items-center">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono mr-1">
            {lang === 'uz' ? 'Status' : 'Статус'}:
          </span>
          {(['', 'planned', 'confirmed', 'in_progress', 'completed'] as const).map((s) => {
            const active = filterStatus === s;
            const label = s === '' ? (lang === 'uz' ? 'Hammasi' : 'Все') : statusLabel(s, lang);
            return (
              <button
                key={s || 'none'}
                onClick={() => setFilterStatus(s as EventStatus | '')}
                className="px-3 py-1 text-xs rounded-full border transition-colors"
                style={
                  active
                    ? { background: 'var(--warning)', color: 'var(--text-inverse)', borderColor: 'var(--warning)', fontWeight: 600 }
                    : { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="ml-auto text-sm self-center" style={{ color: 'var(--text-muted)' }}>
          {lang === 'uz' ? "Topildi" : 'Найдено'}: <b style={{ color: 'var(--text-primary)' }}>{filtered.length}</b>
        </div>
      </div>

      {loading && (
        <div className="space-y-1 py-4">
          <SkeletonTableRow cells={6} />
          <SkeletonTableRow cells={6} />
          <SkeletonTableRow cells={6} />
          <SkeletonTableRow cells={6} />
          <SkeletonTableRow cells={6} />
        </div>
      )}
      {error && (
        <div className="font-mono uppercase tracking-widest text-sm py-4" style={{ color: 'var(--danger)' }}>
          {lang === 'uz' ? 'XATO' : 'ОШИБКА'}: {error}
        </div>
      )}

      {/* Calendar grid: Неделя × Дата × Канал × Роль × Тема × Статус */}
      {!loading && grouped.length > 0 && (
        <div className="rounded-lg overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
          <div style={{ minWidth: 700 }}>
          {/* Header */}
          <div className="grid grid-cols-[60px_110px_120px_90px_1fr_140px] gap-px text-[10px] uppercase tracking-wider font-mono" style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>
            <div className="p-2 text-center" style={{ background: 'var(--bg-elevated)' }}>{lang === 'uz' ? 'Hafta' : 'Нед.'}</div>
            <div className="p-2" style={{ background: 'var(--bg-elevated)' }}>{lang === 'uz' ? 'Sana' : 'Дата'}</div>
            <div className="p-2" style={{ background: 'var(--bg-elevated)' }}>{lang === 'uz' ? 'Kanal' : 'Канал'}</div>
            <div className="p-2" style={{ background: 'var(--bg-elevated)' }}>{lang === 'uz' ? 'Rol' : 'Роль'}</div>
            <div className="p-2" style={{ background: 'var(--bg-elevated)' }}>{lang === 'uz' ? 'Mavzu' : 'Тема'}</div>
            <div className="p-2" style={{ background: 'var(--bg-elevated)' }}>{lang === 'uz' ? 'Status' : 'Статус'}</div>
          </div>

          {grouped.map(([month, list]) => {
            const monthLabel = new Date(month + '-01').toLocaleDateString(
              lang === 'uz' ? 'uz-UZ' : 'ru-RU',
              { month: 'long', year: 'numeric' },
            );
            return (
              <div key={month}>
                {/* Month separator */}
                <div className="px-4 py-2 font-semibold text-sm font-mono uppercase tracking-wider" style={{ background: 'var(--bg-overlay)', color: 'var(--text-primary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                  {monthLabel}
                </div>
                {list.map((e) => {
                  const ch = eventChannel(e.event_type);
                  const chCol = CHANNEL_COLORS[ch];
                  const stStyle = STATUS_BADGE_STYLE[e.status];
                  const stIcon = STATUS_ICON[e.status];
                  return (
                    <button
                      key={e.id}
                      onClick={() => navigate(`/training-plan/calendar/${e.id}`)}
                      className={`w-full grid grid-cols-[60px_110px_120px_90px_1fr_140px] gap-px text-left transition-colors border-l-4 ${chCol.border}`}
                      style={{ background: 'var(--bg-card)' }}
                      onMouseEnter={(ev) => { (ev.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; }}
                      onMouseLeave={(ev) => { (ev.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)'; }}
                    >
                      <div className="p-2.5 text-center text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                        W{isoWeek(e.start_date)}
                      </div>
                      <div className="p-2.5 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(e.start_date, lang)}
                        {e.end_date && e.end_date !== e.start_date && (
                          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>— {formatDate(e.end_date, lang)}</div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase" style={chCol.badgeStyle}>
                          {eventTypeLabel(e.event_type, lang)}
                        </span>
                      </div>
                      <div className="p-2.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {roleLabel(e.target_role, lang)}
                      </div>
                      <div className="p-2.5">
                        <div className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
                          {pickLang(e, lang, 'title')}
                        </div>
                        {(e.location || e.target_region) && (
                          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {[e.location, e.target_region].filter(Boolean).join(' · ')}
                          </div>
                        )}
                        {e.status === 'completed' && e.pre_avg_score != null && e.post_avg_score != null && (
                          <div className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--success)' }}>
                            PRE {formatPct(e.pre_avg_score)} → POST {formatPct(e.post_avg_score)}
                            {e.growth_pct != null && ` (+${e.growth_pct.toFixed(0)} п.п.)`}
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={stStyle}>
                          {stIcon} {statusLabel(e.status, lang)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
          </div>
        </div>
      )}

      {!loading && !grouped.length && (
        <div className="font-mono uppercase tracking-widest text-sm py-12 text-center rounded-lg" style={{ color: 'var(--text-muted)', border: '1px dashed var(--border)' }}>
          {lang === 'uz' ? "Hodisalar topilmadi" : 'Событий не найдено'}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Requests Tab
// ---------------------------------------------------------------------------

const REQUEST_STATUS_LABELS_RU: Record<string, string> = {
  draft: 'Черновик',
  pending: 'На рассмотрении',
  approved: 'Утверждено',
  rejected: 'Отклонено',
  scheduled: 'В календаре',
  cancelled: 'Отменено',
};
const REQUEST_STATUS_LABELS_UZ: Record<string, string> = {
  draft: "Qoralama",
  pending: "Ko'rib chiqilmoqda",
  approved: 'Tasdiqlandi',
  rejected: 'Rad etildi',
  scheduled: 'Kalendarda',
  cancelled: 'Bekor',
};
function requestStatusLabel(s: string, lang: Lang): string {
  return (lang === 'uz' ? REQUEST_STATUS_LABELS_UZ : REQUEST_STATUS_LABELS_RU)[s] ?? s;
}

function RequestsTab({ canApprove, lang }: { canApprove: boolean; lang: Lang }) {
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'pending' | 'approved' | 'rejected' | 'scheduled'>('all');

  const reload = async () => {
    setLoading(true);
    try {
      const res = await trainingPlanApi.listRequests({
        status: filter === 'all' ? undefined : filter,
        limit: 100,
      });
      setRequests(res.data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const FILTERS: Array<{ key: typeof filter; ru: string; uz: string }> = [
    { key: 'all', ru: 'Все', uz: 'Hammasi' },
    { key: 'draft', ru: 'Черновик', uz: "Qoralama" },
    { key: 'pending', ru: 'Ожидают', uz: "Kutmoqda" },
    { key: 'approved', ru: 'Утверждены', uz: 'Tasdiqlandi' },
    { key: 'scheduled', ru: 'В календаре', uz: 'Kalendarda' },
    { key: 'rejected', ru: 'Отклонены', uz: 'Rad etilgan' },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-3 py-1.5 text-xs rounded-full border transition-colors font-medium"
            style={
              filter === f.key
                ? { background: 'var(--warning)', color: 'var(--text-inverse)', borderColor: 'var(--warning)' }
                : { background: 'var(--bg-overlay)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
            }
          >
            {lang === 'uz' ? f.uz : f.ru}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3 py-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      )}
      {error && <div className="text-red-400">Error: {error}</div>}

      <div className="space-y-3">
        {requests.map((r) => (
          <RequestCard key={r.id} request={r} onChange={reload} canApprove={canApprove} lang={lang} />
        ))}
        {!loading && !requests.length && (
          <div className="font-mono uppercase tracking-widest text-sm py-12 text-center rounded-lg" style={{ color: 'var(--text-muted)', border: '1px dashed var(--border)' }}>
            {lang === 'uz' ? 'Arizalar yo\'q' : 'Заявок нет'}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  onChange,
  canApprove,
  lang,
}: {
  request: TrainingRequest;
  onChange: () => void;
  canApprove: boolean;
  lang: Lang;
}) {
  const [busy, setBusy] = useState(false);

  const decide = async (decision: 'approved' | 'rejected') => {
    if (busy) return;
    const comment = window.prompt(
      decision === 'approved'
        ? lang === 'uz' ? "Tasdiqlash izohi (ixtiyoriy)" : 'Комментарий к утверждению (опц.)'
        : lang === 'uz' ? "Rad etish sababi" : 'Причина отклонения',
      '',
    );
    if (decision === 'rejected' && !comment) return;
    setBusy(true);
    try {
      const fn = decision === 'approved' ? trainingPlanApi.approveRequest : trainingPlanApi.rejectRequest;
      await fn(request.id, { decision, comment });
      onChange();
    } catch (e) {
      alert(`${lang === 'uz' ? 'Xato' : 'Ошибка'}: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {requestStatusLabel(request.status, lang)}
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {roleLabel(request.requester_role, lang)}
            </span>
            {request.urgency !== 'normal' && (
              <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                {request.urgency}
              </span>
            )}
          </div>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {request.custom_topic ?? request.program_id ?? (lang === 'uz' ? 'Trening' : 'Тренинг')}
          </h3>
          <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {lang === 'uz' ? 'Maqsad' : 'Цель'}: {roleLabel(request.target_role, lang)}
            {request.target_region ? ` · ${request.target_region}` : ''}
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{request.reason}</p>

          {request.pulse_snapshot && (
            <div className="mt-3 p-2 rounded text-xs" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Pulse: </span>
              {lang === 'uz' ? 'oʻzi' : 'своё'} {formatPct(request.pulse_snapshot.self_pulse)},{' '}
              {lang === 'uz' ? 'jamoa' : 'команда'} {formatPct(request.pulse_snapshot.team_avg_pulse)}
              {request.pulse_snapshot.team_size != null
                ? ` (${request.pulse_snapshot.team_size} ${lang === 'uz' ? 'kishi' : 'чел.'})`
                : ''}
              {request.pulse_snapshot.override_used && (
                <span className="ml-2" style={{ color: 'var(--danger)' }}>override</span>
              )}
            </div>
          )}
        </div>
        {canApprove && request.status === 'pending' && (
          <div className="flex flex-col gap-2">
            <button
              disabled={busy}
              onClick={() => decide('approved')}
              className="px-3 py-1.5 text-xs rounded disabled:opacity-50 font-medium"
              style={{ background: 'var(--success)', color: 'var(--text-inverse)' }}
            >
              {lang === 'uz' ? 'Tasdiqlash' : 'Утвердить'}
            </button>
            <button
              disabled={busy}
              onClick={() => decide('rejected')}
              className="px-3 py-1.5 text-xs rounded disabled:opacity-50 font-medium"
              style={{ background: 'var(--danger)', color: 'var(--text-inverse)' }}
            >
              {lang === 'uz' ? 'Rad etish' : 'Отклонить'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field Trips Tab
// ---------------------------------------------------------------------------

function FieldTripsTab({ lang }: { lang: Lang }) {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<FieldTripReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trainingPlanApi
      .listFieldTrips({ limit: 100 })
      .then((res) => {
        setTrips(res.data || []);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="space-y-3 py-4">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    );
  if (error) return <div className="text-red-400">Error: {error}</div>;

  const totalParticipants = trips.reduce((sum, t) => {
    const ps = Object.values(t.participants_summary || {});
    return sum + ps.reduce((s, n) => s + (n || 0), 0);
  }, 0);
  const tripsWithGrowth = trips.filter((t) => t.pre_avg !== null && t.post_avg !== null);
  const avgGrowth = tripsWithGrowth.length
    ? tripsWithGrowth.reduce((s, t) => s + ((t.post_avg ?? 0) - (t.pre_avg ?? 0)) * 100, 0) /
      tripsWithGrowth.length
    : null;
  const totalCost = trips.reduce((sum, t) => sum + (t.total_cost_uzs || 0), 0);

  return (
    <div>
      {trips.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <AggregateStat
            label={lang === 'uz' ? "Safarlar" : 'Командировок'}
            value={trips.length.toString()}
          />
          <AggregateStat
            label={lang === 'uz' ? "Hammasi" : 'Всего участников'}
            value={totalParticipants.toString()}
          />
          <AggregateStat
            label={lang === 'uz' ? "O'rtacha o'sish" : 'Средний рост'}
            value={
              avgGrowth !== null
                ? `${avgGrowth >= 0 ? '+' : ''}${avgGrowth.toFixed(0)} п.п.`
                : '—'
            }
            highlight
          />
          <AggregateStat
            label={lang === 'uz' ? "Xarajatlar" : 'Расходы'}
            value={totalCost > 0 ? new Intl.NumberFormat('ru-RU').format(totalCost) + ' сум' : '—'}
          />
        </div>
      )}

      <div className="space-y-3">
        {trips.map((t) => {
          const totalP = Object.values(t.participants_summary || {}).reduce(
            (s, n) => s + (n || 0),
            0,
          );
          const growthPp =
            t.pre_avg !== null && t.post_avg !== null ? (t.post_avg - t.pre_avg) * 100 : null;
          return (
            <button
              key={t.id}
              onClick={() => navigate(`/training-plan/field-trips/${t.id}`)}
              className="w-full text-left rounded-lg p-4 transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onMouseEnter={(ev) => { (ev.currentTarget as HTMLButtonElement).style.borderColor = 'var(--warning)'; (ev.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(ev) => { (ev.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (ev.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)'; }}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t.cities.join(' · ')}</h3>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{t.trip_code}</span>
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(t.start_date, lang)} – {formatDate(t.end_date, lang)}
                    {totalP > 0 && (
                      <span className="ml-2">
                        · {totalP} {lang === 'uz' ? 'kishi' : 'чел'}
                      </span>
                    )}
                  </div>
                </div>
                {t.pre_avg !== null && t.post_avg !== null && (
                  <div className="text-right text-sm">
                    <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>PRE → POST</div>
                    <div className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {formatPct(t.pre_avg)} → {formatPct(t.post_avg)}
                    </div>
                    {growthPp !== null && (
                      <div
                        className="text-xs font-medium mt-0.5"
                        style={{ color: growthPp >= 0 ? 'var(--success)' : 'var(--danger)' }}
                      >
                        {growthPp >= 0 ? '+' : ''}
                        {growthPp.toFixed(0)} п.п.
                      </div>
                    )}
                  </div>
                )}
              </div>
              {t.narrative && (
                <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{t.narrative}</p>
              )}
            </button>
          );
        })}
        {!trips.length && (
          <div className="font-mono uppercase tracking-widest text-sm py-12 text-center rounded-lg" style={{ color: 'var(--text-muted)', border: '1px dashed var(--border)' }}>
            {lang === 'uz'
              ? "Hali safarlar yo'q"
              : 'Командировок ещё нет. Создай первый отчёт через кнопку «+ Отчёт о командировке».'}
          </div>
        )}
      </div>
    </div>
  );
}

function AggregateStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] uppercase tracking-wider font-mono mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div
        className="font-bold font-mono"
        style={{
          color: highlight ? 'var(--success)' : 'var(--text-primary)',
          fontSize: highlight ? '1.25rem' : '1.125rem',
        }}
      >
        {value}
      </div>
    </div>
  );
}
