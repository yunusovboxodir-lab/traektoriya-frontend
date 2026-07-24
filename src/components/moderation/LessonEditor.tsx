import { useState, useEffect, useCallback } from 'react';
import { coursesApi, type ContentItem } from '../../api/courses';
import { QuizEditor } from './QuizEditor';
import { MediaManager } from './MediaManager';
import { renderMarkdown } from '@/lib/renderMarkdown';
import { useT } from '../../stores/langStore';

interface LessonEditorProps {
  itemId: string;
  onClose: () => void;
  onSaved: () => void;
}

// label → labelKey: тексты живут в словарях src/i18n (i18n)
const DIFFICULTY_KEYS: Record<number, string> = {
  1: 'moderation.difficulty.beginner',
  2: 'moderation.difficulty.intermediate',
  3: 'moderation.difficulty.advanced',
  4: 'moderation.difficulty.expert',
};

const STATUS_OPTIONS = [
  { value: 'draft', labelKey: 'moderation.status.draft' },
  { value: 'review', labelKey: 'moderation.status.review' },
  { value: 'approved', labelKey: 'moderation.status.approved' },
  { value: 'published', labelKey: 'moderation.status.published' },
  { value: 'rejected', labelKey: 'moderation.status.rejected' },
];


export function LessonEditor({ itemId, onClose, onSaved }: LessonEditorProps) {
  const t = useT();
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
          <p className="text-red-600">{error || t('moderation.lessonEditor.notFound')}</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm">
            {t('common.close')}
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
              <h2 className="text-lg font-bold text-gray-900">{t('moderation.lessonEditor.title')}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{item.path} — {item.content_type}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? t('moderation.quizEditor.saving') : t('common.save')}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                {t('common.close')}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('moderation.colTitle')}</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('moderation.statusLabel')}</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('moderation.colDifficulty')}</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {Object.entries(DIFFICULTY_KEYS).map(([k, key]) => (
                    <option key={k} value={k}>{t(key)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('moderation.lessonEditor.durationMin')}</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('moderation.quizEditor.points')}</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('moderation.lessonEditor.learningObjective')}</label>
              <input
                type="text"
                value={learningObjective}
                onChange={e => setLearningObjective(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder={t('moderation.lessonEditor.learningObjectivePlaceholder')}
              />
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">{t('moderation.lessonEditor.contentMarkdown')}</label>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showPreview ? t('moderation.lessonEditor.editor') : t('moderation.lessonEditor.preview')}
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
                  placeholder={t('moderation.lessonEditor.contentPlaceholder')}
                />
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowQuizEditor(true)}
                className="flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>📝</span> {t('moderation.lessonEditor.manageQuiz')}
              </button>
              <button
                onClick={() => setShowMediaManager(true)}
                className="flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>📎</span> {t('moderation.mediaManager.title')}
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
