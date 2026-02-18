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
  color: string;
  border: string;
  badge: string;
  dot: string;
}

// ───────────────────────────────────────
// Constants
// ───────────────────────────────────────

const COLUMNS: Column[] = [
  { key: 'draft', label: 'Черновик', color: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-500', dot: 'bg-slate-400' },
  { key: 'review', label: 'На проверке', color: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500', dot: 'bg-amber-400' },
  { key: 'approved', label: 'Одобрено', color: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-500', dot: 'bg-green-400' },
  { key: 'published', label: 'Опубликовано', color: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-500', dot: 'bg-emerald-400' },
];

const VALID_TRANSITIONS: Record<ColumnKey, ColumnKey[]> = {
  draft: ['review'],
  review: ['approved', 'draft'],
  approved: ['published', 'review'],
  published: [],
};

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  lesson: { label: 'Урок', color: 'bg-blue-100 text-blue-700' },
  quiz: { label: 'Тест', color: 'bg-purple-100 text-purple-700' },
  video: { label: 'Видео', color: 'bg-pink-100 text-pink-700' },
  practice: { label: 'Практика', color: 'bg-green-100 text-green-700' },
  case_study: { label: 'Кейс', color: 'bg-orange-100 text-orange-700' },
  summary: { label: 'Итог', color: 'bg-gray-100 text-gray-600' },
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

  const typeBadge = TYPE_BADGES[item.content_type] || TYPE_BADGES.lesson;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-3.5 hover:shadow-md transition-all group cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-blue-300' : ''
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
        <h4 className="font-medium text-sm text-gray-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
          {item.title}
        </h4>
      </button>

      {/* Meta */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeBadge.color}`}>
          {typeBadge.label}
        </span>
        {item.difficulty_level && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
            {DIFFICULTY_LABELS[item.difficulty_level] || `Ур.${item.difficulty_level}`}
          </span>
        )}
      </div>

      {/* Updated date */}
      <p className="text-[10px] text-gray-400 mt-2">
        {new Date(item.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
      </p>
    </div>
  );
}

// ───────────────────────────────────────
// Overlay card (for drag preview)
// ───────────────────────────────────────

function OverlayCard({ item }: { item: ContentItem }) {
  const typeBadge = TYPE_BADGES[item.content_type] || TYPE_BADGES.lesson;
  return (
    <div className="bg-white rounded-xl shadow-xl border-2 border-blue-400 p-3.5 w-64 rotate-2">
      <h4 className="font-medium text-sm text-gray-900 leading-snug line-clamp-2">{item.title}</h4>
      <div className="flex items-center gap-1.5 mt-2">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeBadge.color}`}>
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
      className={`${column.color} rounded-xl border ${column.border} p-4 min-h-[300px] transition-all ${
        isOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${column.dot}`} />
          <h3 className="font-semibold text-sm text-gray-700">{column.label}</h3>
        </div>
        <span className={`${column.badge} text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold`}>
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
            <svg className="mx-auto w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-gray-400 text-xs">Нет элементов</p>
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
          <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3 animate-pulse min-h-[300px]">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-5 w-6 bg-gray-200 rounded-full" />
            </div>
            {[1, 2, 3].map((j) => (
              <div key={j} className="bg-white rounded-xl p-3 space-y-2">
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-2 w-2/3 bg-gray-200 rounded" />
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
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">Все типы</option>
          <option value="lesson">Уроки</option>
          <option value="quiz">Тесты</option>
          <option value="video">Видео</option>
          <option value="practice">Практика</option>
          <option value="case_study">Кейсы</option>
          <option value="summary">Итоги</option>
        </select>
        <span className="self-center text-sm text-gray-500 whitespace-nowrap">
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
