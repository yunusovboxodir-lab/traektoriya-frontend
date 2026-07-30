import { useT, useLangStore } from '../../stores/langStore';
import type { InsightItem, LmsDashboard, KpiMappingSection } from './types';
import { SectionTitle } from './charts';

// ---------------------------------------------------------------------------
// Fallback KPI mapping (used when backend doesn't provide kpi_mapping)
// ---------------------------------------------------------------------------

const FALLBACK_KPI_FIELD_SALES: KpiMappingSection = {
  title: '', track: 'field_sales',
  items: [
    { category: 'возражения_цена', label: 'Ценовые возражения', labelUz: 'Narx eʼtirozlari', kpi: 'Средний чек, конверсия визитов', kpiUz: 'Oʻrtacha chek, tashriflar konversiyasi', weight: '30% (LMS/CRM)' },
    { category: 'мерч_выкладка', label: 'Выкладка', labelUz: 'Tovar joylashuvi', kpi: 'ShelfScan score', kpiUz: 'ShelfScan score', weight: '40% (AI)' },
    { category: 'мерч_конкурент', label: 'Конкурент на полке', labelUz: 'Rakobatchi tokchada', kpi: 'Доля полки', kpiUz: 'Tokcha ulushi', weight: '40% (AI)' },
    { category: 'продукт_знания', label: 'Знание продукта', labelUz: 'Mahsulotni bilish', kpi: 'Cross-sell (SKU в заказе)', kpiUz: 'Cross-sell (buyurtmadagi SKU)', weight: '30% (LMS/CRM)' },
    { category: 'дебиторка', label: 'Дебиторка', labelUz: 'Debitorlik', kpi: 'Дебиторская задолженность', kpiUz: 'Debitorlik qarzi', weight: '30% (LMS/CRM)' },
    { category: 'планирование', label: 'Планирование', labelUz: 'Rejalashtirish', kpi: 'Активных визитов в день', kpiUz: 'Kuniga faol tashriflar', weight: '30% (LMS/CRM)' },
    { category: 'dspm_стандарты', label: 'Стандарты DSPM', labelUz: 'DSPM standartlari', kpi: 'Compliance score', kpiUz: 'Compliance score', weight: '40% (AI)' },
    { category: 'возражения_общие', label: 'Общие возражения', labelUz: 'Umumiy eʼtirozlar', kpi: 'Конверсия в заказ', kpiUz: 'Buyurtmaga konversiya', weight: '30% (LMS/CRM)' },
  ],
};

const FALLBACK_KPI_RM: KpiMappingSection = {
  title: '', track: 'sales_management',
  items: [
    { category: 'дилер_невыполнение', label: 'Дилер: невыполнение', labelUz: 'Diler: bajarmaslik', kpi: 'Выполнение плана дилерами региона', kpiUz: 'Hudud dilerlari reja bajarilishi', weight: '30% (CRM)' },
    { category: 'дилер_конфликт', label: 'Конфликт дилеров', labelUz: 'Dilerlar nizosi', kpi: 'Стабильность дилерской сети', kpiUz: 'Diler tarmogʻi barqarorligi', weight: '20% (Manual)' },
    { category: 'коучинг_сложный_св', label: 'Коучинг СВ', labelUz: 'SV kouchingi', kpi: 'Рост KPI команды СВ', kpiUz: 'SV jamoasi KPI oʻsishi', weight: '30% (LMS)' },
    { category: 'плановая_аналитика', label: 'Плановая аналитика', labelUz: 'Reja tahlili', kpi: 'Точность прогноза продаж', kpiUz: 'Savdo prognozi aniqligi', weight: '30% (CRM)' },
    { category: 'переговоры_условия', label: 'Переговоры с дилером', labelUz: 'Diler bilan muzokara', kpi: 'Маржинальность контрактов', kpiUz: 'Shartnomalar marjinalligi', weight: '30% (CRM)' },
    { category: 'ротация_потери', label: 'Ротация региона', labelUz: 'Hudud rotatsiyasi', kpi: 'Сохранность при ротации (%)', kpiUz: 'Rotatsiyada saqlanish (%)', weight: '20% (Manual)' },
  ],
};

