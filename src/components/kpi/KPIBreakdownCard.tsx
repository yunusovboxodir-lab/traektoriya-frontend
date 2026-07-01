/**
 * KPIBreakdownCard — персональная карточка разбивки KPI (Scoring v2.0, Этап 2).
 *
 * Показывает 4 компонента KPI из breakdown.components:
 *   Продажи (40%) · Полевое исполнение (30%) · Обучение (20%) · Дисциплина (10%)
 *
 * Пометка «предварительно» (прокси) — на Sales и Discipline, пока нет CRM.
 * Fallback: если breakdown отсутствует — показывает по старым колонкам (ai/lms/crm).
 *
 * Бизнес-процесс: П3 (Scoring v2.0, Этап 2).
 */
import { useEffect, useState } from 'react';
import { kpiApi, type KPIRecord, type KPIBreakdown } from '../../api/kpi';
import { useT } from '../../stores/langStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(v: number): string {
  if (v >= 80) return 'var(--success, #4ade80)';
  if (v >= 60) return 'var(--warning, #fbbf24)';
  return 'var(--danger, #ef4444)';
}

// ---------------------------------------------------------------------------
// Типы
// ---------------------------------------------------------------------------

interface ComponentRow {
  key: keyof KPIBreakdown['components'];
  label: string;
  weight: string;
  isProxy?: boolean;
}

const COMPONENT_ROWS: ComponentRow[] = [
  { key: 'sales',     label: 'Продажи',              weight: '40%', isProxy: true  },
  { key: 'execution', label: 'Полевое исполнение',   weight: '30%', isProxy: false },
  { key: 'learning',  label: 'Обучение',              weight: '20%', isProxy: false },
  { key: 'discipline',label: 'Дисциплина',            weight: '10%', isProxy: true  },
];

// ---------------------------------------------------------------------------
// Sub: одна строка компонента
// ---------------------------------------------------------------------------

