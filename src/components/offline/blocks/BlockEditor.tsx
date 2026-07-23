/**
 * Редактор одного блока. Поля RU + UZ для всех текстовых элементов.
 */
import type { Block, CardItem, NumberedListItem } from '../../../types/offlineProgram';
import { useT } from '../../../stores/langStore';

interface Props {
  block: Block;
  onChange: (b: Block) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const inputCls =
  'w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400';

const labelCls = 'text-xs font-semibold uppercase tracking-wide';

export function BlockEditor({ block, onChange, onRemove, onMoveUp, onMoveDown }: Props) {
  const t = useT();
  const renderFields = () => {
    switch (block.type) {
      case 'heading_h1':
      case 'heading_h2':
        return (
          <>
            <TextField label={t('offlineEdit.headingRu')} value={block.text}
              onChange={(text) => onChange({ ...block, text })} />
            <TextField label={t('offlineEdit.headingUz')} value={block.text_uz || ''}
              onChange={(text_uz) => onChange({ ...block, text_uz })} />
            <SelectField label={t('offlineEdit.align')} value={block.align ?? 'left'}
              options={[{ v: 'left', t: t('offlineEdit.alignLeft') }, { v: 'center', t: t('offlineEdit.alignCenter') }]}
              onChange={(align) => onChange({ ...block, align: align as 'left' | 'center' })} />
          </>
        );

      case 'paragraph':
        return (
          <>
            <TextAreaField label={t('offlineEdit.textRu')} value={block.text}
              onChange={(text) => onChange({ ...block, text })} />
            <TextAreaField label={t('offlineEdit.textUz')} value={block.text_uz || ''}
              onChange={(text_uz) => onChange({ ...block, text_uz })} />
          </>
        );

      case 'callout':
        return (
          <>
            <SelectField label={t('offlineEdit.calloutType')} value={block.variant}
              options={[
                { v: 'info', t: t('offlineEdit.calloutInfo') },
                { v: 'warning', t: t('offlineEdit.calloutWarning') },
                { v: 'success', t: t('offlineEdit.calloutSuccess') },
                { v: 'danger', t: t('offlineEdit.calloutDanger') },
              ]}
              onChange={(variant) => onChange({ ...block, variant: variant as 'info' | 'warning' | 'success' | 'danger' })} />
            <TextAreaField label={t('offlineEdit.textRu')} value={block.text}
              onChange={(text) => onChange({ ...block, text })} />
            <TextAreaField label={t('offlineEdit.textUz')} value={block.text_uz || ''}
              onChange={(text_uz) => onChange({ ...block, text_uz })} />
          </>
        );

      case 'cards_grid': {
        const setColumns = (cols: 2 | 3 | 4) => onChange({ ...block, columns: cols });
        const updateCard = (idx: number, card: CardItem) => {
          const next = [...block.cards];
          next[idx] = card;
          onChange({ ...block, cards: next });
        };
        const addCard = () =>
          onChange({ ...block, cards: [...block.cards, { icon: '✨', title: '', title_uz: '', body: '', body_uz: '' }] });
        const removeCard = (idx: number) =>
          onChange({ ...block, cards: block.cards.filter((_, i) => i !== idx) });

        return (
          <>
            <SelectField label={t('offlineEdit.columns')} value={String(block.columns)}
              options={[{ v: '2', t: '2' }, { v: '3', t: '3' }, { v: '4', t: '4' }]}
              onChange={(v) => setColumns(Number(v) as 2 | 3 | 4)} />
            <div className="space-y-3 mt-3">
              {block.cards.map((card, i) => (
                <div key={i} className="rounded-lg p-3" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t('offlineEdit.cardN', { n: i + 1 })}</span>
                    <button type="button" onClick={() => removeCard(i)} className="text-xs text-red-600 hover:underline">
                      {t('common.actions.delete')}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <TextField label={t('offlinePrograms.form.icon')} value={card.icon || ''}
                      onChange={(icon) => updateCard(i, { ...card, icon })} placeholder="🎯" />
                    <TextField label={t('offlineEdit.accentColor')} value={card.color || ''}
                      onChange={(color) => updateCard(i, { ...card, color })} placeholder="#c9a961" />
                    <TextField label={t('offlineEdit.headingRu')} value={card.title}
                      onChange={(title) => updateCard(i, { ...card, title })} />
                    <TextField label={t('offlineEdit.headingUz')} value={card.title_uz || ''}
                      onChange={(title_uz) => updateCard(i, { ...card, title_uz })} />
                    <TextAreaField label={t('offlineEdit.textRu')} value={card.body || ''}
                      onChange={(body) => updateCard(i, { ...card, body })} />
                    <TextAreaField label={t('offlineEdit.textUz')} value={card.body_uz || ''}
                      onChange={(body_uz) => updateCard(i, { ...card, body_uz })} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addCard}
                className="w-full py-2 border-2 border-dashed rounded-lg text-sm hover:border-amber-400 hover:text-amber-700"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                {t('offlineEdit.addCard')}
              </button>
            </div>
          </>
        );
      }

      case 'quote':
        return (
          <>
            <TextAreaField label={t('offlineEdit.quoteRu')} value={block.text}
              onChange={(text) => onChange({ ...block, text })} />
            <TextAreaField label={t('offlineEdit.quoteUz')} value={block.text_uz || ''}
              onChange={(text_uz) => onChange({ ...block, text_uz })} />
            <TextField label={t('offlineEdit.author')} value={block.author || ''}
              onChange={(author) => onChange({ ...block, author })} />
          </>
        );

      case 'image':
        return (
          <>
            <TextField label={t('offlineEdit.imageUrl')} value={block.url}
              onChange={(url) => onChange({ ...block, url })} placeholder="https://..." />
            <TextField label={t('offlineEdit.caption')} value={block.caption || ''}
              onChange={(caption) => onChange({ ...block, caption })} />
          </>
        );

      case 'comparison': {
        const updateLeftItem = (idx: number, val: string) => {
          const next = [...block.left_items];
          next[idx] = val;
          onChange({ ...block, left_items: next });
        };
        const updateRightItem = (idx: number, val: string) => {
          const next = [...block.right_items];
          next[idx] = val;
          onChange({ ...block, right_items: next });
        };
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <TextField label={t('offlineEdit.leftTitle')} value={block.left_title}
                  onChange={(left_title) => onChange({ ...block, left_title })} />
                {block.left_items.map((it, i) => (
                  <div key={i} className="flex gap-1 mt-2">
                    <input className={inputCls} value={it} onChange={(e) => updateLeftItem(i, e.target.value)} />
                    <button type="button" className="text-red-600 px-2"
                      onClick={() => onChange({ ...block, left_items: block.left_items.filter((_, k) => k !== i) })}>×</button>
                  </div>
                ))}
                <button type="button" className="mt-2 text-xs text-amber-700"
                  onClick={() => onChange({ ...block, left_items: [...block.left_items, ''] })}>{t('offlineEdit.addItem')}</button>
              </div>
              <div>
                <TextField label={t('offlineEdit.rightTitle')} value={block.right_title}
                  onChange={(right_title) => onChange({ ...block, right_title })} />
                {block.right_items.map((it, i) => (
                  <div key={i} className="flex gap-1 mt-2">
                    <input className={inputCls} value={it} onChange={(e) => updateRightItem(i, e.target.value)} />
                    <button type="button" className="text-red-600 px-2"
                      onClick={() => onChange({ ...block, right_items: block.right_items.filter((_, k) => k !== i) })}>×</button>
                  </div>
                ))}
                <button type="button" className="mt-2 text-xs text-amber-700"
                  onClick={() => onChange({ ...block, right_items: [...block.right_items, ''] })}>{t('offlineEdit.addItem')}</button>
              </div>
            </div>
          </>
        );
      }

      case 'numbered_list': {
        const updateItem = (idx: number, item: NumberedListItem) => {
          const next = [...block.items];
          next[idx] = item;
          onChange({ ...block, items: next });
        };
        const addItem = () =>
          onChange({ ...block, items: [...block.items, { title: '', title_uz: '', body: '', body_uz: '' }] });
        const removeItem = (idx: number) =>
          onChange({ ...block, items: block.items.filter((_, i) => i !== idx) });

        return (
          <div className="space-y-3">
            {block.items.map((item, i) => (
              <div key={i} className="rounded-lg p-3" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t('offlineEdit.stepN', { n: i + 1 })}</span>
                  <button type="button" onClick={() => removeItem(i)} className="text-xs text-red-600 hover:underline">
                    {t('common.actions.delete')}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TextField label={t('offlineEdit.headingRu')} value={item.title}
                    onChange={(title) => updateItem(i, { ...item, title })} />
                  <TextField label={t('offlineEdit.headingUz')} value={item.title_uz || ''}
                    onChange={(title_uz) => updateItem(i, { ...item, title_uz })} />
                  <TextAreaField label={t('offlineEdit.textRu')} value={item.body || ''}
                    onChange={(body) => updateItem(i, { ...item, body })} />
                  <TextAreaField label={t('offlineEdit.textUz')} value={item.body_uz || ''}
                    onChange={(body_uz) => updateItem(i, { ...item, body_uz })} />
                </div>
              </div>
            ))}
            <button type="button" onClick={addItem}
              className="w-full py-2 border-2 border-dashed rounded-lg text-sm hover:border-amber-400 hover:text-amber-700"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              {t('offlineEdit.addStep')}
            </button>
          </div>
        );
      }

      default:
        return <div className="text-sm" style={{ color: 'var(--danger)' }}>{t('offlineEdit.unknownBlockType')}</div>;
    }
  };

