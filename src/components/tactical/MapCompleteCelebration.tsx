/**
 * MapCompleteCelebration — поздравительная анимация при 100% базовой карты
 * обучения ТП/СВ/РМ (гейт «уровня 2», П3 — рост компетенций поля).
 *
 * Показывается один раз на пользователя+роль (localStorage), только когда:
 *  - базовая карта пройдена на 100% (baseCompleted),
 *  - в карте есть секции уровня 2 (hasLevel2, иначе праздновать нечего),
 *  - пользователь смотрит СВОЮ карту, а не чужую роль через селектор (isOwnMap).
 *
 * Стиль и приёмы — по образцу `onboarding/SectionUnlockChest.tsx` (fixed
 * inset:0, backdrop-blur, инлайн @keyframes), но без эмодзи: иконка — SVG,
 * конфетти — CSS/framer-частицы (в проекте нет конфетти-библиотеки).
 */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useT } from '../../stores/langStore';

interface ConfettiPiece {
  left: number;      // % от ширины
  delay: number;      // сек
  duration: number;   // сек
  size: number;        // px
  color: string;
  rotate: number;
  round: boolean;
}

const CONFETTI_COLORS = [
  'var(--color-rm)',
  'var(--color-sv)',
  'var(--color-tp)',
  'var(--brass, var(--color-rm))',
];

function buildConfetti(count: number): ConfettiPiece[] {
  const pieces: ConfettiPiece[] = [];
  for (let i = 0; i < count; i++) {
    pieces.push({
      left: Math.round((Math.sin(i * 12.9898) * 0.5 + 0.5) * 100),
      delay: (i % 7) * 0.18,
      duration: 2.6 + (i % 5) * 0.35,
      size: 6 + (i % 4) * 3,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: (i * 47) % 360,
      round: i % 2 === 0,
    });
  }
  return pieces;
}

interface MapCompleteCelebrationProps {
  /** baseCompleted && hasLevel2 && isOwnMap — считает вызывающая страница. */
  eligible: boolean;
  userId: string;
  role: string;
  /** Прокрутить/подсветить первый узел уровня 2 (необязательно). */
  onStartLevel2?: () => void;
}

export function MapCompleteCelebration({ eligible, userId, role, onStartLevel2 }: MapCompleteCelebrationProps) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const storageKey = `trj-map-complete-${userId}-${role}`;
  const confetti = useMemo(() => buildConfetti(26), []);

  useEffect(() => {
    if (!eligible) return;
    let seen = false;
    try {
      seen = localStorage.getItem(storageKey) === '1';
    } catch {
      /* localStorage недоступен (приватный режим и т.п.) — считаем непоказанным */
    }
    if (!seen) setVisible(true);
  }, [eligible, storageKey]);

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const handleStart = () => {
    dismiss();
    onStartLevel2?.();
  };

  if (!visible) return null;

  return (
    <div
      data-screenshot-ignore="true"
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        background: 'oklch(0 0 0 / 0.62)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes mapCelebratePop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes mapCelebrateGlow { 0%,100%{opacity:0.45} 50%{opacity:1} }
        @keyframes mapCelebrateBadgePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        .map-celebrate-pop { animation: mapCelebratePop 0.5s cubic-bezier(0.2,0.7,0.2,1.3) both; }
        .map-celebrate-glow { animation: mapCelebrateGlow 2.2s ease-in-out infinite; }
        .map-celebrate-badge { animation: mapCelebrateBadgePulse 1.8s ease-in-out infinite; }
      `}</style>

      {/* Конфетти на весь экран — за карточкой, не мешает кликам */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
        {confetti.map((p, i) => (
          <motion.span
            key={i}
            initial={{ y: '-10vh', opacity: 0, rotate: p.rotate }}
            animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: p.rotate + 220 }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              left: `${p.left}%`,
              top: 0,
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: p.round ? '50%' : 3,
              display: 'block',
            }}
          />
        ))}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="map-celebrate-pop"
        style={{
          width: '100%', maxWidth: 420,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '28px 24px 22px',
          boxShadow: 'var(--shadow-md)', textAlign: 'center',
          position: 'relative', overflow: 'hidden', zIndex: 1,
        }}
      >
        <div
          className="map-celebrate-glow"
          style={{
            position: 'absolute', top: -70, left: '50%', transform: 'translateX(-50%)',
            width: 220, height: 140, borderRadius: '50%',
            background: 'radial-gradient(circle, var(--color-rm-bg), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="map-celebrate-badge" style={{ display: 'inline-flex', marginBottom: 14 }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2.5l2.47 5.01 5.53.8-4 3.9.94 5.5L12 15.9l-4.94 2.6.94-5.5-4-3.9 5.53-.8L12 2.5z"
              fill="var(--color-rm)"
              stroke="var(--color-rm)"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div style={{
          fontFamily: 'var(--font-display, inherit)', fontWeight: 700, fontSize: 21,
          color: 'var(--text-primary)', marginBottom: 8,
        }}>
          {t('learning.mapComplete.title')}
        </div>

        <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 22 }}>
          {t('learning.mapComplete.subtitle')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={handleStart}
            style={{
              padding: '12px 16px', borderRadius: 'var(--radius-md)',
              border: 'none', cursor: 'pointer',
              background: 'var(--color-rm)', color: 'var(--text-inverse)',
              fontFamily: 'var(--font-body, inherit)', fontWeight: 700, fontSize: 15,
            }}
          >
            {t('learning.mapComplete.startLevel2')}
          </button>
          <button
            type="button"
            onClick={dismiss}
            style={{
              padding: '10px 16px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body, inherit)', fontWeight: 500, fontSize: 14,
            }}
          >
            {t('learning.mapComplete.later')}
          </button>
        </div>
      </div>
    </div>
  );
}
