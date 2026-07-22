/**
 * HeroPanel — левая панель с профилем оператора, рангом, серией, статистикой,
 * навигацией по зонам и обзором команды.
 */
import type { CSSProperties } from 'react';
import { Panel, Stat, ProgressBar, RingProgress } from './Panel';
import { ZONES as DEFAULT_ZONES } from './data';
import type { MapZone } from './types';
import { useLangStore } from '../../stores/langStore';
import { useLearningHero, tierLabel } from '../../hooks/useLearningHero';

const ZONE_TINTS = [
  'var(--level-1)', // T1 Стажёр — зелёный/золотой
  'var(--level-2)', // T2 Практик — синий/бирюзовый
  'var(--level-3)', // T3 Эксперт — фиолетовый
  'var(--level-4)', // T4 Мастер — красный
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
  const hero = useLearningHero();
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
                <stop offset="0%" stopColor="var(--bg-elevated)" />
                <stop offset="100%" stopColor="var(--bg-surface)" />
              </linearGradient>
            </defs>
            <circle cx="28" cy="28" r="26" fill="url(#av)" stroke="var(--border-strong)" strokeWidth="1" />
            <circle cx="28" cy="22" r="8" fill="var(--text-secondary)" opacity="0.85" />
            <path d="M 12 50 Q 28 36 44 50 L 44 56 L 12 56 Z" fill="var(--text-secondary)" opacity="0.85" />
          </svg>
          <div className="avatar-status" />
        </div>
        <div>
          <div className="hero-name">{operatorName}</div>
          <div className="hero-role">{operatorRole}</div>
        </div>
      </div>

      {/* Блок личного прогресса (эшелон/серия/рейтинг) скрыт для ролей без
          собственного учебного прогресса (admin/superadmin/commercial_dir) —
          hero.hidden. Статистика курсов и навигация по территориям остаются. */}
      {!hero.hidden && (
      <>
      <div className="divider" />

      {/* Rank + ring — эшелон = реальный тир Мощи (из /power/my). */}
      <div className="hero-rank">
        <RingProgress value={overallPct} label={hero.tier ? tierLabel(hero.tier, lang) : ''} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: 'var(--text-muted)' }}>
            {t('ТЕКУЩИЙ ЭШЕЛОН', 'JORIY ESHELON')}
          </div>
          {hero.loading ? (
            <div className="animate-pulse" style={{ width: 90, height: 22, borderRadius: 6, background: 'var(--bg-overlay)', marginTop: 4 }} />
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: 'var(--brass)' }}>
                {hero.tier ? tierLabel(hero.tier, lang) : '—'}
              </div>
              {hero.power != null && (
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {t('Мощь', 'Quvvat')}: <span style={{ color: 'var(--success)' }}>{hero.power.toLocaleString('ru')}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <ProgressBar value={done * 50} max={total * 50} level={t('LVL 2', 'LVL 2')} />
      </div>

      <div className="divider" />

      {/* Серия + рейтинг обучения — реальные (streak из /power/my, ранг из
          leaderboard). «Время сегодня» убрано — реального источника нет. */}
      <div className="streak-row">
        <div>
          <div className="metric-label">{t('СЕРИЯ', 'SERIYA')}</div>
          {hero.loading ? (
            <div className="animate-pulse" style={{ width: 40, height: 20, borderRadius: 4, background: 'var(--bg-overlay)', marginTop: 4 }} />
          ) : (
            <div className="metric-val">
              {hero.streakDays != null && hero.streakDays > 0 && <span className="streak-icon">▲</span>}
              {hero.streakDays ?? 0} <span className="metric-unit">{t('дн.', 'kun')}</span>
            </div>
          )}
        </div>
        <div>
          <div className="metric-label">{t('РЕЙТИНГ ОБУЧЕНИЯ', 'OʻQISH REYTINGI')}</div>
          {hero.loading ? (
            <div className="animate-pulse" style={{ width: 48, height: 20, borderRadius: 4, background: 'var(--bg-overlay)', marginTop: 4 }} />
          ) : hero.rank != null ? (
            <div className="metric-val">#{hero.rank}{hero.totalInGroup != null && <span className="metric-unit">/{hero.totalInGroup}</span>}</div>
          ) : (
            <div className="metric-val">—</div>
          )}
        </div>
      </div>

      <div className="divider" />
      </>
      )}

      {/* Stats */}
      <div className="section-label">{t('СТАТИСТИКА', 'STATISTIKA')}</div>
      <Stat k={t('Всего курсов', 'Jami kurslar')} v={total} />
      <Stat k={t('Пройдено', "O'tildi")} v={done} accent="var(--success)" />
      <Stat k={t('В процессе', 'Jarayonda')} v={inProgress} accent="var(--brass)" />
      <Stat k={t('Доступно', 'Mavjud')} v={available} accent="var(--info)" />
      <Stat k={t('Заблокировано', 'Bloklangan')} v={locked} accent="var(--text-muted)" />

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
              <span className="chip-name">{lang === 'uz' ? (z.labelUz ?? z.label) : z.label}</span>
              <span className="chip-count">{z.count}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
