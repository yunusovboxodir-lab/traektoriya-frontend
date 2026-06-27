/**
 * Редактор одного блока. Поля RU + UZ для всех текстовых элементов.
 */
import type { Block, CardItem, NumberedListItem } from '../../../types/offlineProgram';

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
  const renderFields = () => {
    switch (block.type) {
      case 'heading_h1':
      case 'heading_h2':
        return (
          <>
            <TextField label="Заголовок (RU)" value={block.text}
              onChange={(text) => onChange({ ...block, text })} />
            <TextField label="Заголовок (UZ)" value={block.text_uz || ''}
              onChange={(text_uz) => onChange({ ...block, text_uz })} />
            <SelectField label="Выравнивание" value={block.align ?? 'left'}
              options={[{ v: 'left', t: 'Слева' }, { v: 'center', t: 'По центру' }]}
              onChange={(align) => onChange({ ...block, align: align as 'left' | 'center' })} />
          </>
        );

      case 'paragraph':
        return (
          <>
            <TextAreaField label="Текст (RU)" value={block.text}
              onChange={(text) => onChange({ ...block, text })} />
            <TextAreaField label="Текст (UZ)" value={block.text_uz || ''}
              onChange={(text_uz) => onChange({ ...block, text_uz })} />
          </>
        );

      case 'callout':
        return (
          <>
            <SelectField label="Тип" value={block.variant}
              options={[
                { v: 'info', t: 'Инфо (синий)' },
                { v: 'warning', t: 'Внимание (жёлтый)' },
                { v: 'success', t: 'Успех (зелёный)' },
                { v: 'danger', t: 'Опасно (красный)' },
              ]}
              onChange={(variant) => onChange({ ...block, variant: variant as 'info' | 'warning' | 'success' | 'danger' })} />
            <TextAreaField label="Текст (RU)" value={block.text}
              onChange={(text) => onChange({ ...block, text })} />
            <TextAreaField label="Текст (UZ)" value={block.text_uz || ''}
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
            <SelectField label="Колонки" value={String(block.columns)}
              options={[{ v: '2', t: '2' }, { v: '3', t: '3' }, { v: '4', t: '4' }]}
              onChange={(v) => setColumns(Number(v) as 2 | 3 | 4)} />
            <div className="space-y-3 mt-3">
              {block.cards.map((card, i) => (
                <div key={i} className="rounded-lg p-3" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Карточка #{i + 1}</span>
                    <button type="button" onClick={() => removeCard(i)} className="text-xs text-red-600 hover:underline">
                      Удалить
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <TextField label="Иконка" value={card.icon || ''}
                      onChange={(icon) => updateCard(i, { ...card, icon })} placeholder="🎯" />
                    <TextField label="Цвет акцента" value={card.color || ''}
                      onChange={(color) => updateCard(i, { ...card, color })} placeholder="#c9a961" />
                    <TextField label="Заголовок (RU)" value={card.title}
                      onChange={(title) => updateCard(i, { ...card, title })} />
                    <TextField label="Заголовок (UZ)" value={card.title_uz || ''}
                      onChange={(title_uz) => updateCard(i, { ...card, title_uz })} />
                    <TextAreaField label="Текст (RU)" value={card.body || ''}
                      onChange={(body) => updateCard(i, { ...card, body })} />
                    <TextAreaField label="Текст (UZ)" value={card.body_uz || ''}
                      onChange={(body_uz) => updateCard(i, { ...card, body_uz })} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addCard}
                className="w-full py-2 border-2 border-dashed rounded-lg text-sm hover:border-amber-400 hover:text-amber-700"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                + Добавить карточку
              </button>
            </div>
          </>
        );
      }

      case 'quote':
        return (
          <>
            <TextAreaField label="Цитата (RU)" value={block.text}
              onChange={(text) => onChange({ ...block, text })} />
            <TextAreaField label="Цитата (UZ)" value={block.text_uz || ''}
              onChange={(text_uz) => onChange({ ...block, text_uz })} />
            <TextField label="Автор" value={block.author || ''}
              onChange={(author) => onChange({ ...block, author })} />
          </>
        );

      case 'image':
        return (
          <>
            <TextField label="URL изображения" value={block.url}
              onChange={(url) => onChange({ ...block, url })} placeholder="https://..." />
            <TextField label="Подпись" value={block.caption || ''}
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
                <TextField label="Левый заголовок" value={block.left_title}
                  onChange={(left_title) => onChange({ ...block, left_title })} />
                {block.left_items.map((it, i) => (
                  <div key={i} className="flex gap-1 mt-2">
                    <input className={inputCls} value={it} onChange={(e) => updateLeftItem(i, e.target.value)} />
                    <button type="button" className="text-red-600 px-2"
                      onClick={() => onChange({ ...block, left_items: block.left_items.filter((_, k) => k !== i) })}>×</button>
                  </div>
                ))}
                <button type="button" className="mt-2 text-xs text-amber-700"
                  onClick={() => onChange({ ...block, left_items: [...block.left_items, ''] })}>+ Пункт</button>
              </div>
              <div>
                <TextField label="Правый заголовок" value={block.right_title}
                  onChange={(right_title) => onChange({ ...block, right_title })} />
                {block.right_items.map((it, i) => (
                  <div key={i} className="flex gap-1 mt-2">
                    <input className={inputCls} value={it} onChange={(e) => updateRightItem(i, e.target.value)} />
                    <button type="button" className="text-red-600 px-2"
                      onClick={() => onChange({ ...block, right_items: block.right_items.filter((_, k) => k !== i) })}>×</button>
                  </div>
                ))}
                <button type="button" className="mt-2 text-xs text-amber-700"
                  onClick={() => onChange({ ...block, right_items: [...block.right_items, ''] })}>+ Пункт</button>
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
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Шаг #{i + 1}</span>
                  <button type="button" onClick={() => removeItem(i)} className="text-xs text-red-600 hover:underline">
                    Удалить
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TextField label="Заголовок (RU)" value={item.title}
                    onChange={(title) => updateItem(i, { ...item, title })} />
                  <TextField label="Заголовок (UZ)" value={item.title_uz || ''}
                    onChange={(title_uz) => updateItem(i, { ...item, title_uz })} />
                  <TextAreaField label="Текст (RU)" value={item.body || ''}
                    onChange={(body) => updateItem(i, { ...item, body })} />
                  <TextAreaField label="Текст (UZ)" value={item.body_uz || ''}
                    onChange={(body_uz) => updateItem(i, { ...item, body_uz })} />
                </div>
              </div>
            ))}
            <button type="button" onClick={addItem}
              className="w-full py-2 border-2 border-dashed rounded-lg text-sm hover:border-amber-400 hover:text-amber-700"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              + Добавить шаг
            </button>
          </div>
        );
      }

      default:
        return <div className="text-sm" style={{ color: 'var(--danger)' }}>Неизвестный тип блока</div>;
    }
  };

  return (
    <div className="rounded-xl p-4 mb-3" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{blockTypeLabel(block.type)}</span>
        <div className="flex gap-1">
          {onMoveUp && (
            <button type="button" onClick={onMoveUp} className="px-2 hover:opacity-80" style={{ color: 'var(--text-muted)' }} title="Вверх">↑</button>
          )}
          {onMoveDown && (
            <button type="button" onClick={onMoveDown} className="px-2 hover:opacity-80" style={{ color: 'var(--text-muted)' }} title="Вниз">↓</button>
          )}
          <button type="button" onClick={onRemove} className="px-2" style={{ color: 'var(--danger)' }} title="Удалить">X</button>
        </div>
      </div>
      <div className="space-y-2">{renderFields()}</div>
    </div>
  );
}

function blockTypeLabel(type: Block['type']): string {
  const labels: Partial<Record<Block['type'], string>> = {
    heading_h1: 'Заголовок H1',
    heading_h2: 'Заголовок H2',
    paragraph: 'Параграф',
    cards_grid: 'Карточки',
    quote: 'Цитата',
    image: 'Изображение',
    callout: 'Выноска',
    comparison: 'Сравнение',
    numbered_list: 'Нумерованный список',
    divider: 'Разделитель',
    hero: 'Hero',
    big_number: 'Большое число',
    stat_grid: 'Сетка статистики',
  };
  return labels[type] || type;
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
