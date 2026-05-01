/**
 * AwardsPanel — правая панель с медалями/наградами оператора.
 */
import { Panel } from './Panel';
import type { Award } from './types';

const AWARDS: Award[] = [
  { code: 'AWD-01', glyph: '◆', name: 'Стратег', sub: 'Пройди 20 курсов · 17/20', color: 'oklch(0.78 0.15 220)' },
  { code: 'AWD-02', glyph: '▲', name: 'Тактик', sub: 'Серия 10 дней · 5/10', color: 'oklch(0.82 0.15 75)' },
  { code: 'AWD-03', glyph: '★', name: 'Командир', sub: 'Помоги команде · ✓', color: 'oklch(0.82 0.15 90)' },
  { code: 'AWD-04', glyph: '◇', name: 'Аналитик', sub: '20 ABCD-анализов', color: 'oklch(0.50 0.02 250)', locked: true },
];

function AwardBadge({ code, glyph, name, sub, color, locked }: Award) {
  return (
    <div className={'award-row' + (locked ? ' locked' : '')}>
      <div className="award-medal" style={{ borderColor: color, color: color }}>
        <svg width="44" height="44" viewBox="0 0 44 44">
          <polygon points="22,4 30,10 30,28 22,40 14,28 14,10"
            fill="none" stroke={color} strokeWidth="1.2" opacity="0.4" />
          <polygon points="22,8 28,12 28,26 22,36 16,26 16,12"
            fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1" />
          <text x="22" y="23" textAnchor="middle" dominantBaseline="central"
            fontSize="14" fontWeight="700" fill={color}>{glyph}</text>
        </svg>
      </div>
      <div className="award-body">
        <div className="award-head">
          <span className="award-code">{code}</span>
        </div>
        <div className="award-name">{name}</div>
        <div className="award-sub">{sub}</div>
      </div>
    </div>
  );
}

export function AwardsPanel() {
  return (
    <Panel label="МОИ НАГРАДЫ" code="3 / 18">
      {AWARDS.map((a) => <AwardBadge key={a.code} {...a} />)}
      <button className="full-btn">СМОТРЕТЬ ВСЕ →</button>
    </Panel>
  );
}