  return (
    <div className="rounded-xl p-4 mb-3" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{blockTypeLabel(block.type, t)}</span>
        <div className="flex gap-1">
          {onMoveUp && (
            <button type="button" onClick={onMoveUp} className="px-2 hover:opacity-80" style={{ color: 'var(--text-muted)' }} title={t('offlineEdit.moveUp')}>↑</button>
          )}
          {onMoveDown && (
            <button type="button" onClick={onMoveDown} className="px-2 hover:opacity-80" style={{ color: 'var(--text-muted)' }} title={t('offlineEdit.moveDown')}>↓</button>
          )}
          <button type="button" onClick={onRemove} className="px-2" style={{ color: 'var(--danger)' }} title={t('common.actions.delete')}>X</button>
        </div>
      </div>
      <div className="space-y-2">{renderFields()}</div>
    </div>
  );
}

// Метки типов блоков — через ключи словаря + t() (i18n, Кодекс 10_bilingual)
function blockTypeLabel(type: Block['type'], t: (key: string) => string): string {
  const labelKeys: Partial<Record<Block['type'], string>> = {
    heading_h1: 'offlineEdit.blockLabels.heading_h1',
    heading_h2: 'offlineEdit.blockLabels.heading_h2',
    paragraph: 'offlineEdit.blockLabels.paragraph',
    cards_grid: 'offlineEdit.blockLabels.cards_grid',
    quote: 'offlineEdit.blockLabels.quote',
    image: 'offlineEdit.blockLabels.image',
    callout: 'offlineEdit.blockLabels.callout',
    comparison: 'offlineEdit.blockLabels.comparison',
    numbered_list: 'offlineEdit.blockLabels.numbered_list',
    divider: 'offlineEdit.blockLabels.divider',
    hero: 'offlineEdit.blockLabels.hero',
    big_number: 'offlineEdit.blockLabels.big_number',
    stat_grid: 'offlineEdit.blockLabels.stat_grid',
  };
  const key = labelKeys[type];
  return key ? t(key) : type;
}

function TextField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className={labelCls} style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function TextAreaField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={labelCls} style={{ color: 'var(--text-muted)' }}>{label}</label>
      <textarea className={`${inputCls} min-h-[60px]`} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: Array<{ v: string; t: string }>;
}) {
  return (
    <div>
      <label className={labelCls} style={{ color: 'var(--text-muted)' }}>{label}</label>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
      </select>
    </div>
  );
}
