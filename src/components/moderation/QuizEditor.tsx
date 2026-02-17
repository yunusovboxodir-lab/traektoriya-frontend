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
      setError('Failed to load questions');
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
      setError('Failed to create question');
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
      setError('Failed to delete question');
    }
  };

  const handleToggleActive = async (q: QuizQuestion) => {
    try {
      await coursesApi.updateQuestion(q.id, { is_active: !q.is_active });
      setQuestions(qs => qs.map(x => (x.id === q.id ? { ...x, is_active: !x.is_active } : x)));
    } catch {
      setError('Failed to update question');
    }
  };

  const updateOption = (idx: number, text: string) => {
    setNewOptions(opts => opts.map((o, i) => (i === idx ? { ...o, text } : o)));
  };

  const addOption = () => {
    const nextId = String.fromCharCode(97 + newOptions.length); // e, f, g...
    setNewOptions([...newOptions, { id: nextId, text: '' }]);
  };

  const removeOption = (idx: number) => {
    if (newOptions.length <= 2) return;
    setNewOptions(opts => opts.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">
            Управление квизом ({questions.length} вопросов)
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : (
            <>
              {/* Existing questions */}
              {questions.map((q, idx) => (
                <div key={q.id} className="border rounded-xl overflow-hidden">
                  <div
                    className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                      !q.is_active ? 'opacity-50' : ''
                    }`}
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-400">#{idx + 1}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          q.question_type === 'multiple_choice'
                            ? 'bg-blue-100 text-blue-700'
                            : q.question_type === 'multi_select'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {QUESTION_TYPES.find(t => t.value === q.question_type)?.label || q.question_type}
                      </span>
                      <span className="text-sm text-gray-700 truncate">{q.question}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{q.points} бал.</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(q); }}
                        className={`px-2 py-1 rounded text-xs ${
                          q.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {q.is_active ? 'Вкл' : 'Выкл'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>

                  {expandedId === q.id && (
                    <div className="px-4 pb-4 border-t bg-gray-50 space-y-2">
                      <div className="pt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Вопрос:</p>
                        <p className="text-sm text-gray-600">{q.question}</p>
                      </div>
                      {q.options && q.options.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Варианты:</p>
                          {q.options.map(opt => {
                            const isCorrect = Array.isArray(q.correct_answer)
                              ? (q.correct_answer as string[]).includes(opt.id)
                              : q.correct_answer === opt.id;
                            return (
                              <div
                                key={opt.id}
                                className={`text-sm px-3 py-1.5 rounded mb-1 ${
                                  isCorrect
                                    ? 'bg-green-100 text-green-800 font-medium'
                                    : 'bg-white text-gray-600'
                                }`}
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
                          <p className="text-sm font-medium text-gray-700 mb-1">Пояснение:</p>
                          <p className="text-sm text-gray-600 italic">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* New question form */}
              {showNewForm ? (
                <div className="border-2 border-dashed border-blue-300 rounded-xl p-5 space-y-4 bg-blue-50/30">
                  <h3 className="font-medium text-gray-900">Новый вопрос</h3>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Тип вопроса</label>
                    <select
                      value={newType}
                      onChange={e => {
                        setNewType(e.target.value);
                        if (e.target.value === 'true_false') setNewCorrect('true');
                        else setNewCorrect('a');
                      }}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      {QUESTION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Question text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Текст вопроса</label>
                    <textarea
                      value={newQuestion}
                      onChange={e => setNewQuestion(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]"
                      placeholder="Введите текст вопроса..."
                    />
                  </div>

                  {/* Options (not for true/false) */}
                  {newType !== 'true_false' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Варианты ответов</label>
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
                          <span className="font-mono text-sm text-gray-400 w-5">{opt.id.toUpperCase()}.</span>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={e => updateOption(idx, e.target.value)}
                            className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                            placeholder={`Вариант ${opt.id.toUpperCase()}`}
                          />
                          {newOptions.length > 2 && (
                            <button
                              onClick={() => removeOption(idx)}
                              className="text-red-400 hover:text-red-600 text-lg"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      ))}
                      {newOptions.length < 8 && (
                        <button
                          onClick={addOption}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Добавить вариант
                        </button>
                      )}
                    </div>
                  )}

                  {/* True/False selector */}
                  {newType === 'true_false' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Правильный ответ</label>
                      <div className="flex gap-4">
                        {['true', 'false'].map(v => (
                          <label key={v} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="tf_correct"
                              checked={newCorrect === v}
                              onChange={() => setNewCorrect(v)}
                            />
                            <span className="text-sm">{v === 'true' ? 'Верно' : 'Неверно'}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Пояснение (необязательно)</label>
                    <textarea
                      value={newExplanation}
                      onChange={e => setNewExplanation(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm min-h-[60px]"
                      placeholder="Почему этот ответ правильный..."
                    />
                  </div>

                  {/* Points & Difficulty */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Баллы</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={newPoints}
                        onChange={e => setNewPoints(Number(e.target.value))}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Сложность (1-5)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={newDifficulty}
                        onChange={e => setNewDifficulty(Number(e.target.value))}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCreate}
                      disabled={saving || !newQuestion.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Сохранение...' : 'Добавить вопрос'}
                    </button>
                    <button
                      onClick={resetNewForm}
                      className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="w-full py-3 border-2 border-dashed rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
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
