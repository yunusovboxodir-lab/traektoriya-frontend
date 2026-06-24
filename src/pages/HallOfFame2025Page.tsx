/**
 * HallOfFame2025Page — «Зал славы. Кубок N'Medov 2025».
 * Историческая витрина: подиум + рейтинг 30 команд по двум зачётам.
 * Раздел Карты обучения (вход кнопкой из TacticalLearningPage). Только чтение,
 * без детализации по месяцам и агентам (решение владельца 2026-06-24).
 *
 * Данные — статические: src/data/championship2025.ts (неизменная летопись).
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLangStore } from '../stores/langStore';
import { StatusBar } from '../components/tactical/StatusBar';
import { CHAMPIONSHIP_2025, type HofTeam } from '../data/championship2025';
import '../styles/tactical-design.css';

const FONT_LINK_ID = 'tactical-fonts';
function injectFonts() {
  if (typeof document === 'undefined' || document.getElementById(FONT_LINK_ID)) return;
  const l = document.createElement('link');
  l.id = FONT_LINK_ID;
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap';
  document.head.appendChild(l);
}

const MONO = 'JetBrains Mono, monospace';
const pct = (v: number | null) => (v == null ? '—' : `${v}%`);
const tone = (v: number | null) => {
  const n = v ?? 0;
  return n >= 70 ? 'var(--green, #46c98b)'
    : n >= 50 ? 'var(--gold)'
    : n >= 30 ? '#d08a4e'
    : 'var(--red, #e8654f)';
};

export function HallOfFame2025Page() {
  const lang = useLangStore((s) => s.lang);
  const navigate = useNavigate();
  const [cat, setCat] = useState(0);

  useEffect(() => { injectFonts(); }, []);

  const category = CHAMPIONSHIP_2025.categories[cat];
  const catName = (i: number) => {
    const c = CHAMPIONSHIP_2025.categories[i];
    return lang === 'uz' ? c.name_uz : c.name_ru;
  };
  const medals = ['🥇', '🥈', '🥉'];
  const podiumOrder = [1, 0, 2]; // 2-е, 1-е, 3-е — классический подиум

  return (
    <div className="tactical-root" style={{ paddingBottom: 60 }}>
      <StatusBar />

      <div className="title-row" style={{ flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => navigate('/learning')}
          style={btnStyle}
          title={lang === 'uz' ? "O'qish xaritasiga qaytish" : 'Назад к карте обучения'}
        >
          ‹ {lang === 'uz' ? 'XARITA' : 'КАРТА'}
        </button>
        <h1 style={{ fontFamily: 'Cinzel, serif' }}>
          {lang === 'uz' ? "Shon-shuhrat zali" : 'Зал славы'}
        </h1>
        <span className="tactical-tag" />
        <div className="title-meta">
          <span><b>2025</b> {lang === 'uz' ? 'KUBOK' : 'КУБОК'}</span>
          <span><b>{category.teams.length}</b> {lang === 'uz' ? 'JAMOA' : 'КОМАНД'}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 16px' }}>
        {/* Переключатель зачётов */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '8px 0 24px', flexWrap: 'wrap' }}>
          {CHAMPIONSHIP_2025.categories.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCat(i)}
              style={{
                ...btnStyle,
                marginLeft: 0,
                color: i === cat ? 'var(--gold)' : 'var(--text-1)',
                borderColor: i === cat ? 'var(--brass)' : 'var(--line)',
                background: i === cat ? 'oklch(0.25 0.05 240 / 0.5)' : 'oklch(0.20 0.03 240 / 0.45)',
                fontWeight: i === cat ? 700 : 600,
              }}
            >
              {catName(i)}
            </button>
          ))}
        </div>

        {/* Подиум */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: 14, alignItems: 'end', marginBottom: 30 }}>
          {podiumOrder.map((i) => {
            const t = category.teams[i];
            if (!t) return <div key={i} />;
            const isFirst = t.rank === 1;
            return (
              <div
                key={i}
                className="glass-panel"
                style={{
                  textAlign: 'center',
                  padding: isFirst ? '24px 14px 18px' : '18px 14px',
                  borderColor: isFirst ? 'rgba(242,198,96,.5)' : undefined,
                  boxShadow: isFirst ? '0 10px 40px -12px rgba(242,198,96,.4)' : undefined,
                }}
              >
                <div style={{ fontSize: 30, lineHeight: 1 }}>{medals[t.rank - 1]}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.2em', color: 'var(--text-2)', marginTop: 4 }}>
                  {t.rank} {lang === 'uz' ? "O'RIN" : 'МЕСТО'}
                </div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: 19, fontWeight: 700, margin: '8px 0 2px', color: 'var(--text-0)' }}>{t.team}</div>
                <div style={{ color: 'var(--text-1)', fontSize: 12.5 }}>{t.supervisor}</div>
                <div style={{ color: 'var(--text-2)', fontSize: 11, marginTop: 2 }}>{t.dealer}</div>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, marginTop: 10, color: t.rank === 1 ? 'var(--gold)' : t.rank === 2 ? '#cdd6e3' : '#d08a4e' }}>
                  {pct(t.total)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Рейтинг */}
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr>
                {th('#', 'center')}
                {th(lang === 'uz' ? 'JAMOA' : 'КОМАНДА')}
                {th(lang === 'uz' ? 'SUPERVAYZER' : 'СУПЕРВАЙЗЕР')}
                {th(lang === 'uz' ? 'DILER' : 'ДИЛЕР')}
                {th('М1', 'center')}{th('М2', 'center')}{th('М3', 'center')}{th('М4', 'center')}
                {th(lang === 'uz' ? 'JAMI' : 'ИТОГ', 'center')}
              </tr>
            </thead>
            <tbody>
              {category.teams.map((t) => (
                <Row key={t.team} t={t} />
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 11, marginTop: 22, fontFamily: MONO, letterSpacing: '.1em' }}>
          {lang === 'uz'
            ? "Tarixiy yozuv · N'Medov Kubogi 2025 qayd etilgan"
            : "Историческая запись · Кубок N'Medov 2025 зафиксирован"}
        </div>
      </div>
    </div>
  );
}

