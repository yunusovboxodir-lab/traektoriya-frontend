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

const CALLOUT_STYLES: Record<string, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  danger: 'bg-red-50 border-red-200 text-red-900',
};

const COLS_CLASSES: Record<number, string> = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
};

export function BlockRenderer({ block, lang, size = 'projector' }: Props) {
  const isProjector = size === 'projector';

  switch (block.type) {
    case 'heading_h1':
      return (
        <h1
          className={`font-serif font-normal text-stone-800 ${
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
          className={`font-serif font-normal text-stone-800 ${
            isProjector ? 'text-3xl md:text-4xl lg:text-5xl' : 'text-2xl'
          } mb-3 ${ALIGN_CLASSES[block.align ?? 'left']}`}
        >
          {pickLang(block.text, block.text_uz, lang)}
        </h2>
      );

    case 'paragraph':
      return (
        <p
          className={`text-stone-700 leading-relaxed ${
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
              className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm"
              style={card.color ? { borderTopColor: card.color, borderTopWidth: 4 } : undefined}
            >
              {card.icon && (
                <div className={`${isProjector ? 'text-4xl' : 'text-2xl'} mb-2`}>{card.icon}</div>
              )}
              <h4
                className={`font-bold text-stone-800 mb-1 ${
                  isProjector ? 'text-xl' : 'text-base'
                }`}
              >
                {pickLang(card.title, card.title_uz, lang)}
              </h4>
              {(card.body || card.body_uz) && (
                <p
                  className={`text-stone-600 ${isProjector ? 'text-base' : 'text-sm'}`}
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
          className={`border-l-4 border-amber-500 bg-amber-50 px-5 py-4 rounded-r-lg italic text-stone-700 ${
            isProjector ? 'text-xl md:text-2xl' : 'text-base'
          } mb-3`}
        >
          «{pickLang(block.text, block.text_uz, lang)}»
          {block.author && (
            <footer className={`mt-2 not-italic text-stone-500 ${isProjector ? 'text-base' : 'text-sm'}`}>
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
            <figcaption className={`text-stone-500 mt-2 text-center ${isProjector ? 'text-base' : 'text-sm'}`}>
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'callout': {
      const style = CALLOUT_STYLES[block.variant] || CALLOUT_STYLES.info;
      return (
        <div
          className={`border rounded-xl ${
            isProjector ? 'p-5 text-xl' : 'p-3 text-sm'
          } mb-3 ${style}`}
        >
          {pickLang(block.text, block.text_uz, lang)}
        </div>
      );
    }

    case 'comparison':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <h4 className={`font-bold text-green-800 mb-3 ${isProjector ? 'text-xl' : 'text-base'}`}>
              {block.left_title}
            </h4>
            <ul className={`space-y-1 text-green-900 ${isProjector ? 'text-lg' : 'text-sm'}`}>
              {block.left_items.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <h4 className={`font-bold text-red-800 mb-3 ${isProjector ? 'text-xl' : 'text-base'}`}>
              {block.right_title}
            </h4>
            <ul className={`space-y-1 text-red-900 ${isProjector ? 'text-lg' : 'text-sm'}`}>
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
                className={`flex-shrink-0 ${
                  isProjector ? 'w-12 h-12 text-2xl' : 'w-9 h-9 text-base'
                } rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold`}
              >
                {i + 1}
              </div>
              <div className="flex-1">
                <h4 className={`font-bold text-stone-800 ${isProjector ? 'text-xl' : 'text-base'}`}>
                  {pickLang(item.title, item.title_uz, lang)}
                </h4>
                {(item.body || item.body_uz) && (
                  <p className={`text-stone-600 ${isProjector ? 'text-lg' : 'text-sm'}`}>
                    {pickLang(item.body, item.body_uz, lang)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      );

    default:
      return null;
  }
}
