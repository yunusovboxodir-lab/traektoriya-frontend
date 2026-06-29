import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { coursesApi, type QuizQuestion } from '../../api/courses';

interface QuizEditorProps {
  itemId: string;
  onClose: () => void;
}

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Один ответ' },
  { value: 'multi_select', label: 'Несколько ответов' },
  { value: 'true_false', label: 'Верно/Неверно' },
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
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [error, setError] = useState('');

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
      setError('Не удалось загрузить вопросы');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

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
      setError('Не удалось создать вопрос');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (qId: string) => {
    if (!confirm('Удалить вопрос?')) return;
    try {
      await coursesApi.deleteQuestion(qId);
      setQuestions(qs => qs.filter(q => q.id !== qId));
    } catch {
      setError('Не удалось удалить вопрос');
    }
  };

  const handleToggleActive = async (q: QuizQuestion) => {
    try {
      await coursesApi.updateQuestion(q.id, { is_active: !q.is_active });
      setQuestions(qs => qs.map(x => (x.id === q.id ? { ...x, is_active: !x.is_active } : x)));
    } catch {
      setError('Не удалось обновить вопрос');
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
            Управление квизом ({questions.length} вопросов)
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
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>
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
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>#{idx + 1}</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={qTypeBadgeStyle(q.question_type)}
                      >
                        {QUESTION_TYPES.find(t => t.value === q.question_type)?.label || q.question_type}
                      </span>
                      <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{q.question}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{q.points} бал.</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(q); }}
                        className="px-2 py-1 rounded text-xs"
                        style={q.is_active
                          ? { background: 'var(--success-bg)', color: 'var(--success)' }
                          : { background: 'var(--bg-elevated)', color: 'var(--text-muted)' }
                        }
                      >
                        {q.is_active ? 'Вкл' : 'Выкл'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }}
                        className="text-sm"
                        style={{ color: 'var(--danger)' }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>

                  {expandedId === q.id && (
                    <div className="px-4 pb-4 space-y-2" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                      <div className="pt-3">
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Вопрос:</p>
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{q.question}</p>
                      </div>
                      {q.options && q.options.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Варианты:</p>
                          {q.options.map(opt => {
                            const isCorrect = Array.isArray(q.correct_answer)
                              ? (q.correct_answer as string[]).includes(opt.id)
                              : q.correct_answer === opt.id;
                            return (
                              <div
                                key={opt.id}
                                className="text-sm px-3 py-1.5 rounded mb-1"
                                style={isCorrect
                                  ? { background: 'var(--success-bg)', color: 'var(--success)', fontWeight: 500 }
                                  : { background: 'var(--bg-card)', color: 'var(--text-secondary)' }
                                }
                              >
                                <span className="font-mono mr-2">{opt.id.toUpperCase()}.</span>
                                {opt.text}
                                {isCorrect && ' ✓'}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {q.explanation && (
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Пояснение:</p>
                          <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* New question form */}
              {showNewForm ? (
                <div className="rounded-xl p-5 space-y-4" style={{ border: '2px dashed var(--info)', background: 'var(--info-bg)' }}>
                  <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Новый вопрос</h3>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Тип вопроса</label>
                    <select
                      value={newType}
                      onChange={e => {
                        setNewType(e.target.value);
                        if (e.target.value === 'true_false') setNewCorrect('true');
                        else setNewCorrect('a');
                      }}
                      style={fieldStyle}
                    >
                      {QUESTION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Question text */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Текст вопроса</label>
                    <textarea
                      value={newQuestion}
                      onChange={e => setNewQuestion(e.target.value)}
                      className="min-h-[80px]"
                      style={{ ...fieldStyle, resize: 'vertical' }}
                      placeholder="Введите текст вопроса..."
                    />
                  </div>

                  {/* Options (not for true/false) */}
                  {newType !== 'true_false' && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Варианты ответов</label>
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
                            placeholder={`Вариант ${opt.id.toUpperCase()}`}
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
                          + Добавить вариант
                        </button>
                      )}
                    </div>
                  )}

                  {/* True/False selector */}
                  {newType === 'true_false' && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Правильный ответ</label>
                      <div className="flex gap-4">
                        {['true', 'false'].map(v => (
                          <label key={v} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="tf_correct"
                              checked={newCorrect === v}
                              onChange={() => setNewCorrect(v)}
                            />
                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{v === 'true' ? 'Верно' : 'Неверно'}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Пояснение (необязательно)</label>
                    <textarea
                      value={newExplanation}
                      onChange={e => setNewExplanation(e.target.value)}
                      className="min-h-[60px]"
                      style={{ ...fieldStyle, resize: 'vertical' }}
                      placeholder="Почему этот ответ правильный..."
                    />
                  </div>

                  {/* Points & Difficulty */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Баллы</label>
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
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Сложность (1-5)</label>
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
                      {saving ? 'Сохранение...' : 'Добавить вопрос'}
                    </button>
                    <button
                      onClick={resetNewForm}
                      className="px-4 py-2 rounded-lg text-sm"
                      style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="w-full py-3 rounded-xl text-sm transition-colors"
                  style={{ border: '2px dashed var(--border)', color: 'var(--text-muted)' }}
                >
                  + Добавить вопрос
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
