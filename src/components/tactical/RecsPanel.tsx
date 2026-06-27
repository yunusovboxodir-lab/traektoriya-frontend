/**
 * RecsPanel — рекомендации курсов на основе пробелов в KPI.
 */
import { useNavigate } from 'react-router-dom';
import { Panel } from './Panel';
import { useLangStore } from '../../stores/langStore';

interface RecData {
  code: string;
  title_ru: string;
  title_uz: string;
  sub_ru: string;
  sub_uz: string;
  tag_ru: string;
  tag_uz: string;
  tagC: string;
  xp: number;
}

const RECOMMENDATIONS: RecData[] = [
  { code: 'PR-02', title_ru: 'ABCD-анализ', title_uz: 'ABCD-tahlil', sub_ru: 'дилерской базы', sub_uz: 'diler bazasi', tag_ru: 'НОВОЕ', tag_uz: 'YANGI', tagC: 'var(--info)', xp: 80 },
  { code: 'PR-03', title_ru: 'Pricing', title_uz: 'Pricing', sub_ru: 'и маржинальность', sub_uz: 'va marjinallik', tag_ru: 'В ПРОЦЕССЕ', tag_uz: 'JARAYONDA', tagC: 'var(--brass)', xp: 120 },
  { code: 'PR-05', title_ru: 'Контроль ДЗ', title_uz: 'DQ nazorati', sub_ru: 'и мотивация', sub_uz: 'va motivatsiya', tag_ru: 'НОВОЕ', tag_uz: 'YANGI', tagC: 'var(--info)', xp: 60 },
  { code: 'EX-01', title_ru: 'Стратегия', title_uz: 'Strategiya', sub_ru: 'крупных сделок', sub_uz: "yirik bitimlar uchun", tag_ru: 'ПРИОРИТЕТ', tag_uz: 'PRIORITET', tagC: 'var(--success)', xp: 200 },
];

export function RecsPanel() {
  const lang = useLangStore((s) => s.lang);
  const navigate = useNavigate();
  const t = (ru: string, uz: string) => (lang === 'uz' ? uz : ru);

  return (
    <Panel label={t('РЕКОМЕНДУЮ СЕГОДНЯ', 'BUGUNGI TAVSIYA')} code="ALG-V3">
      <div className="recs-meta">
        <span>{t('Подобрано на основе:', 'Asoslangan:')} <strong>{t('пробелы по KPI Q2', 'KPI Q2 boʻyicha kamchilik')}</strong></span>
        <span className="dot-divider">·</span>
        <span>{t('Обновлено', 'Yangilandi')} 09:42</span>
      </div>
      <div className="recs-list">
        {RECOMMENDATIONS.map((r, i) => (
          <div key={r.code} className="rec-row">
            <div className="rec-rank">{String(i + 1).padStart(2, '0')}</div>
            <div className="rec-body">
              <div className="rec-head">
                <span className="rec-code">{r.code}</span>
                <span className="rec-tag" style={{ color: r.tagC, borderColor: r.tagC }}>{t(r.tag_ru, r.tag_uz)}</span>
              </div>
              <div className="rec-title">
                {t(r.title_ru, r.title_uz)} <span className="rec-sub">{t(r.sub_ru, r.sub_uz)}</span>
              </div>
              <div className="rec-foot">
                <span>+{r.xp} XP</span>
                <span className="dot-divider">·</span>
                <span>≈ {Math.round(r.xp / 4)} {t('мин', 'daq')}</span>
              </div>
            </div>
            <button
              className="rec-launch"
              onClick={() => navigate('/learning')}
              aria-label={t('Открыть курс', 'Kursni ochish')}
            >▶</button>
          </div>
        ))}
      </div>
      <button className="full-btn" onClick={() => navigate('/learning')}>
        {t('СМОТРЕТЬ ВСЕ', 'BARCHASINI KOʻRISH')} →
      </button>
    </Panel>
  );
}