function Row({ t }: { t: HofTeam }) {
  const medalColor = t.rank === 1 ? 'var(--gold)' : t.rank === 2 ? '#cdd6e3' : t.rank === 3 ? '#d08a4e' : 'var(--text-2)';
  return (
    <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
      <td style={{ fontFamily: MONO, fontWeight: 700, textAlign: 'center', color: medalColor, padding: '11px 12px' }}>{t.rank}</td>
      <td style={{ padding: '11px 12px', fontWeight: 600, color: 'var(--text-0)' }}>{t.team}</td>
      <td style={{ padding: '11px 12px', color: 'var(--text-1)' }}>{t.supervisor}</td>
      <td style={{ padding: '11px 12px', color: 'var(--text-2)', fontSize: 12 }}>{t.dealer}</td>
      {t.months.map((m, i) => (
        <td key={i} style={{ fontFamily: MONO, textAlign: 'center', color: m ? 'var(--text-1)' : 'var(--text-2)', opacity: m ? 1 : 0.45, padding: '11px 12px' }}>
          {pct(m)}
        </td>
      ))}
      <td style={{ fontFamily: MONO, fontWeight: 700, textAlign: 'center', color: tone(t.total), padding: '11px 12px', minWidth: 64 }}>
        {pct(t.total)}
        <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,.08)', marginTop: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, width: `${t.total ?? 0}%`, background: tone(t.total) }} />
        </div>
      </td>
    </tr>
  );
}

function th(label: string, align: 'left' | 'center' = 'left') {
  return (
    <th style={{
      fontFamily: MONO, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase',
      color: 'var(--text-2)', textAlign: align, padding: 12, fontWeight: 600,
      borderBottom: '1px solid var(--line)', background: 'oklch(0 0 0 / 0.18)',
    }}>{label}</th>
  );
}

const btnStyle: React.CSSProperties = {
  marginLeft: 16,
  background: 'oklch(0.20 0.03 240 / 0.45)',
  border: '1px solid var(--line)',
  borderRadius: 6,
  padding: '6px 12px',
  color: 'var(--brass)',
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};
