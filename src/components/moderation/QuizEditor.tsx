import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { coursesApi, type QuizQuestion } from '../../api/courses';
import { useT } from '../../stores/langStore';

interface QuizEditorProps {
  itemId: string;
  onClose: () => void;
}

// label → labelKey: тексты живут в словарях src/i18n (i18n)
const QUESTION_TYPES = [
  { value: 'multiple_choice', labelKey: 'moderation.quizEditor.typeSingle' },
  { value: 'multi_select', labelKey: 'moderation.quizEditor.typeMulti' },
  { value: 'true_false', labelKey: 'moderation.quizEditor.typeTrueFalse' },
];

const DEFAULT_OPTIONS = [
  { id: 'a', text: '' },
  { id: 'b', text: '' },
  { id: 'c', text: '' },
  { id: 'd', text: '' },
];

// Shared input style
const fieldStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: 8,
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  width: '100%',
  outline: 'none',
};

function qTypeBadgeStyle(qType: string): React.CSSProperties {
  if (qType === 'multiple_choice') return { background: 'var(--info-bg)', color: 'var(--info)' };
  if (qType === 'multi_select') return { background: 'var(--color-tp-bg)', color: 'var(--color-tp)' };
  return { background: 'var(--warning-bg)', color: 'var(--warning)' };
}

