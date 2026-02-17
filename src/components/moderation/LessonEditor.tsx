import { useState, useEffect, useCallback } from 'react';
import { coursesApi, type ContentItem } from '../../api/courses';
import { QuizEditor } from './QuizEditor';
import { MediaManager } from './MediaManager';

interface LessonEditorProps {
  itemId: string;
  onClose: () => void;
  onSaved: () => void;
}

const DIFFICULTY_MAP: Record<number, string> = {
  1: 'Начальный',
  2: 'Средний',
  3: 'Продвинутый',
  4: 'Экспертный',
};

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Черновик' },
  { value: 'review', label: 'На проверке' },
  { value: 'approved', label: 'Утверждён' },
  { value: 'published', label: 'Опубликован' },
  { value: 'rejected', label: 'Отклонён' },
];

function renderMarkdown(text: string): string {
  return text
    .replace(/### (.+)/g, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
    .replace(/## (.+)/g, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
    .replace(/# (.+)/g, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export function LessonEditor({ itemId, onClose, onSaved }: LessonEditorProps) {
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showMediaManager, setShowMediaManager] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [learningObjective, setLearningObjective] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [duration, setDuration] = useState(5);
  const [status, setStatus] = useState('draft');
  const [points, setPoints] = useState(10);

  const fetchItem = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await coursesApi.getContentItemDetail(itemId);
      const data = resp.data;
      setItem(data);
      setTitle(data.title || '');
      setContent(data.content || '');
      setLearningObjective(data.learning_objective || '');
      setDifficulty(data.difficulty_level);
      setDuration(data.duration_minutes);
      setStatus(data.status);
      setPoints(data.points);
    } catch {
      setError('Failed to load content item');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await coursesApi.updateContentItem(itemId, {
        title,
        content,
        learning_objective: learningObjective,
        difficulty_level: difficulty,
        duration_minutes: duration,
        status,
        points,
      });
      onSaved();
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleMediaUpdate = (updated: ContentItem) => {
    setItem(updated);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="text-red-600">{error || 'Элемент не найден'}</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm">
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Редактирование урока</h2>
              <p className="text-sm text-gray-500 mt-0.5">{item.path} — {item.content_type}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Закрыть
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Status + Difficulty row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сложность</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {Object.entries(DIFFICULTY_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Длительность (мин)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Баллы</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={points}
                  onChange={e => setPoints(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Learning objective */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Учебная цель</label>
              <input
                type="text"
                value={learningObjective}
                onChange={e => setLearningObjective(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Что студент освоит после этого урока..."
              />
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Контент (Markdown)</label>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showPreview ? 'Редактор' : 'Предпросмотр'}
                </button>
              </div>
              {showPreview ? (
                <div
                  className="border rounded-lg px-4 py-3 min-h-[300px] prose prose-sm max-w-none bg-gray-50"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                />
              ) : (
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono min-h-[300px] resize-y"
                  placeholder="Markdown контент урока..."
                />
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowQuizEditor(true)}
                className="flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>📝</span> Управление квизом
              </button>
              <button
                onClick={() => setShowMediaManager(true)}
                className="flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>📎</span> Медиафайлы
                {item.media_urls && item.media_urls.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs">
                    {item.media_urls.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Editor modal */}
      {showQuizEditor && (
        <QuizEditor itemId={itemId} onClose={() => setShowQuizEditor(false)} />
      )}

      {/* Media Manager modal */}
      {showMediaManager && item && (
        <MediaManager
          item={item}
          onUpdate={handleMediaUpdate}
          onClose={() => setShowMediaManager(false)}
        />
      )}
    </>
  );
}