function ComponentRow({
  label,
  weight,
  value,
  contribution,
  isProxy,
  proxyActive,
}: {
  label: string;
  weight: string;
  value: number;
  contribution?: number;
  isProxy?: boolean;
  proxyActive?: boolean;
}) {
  const showProxy = isProxy && proxyActive;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.75 }}>{weight}</span>
          {showProxy && (
            <span
              title="Предварительное значение — прокси до интеграции CRM (SalesDoctor)"
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.04em',
                padding: '1px 5px',
                borderRadius: 4,
                border: '1px solid var(--warning, #fbbf24)',
                color: 'var(--warning, #fbbf24)',
                opacity: 0.85,
                whiteSpace: 'nowrap',
              }}
            >
              пред.
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor(value) }}>
            {value.toFixed(1)}
          </span>
          {contribution !== undefined && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              (+{contribution.toFixed(1)})
            </span>
          )}
        </div>
      </div>
      {/* Прогресс-бар */}
      <div
        style={{
          height: 5,
          borderRadius: 3,
          background: 'var(--bg-overlay, rgba(255,255,255,0.06))',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(value, 100)}%`,
            background: scoreColor(value),
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fallback view: старые колонки (до Этапа 2)
// ---------------------------------------------------------------------------

function FallbackView({ record }: { record: KPIRecord }) {
  const legacy = [
    { label: 'Продажи (прокси)',     value: record.ai_score,  isProxy: true  },
    { label: 'Обучение',             value: record.lms_score, isProxy: false },
    { label: 'Исполнение (прокси)',  value: record.crm_score, isProxy: true  },
  ];
  return (
    <>
      <div
        style={{
          fontSize: 11,
          color: 'var(--warning, #fbbf24)',
          marginBottom: 10,
          padding: '5px 8px',
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 6,
        }}
      >
        Детализация по старой формуле (Этап 1). Новый расчёт появится после пересчёта KPI.
      </div>
      {legacy.map((row) => (
        <ComponentRow
          key={row.label}
          label={row.label}
          weight=""
          value={row.value}
          isProxy={row.isProxy}
          proxyActive={row.isProxy}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Skeleton() {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        padding: 16,
      }}
    >
      <div style={{ height: 14, width: 140, background: 'var(--bg-overlay)', borderRadius: 6, marginBottom: 16 }} className="animate-pulse" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <div style={{ height: 12, width: '60%', background: 'var(--bg-overlay)', borderRadius: 4, marginBottom: 6 }} className="animate-pulse" />
          <div style={{ height: 5, background: 'var(--bg-overlay)', borderRadius: 3 }} className="animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface KPIBreakdownCardProps {
  /** Период в формате YYYY-MM (если не передан — текущий). */
  period?: string;
  /** userId для просмотра чужого KPI (СВ смотрит ТП). Если не передан — /kpi/my. */
  userId?: string;
}

export function KPIBreakdownCard({ period, userId }: KPIBreakdownCardProps) {
  const t = useT();
  const [record, setRecord] = useState<KPIRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const req = userId
      ? kpiApi.getUserKPI(userId, period)
      : kpiApi.getMyKPI(period);
    req
      .then((res) => setRecord(res.data as KPIRecord))
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string };
        setError(e.response?.data?.detail || e.message || 'Ошибка загрузки KPI');
      })
      .finally(() => setLoading(false));
  }, [period, userId]);

  const periodLabel = period ?? new Date().toISOString().slice(0, 7);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div
        style={{
          borderRadius: 12,
          border: '1px solid var(--danger-border, rgba(239,68,68,0.3))',
          background: 'var(--danger-bg, rgba(239,68,68,0.07))',
          padding: 14,
          fontSize: 13,
          color: 'var(--danger, #ef4444)',
        }}
      >
        {error}
      </div>
    );
  }

  if (!record) {
    return (
      <div
        style={{
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          padding: 14,
          fontSize: 13,
          color: 'var(--text-muted)',
        }}
      >
        {t('kpi.noData') || 'Данные KPI ещё не рассчитаны для этого периода.'}
      </div>
    );
  }

  const bd = record.breakdown;
  const hasBreakdown = !!bd?.components;

  // Определяем прокси-флаги: из breakdown или true (старые записи — всё предварительно)
  const proxySales      = bd?.proxy?.sales ?? true;
  const proxyDiscipline = bd?.proxy?.discipline ?? true;

  const proxyMap: Record<keyof KPIBreakdown['components'], boolean> = {
    sales:      proxySales,
    execution:  false,
    learning:   false,
    discipline: proxyDiscipline,
  };

  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        padding: 16,
      }}
    >
      {/* Заголовок */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            KPI периода
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {periodLabel}
            {bd?.formula && (
              <span style={{ marginLeft: 6, opacity: 0.6 }}>· v2.0</span>
            )}
          </div>
        </div>
        {/* Итоговый KPI */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: scoreColor(record.total_kpi),
              lineHeight: 1,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {record.total_kpi.toFixed(1)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
            {bd?.streak_bonus && bd.streak_bonus > 1
              ? `+${((bd.streak_bonus - 1) * 100).toFixed(0)}% серия`
              : 'без серии'}
          </div>
        </div>
      </div>

      {/* Разделитель */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 14 }} />

      {/* Компоненты */}
      {hasBreakdown ? (
        <>
          {COMPONENT_ROWS.map((row) => {
            const value = bd!.components[row.key];
            const contribution = bd!.contributions?.[row.key];
            const isProxy = proxyMap[row.key];
            return (
              <ComponentRow
                key={row.key}
                label={row.label}
                weight={row.weight}
                value={value}
                contribution={contribution}
                isProxy={row.isProxy}
                proxyActive={isProxy}
              />
            );
          })}

          {/* streak */}
          {bd!.streak_days > 0 && (
            <div
              style={{
                marginTop: 8,
                padding: '6px 10px',
                borderRadius: 7,
                background: 'rgba(251,191,36,0.07)',
                border: '1px solid rgba(251,191,36,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--warning, #fbbf24)' }}>
                Серия: {bd!.streak_days} д.
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning, #fbbf24)' }}>
                ×{bd!.streak_bonus.toFixed(3)}
              </span>
            </div>
          )}

          {/* Пояснение прокси */}
          {(proxySales || proxyDiscipline) && (
            <div
              style={{
                marginTop: 10,
                fontSize: 11,
                color: 'var(--text-muted)',
                opacity: 0.75,
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: 'var(--warning, #fbbf24)', marginRight: 4 }}>пред.</span>
              — предварительные данные (прокси до подключения CRM SalesDoctor).
            </div>
          )}
        </>
      ) : (
        <FallbackView record={record} />
      )}

      {/* Формула */}
      {hasBreakdown && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
            fontSize: 10,
            color: 'var(--text-muted)',
            opacity: 0.6,
            letterSpacing: '0.02em',
          }}
        >
          40% Продажи · 30% Исполнение · 20% Обучение · 10% Дисциплина + streak-бонус
        </div>
      )}
    </div>
  );
}