export function QuizEditor({ itemId, onClose }: QuizEditorProps) {
  const t = useT();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [error, setError] = useState('');

  // Edit question state (inline edit при разворачивании)
  const [editQuestion, setEditQuestion] = useState('');
  const [editOptions, setEditOptions] = useState<Array<{ id: string; text: string }>>([]);
  const [editCorrect, setEditCorrect] = useState<string | string[]>('');
  const [editExplanation, setEditExplanation] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // New question form state
  const [newType, setNewType] = useState('multiple_choice');
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(DEFAULT_OPTIONS.map(o => ({ ...o })));
  const [newCorrect, setNewCorrect] = useState<string | string[]>('a');
  const [newExplanation, setNewExplanation] = useState('');
  const [newPoints, setNewPoints] = useState(1);
  const [newDifficulty, setNewDifficulty] = useState(2);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await coursesApi.getQuestions(itemId);
      setQuestions(resp.data.items);
    } catch {
      setError(t('moderation.quizEditor.loadError'));
    } finally {
      setLoading(false);
    }
  }, [itemId, t]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const resetNewForm = () => {
    setNewType('multiple_choice');
    setNewQuestion('');
    setNewOptions(DEFAULT_OPTIONS.map(o => ({ ...o })));
    setNewCorrect('a');
    setNewExplanation('');
    setNewPoints(1);
    setNewDifficulty(2);
    setShowNewForm(false);
  };

  // Заполнить форму редактирования из данных вопроса
  const initEditFromQuestion = (q: QuizQuestion) => {
    setEditQuestion(q.question);
    setEditOptions(q.options ? q.options.map(o => ({ id: o.id, text: o.text })) : []);
    setEditCorrect(q.correct_answer as string | string[]);
    setEditExplanation(q.explanation || '');
  };

  const handleUpdate = async (q: QuizQuestion) => {
    if (!editQuestion.trim()) return;
    setEditSaving(true);
    setError('');
    try {
      await coursesApi.updateQuestion(q.id, {
        question: editQuestion.trim(),
        options: editOptions.filter(o => o.text.trim()),
        correct_answer: editCorrect,
        explanation: editExplanation || undefined,
      });
      await fetchQuestions();
    } catch {
      setError(t('moderation.quizEditor.saveError'));
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newQuestion.trim()) return;
    try {
      setSaving(true);
      setError('');

      let correctAnswer: string | string[];
      if (newType === 'true_false') {
        correctAnswer = newCorrect as string;
      } else if (newType === 'multi_select') {
        correctAnswer = Array.isArray(newCorrect) ? newCorrect : [newCorrect as string];
      } else {
        correctAnswer = newCorrect as string;
      }

      const options =
        newType === 'true_false'
          ? [{ id: 'true', text: 'Верно' }, { id: 'false', text: 'Неверно' }]
          : newOptions.filter(o => o.text.trim());

      await coursesApi.createQuestion(itemId, {
        question_type: newType,
        question: newQuestion,
        options,
        correct_answer: correctAnswer,
        explanation: newExplanation || undefined,
        points: newPoints,
        difficulty: newDifficulty,
        sort_order: questions.length,
      });
      resetNewForm();
      await fetchQuestions();
    } catch {
      setError(t('moderation.quizEditor.createError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (qId: string) => {
    if (!confirm(t('moderation.quizEditor.deleteConfirm'))) return;
    try {
      await coursesApi.deleteQuestion(qId);
      setQuestions(qs => qs.filter(q => q.id !== qId));
    } catch {
      setError(t('moderation.quizEditor.deleteError'));
    }
  };

  const handleToggleActive = async (q: QuizQuestion) => {
    try {
      await coursesApi.updateQuestion(q.id, { is_active: !q.is_active });
      setQuestions(qs => qs.map(x => (x.id === q.id ? { ...x, is_active: !x.is_active } : x)));
    } catch {
      setError(t('moderation.quizEditor.toggleError'));
    }
  };

  const updateOption = (idx: number, text: string) => {
    setNewOptions(opts => opts.map((o, i) => (i === idx ? { ...o, text } : o)));
  };

  const addOption = () => {
    const nextId = String.fromCharCode(97 + newOptions.length);
    setNewOptions([...newOptions, { id: nextId, text: '' }]);
  };

  const removeOption = (idx: number) => {
    if (newOptions.length <= 2) return;
    setNewOptions(opts => opts.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div className="sticky top-0 px-6 py-4 flex items-center justify-between rounded-t-2xl" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('moderation.quizEditor.title', { n: questions.length })}
          </h2>
          <button onClick={onClose} className="text-xl" style={{ color: 'var(--text-muted)' }}>
            &times;
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>{error}</div>
          )}

          {loading ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</div>
          ) : (
            <>
              {/* Existing questions */}
              {questions.map((q, idx) => (
                <div key={q.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <div
                    className="px-4 py-3 flex items-center justify-between cursor-pointer transition-colors"
                    style={{
                      opacity: q.is_active ? 1 : 0.5,
                      background: 'var(--bg-surface)',
                    }}
                    onClick={() => {
                      if (expandedId === q.id) {
                        setExpandedId(null);
                      } else {
                        setExpandedId(q.id);
                        initEditFromQuestion(q);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>#{idx + 1}</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={qTypeBadgeStyle(q.question_type)}
                      >
                        {(() => {
                          const qt = QUESTION_TYPES.find(qType => qType.value === q.question_type);
                          return qt ? t(qt.labelKey) : q.question_type;
                        })()}
                      </span>
                      <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{q.question}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('moderation.quizEditor.pointsShort', { n: q.points })}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(q); }}
                        className="px-2 py-1 rounded text-xs"
                        style={q.is_active
                          ? { background: 'var(--success-bg)', color: 'var(--success)' }
                          : { background: 'var(--bg-elevated)', color: 'var(--text-muted)' }
                        }
                      >
                        {q.is_active ? t('moderation.quizEditor.on') : t('moderation.quizEditor.off')}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }}
                        className="text-sm"
                        style={{ color: 'var(--danger)' }}
                      >
                        {t('common.actions.delete')}
                      </button>
                    </div>
                  </div>

                  {expandedId === q.id && (
                    <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                      <div className="pt-3">
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('moderation.quizEditor.questionText')}</label>
                        <textarea
                          rows={2}
                          value={editQuestion}
                          onChange={(e) => setEditQuestion(e.target.value)}
                          style={{ ...fieldStyle, resize: 'vertical' }}
                        />
                      </div>
                      {editOptions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('moderation.quizEditor.options')}</p>
                          {editOptions.map((opt, i) => {
                            const isCorrect = Array.isArray(editCorrect)
                              ? (editCorrect as string[]).includes(opt.id)
                              : editCorrect === opt.id;
                            return (
                              <div key={opt.id} className="flex items-center gap-2 mb-1">
                                <input
                                  type="checkbox"
                                  checked={isCorrect}
                                  onChange={() => {
                                    if (Array.isArray(editCorrect)) {
                                      setEditCorrect(
                                        isCorrect
                                          ? (editCorrect as string[]).filter((x) => x !== opt.id)
                                          : [...(editCorrect as string[]), opt.id],
                                      );
                                    } else {
                                      setEditCorrect(opt.id);
                                    }
                                  }}
                                  className="flex-shrink-0"
                                />
                                <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{opt.id.toUpperCase()}.</span>
                                <input
                                  value={opt.text}
                                  onChange={(e) => {
                                    const updated = editOptions.map((o, j) => j === i ? { ...o, text: e.target.value } : o);
                                    setEditOptions(updated);
                                  }}
                                  style={{ ...fieldStyle, padding: '0.25rem 0.5rem' }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('moderation.quizEditor.explanation')}</label>
                        <input
                          value={editExplanation}
                          onChange={(e) => setEditExplanation(e.target.value)}
                          style={fieldStyle}
                          placeholder={t('moderation.quizEditor.optional')}
                        />
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleUpdate(q)}
                          disabled={editSaving || !editQuestion.trim()}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
                          style={{ background: 'var(--info)', color: '#fff' }}
                        >
                          {editSaving ? t('moderation.quizEditor.saving') : t('common.save')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* New question form */}
              {showNewForm ? (
                <div className="rounded-xl p-5 space-y-4" style={{ border: '2px dashed var(--info)', background: 'var(--info-bg)' }}>
                  <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('moderation.quizEditor.newQuestion')}</h3>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('moderation.quizEditor.questionType')}</label>
                    <select
                      value={newType}
                      onChange={e => {
                        setNewType(e.target.value);
                        if (e.target.value === 'true_false') setNewCorrect('true');
                        else setNewCorrect('a');
                      }}
                      style={fieldStyle}
                    >
                      {QUESTION_TYPES.map(qt => (
                        <option key={qt.value} value={qt.value}>{t(qt.labelKey)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Question text */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('moderation.quizEditor.questionText')}</label>
                    <textarea
                      value={newQuestion}
                      onChange={e => setNewQuestion(e.target.value)}
                      className="min-h-[80px]"
                      style={{ ...fieldStyle, resize: 'vertical' }}
                      placeholder={t('moderation.quizEditor.questionPlaceholder')}
                    />
                  </div>

                  {/* Options (not for true/false) */}
                  {newType !== 'true_false' && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('moderation.quizEditor.options')}</label>
                      {newOptions.map((opt, idx) => (
                        <div key={opt.id} className="flex items-center gap-2 mb-2">
                          <input
                            type={newType === 'multi_select' ? 'checkbox' : 'radio'}
                            name="correct"
                            checked={
                              newType === 'multi_select'
                                ? (Array.isArray(newCorrect) && newCorrect.includes(opt.id))
                                : newCorrect === opt.id
                            }
                            onChange={() => {
                              if (newType === 'multi_select') {
                                const arr = Array.isArray(newCorrect) ? [...newCorrect] : [];
                                const idx2 = arr.indexOf(opt.id);
                                if (idx2 >= 0) arr.splice(idx2, 1);
                                else arr.push(opt.id);
                                setNewCorrect(arr);
                              } else {
                                setNewCorrect(opt.id);
                              }
                            }}
                            className="mt-0.5"
                          />
                          <span className="font-mono text-sm w-5" style={{ color: 'var(--text-muted)' }}>{opt.id.toUpperCase()}.</span>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={e => updateOption(idx, e.target.value)}
                            style={{ ...fieldStyle, width: undefined, flex: 1 }}
                            placeholder={t('moderation.quizEditor.optionPlaceholder', { letter: opt.id.toUpperCase() })}
                          />
                          {newOptions.length > 2 && (
                            <button
                              onClick={() => removeOption(idx)}
                              className="text-lg"
                              style={{ color: 'var(--danger)' }}
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      ))}
                      {newOptions.length < 8 && (
                        <button
                          onClick={addOption}
                          className="text-sm"
                          style={{ color: 'var(--info)' }}
                        >
                          {t('moderation.quizEditor.addOption')}
                        </button>
                      )}
                    </div>
                  )}

                  {/* True/False selector */}
                  {newType === 'true_false' && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('moderation.quizEditor.correctAnswer')}</label>
                      <div className="flex gap-4">
                        {['true', 'false'].map(v => (
                          <label key={v} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="tf_correct"
                              checked={newCorrect === v}
                              onChange={() => setNewCorrect(v)}
                            />
                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{v === 'true' ? t('moderation.quizEditor.true') : t('moderation.quizEditor.false')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('moderation.quizEditor.explanationOptional')}</label>
                    <textarea
                      value={newExplanation}
                      onChange={e => setNewExplanation(e.target.value)}
                      className="min-h-[60px]"
                      style={{ ...fieldStyle, resize: 'vertical' }}
                      placeholder={t('moderation.quizEditor.explanationPlaceholder')}
                    />
                  </div>

                  {/* Points & Difficulty */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('moderation.quizEditor.points')}</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={newPoints}
                        onChange={e => setNewPoints(Number(e.target.value))}
                        style={fieldStyle}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('moderation.quizEditor.difficultyRange')}</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={newDifficulty}
                        onChange={e => setNewDifficulty(Number(e.target.value))}
                        style={fieldStyle}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCreate}
                      disabled={saving || !newQuestion.trim()}
                      className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                      style={{ background: 'var(--info)', color: 'var(--text-inverse)' }}
                    >
                      {saving ? t('moderation.quizEditor.saving') : t('moderation.quizEditor.addQuestion')}
                    </button>
                    <button
                      onClick={resetNewForm}
                      className="px-4 py-2 rounded-lg text-sm"
                      style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="w-full py-3 rounded-xl text-sm transition-colors"
                  style={{ border: '2px dashed var(--border)', color: 'var(--text-muted)' }}
                >
                  {t('moderation.quizEditor.addQuestionButton')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
