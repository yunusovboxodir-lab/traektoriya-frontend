import { useState, useCallback } from 'react';
import type {
  BlockLessonData, LessonBlock, BlockCinematicSceneData, BlockKeyPointData,
  BiText, CinematicDialogue,
} from '../../api/learning';
import { learningApi } from '../../api/learning';
import { bl } from '../../utils/bilingual';
import { useToastStore } from '../../stores/toastStore';

// ============================================================
// BLOCK CARD VIEW — Admin card view for v3 BlockLessonData
// Inline editing + save to backend + preview as user
// ============================================================

interface Props {
  data: BlockLessonData;
  courseId: string;
  lang?: 'ru' | 'uz';
  onComplete: () => void;
  onPreview: () => void;
  onDataUpdate?: (updated: BlockLessonData) => void;
}

const BLOCK_TYPE_LABELS: Record<string, { ru: string; uz: string; icon: string }> = {
  cinematic_scene: { ru: 'Кинематографическая сцена', uz: 'Kinematik sahna', icon: '🎬' },
  video_scene: { ru: 'Видео-сцена', uz: 'Video sahna', icon: '🎥' },
  key_point: { ru: 'Ключевая мысль', uz: 'Asosiy fikr', icon: '💡' },
  swipe_cards: { ru: 'Карточки Верно/Неверно', uz: "To'g'ri/Noto'g'ri kartalar", icon: '👆' },
  sorting: { ru: 'Сортировка', uz: 'Saralash', icon: '🔢' },
  fill_blank: { ru: 'Заполни пропуск', uz: "Bo'sh joyni to'ldiring", icon: '✏️' },
  dialogue_choice: { ru: 'Выбор в диалоге', uz: 'Dialog tanlovi', icon: '💬' },
  quiz: { ru: 'Квиз', uz: 'Viktorina', icon: '✅' },
  results: { ru: 'Результаты', uz: 'Natijalar', icon: '🏆' },
};

