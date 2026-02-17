import { useState, useRef, useCallback } from 'react';
import { coursesApi, type ContentItem, type MediaEntry } from '../../api/courses';

interface MediaManagerProps {
  item: ContentItem;
  onUpdate: (updated: ContentItem) => void;
  onClose: () => void;
}

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_SIZE_MB = 10;

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function MediaManager({ item, onUpdate, onClose }: MediaManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaList: MediaEntry[] = item.media_urls || [];

  const handleFileUpload = useCallback(
    async (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setError(`Формат .${ext} не поддерживается. Допустимые: ${ALLOWED_EXTENSIONS.join(', ')}`);
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Файл слишком большой. Максимум ${MAX_SIZE_MB} МБ`);
        return;
      }

      try {
        setUploading(true);
        setError('');
        const resp = await coursesApi.uploadMedia(item.id, file);
        onUpdate(resp.data);
      } catch {
        setError('Ошибка загрузки файла');
      } finally {
        setUploading(false);
      }
    },
    [item.id, onUpdate],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  const handleAddVideoUrl = async () => {
    if (!videoUrl.trim()) return;
    if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
      setError('URL должен начинаться с http:// или https://');
      return;
    }
    try {
      setError('');
      const resp = await coursesApi.addMediaUrl(item.id, videoUrl, 'video');
      onUpdate(resp.data);
      setVideoUrl('');
    } catch {
      setError('Ошибка добавления URL');
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Удалить медиа?')) return;
    try {
      setError('');
      const resp = await coursesApi.deleteMedia(item.id, index);
      onUpdate(resp.data);
    } catch {
      setError('Ошибка удаления');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">Медиафайлы</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
          )}

          {/* Upload area */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Загрузка изображений</h3>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              {uploading ? (
                <div className="text-blue-600">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm">Загрузка...</p>
                </div>
              ) : (
                <>
                  <div className="text-3xl mb-2">📷</div>
                  <p className="text-sm text-gray-600">
                    Перетащите изображение сюда или нажмите для выбора
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, GIF, WebP (до {MAX_SIZE_MB} МБ)
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.map(e => `.${e}`).join(',')}
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />
          </div>

          {/* Video URL */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Добавить видео URL</h3>
            <div className="flex gap-2">
              <input
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleAddVideoUrl}
                disabled={!videoUrl.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Добавить
              </button>
            </div>
          </div>

          {/* Media list */}
          {mediaList.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Медиафайлы ({mediaList.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {mediaList.map((m, idx) => (
                  <div key={idx} className="border rounded-xl overflow-hidden group relative">
                    {m.type === 'image' ? (
                      <img
                        src={m.url}
                        alt={m.original_filename || `Image ${idx + 1}`}
                        className="w-full h-40 object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160" fill="%23f3f4f6"><rect width="200" height="160"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14">Image</text></svg>';
                        }}
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                        {getYouTubeId(m.url) ? (
                          <img
                            src={`https://img.youtube.com/vi/${getYouTubeId(m.url)}/mqdefault.jpg`}
                            alt="YouTube"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <div className="text-3xl">🎬</div>
                            <p className="text-xs text-gray-500 mt-1 px-2 truncate max-w-full">
                              {m.url}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500 truncate flex-1">
                        {m.original_filename || (m.type === 'video' ? 'Видео' : 'Изображение')}
                      </span>
                      <button
                        onClick={() => handleDelete(idx)}
                        className="text-red-400 hover:text-red-600 text-sm ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