const FALLBACK_KPI_CD: KpiMappingSection = {
  title: '', track: 'sales_management',
  items: [
    { category: 'стратегия_приоритеты', label: 'Приоритеты стратегии', labelUz: 'Strategiya prioritetlari', kpi: 'ROI регионального распределения', kpiUz: 'Hududiy taqsimot ROI', weight: '40% (BI)' },
    { category: 'команда_рм_управление', label: 'Управление РМ', labelUz: 'RM boshqaruvi', kpi: 'Выполнение планов РМ', kpiUz: 'RM rejalari bajarilishi', weight: '30% (CRM)' },
    { category: 'дилеры_крупный_конфликт', label: 'Конфликт ключевого дилера', labelUz: 'Kalit diler nizosi', kpi: 'Retention ключевых дилеров', kpiUz: 'Kalit dilerlar retentioni', weight: '30% (CRM)' },
    { category: 'данные_интерпретация', label: 'Интерпретация данных', labelUz: 'Maʼlumotlar talqini', kpi: 'Точность диагностики причин', kpiUz: 'Sabablar diagnostikasi aniqligi', weight: '40% (BI)' },
    { category: 'трейд_маркетинг_roi', label: 'ROI трейд-маркетинга', labelUz: 'Treyd-marketing ROI', kpi: 'ROI трейд-маркетинга', kpiUz: 'Treyd-marketing ROI', weight: '40% (BI)' },
  ],
};

const FALLBACK_KPI_BM: KpiMappingSection = {
  title: '', track: 'sales_management',
  items: [
    { category: 'продукт_позиционирование', label: 'Позиционирование продукта', labelUz: 'Mahsulot pozitsiyalashi', kpi: 'Quiz accuracy по продукту (ТП)', kpiUz: 'Mahsulot boʻyicha Quiz accuracy (TP)', weight: '30% (LMS)' },
    { category: 'бренд_полка', label: 'Доля полки бренда', labelUz: 'Brend tokcha ulushi', kpi: 'ShelfScan score по бренду', kpiUz: 'Brend boʻyicha ShelfScan score', weight: '40% (AI)' },
    { category: 'контент_устарел', label: 'Устаревший контент', labelUz: 'Eskirgan kontent', kpi: 'Актуальность контента (%)', kpiUz: 'Kontent dolzarbligi (%)', weight: '20% (LMS)' },
    { category: 'трейд_активность', label: 'Трейд-активность', labelUz: 'Treyd-faollik', kpi: 'Эффективность промо-акций', kpiUz: 'Promo-aksiyalar samaradorligi', weight: '30% (CRM)' },
  ],
};

function getKpiSections(
  track: string,
  backendMapping: KpiMappingSection[] | undefined,
  t: (k: string) => string,
): { title: string; items: KpiMappingSection['items'] }[] {
  // Use backend data if available
  if (backendMapping && backendMapping.length > 0) {
    if (track === 'field_sales') {
      return backendMapping.filter(s => s.track === 'field_sales');
    } else if (track === 'sales_management') {
      return backendMapping.filter(s => s.track === 'sales_management');
    }
    return backendMapping;
  }

  // Fallback to hardcoded data
  if (track === 'field_sales') {
    return [{ title: t('analytics.eff.kpiFieldSales'), items: FALLBACK_KPI_FIELD_SALES.items }];
  } else if (track === 'sales_management') {
    return [
      { title: t('analytics.eff.kpiRM'), items: FALLBACK_KPI_RM.items },
      { title: t('analytics.eff.kpiCD'), items: FALLBACK_KPI_CD.items },
      { title: t('analytics.eff.kpiBM'), items: FALLBACK_KPI_BM.items },
    ];
  }
  return [
    { title: t('analytics.eff.kpiFieldSales'), items: FALLBACK_KPI_FIELD_SALES.items },
    { title: t('analytics.eff.kpiRM'), items: FALLBACK_KPI_RM.items },
    { title: t('analytics.eff.kpiCD'), items: FALLBACK_KPI_CD.items },
    { title: t('analytics.eff.kpiBM'), items: FALLBACK_KPI_BM.items },
  ];
}

