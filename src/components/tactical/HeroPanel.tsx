/**
 * HeroPanel — левая панель с профилем оператора, рангом, серией, статистикой,
 * навигацией по зонам и обзором команды.
 */
import type { CSSProperties } from 'react';
import { Panel, Stat, ProgressBar, RingProgress } from './Panel';
import { ZONES } from './data';
import type { TeamMember } from './types';

const TEAM: TeamMember[] = [
  { n: 'Gulnaza', r: 'СВ', p: 75, s: 'oklch(0.78 0.15 155)' },
  { n: 'Ibrahim', r: 'СВ', p: 60, s: 'oklch(0.82 0.15 75)' },
  { n: 'Aset',    r: 'СВ', p: 45, s: 'oklch(0.82 0.15 75)' },
  { n: 'Bekzod',  r: 'СВ', p: 30, s: 'oklch(0.78 0.15 220)' },
];

const ZONE_TINTS = [
  'oklch(0.75 0.10 220)',
  'oklch(0.78 0.12 75)',
  'oklch(0.75 0.12 155)',
  'oklch(0.82 0.13 90)',
];

interface HeroPanelProps {
  onZoneFocus: (zoneIdx: number | null) => void;
  focusZone: number | null;
  /** Имя оператора (sales_rep / supervisor / etc) */
  operatorName?: string;
  /** Роль (территория) */
  operatorRole?: string;
}

export function HeroPanel({ onZoneFocus, focusZone, operatorName = 'Оператор', operatorRole = 'ТЕРРИТОРИАЛЬНЫЙ ПРЕДСТАВИТЕЛЬ · ALMATY-04' }: HeroPanelProps) {
  return (
    <Panel label="ОПЕРАТОР" code="UID-08842">
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
        <RingProgress value={26} label="ПРАКТИК" />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: 'oklch(0.55 0.02 250)' }}>ТЕКУЩИЙ ЭШЕЛОН</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: 'oklch(0.82 0.15 75)' }}>Практик</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'oklch(0.6 0.02 250)', marginTop: 2 }}>
            след. рубеж: <span style={{ color: 'oklch(0.78 0.15 155)' }}>Эксперт</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <ProgressBar value={320} max={1200} />
      </div>

      <div className="divider" />

      {/* Streak */}
      <div className="streak-row">
        <div>
          <div className="metric-label">СЕРИЯ</div>
          <div className="metric-val"><span className="streak-icon">▲</span>5 <span className="metric-unit">дн.</span></div>
        </div>
        <div>
          <div className="metric-label">ВРЕМЯ СЕГОДНЯ</div>
          <div className="metric-val">42<span className="metric-unit">мин</span></div>
        </div>
        <div>
          <div className="metric-label">РЕЙТИНГ</div>
          <div className="metric-val">#7<span className="metric-unit">/142</span></div>
        </div>
      </div>

      <div className="divider" />

      {/* Stats */}
      <div className="section-label">СТАТИСТИКА</div>
      <Stat k="Всего разделов" v="32" />
      <Stat k="Пройдено" v="12" accent="oklch(0.78 0.15 155)" />
      <Stat k="В процессе" v="3" accent="oklch(0.82 0.15 75)" />
      <Stat k="Доступно" v="5" accent="oklch(0.78 0.15 220)" />
      <Stat k="Заблокировано" v="12" accent="oklch(0.50 0.02 250)" />

      <div className="divider" />

      {/* Zone navigator */}
      <div className="section-label">НАВИГАЦИЯ ПО ТЕРРИТОРИЯМ</div>
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

      <div className="divider" />

      {/* Team */}
      <div className="section-label">КОМАНДНЫЙ ОБЗОР · JEKA-DIV</div>
      {TEAM.map((t) => (
        <div key={t.n} className="team-row">
          <div className="team-id">
            {t.n} <span className="team-role">({t.r})</span>
          </div>
          <div className="team-bar">
            <div className="team-bar-fill" style={{ width: t.p + '%', background: t.s }} />
          </div>
          <div className="team-pct">{t.p}%</div>
        </div>
      ))}
    </Panel>
  );
}
