/**
 * EngineHealthPage — витрина «Здоровье платформы» (admin).
 *
 * Рисует вердикты движка самоулучшения (эффективность контента) + честный
 * статус трёх петель. Поверхность чек-поинта человек+ИИ (L2).
 *
 * Бэкенд: /api/v1/engine-health/* · Спека: _docs/SELF_IMPROVEMENT_ENGINE.md.
 * ЧЕСТНОСТЬ: до go-live и потока данных нет — показываем «движок на рельсах,
 * ждёт потока», а не имитацию живости.
 */
import { useEffect, useState, useCallback } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { useT } from '../stores/langStore';
import {
  PageHeader, Card, CardHeader, CardBody, CardTitle, CardDescription,
  Badge, EmptyState, Button,
} from '@/components/ui';
import type { BadgeVariant } from '@/components/ui';
import {
  engineHealthApi,
  type EffStatus, type EffItem, type LoopInfo, type SummaryResponse,
  type CoverageResponse,
} from '../api/engineHealth';

// Вердикт эффективности → цвет бейджа + ключ подписи.
const STATUS_META: Record<EffStatus, { variant: BadgeVariant; labelKey: string }> = {
  winner:  { variant: 'success', labelKey: 'engineHealth.status.winner' },
  weak:    { variant: 'danger',  labelKey: 'engineHealth.status.weak' },
  dead:    { variant: 'neutral', labelKey: 'engineHealth.status.dead' },
  unknown: { variant: 'info',    labelKey: 'engineHealth.status.unknown' },
};

// Состояние петли → цвет.
const LOOP_STATE_VARIANT: Record<string, BadgeVariant> = {
  in_product: 'success',
  alive: 'success',
  waiting_signal: 'info',
  idle_no_data: 'neutral',
  manual_checkpoint: 'warning',
};

function fmtLift(v: number): string {
  return (v > 0 ? '+' : '') + v.toFixed(2);
}

export function EngineHealthPage() {
  const t = useT();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loops, setLoops] = useState<LoopInfo[]>([]);
  const [items, setItems] = useState<EffItem[]>([]);
  const [coverage, setCoverage] = useState<CoverageResponse | null>(null);
  const [period, setPeriod] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [s, l, ce, cov] = await Promise.all([
        engineHealthApi.summary(),
        engineHealthApi.loops(),
        engineHealthApi.contentEffectiveness(),
        engineHealthApi.coverage(),
      ]);
      setSummary(s.data);
      setLoops(l.data.loops);
      setItems(ce.data.items);
      setPeriod(ce.data.period);
      setCoverage(cov.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const engineLive = summary?.engine_state === 'live';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title={t('engineHealth.title')}
        subtitle={t('engineHealth.subtitle')}
        actions={
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('common.actions.refresh')}
          </Button>
        }
      />

      {error && (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Activity className="w-8 h-8" />}
              title={t('engineHealth.errors.loadTitle')}
              description={t('engineHealth.errors.loadDesc')}
            />
          </CardBody>
        </Card>
      )}

      {!error && (
        <>
          {/* --- Свод --- */}
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-fg-muted text-sm">{t('engineHealth.summary.engineState')}</span>
                  <Badge variant={engineLive ? 'success' : 'info'}>
                    {engineLive ? t('engineHealth.summary.engineLive') : t('engineHealth.summary.engineWaiting')}
                  </Badge>
                </div>
                <div className="text-sm text-fg-muted">
                  {t('engineHealth.summary.anchor')} <span className="text-fg-default font-medium">{summary?.anchor_metric ?? '—'}</span>
                </div>
                <div className="text-sm text-fg-muted">
                  {t('engineHealth.summary.period')} <span className="text-fg-default font-medium">{summary?.latest_period ?? '—'}</span>
                </div>
              </div>
              {!engineLive && (
                <p className="mt-3 text-sm text-fg-muted">
                  {t('engineHealth.summary.waitingNote')}
                </p>
              )}
            </CardBody>
          </Card>

          {/* --- Три петли --- */}
          <section>
            <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wide mb-3">
              {t('engineHealth.loops.title')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {loops.map((lp) => (
                <Card key={lp.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{lp.id} · {lp.title}</CardTitle>
                      <Badge variant={LOOP_STATE_VARIANT[lp.state] ?? 'neutral'}>
                        {lp.state}
                      </Badge>
                    </div>
                    <CardDescription>{t('engineHealth.loops.cadenceAnchor', { cadence: lp.cadence, anchor: lp.anchor })}</CardDescription>
                  </CardHeader>
                  <CardBody>
                    <p className="text-sm text-fg-muted">{lp.note}</p>
                    {lp.id === 'L1' && typeof lp.verdicts_total === 'number' && (
                      <p className="mt-2 text-xs text-fg-muted">
                        {t('engineHealth.loops.verdictsCount', { decided: lp.verdicts_decided ?? '', total: lp.verdicts_total })}
                      </p>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>

          {/* --- Эффективность контента --- */}
          <section>
            <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wide mb-3">
              {t('engineHealth.effectiveness.title')}{period ? ` · ${period}` : ''}
            </h2>
            <Card>
              {items.length === 0 ? (
                <CardBody>
                  <EmptyState
                    icon={<Activity className="w-8 h-8" />}
                    title={t('engineHealth.effectiveness.emptyTitle')}
                    description={t('engineHealth.effectiveness.emptyDesc')}
                  />
                </CardBody>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-fg-muted border-b border-border-default">
                        <th className="px-4 py-2 font-medium">{t('engineHealth.table.course')}</th>
                        <th className="px-4 py-2 font-medium">{t('engineHealth.table.verdict')}</th>
                        <th className="px-4 py-2 font-medium text-right">{t('engineHealth.table.lift')}</th>
                        <th className="px-4 py-2 font-medium text-right">{t('engineHealth.table.sample')}</th>
                        <th className="px-4 py-2 font-medium text-right">{t('engineHealth.table.confidence')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => {
                        const meta = STATUS_META[it.status];
                        return (
                          <tr key={it.course_id} className="border-b border-border-default/50">
                            <td className="px-4 py-2">
                              <div className="text-fg-default">{it.title_ru ?? it.course_code ?? it.course_id.slice(0, 8)}</div>
                              {it.course_code && (
                                <div className="text-xs text-fg-muted">{it.course_code}</div>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <Badge variant={meta.variant}>{t(meta.labelKey)}</Badge>
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums">{fmtLift(it.lift)}</td>
                            <td className="px-4 py-2 text-right tabular-nums">{it.sample_size}</td>
                            <td className="px-4 py-2 text-right tabular-nums">{(it.confidence * 100).toFixed(0)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </section>

          {/* --- Покрытие (заглушка) --- */}
          <section>
            <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wide mb-3">
              {t('engineHealth.coverage.title')}
            </h2>
            <Card>
              <CardBody>
                <p className="text-sm text-fg-muted">
                  {coverage?.note ?? t('engineHealth.coverage.defaultNote')}
                </p>
              </CardBody>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
