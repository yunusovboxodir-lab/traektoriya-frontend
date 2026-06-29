import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { api } from '../../api/client';
import { toast } from '../../stores/toastStore';

// ───────────────────────────────────────
// Types
// ───────────────────────────────────────

interface ContentItem {
  id: string;
  course_id: string | null;
  title: string;
  content_type: string;
  difficulty_level: number | null;
  status: string;
  duration_minutes: number | null;
  updated_at: string;
}

type ColumnKey = 'draft' | 'review' | 'approved' | 'published';

interface Column {
  key: ColumnKey;
  label: string;
  /** CSS var for column dot indicator */
  dotColor: string;
  /** CSS var for column badge background */
  badgeColor: string;
}

// ───────────────────────────────────────
// Constants
// ───────────────────────────────────────

const COLUMNS: Column[] = [
  { key: 'draft',     label: 'Черновик',       dotColor: 'var(--text-muted)',   badgeColor: 'var(--text-muted)' },
  { key: 'review',   label: 'На проверке',    dotColor: 'var(--warning)',      badgeColor: 'var(--warning)' },
  { key: 'approved', label: 'Одобрено',       dotColor: 'var(--success)',      badgeColor: 'var(--success)' },
  { key: 'published',label: 'Опубликовано',   dotColor: 'var(--success)',      badgeColor: 'var(--success)' },
];

const VALID_TRANSITIONS: Record<ColumnKey, ColumnKey[]> = {
  draft: ['review'],
  review: ['approved', 'draft'],
  approved: ['published', 'review'],
  published: [],
};

