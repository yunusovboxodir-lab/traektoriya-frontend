/**
 * RecsPanel — рекомендации курсов на основе пробелов в KPI.
 */
import { Panel } from './Panel';
import type { Recommendation } from './types';

const RECOMMENDATIONS: Recommendation[] = [
  { code: 'PR-02', title: 'ABCD-анализ', sub: 'дилерской базы', tag: 'НОВОЕ', tagC: 'oklch(0.78 0.15 220)', xp: 80 },
  { code: 'PR-03', title: 'Pricing', sub: 'и маржинальность', tag: 'В ПРОЦЕССЕ', tagC: 'oklch(0.82 0.15 75)', xp: 120 },
  { code: 'PR-05', title: 'Контроль ДЗ', sub: 'и мотивация', tag: 'НОВОЕ', tagC: 'oklch(0.78 0.15 220)', xp: 60 },
  { code: 'EX-01', title: 'Стратегия', sub: 'крупных сделок', tag: 'ПРИОРИТЕТ', tagC: 'oklch(0.78 0.15 155)', xp: 200 },
];

export function RecsPanel() {
  return (
    <Panel label="РЕКОМЕНДУЮ СЕГОДНЯ" code="ALG-V3">
      <div className="recs-meta">
        <span>Подобрано на основе: <strong>пробелы по KPI Q2</strong></span>
        <span className="dot-divider">·</span>
        <span>Обновлено 09:42</span>
      </div>
      <div className="recs-list">
        {RECOMMENDATIONS.map((r, i) => (
          <div key={r.code} className="rec-row">
            <div className="rec-rank">{String(i + 1).padStart(2, '0')}</div>
            <div className="rec-body">
              <div className="rec-head">
                <span className="rec-code">{r.code}</span>
                <span className="rec-tag" style={{ color: r.tagC, borderColor: r.tagC }}>{r.tag}</span>
              </div>
              <div className="rec-title">
                {r.title} <span className="rec-sub">{r.sub}</span>
              </div>
              <div className="rec-foot">
                <span>+{r.xp} XP</span>
                <span className="dot-divider">·</span>
                <span>≈ {Math.round(r.xp / 4)} мин</span>
              </div>
            </div>
            <button className="rec-launch">▶</button>
          </div>
        ))}
      </div>
      <button className="full-btn">СМОТРЕТЬ ВСЕ (12) →</button>
    </Panel>
  );
}
