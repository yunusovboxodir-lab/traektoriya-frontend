/**
 * GuideTour — лёгкий тур-карточки для «Гида по платформе» (онбординг, пункт 2 фаза C).
 *
 * Показывает карточки одного гида (PlatformGuide) с листанием next/prev + точками.
 * Оверлей поверх экрана. Двуязычный (берёт текущий язык). Дизайн-токены.
 */
import { useState } from 'react';
import { useLangStore } from '../../stores/langStore';
import type { PlatformGuide } from '../../config/platformGuides';

interface Props {
  guide: PlatformGuide;
  onClose: () => void;
}

export function GuideTour({ guide, onClose }: Props) {
  const lang = useLangStore((s) => s.lang);
  const [i, setI] = useState(0);
  const cards = guide.cards;
  const card = cards[i];
  const isLast = i === cards.length - 1;

  return (
    <div
      data-screenshot-ignore="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <style>{`
        @keyframes guideCardIn { 0%{transform:translateY(10px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        .guide-card-anim { animation: guideCardIn 0.25s ease both; }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 380,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '20px 20px 18px',
          boxShadow: 'var(--shadow-md)', position: 'relative',
        }}
      >
        {/* Закрыть */}
        <button
          onClick={onClose}
          aria-label={lang === 'uz' ? 'Yopish' : 'Закрыть'}
          style={{
            position: 'absolute', top: 12, right: 12, width: 30, height: 30,
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 20, lineHeight: 1,
          }}
        >×</button>

        {/* Бейдж гида */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
          color: 'var(--color-rm)', marginBottom: 14,
          textTransform: 'uppercase',
        }}>
          <span aria-hidden="true">{guide.icon}</span>
          {guide.label[lang]}
        </div>

        {/* Карточка */}
        <div key={i} className="guide-card-anim" style={{ minHeight: 150 }}>
          {card.icon && (
            <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 12 }} aria-hidden="true">{card.icon}</div>
          )}
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
            color: 'var(--text-primary)', marginBottom: 8,
          }}>
            {card.title[lang]}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
            {card.body[lang]}
          </div>
        </div>

        {/* Точки */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '18px 0 14px' }}>
          {cards.map((_, idx) => (
            <span key={idx} style={{
              width: idx === i ? 18 : 6, height: 6, borderRadius: 3,
              background: idx === i ? 'var(--color-rm)' : 'var(--border-strong)',
              transition: 'all 0.2s ease',
            }} />
          ))}
        </div>

        {/* Навигация */}
        <div style={{ display: 'flex', gap: 8 }}>
          {i > 0 && (
            <button
              onClick={() => setI((v) => v - 1)}
              style={{
                padding: '11px 16px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', cursor: 'pointer',
                background: 'transparent', color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
              }}
            >
              {lang === 'uz' ? 'Orqaga' : 'Назад'}
            </button>
          )}
          <button
            onClick={() => (isLast ? onClose() : setI((v) => v + 1))}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 'var(--radius-md)',
              border: 'none', cursor: 'pointer',
              background: 'var(--color-rm)', color: 'var(--text-inverse)',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
            }}
          >
            {isLast
              ? (lang === 'uz' ? 'Tushunarli' : 'Понятно')
              : (lang === 'uz' ? 'Keyingi' : 'Дальше')}
          </button>
        </div>
      </div>
    </div>
  );
}
