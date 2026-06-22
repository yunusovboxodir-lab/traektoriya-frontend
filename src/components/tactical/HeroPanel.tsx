/**
 * HeroPanel — левая панель с профилем оператора, рангом, серией, статистикой,
 * навигацией по зонам и обзором команды.
 */
import type { CSSProperties } from 'react';
import { Panel, Stat, ProgressBar, RingProgress } from './Panel';
import { ZONES as DEFAULT_ZONES } from './data';
import type { MapZone } from './types';
import { useLangStore } from '../../stores/langStore';

const ZONE_TINTS = [
  'oklch(0.76 0.15 150)', // T1 Стажёр — зелёный
  'oklch(0.72 0.14 245)', // T2 Практик — синий
  'oklch(0.86 0.15 100)', // T3 Эксперт — жёлтый
  'oklch(0.70 0.18 27)',  // T4 Мастер — красный
];

interface HeroPanelProps {
  onZoneFocus: (zoneIdx: number | null) => void;
  focusZone: number | null;
  /** Имя оператора (sales_rep / supervisor / etc) */
  operatorName?: string;
  /** Роль (территория) */
  operatorRole?: string;
  /** Динамические зоны (с обновлёнными count) */
  zones?: MapZone[];
  /** Реальное число курсов */
  totalCourses?: number;
  /** Пройдено курсов */
  doneCourses?: number;
}

export function HeroPanel({
  onZoneFocus,
  focusZone,
  operatorName = 'Оператор',
  operatorRole = 'ТЕРРИТОРИАЛЬНЫЙ ПРЕДСТАВИТЕЛЬ · ALMATY-04',
  zones,
  totalCourses,
  doneCourses,
}: HeroPanelProps) {
  const lang = useLangStore((s) => s.lang);
  const ZONES = zones && zones.length > 0 ? zones : DEFAULT_ZONES;
  const total = totalCourses ?? 32;
  const done = doneCourses ?? 12;
  const inProgress = Math.max(0, Math.min(3, total - done));
  const available = Math.max(0, Math.min(5, total - done - inProgress));
  const locked = Math.max(0, total - done - inProgress - available);
  const overallPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const t = (ru: string, uz: string) => (lang === 'uz' ? uz : ru);

  return (
    <Panel label={t('ОПЕРАТОР', 'OPERATOR')} code="UID-08842">
      {/* Identity */}
      <div className="hero-identity">
        <div className="avatar">
          <svg width="56" height="56" viewBox="0 0 56 56">
            <defs>
              <linearGradient id="av" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.45 0.10 220)" />
                <stop offset="100%" stopColor="oklch(0.30 0.06 250)" />
              </linearGradient>
            </defs>
            <circle cx="28" cy="28" r="26" fill="url(#av)" stroke="oklch(0.7 0.10 220)" strokeWidth="1" />
            <circle cx="28" cy="22" r="8" fill="oklch(0.85 0.04 220)" opacity="0.85" />
            <path d="M 12 50 Q 28 36 44 50 L 44 56 L 12 56 Z" fill="oklch(0.85 0.04 220)" opacity="0.85" />
          </svg>
          <div className="avatar-status" />
        </div>
        <div>
          <div className="hero-name">{operatorName}</div>
          <div className="hero-role">{operatorRole}</div>
        </div>
      </div>

      <div className="divider" />

      {/* Rank + ring */}
      <div className="hero-rank">
        <RingProgress value={overallPct} label={t('ПРАКТИК', 'PRAKTIK')} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: 'oklch(0.55 0.02 250)' }}>{t('ТЕКУЩИЙ ЭШЕЛОН', 'JORIY ESHELON')}</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: 'oklch(0.82 0.15 75)' }}>{t('Практик', 'Praktik')}</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'oklch(0.6 0.02 250)', marginTop: 2 }}>
            {t('след. рубеж', 'keyingi bosqich')}: <span style={{ color: 'oklch(0.78 0.15 155)' }}>{t('Эксперт', 'Ekspert')}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <ProgressBar value={done * 50} max={total * 50} level={t('LVL 2', 'LVL 2')} />
      </div>

      <div className="divider" />

      {/* Streak */}
      <div className="streak-row">
        <div>
          <div className="metric-label">{t('СЕРИЯ', 'SERIYA')}</div>
          <div className="metric-val"><span className="streak-icon">▲</span>5 <span className="metric-unit">{t('дн.', 'kun')}</span></div>
        </div>
        <div>
          <div className="metric-label">{t('ВРЕМЯ СЕГОДНЯ', 'BUGUNGI VAQT')}</div>
          <div className="metric-val">42<span className="metric-unit">{t('мин', 'daq')}</span></div>
        </div>
        <div>
          <div className="metric-label">{t('РЕЙТИНГ', 'REYTING')}</div>
          <div className="metric-val">#7<span className="metric-unit">/142</span></div>
        </div>
      </div>

      <div className="divider" />

      {/* Stats */}
      <div className="section-label">{t('СТАТИСТИКА', 'STATISTIKA')}</div>
      <Stat k={t('Всего курсов', 'Jami kurslar')} v={total} />
      <Stat k={t('Пройдено', "O'tildi")} v={done} accent="oklch(0.78 0.15 155)" />
      <Stat k={t('В процессе', 'Jarayonda')} v={inProgress} accent="oklch(0.82 0.15 75)" />
      <Stat k={t('Доступно', 'Mavjud')} v={available} accent="oklch(0.78 0.15 220)" />
      <Stat k={t('Заблокировано', 'Bloklangan')} v={locked} accent="oklch(0.50 0.02 250)" />

      <div className="divider" />

      {/* Zone navigator */}
      <div className="section-label">{t('НАВИГАЦИЯ ПО ТЕРРИТОРИЯМ', 'HUDUDLAR BOʻYLAB NAVIGATSIYA')}</div>
      <div className="zone-nav">
        {ZONES.map((z, i) => {
          const tint = ZONE_TINTS[i];
          const active = focusZone === i;
          return (
            <button
              key={z.id}
              className={'zone-chip' + (active ? ' active' : '')}
              style={{ ['--c' as never]: tint } as CSSProperties}
              onClick={() => onZoneFocus(active ? null : i)}
            >
              <span className="chip-num">T{i + 1}</span>
              <span className="chip-name">{z.label}</span>
              <span className="chip-count">{z.count}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
