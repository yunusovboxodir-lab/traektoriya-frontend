/**
 * Универсальный рендерер блоков слайда.
 * Используется на странице проектора (presenter) и в превью редактора.
 */
import type { Block } from '../../../types/offlineProgram';
import { pickLang } from '../../../types/offlineProgram';

interface Props {
  block: Block;
  lang: 'ru' | 'uz';
  /** Размер шрифтов: 'projector' (большой) | 'preview' (мелкий) */
  size?: 'projector' | 'preview';
}

const ALIGN_CLASSES: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
};

/* Цвета блоков выровнены под dark-палитру платформы (index.css :root):
   --bg-card #1A1F2E, --bg-elevated #20263A, --color-rm #C8A84B (золотой акцент),
   --text-primary #E8EAF0, --text-secondary #9CA3AF.
   Хардкоженные hex обоснованы — глобальный override на тёмную тему перебивает
   tailwind утилиты вроде text-stone-800/bg-white. */
const CALLOUT_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  info:    { bg: 'rgba(96, 165, 250, 0.10)',  border: 'rgba(96, 165, 250, 0.35)',  color: '#93C5FD' },
  warning: { bg: 'rgba(251, 191, 36, 0.12)',  border: 'rgba(251, 191, 36, 0.40)',  color: '#FCD34D' },
  success: { bg: 'rgba(74, 222, 128, 0.10)',  border: 'rgba(74, 222, 128, 0.35)',  color: '#6EE7B7' },
  danger:  { bg: 'rgba(248, 113, 113, 0.10)', border: 'rgba(248, 113, 113, 0.40)', color: '#FCA5A5' },
};

const VARIANT_COLORS: Record<string, string> = {
  neutral: '#E8EAF0',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger:  '#F87171',
  info:    '#60A5FA',
};

const COLS_CLASSES: Record<number, string> = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
};

const GOLD = '#C8A84B';
const CARD_BG = '#1A1F2E';
const ELEVATED_BG = '#20263A';
const BORDER = '#252B3B';