const TYPE_BADGE_STYLE: Record<string, { label: string; style: React.CSSProperties }> = {
  lesson:     { label: 'Урок',      style: { background: 'var(--info-bg)',    color: 'var(--info)' } },
  quiz:       { label: 'Тест',      style: { background: 'var(--color-tp-bg)', color: 'var(--color-tp)' } },
  video:      { label: 'Видео',     style: { background: 'var(--danger-bg)',  color: 'var(--danger)' } },
  practice:   { label: 'Практика',  style: { background: 'var(--success-bg)', color: 'var(--success)' } },
  case_study: { label: 'Кейс',      style: { background: 'var(--warning-bg)', color: 'var(--warning)' } },
  summary:    { label: 'Итог',      style: { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' } },
};

const DIFFICULTY_LABELS: Record<number, string> = { 1: 'Нач.', 2: 'Сред.', 3: 'Прод.', 4: 'Эксп.' };

// ───────────────────────────────────────
// Draggable Card
// ───────────────────────────────────────

function DraggableCard({ item, onClick }: { item: ContentItem; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const typeBadge = TYPE_BADGE_STYLE[item.content_type] || TYPE_BADGE_STYLE.lesson;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
      className={`rounded-xl shadow-sm p-3.5 hover:shadow-md transition-all group cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
      {...listeners}
      {...attributes}
    >
      {/* Title (clickable) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="text-left w-full"
      >
        <h4 className="font-medium text-sm leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
          {item.title}
        </h4>
      </button>

      {/* Meta */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={typeBadge.style}>
          {typeBadge.label}
        </span>
        {item.difficulty_level && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
            {DIFFICULTY_LABELS[item.difficulty_level] || `Ур.${item.difficulty_level}`}
          </span>
        )}
      </div>

      {/* Updated date */}
      <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
        {new Date(item.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
      </p>
    </div>
  );
}

// ───────────────────────────────────────
// Overlay card (for drag preview)
// ───────────────────────────────────────

function OverlayCard({ item }: { item: ContentItem }) {
  const typeBadge = TYPE_BADGE_STYLE[item.content_type] || TYPE_BADGE_STYLE.lesson;
  return (
    <div className="rounded-xl shadow-xl p-3.5 w-64 rotate-2" style={{ background: 'var(--bg-card)', border: '2px solid var(--info)' }}>
      <h4 className="font-medium text-sm leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={typeBadge.style}>
          {typeBadge.label}
        </span>
      </div>
    </div>
  );
}

// ───────────────────────────────────────
// Droppable Column
// ───────────────────────────────────────

function DroppableColumn({
  column,
  items,
  onCardClick,
}: {
  column: Column;
  items: ContentItem[];
  onCardClick: (item: ContentItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl p-4 min-h-[300px] transition-all ${
        isOver ? 'ring-2 ring-offset-2' : ''
      }`}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        outlineColor: isOver ? 'var(--info)' : undefined,
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: column.dotColor }} />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>{column.label}</h3>
        </div>
        <span className="text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold" style={{ background: column.badgeColor, color: 'var(--text-inverse)' }}>
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {items.map((item) => (
          <DraggableCard key={item.id} item={item} onClick={() => onCardClick(item)} />
        ))}
        {items.length === 0 && (
          <div className="text-center py-10">
            <svg className="mx-auto w-8 h-8 mb-2" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Нет элементов</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────
// Main Component
// ───────────────────────────────────────

export function ContentKanbanTab() {
  const [board, setBoard] = useState<Record<ColumnKey, ContentItem[]>>({
    draft: [],
    review: [],
    approved: [],
    published: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // ─── Load data ─────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const statuses: ColumnKey[] = ['draft', 'review', 'approved', 'published'];
      const results = await Promise.allSettled(
        statuses.map((status) =>
          api.get<{ items: ContentItem[] }>('/api/v1/courses/items', {
            params: { status, limit: 100 },
          }),
        ),
      );

      const newBoard: Record<ColumnKey, ContentItem[]> = { draft: [], review: [], approved: [], published: [] };
      statuses.forEach((status, i) => {
        const r = results[i];
        if (r.status === 'fulfilled') {
          newBoard[status] = r.value.data.items || [];
        }
      });
      setBoard(newBoard);
    } catch {
      toast.error('Не удалось загрузить контент');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Drag handlers ─────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as ContentItem | undefined;
    setActiveItem(item || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveItem(null);

    const { active, over } = event;
    if (!over) return;

    const targetColumn = over.id as ColumnKey;
    const draggedItem = active.data.current?.item as ContentItem | undefined;
    if (!draggedItem) return;

    const sourceColumn = draggedItem.status as ColumnKey;
    if (sourceColumn === targetColumn) return;

    // Validate transition
    const allowed = VALID_TRANSITIONS[sourceColumn] || [];
    if (!allowed.includes(targetColumn)) {
      toast.warning(`Нельзя переместить из "${COLUMNS.find(c => c.key === sourceColumn)?.label}" в "${COLUMNS.find(c => c.key === targetColumn)?.label}"`);
      return;
    }

    // Optimistic update
    const updatedItem = { ...draggedItem, status: targetColumn };
    setBoard((prev) => ({
      ...prev,
      [sourceColumn]: prev[sourceColumn].filter((i) => i.id !== draggedItem.id),
      [targetColumn]: [updatedItem, ...prev[targetColumn]],
    }));

    try {
      await api.patch('/api/v1/courses/items/' + draggedItem.id, { status: targetColumn });
      toast.success(`Статус изменён на "${COLUMNS.find(c => c.key === targetColumn)?.label}"`);
    } catch {
      // Revert
      setBoard((prev) => ({
        ...prev,
        [targetColumn]: prev[targetColumn].filter((i) => i.id !== draggedItem.id),
        [sourceColumn]: [draggedItem, ...prev[sourceColumn]],
      }));
      toast.error('Не удалось обновить статус');
    }
  };

  // ─── Filtering ─────────────────────────
  const filterItems = (items: ContentItem[]) => {
    let result = items;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.title.toLowerCase().includes(q));
    }
    if (typeFilter) {
      result = result.filter((i) => i.content_type === typeFilter);
    }
    return result;
  };

  // ─── Card click handler ─────────────────
  const handleCardClick = (_item: ContentItem) => {
    // Could navigate to an editor; for now just show a toast
    toast.info(`Элемент: ${_item.title}`);
  };

  // ─── Loading ───────────────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl p-4 space-y-3 animate-pulse min-h-[300px]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded" style={{ background: 'var(--bg-elevated)' }} />
              <div className="h-5 w-6 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
            </div>
            {[1, 2, 3].map((j) => (
              <div key={j} className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-card)' }}>
                <div className="h-3 w-full rounded" style={{ background: 'var(--bg-elevated)' }} />
                <div className="h-2 w-2/3 rounded" style={{ background: 'var(--bg-elevated)' }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  const totalItems = Object.values(board).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
        >
          <option value="">Все типы</option>
          <option value="lesson">Уроки</option>
          <option value="quiz">Тесты</option>
          <option value="video">Видео</option>
          <option value="practice">Практика</option>
          <option value="case_study">Кейсы</option>
          <option value="summary">Итоги</option>
        </select>
        <span className="self-center text-sm whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
          Всего: {totalItems}
        </span>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto -mx-4 px-4 pb-4">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[768px]">
            {COLUMNS.map((col) => (
              <DroppableColumn
                key={col.key}
                column={col}
                items={filterItems(board[col.key])}
                onCardClick={handleCardClick}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeItem ? <OverlayCard item={activeItem} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