export function BlockCardView({ data, courseId, lang = 'ru', onComplete, onPreview, onDataUpdate }: Props) {
  const [expandedBlock, setExpandedBlock] = useState<number>(0);
  const [editMode, setEditMode] = useState(false);
  const [localData, setLocalData] = useState<BlockLessonData>(() => structuredClone(data));
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  // Deep-update a block at given index
  const updateBlock = useCallback((blockIdx: number, updatedBlock: LessonBlock) => {
    setLocalData(prev => {
      const next = structuredClone(prev);
      next.blocks[blockIdx] = updatedBlock;
      return next;
    });
    setHasChanges(true);
  }, []);

  // Save to backend
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await learningApi.updateLessonData(courseId, localData);
      setHasChanges(false);
      onDataUpdate?.(localData);
      addToast('success', lang === 'uz' ? 'Saqlandi' : 'Сохранено');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка сохранения';
      addToast('error', msg);
    } finally {
      setSaving(false);
    }
  }, [courseId, localData, onDataUpdate, addToast, lang]);

  // Discard changes
  const handleDiscard = useCallback(() => {
    setLocalData(structuredClone(data));
    setHasChanges(false);
  }, [data]);

  const displayData = editMode ? localData : data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-800">{bl(displayData.title, lang)}</h3>
          <p className="text-xs text-gray-400 mt-0.5">v3.0 — {displayData.blocks.length} {lang === 'uz' ? 'bloklar' : 'блоков'}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Edit toggle */}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              editMode
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {editMode ? (lang === 'uz' ? 'Tahrirlash' : 'Редактирование') : (lang === 'uz' ? 'Tahrirlash' : 'Редактировать')}
          </button>
          {/* Preview button */}
          <button
            onClick={onPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {lang === 'uz' ? 'Foydalanuvchi sifatida' : 'Просмотр'}
          </button>
        </div>
      </div>

      {/* Save bar (when changes exist) */}
      {editMode && hasChanges && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl animate-fadeIn">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs text-amber-700 flex-1">
            {lang === 'uz' ? "Saqlanmagan o'zgarishlar" : 'Есть несохранённые изменения'}
          </span>
          <button
            onClick={handleDiscard}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
          >
            {lang === 'uz' ? 'Bekor qilish' : 'Отменить'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 px-3 py-1 rounded-lg disabled:opacity-50"
          >
            {saving
              ? (lang === 'uz' ? 'Saqlanmoqda...' : 'Сохранение...')
              : (lang === 'uz' ? 'Saqlash' : 'Сохранить')
            }
          </button>
        </div>
      )}

      {/* Block cards */}
      <div className="space-y-2">
        {displayData.blocks.map((block, idx) => {
          const meta = BLOCK_TYPE_LABELS[block.type] || { ru: block.type, uz: block.type, icon: '📦' };
          const isExpanded = expandedBlock === idx;

          return (
            <div
              key={idx}
              className={`border rounded-xl overflow-hidden transition-all ${
                isExpanded ? 'border-blue-200 shadow-sm' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {/* Block header */}
              <button
                onClick={() => setExpandedBlock(isExpanded ? -1 : idx)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800">
                    {idx + 1}. {lang === 'uz' ? meta.uz : meta.ru}
                  </span>
                  <BlockSubtitle block={block} lang={lang} />
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 animate-fadeIn">
                  <BlockDetailView
                    block={block}
                    blockIdx={idx}
                    lang={lang}
                    editMode={editMode}
                    onUpdate={updateBlock}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="pt-2 flex justify-center gap-3">
        <button
          onClick={onPreview}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {lang === 'uz' ? 'Ishga tushirish' : 'Запустить урок'}
        </button>
        <button
          onClick={onComplete}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          {lang === 'uz' ? 'Yakunlash' : 'Завершить'}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}


// ==============================================================
// Editable BiText field
// ==============================================================

function EditableBiText({
  value,
  lang,
  onChange,
  multiline = false,
  className = '',
  placeholder = '',
}: {
  value: BiText;
  lang: 'ru' | 'uz';
  onChange: (updated: BiText) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const text = bl(value, lang);
  const Tag = multiline ? 'textarea' : 'input';

  return (
    <Tag
      value={text}
      placeholder={placeholder}
      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange({ ...value, [lang]: e.target.value });
      }}
      className={`w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent ${
        multiline ? 'resize-y min-h-[60px]' : ''
      } ${className}`}
    />
  );
}


// ==============================================================
// Subtitle under block header
// ==============================================================

function BlockSubtitle({ block, lang }: { block: LessonBlock; lang: 'ru' | 'uz' }) {
  if (block.type === 'cinematic_scene') {
    const d = block.data as BlockCinematicSceneData;
    const loc = d.location?.subtitle ? bl(d.location.subtitle, lang) : '';
    return loc ? <p className="text-xs text-gray-400 truncate">{loc}</p> : null;
  }
  if (block.type === 'key_point') {
    const d = block.data as BlockKeyPointData;
    return <p className="text-xs text-gray-400 truncate">{bl(d.title, lang)}</p>;
  }
  return null;
}


// ==============================================================
// Expanded block detail (read-only or editable)
// ==============================================================

function BlockDetailView({
  block, blockIdx, lang, editMode, onUpdate,
}: {
  block: LessonBlock;
  blockIdx: number;
  lang: 'ru' | 'uz';
  editMode: boolean;
  onUpdate: (idx: number, b: LessonBlock) => void;
}) {
  switch (block.type) {
    case 'cinematic_scene':
      return (
        <CinematicSceneCard
          data={block.data as BlockCinematicSceneData}
          lang={lang}
          editMode={editMode}
          onChange={(d) => onUpdate(blockIdx, { type: 'cinematic_scene', data: d })}
        />
      );
    case 'key_point':
      return (
        <KeyPointCard
          data={block.data as BlockKeyPointData}
          lang={lang}
          editMode={editMode}
          onChange={(d) => onUpdate(blockIdx, { type: 'key_point', data: d })}
        />
      );
    default:
      return (
        <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
          <pre className="whitespace-pre-wrap break-words max-h-48 overflow-auto">
            {JSON.stringify(block.data, null, 2)}
          </pre>
        </div>
      );
  }
}


// ==============================================================
// Cinematic scene card — Location → Crisis → Backstory → Dialogue → Stakes
// ==============================================================

function CinematicSceneCard({
  data, lang, editMode, onChange,
}: {
  data: BlockCinematicSceneData;
  lang: 'ru' | 'uz';
  editMode: boolean;
  onChange: (d: BlockCinematicSceneData) => void;
}) {
  const loc = data.location;
  const crisis = data.crisis;
  const backstory = data.backstory;
  const dialogues = data.dialogues || [];
  const characters = data.characters || [];

  const charMap = new Map(characters.map(c => [c.id, bl(c.name, lang)]));

  // Helper to update nested fields
  const set = (patch: Partial<BlockCinematicSceneData>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-3">
      {/* 1. Location */}
      {loc && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-3 text-white">
          {editMode ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <EditableBiText value={loc.day} lang={lang} placeholder="День" className="!bg-gray-700 !border-gray-600 !text-white w-1/2" onChange={(v) => set({ location: { ...loc, day: v } })} />
                <EditableBiText value={loc.time} lang={lang} placeholder="Время" className="!bg-gray-700 !border-gray-600 !text-white w-1/2" onChange={(v) => set({ location: { ...loc, time: v } })} />
              </div>
              <EditableBiText value={loc.subtitle} lang={lang} placeholder="Контекст визита" className="!bg-gray-700 !border-gray-600 !text-white" onChange={(v) => set({ location: { ...loc, subtitle: v } })} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-gray-400">{bl(loc.day, lang)}</span>
                <span className="w-1 h-1 rounded-full bg-gray-500" />
                <span className="font-mono text-gray-400">{bl(loc.time, lang)}</span>
              </div>
              <p className="text-sm font-semibold mt-1">{bl(loc.subtitle, lang)}</p>
            </>
          )}
        </div>
      )}

      {/* 2. Crisis */}
      {crisis && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
          {editMode ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-red-700 uppercase">{bl(crisis.badge, lang)}</label>
              <EditableBiText value={crisis.headline} lang={lang} placeholder="Заголовок кризиса" onChange={(v) => set({ crisis: { ...crisis, headline: v } })} />
              <EditableBiText value={crisis.description} lang={lang} multiline placeholder="Описание" onChange={(v) => set({ crisis: { ...crisis, description: v } })} />
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <span className="text-base shrink-0">{crisis.emoji}</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-red-700 uppercase">{bl(crisis.badge, lang)}</p>
                <p className="text-sm text-red-800 mt-0.5 font-medium">{bl(crisis.headline, lang)}</p>
                <p className="text-xs text-red-600 mt-1">{bl(crisis.description, lang)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Backstory */}
      {(backstory || editMode) && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
          <p className="text-xs font-bold text-amber-700 uppercase mb-1">
            {lang === 'uz' ? 'Vaziyat' : 'Ситуация'}
          </p>
          {editMode ? (
            <EditableBiText
              value={backstory || { ru: '', uz: '' }}
              lang={lang}
              multiline
              placeholder={lang === 'uz' ? 'Vaziyat tavsifi...' : 'Описание ситуации...'}
              onChange={(v) => set({ backstory: v })}
            />
          ) : (
            <p className="text-sm text-amber-900 leading-relaxed">{bl(backstory!, lang)}</p>
          )}
        </div>
      )}

      {/* 4. Dialogues */}
      {dialogues.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-gray-500 uppercase">
            {lang === 'uz' ? 'Dialog' : 'Диалог'} ({dialogues.length})
          </p>
          {dialogues.map((d, i) => {
            const name = charMap.get(d.characterId) || d.characterId;
            const char = characters.find(c => c.id === d.characterId);
            const isLeft = char?.side === 'left';

            if (editMode) {
              return (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-gray-500 mt-2 shrink-0 w-20 truncate">{name}:</span>
                  <EditableBiText
                    value={d.text}
                    lang={lang}
                    multiline
                    onChange={(v) => {
                      const newDialogues = [...dialogues];
                      newDialogues[i] = { ...d, text: v } as CinematicDialogue;
                      set({ dialogues: newDialogues });
                    }}
                  />
                </div>
              );
            }

            return (
              <div key={i} className={`flex gap-2 ${isLeft ? '' : 'flex-row-reverse'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                  isLeft ? 'bg-blue-50 text-blue-900' : 'bg-gray-100 text-gray-800'
                }`}>
                  <span className="font-semibold">{name}:</span>{' '}
                  {bl(d.text, lang)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Stakes */}
      {crisis?.stakes && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
          <p className="text-xs font-bold text-purple-700 uppercase mb-1">
            {lang === 'uz' ? 'Nimalar xavf ostida' : 'Что на кону'}
          </p>
          {editMode ? (
            <EditableBiText
              value={crisis.stakes}
              lang={lang}
              multiline
              onChange={(v) => set({ crisis: { ...crisis, stakes: v } })}
            />
          ) : (
            <p className="text-sm text-purple-900">{bl(crisis.stakes, lang)}</p>
          )}
        </div>
      )}

      {/* CTA */}
      {editMode && crisis && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">CTA</p>
          <EditableBiText
            value={crisis.cta}
            lang={lang}
            onChange={(v) => set({ crisis: { ...crisis, cta: v } })}
          />
        </div>
      )}
    </div>
  );
}


// ==============================================================
// Key point card
// ==============================================================

function KeyPointCard({
  data, lang, editMode, onChange,
}: {
  data: BlockKeyPointData;
  lang: 'ru' | 'uz';
  editMode: boolean;
  onChange: (d: BlockKeyPointData) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-xl">{data.icon}</span>
        <div className="flex-1">
          {editMode ? (
            <div className="space-y-1.5">
              <EditableBiText value={data.title} lang={lang} placeholder="Заголовок" onChange={(v) => onChange({ ...data, title: v })} />
              {(data.body || editMode) && (
                <EditableBiText value={data.body || { ru: '', uz: '' }} lang={lang} multiline placeholder="Текст" onChange={(v) => onChange({ ...data, body: v })} />
              )}
            </div>
          ) : (
            <>
              <p className="text-sm font-bold text-gray-800">{bl(data.title, lang)}</p>
              {data.body && <p className="text-xs text-gray-600 mt-1">{bl(data.body, lang)}</p>}
            </>
          )}
        </div>
      </div>

      {data.variant === 'number' && data.number && (
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          {editMode ? (
            <div className="space-y-1">
              <EditableBiText value={data.number} lang={lang} className="text-center !text-lg !font-bold" onChange={(v) => onChange({ ...data, number: v })} />
              {data.numberCaption && <EditableBiText value={data.numberCaption} lang={lang} className="text-center !text-xs" onChange={(v) => onChange({ ...data, numberCaption: v })} />}
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-blue-600">{bl(data.number, lang)}</p>
              {data.numberCaption && <p className="text-xs text-blue-400 mt-1">{bl(data.numberCaption, lang)}</p>}
            </>
          )}
        </div>
      )}

      {!editMode && data.variant === 'chips' && data.chips && (
        <div className="flex flex-wrap gap-1.5">
          {data.chips.map((chip, i) => (
            <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              {bl(chip, lang)}
            </span>
          ))}
        </div>
      )}

      {!editMode && data.variant === 'steps' && data.steps && (
        <div className="space-y-1.5">
          {data.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">
                {step.num}
              </span>
              <p className="text-xs text-gray-700">{bl(step.text, lang)}</p>
            </div>
          ))}
        </div>
      )}

      {data.callout && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
          {editMode ? (
            <EditableBiText value={data.callout} lang={lang} multiline onChange={(v) => onChange({ ...data, callout: v })} />
          ) : (
            <p className="text-xs text-emerald-800">{bl(data.callout, lang)}</p>
          )}
        </div>
      )}
    </div>
  );
}