export function BlockRenderer({ block, lang, size = 'projector' }: Props) {
  const isProjector = size === 'projector';

  switch (block.type) {
    case 'heading_h1':
      return (
        <h1
          style={{ color: '#E8EAF0' }}
          className={`font-bold ${
            isProjector
              ? 'text-5xl md:text-6xl lg:text-7xl leading-tight'
              : 'text-3xl leading-tight'
          } mb-4 ${ALIGN_CLASSES[block.align ?? 'left']}`}
        >
          {pickLang(block.text, block.text_uz, lang)}
        </h1>
      );

    case 'heading_h2':
      return (
        <h2
          style={{ color: '#E8EAF0' }}
          className={`font-semibold ${
            isProjector ? 'text-3xl md:text-4xl lg:text-5xl' : 'text-2xl'
          } mb-3 ${ALIGN_CLASSES[block.align ?? 'left']}`}
        >
          {pickLang(block.text, block.text_uz, lang)}
        </h2>
      );

    case 'paragraph':
      return (
        <p
          style={{ color: '#9CA3AF' }}
          className={`leading-relaxed ${
            isProjector ? 'text-xl md:text-2xl' : 'text-base'
          } mb-3 ${ALIGN_CLASSES[block.align ?? 'left']}`}
        >
          {pickLang(block.text, block.text_uz, lang)}
        </p>
      );

    case 'cards_grid': {
      const cols = COLS_CLASSES[block.columns] || COLS_CLASSES[3];
      return (
        <div className={`grid ${cols} gap-4 mb-4`}>
          {block.cards.map((card, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 transition-transform hover:scale-[1.02]"
              style={{
                backgroundColor: CARD_BG,
                border: `1px solid ${BORDER}`,
                ...(card.color ? { borderTopColor: card.color, borderTopWidth: 4 } : {}),
              }}
            >
              {card.icon && (
                <div className={`${isProjector ? 'text-4xl' : 'text-2xl'} mb-2`}>{card.icon}</div>
              )}
              <h4
                style={{ color: '#E8EAF0' }}
                className={`font-bold mb-1 ${isProjector ? 'text-xl' : 'text-base'}`}
              >
                {pickLang(card.title, card.title_uz, lang)}
              </h4>
              {(card.body || card.body_uz) && (
                <p
                  style={{ color: '#9CA3AF' }}
                  className={`${isProjector ? 'text-base' : 'text-sm'}`}
                >
                  {pickLang(card.body, card.body_uz, lang)}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }

    case 'quote':
      return (
        <blockquote
          style={{
            backgroundColor: 'rgba(200, 168, 75, 0.08)',
            borderLeft: `4px solid ${GOLD}`,
            color: '#E8EAF0',
          }}
          className={`px-5 py-4 rounded-r-lg italic ${
            isProjector ? 'text-xl md:text-2xl' : 'text-base'
          } mb-3`}
        >
          «{pickLang(block.text, block.text_uz, lang)}»
          {block.author && (
            <footer
              style={{ color: '#9CA3AF' }}
              className={`mt-2 not-italic ${isProjector ? 'text-base' : 'text-sm'}`}
            >
              — {block.author}
            </footer>
          )}
        </blockquote>
      );

    case 'image':
      return (
        <figure className="mb-3">
          <img src={block.url} alt={block.caption || ''} className="rounded-xl w-full" />
          {block.caption && (
            <figcaption
              style={{ color: '#9CA3AF' }}
              className={`mt-2 text-center ${isProjector ? 'text-base' : 'text-sm'}`}
            >
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'callout': {
      const style = CALLOUT_STYLES[block.variant] || CALLOUT_STYLES.info;
      return (
        <div
          style={{ backgroundColor: style.bg, borderColor: style.border, color: style.color, borderWidth: 1 }}
          className={`rounded-xl border ${
            isProjector ? 'p-5 text-xl' : 'p-3 text-sm'
          } mb-3`}
        >
          {pickLang(block.text, block.text_uz, lang)}
        </div>
      );
    }

    case 'comparison':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div
            style={{
              backgroundColor: 'rgba(74, 222, 128, 0.08)',
              border: '1px solid rgba(74, 222, 128, 0.30)',
            }}
            className="rounded-xl p-5"
          >
            <h4
              style={{ color: '#6EE7B7' }}
              className={`font-bold mb-3 ${isProjector ? 'text-xl' : 'text-base'}`}
            >
              {block.left_title}
            </h4>
            <ul
              style={{ color: '#E8EAF0' }}
              className={`space-y-1 ${isProjector ? 'text-lg' : 'text-sm'}`}
            >
              {block.left_items.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(248, 113, 113, 0.08)',
              border: '1px solid rgba(248, 113, 113, 0.30)',
            }}
            className="rounded-xl p-5"
          >
            <h4
              style={{ color: '#FCA5A5' }}
              className={`font-bold mb-3 ${isProjector ? 'text-xl' : 'text-base'}`}
            >
              {block.right_title}
            </h4>
            <ul
              style={{ color: '#E8EAF0' }}
              className={`space-y-1 ${isProjector ? 'text-lg' : 'text-sm'}`}
            >
              {block.right_items.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      );

    case 'numbered_list':
      return (
        <ol className="space-y-3 mb-4">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-4">
              <div
                style={{ backgroundColor: GOLD, color: '#0D0F14' }}
                className={`flex-shrink-0 ${
                  isProjector ? 'w-12 h-12 text-2xl' : 'w-9 h-9 text-base'
                } rounded-xl flex items-center justify-center font-bold`}
              >
                {i + 1}
              </div>
              <div className="flex-1">
                <h4
                  style={{ color: '#E8EAF0' }}
                  className={`font-bold ${isProjector ? 'text-xl' : 'text-base'}`}
                >
                  {pickLang(item.title, item.title_uz, lang)}
                </h4>
                {(item.body || item.body_uz) && (
                  <p
                    style={{ color: '#9CA3AF', whiteSpace: 'pre-line' }}
                    className={`${isProjector ? 'text-lg' : 'text-sm'}`}
                  >
                    {pickLang(item.body, item.body_uz, lang)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      );

    case 'hero': {
      const accent = block.accent || GOLD;
      return (
        <div className={`flex flex-col items-center ${isProjector ? 'py-12' : 'py-6'}`}>
          {block.icon && (
            <div
              style={{
                width: isProjector ? 96 : 64,
                height: isProjector ? 96 : 64,
                background: `linear-gradient(135deg, ${accent} 0%, #8a7332 100%)`,
                boxShadow: `0 8px 32px ${accent}55`,
              }}
              className={`rounded-2xl flex items-center justify-center mb-6 ${
                isProjector ? 'text-5xl' : 'text-3xl'
              }`}
            >
              {block.icon}
            </div>
          )}
          <h1
            style={{ color: '#E8EAF0', letterSpacing: '-0.02em' }}
            className={`font-bold text-center ${
              isProjector
                ? 'text-6xl md:text-7xl lg:text-8xl leading-none'
                : 'text-4xl leading-tight'
            } mb-4`}
          >
            {pickLang(block.title, block.title_uz, lang)}
          </h1>
          <div
            style={{ height: 4, width: 80, backgroundColor: accent, borderRadius: 2 }}
            className="mb-6"
          />
          {(block.subtitle || block.subtitle_uz) && (
            <p
              style={{ color: '#9CA3AF' }}
              className={`text-center max-w-3xl ${
                isProjector ? 'text-2xl md:text-3xl' : 'text-lg'
              } mb-3`}
            >
              {pickLang(block.subtitle, block.subtitle_uz, lang)}
            </p>
          )}
          {(block.caption || block.caption_uz) && (
            <p
              style={{ color: '#6B7280', letterSpacing: '0.2em' }}
              className={`uppercase font-semibold text-center ${
                isProjector ? 'text-sm' : 'text-xs'
              }`}
            >
              {pickLang(block.caption, block.caption_uz, lang)}
            </p>
          )}
        </div>
      );
    }

    case 'big_number': {
      const color = VARIANT_COLORS[block.variant || 'neutral'];
      return (
        <div
          style={{ backgroundColor: ELEVATED_BG, border: `1px solid ${BORDER}` }}
          className={`rounded-2xl ${isProjector ? 'p-8' : 'p-5'} mb-3 text-center`}
        >
          <div
            style={{ color }}
            className={`font-bold ${isProjector ? 'text-7xl md:text-8xl' : 'text-5xl'} leading-none mb-3`}
          >
            {block.value}
          </div>
          <div
            style={{ color: '#E8EAF0' }}
            className={`font-semibold ${isProjector ? 'text-xl' : 'text-base'}`}
          >
            {pickLang(block.label, block.label_uz, lang)}
          </div>
          {(block.hint || block.hint_uz) && (
            <div
              style={{ color: '#9CA3AF' }}
              className={`mt-2 ${isProjector ? 'text-base' : 'text-sm'}`}
            >
              {pickLang(block.hint, block.hint_uz, lang)}
            </div>
          )}
        </div>
      );
    }

    case 'stat_grid': {
      const cols = COLS_CLASSES[block.columns] || COLS_CLASSES[3];
      return (
        <div className={`grid ${cols} gap-4 mb-4`}>
          {block.items.map((item, i) => {
            const color = VARIANT_COLORS[item.variant || 'neutral'];
            return (
              <div
                key={i}
                style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderTopColor: color, borderTopWidth: 4 }}
                className={`rounded-2xl ${isProjector ? 'p-6' : 'p-4'} text-center`}
              >
                <div
                  style={{ color }}
                  className={`font-bold ${isProjector ? 'text-5xl md:text-6xl' : 'text-4xl'} leading-none mb-2`}
                >
                  {item.value}
                </div>
                <div
                  style={{ color: '#E8EAF0' }}
                  className={`font-semibold ${isProjector ? 'text-base' : 'text-sm'}`}
                >
                  {pickLang(item.label, item.label_uz, lang)}
                </div>
                {(item.hint || item.hint_uz) && (
                  <div
                    style={{ color: '#9CA3AF' }}
                    className={`mt-1 ${isProjector ? 'text-sm' : 'text-xs'}`}
                  >
                    {pickLang(item.hint, item.hint_uz, lang)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    case 'divider':
      return (
        <div className="flex items-center gap-3 my-6">
          <div style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
          {block.label && (
            <span
              style={{ color: GOLD, letterSpacing: '0.2em' }}
              className={`uppercase font-semibold ${isProjector ? 'text-sm' : 'text-xs'}`}
            >
              {block.label}
            </span>
          )}
          <div style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
        </div>
      );

    default:
      return null;
  }
}