// ---------------------------------------------------------------------------
// EffectivenessTab
// ---------------------------------------------------------------------------

interface Props {
  insights: InsightItem[];
  dashboard: LmsDashboard | null;
  track: string;
}

export function EffectivenessTab({ insights, dashboard, track }: Props) {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const kpiSections = getKpiSections(track, dashboard?.kpi_mapping, t);

  return (
    <div>
      {/* Module effectiveness table */}
      {insights.length > 0 && (
        <>
          <SectionTitle title={t('analytics.eff.moduleEffectiveness')} />
          <div className="rounded-xl shadow-sm mb-10 overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.eff.module')}</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.eff.completion7d')}</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.eff.avgScore')}</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.eff.avgTime')}</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.eff.delta')}</th>
                </tr>
              </thead>
              <tbody>
                {insights.map((ins) => (
                  <tr key={ins.id} className="last:border-0" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 px-4">
                      <div className="font-medium truncate max-w-[250px]" style={{ color: 'var(--text-primary)' }}>
                        {ins.course_title}
                      </div>
                      {ins.cluster_category && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{ins.cluster_category}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {ins.completion_rate_7d != null ? (
                        <span className="font-medium" style={{
                          color: ins.completion_rate_7d >= 70 ? 'var(--success)' :
                                 ins.completion_rate_7d >= 40 ? 'var(--warning)' :
                                 'var(--danger)',
                        }}>
                          {Math.round(ins.completion_rate_7d)}%
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="py-3 px-4 text-right" style={{ color: 'var(--text-secondary)' }}>
                      {ins.stats?.avg_score != null ? `${Math.round(ins.stats.avg_score)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right" style={{ color: 'var(--text-secondary)' }}>
                      {ins.stats?.avg_time_sec != null
                        ? `${Math.round(ins.stats.avg_time_sec / 60)} ${t('analytics.min')}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {ins.effectiveness_delta != null ? (
                        <span className="font-semibold" style={{
                          color: ins.effectiveness_delta < 0 ? 'var(--success)' : 'var(--danger)',
                        }}>
                          {ins.effectiveness_delta > 0 ? '+' : ''}
                          {Math.round(ins.effectiveness_delta)}%
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* KPI linkage */}
      <SectionTitle title={t('analytics.eff.kpiLinkage')} />
      {kpiSections.map((section) => (
        <div key={section.title} className="mb-6">
          {kpiSections.length > 1 && (
            <h4 className="text-sm font-medium mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>{section.title}</h4>
          )}
          <div className="rounded-xl shadow-sm overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.eff.cluster')}</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.eff.linkedKpi')}</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>{t('analytics.eff.formulaWeight')}</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item) => {
                  const cluster = dashboard?.pain_clusters?.find(c => c.category === item.category);
                  return (
                    <tr key={item.category} className="last:border-0" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {cluster?.label ?? (lang === 'uz' ? (item.labelUz ?? item.label) : item.label)}
                          </span>
                          {cluster && (
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                              {cluster.count}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{lang === 'uz' ? (item.kpiUz ?? item.kpi) : item.kpi}</td>
                      <td className="py-3 px-4 text-right" style={{ color: 'var(--text-muted)' }}>{item.weight}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <div className="mb-10" />

      {/* ROI explanation */}
      <div className="rounded-xl p-5 mb-10" style={{ background: 'var(--info-bg)', border: '1px solid var(--info)' }}>
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--info)' }}>
          {t('analytics.eff.roiTitle')}
        </h4>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {t('analytics.eff.roiDesc')}
        </p>
      </div>

      {insights.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3" style={{ color: 'var(--text-muted)' }}>—</div>
          <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{t('analytics.eff.emptyTitle')}</h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
            {t('analytics.eff.emptyDesc')}
          </p>
        </div>
      )}
    </div>
  );
}
