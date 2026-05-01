/**
 * AwardsPanel — правая панель с медалями/наградами оператора.
 */
import { Panel } from './Panel';
import type { Award } from './types';
import { useLangStore } from '../../stores/langStore';

interface AwardData extends Omit<Award, 'name' | 'sub'> {
  name_ru: string;
  name_uz: string;
  sub_ru: string;
  sub_uz: string;
}

const AWARDS_DATA: AwardData[] = [
  { code: 'AWD-01', glyph: '◆', name_ru: 'Стратег', name_uz: 'Strateg', sub_ru: 'Пройди 20 курсов · 17/20', sub_uz: '20 ta kurs · 17/20', color: 'oklch(0.78 0.15 220)' },
  { code: 'AWD-02', glyph: '▲', name_ru: 'Тактик', name_uz: 'Taktik', sub_ru: 'Серия 10 дней · 5/10', sub_uz: '10 kun seriya · 5/10', color: 'oklch(0.82 0.15 75)' },
  { code: 'AWD-03', glyph: '★', name_ru: 'Командир', name_uz: 'Qoʻmondon', sub_ru: 'Помоги команде · ✓', sub_uz: 'Jamoaga yordam · ✓', color: 'oklch(0.82 0.15 90)' },
  { code: 'AWD-04', glyph: '◇', name_ru: 'Аналитик', name_uz: 'Tahlilchi', sub_ru: '20 ABCD-анализов', sub_uz: "20 ta ABCD-tahlil", color: 'oklch(0.50 0.02 250)', locked: true },
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
  const lang = useLangStore((s) => s.lang);
  const t = (ru: string, uz: string) => (lang === 'uz' ? uz : ru);
  return (
    <Panel label={t('МОИ НАГРАДЫ', 'MENING MUKOFOTLARIM')} code="3 / 18">
      {AWARDS_DATA.map((a) => (
        <AwardBadge
          key={a.code}
          code={a.code}
          glyph={a.glyph}
          name={t(a.name_ru, a.name_uz)}
          sub={t(a.sub_ru, a.sub_uz)}
          color={a.color}
          locked={a.locked}
        />
      ))}
      <button className="full-btn">{t('СМОТРЕТЬ ВСЕ', 'BARCHASINI KOʻRISH')} →</button>
    </Panel>
  );
}
