import { useState } from 'react';
import type { Lang } from '../../stores/langStore';
import type { BilingualText } from '../../api/learning';

/** Pick the right language from a bilingual value or return plain string as-is. */
function bl(v: string | BilingualText | undefined | null, lang: Lang): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return (lang === 'uz' && v.uz) ? v.uz : v.ru;
}

// ─── Ordering subtype ───────────────────────────────────
interface OrderingProps {
  question: string;
  items: string[];
  correctOrder: number[];
  explanation?: string;
  questionIndex: number;
  onResult: (questionIndex: number, isCorrect: boolean) => void;
}

function DragDropOrdering({
  question,
  items,
  correctOrder,
  explanation,
  questionIndex,
  onResult,
}: OrderingProps) {
  const [order, setOrder] = useState<number[]>(items.map((_, i) => i));
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const moveItem = (from: number, to: number) => {
    if (checked) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
  };

  const checkAnswer = () => {
    const correct = order.every((v, i) => v === correctOrder[i]);
    setIsCorrect(correct);
    setChecked(true);
    onResult(questionIndex, correct);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      moveItem(dragIdx, idx);
      setDragIdx(idx);
    }
  };
  const handleDragEnd = () => setDragIdx(null);

  return (
    <div>
      <p className="font-medium text-gray-800 mb-1 text-[15px]">
        <span className="text-blue-500 font-bold mr-1">{questionIndex + 1}.</span> {question}
      </p>
      <p className="text-xs text-gray-400 mb-3">Расставьте в правильном порядке (перетаскивайте или используйте кнопки)</p>

      <div className="space-y-2">
        {order.map((itemIdx, pos) => (
          <div
            key={itemIdx}
            draggable={!checked}
            onDragStart={() => handleDragStart(pos)}
            onDragOver={(e) => handleDragOver(e, pos)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
              checked
                ? pos === correctOrder.indexOf(itemIdx)
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
                : dragIdx === pos
                ? 'bg-blue-50 border-blue-300 shadow-md scale-[1.02]'
                : 'bg-white border-gray-200 hover:border-blue-200 cursor-grab active:cursor-grabbing'
            }`}
          >
            {/* Order number */}
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
              checked
                ? pos === correctOrder.indexOf(itemIdx) ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {pos + 1}
            </span>

            {/* Drag handle */}
            {!checked && (
              <svg className="w-4 h-4 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z"/>
              </svg>
            )}

            {/* Text */}
            <span className="flex-1 text-sm text-gray-700">{items[itemIdx]}</span>

            {/* Move buttons for mobile */}
            {!checked && (
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => pos > 0 && moveItem(pos, pos - 1)}
                  disabled={pos === 0}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </button>
                <button
                  onClick={() => pos < order.length - 1 && moveItem(pos, pos + 1)}
                  disabled={pos === order.length - 1}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!checked && (
        <button
          onClick={checkAnswer}
          className="mt-4 px-5 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors"
        >
          Проверить
        </button>
      )}

      {checked && (
        <div className={`mt-3 p-3 rounded-xl text-sm flex items-start gap-2 ${
          isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
        }`}>
          <span className="shrink-0 mt-0.5">{isCorrect ? '✅' : '❌'}</span>
          <span>{isCorrect ? 'Правильный порядок!' : `Неверно. ${explanation || 'Попробуйте ещё раз.'}`}</span>
        </div>
      )}
    </div>
  );
}

// ─── Zones subtype ──────────────────────────────────────
interface ZonesProps {
  question: string;
  items: string[];
  zones: string[];
  correctAnswer: Record<string, string>;
  explanation?: string;
  questionIndex: number;
  onResult: (questionIndex: number, isCorrect: boolean) => void;
}

function DragDropZones({
  question,
  items,
  zones,
  correctAnswer,
  explanation,
  questionIndex,
  onResult,
}: ZonesProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const unassigned = items.filter(item => !Object.keys(assignments).includes(item));

  const assignToZone = (item: string, zone: string) => {
    if (checked) return;
    setAssignments(prev => ({ ...prev, [item]: zone }));
  };

  const removeFromZone = (item: string) => {
    if (checked) return;
    setAssignments(prev => {
      const next = { ...prev };
      delete next[item];
      return next;
    });
  };

  const checkAnswer = () => {
    const correct = Object.keys(correctAnswer).every(
      item => assignments[item] === correctAnswer[item]
    );
    setIsCorrect(correct);
    setChecked(true);
    onResult(questionIndex, correct);
  };

  return (
    <div>
      <p className="font-medium text-gray-800 mb-1 text-[15px]">
        <span className="text-blue-500 font-bold mr-1">{questionIndex + 1}.</span> {question}
      </p>
      <p className="text-xs text-gray-400 mb-3">Перетащите элементы в нужную зону или нажмите на элемент, затем на зону</p>

      {/* Unassigned items */}
      {unassigned.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          {unassigned.map(item => (
            <div
              key={item}
              draggable={!checked}
              onDragStart={() => setDragItem(item)}
              onDragEnd={() => setDragItem(null)}
              onClick={() => setDragItem(dragItem === item ? null : item)}
              className={`px-3 py-2 rounded-lg text-sm font-medium cursor-grab active:cursor-grabbing transition-all ${
                dragItem === item
                  ? 'bg-blue-500 text-white shadow-md scale-105'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              {item}
            </div>
          ))}
        </div>
      )}

      {/* Zones */}
      <div className="space-y-3">
        {zones.map(zone => {
          const zoneItems = Object.entries(assignments)
            .filter(([, z]) => z === zone)
            .map(([item]) => item);

          return (
            <div
              key={zone}
              onDragOver={e => { e.preventDefault(); }}
              onDrop={() => { if (dragItem) { assignToZone(dragItem, zone); setDragItem(null); } }}
              onClick={() => { if (dragItem && !checked) { assignToZone(dragItem, zone); setDragItem(null); } }}
              className={`p-3 rounded-xl border-2 border-dashed transition-all min-h-[60px] ${
                dragItem
                  ? 'border-blue-300 bg-blue-50/50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{zone}</p>
              <div className="flex flex-wrap gap-2">
                {zoneItems.map(item => {
                  const itemCorrect = checked && correctAnswer[item] === zone;
                  const itemWrong = checked && correctAnswer[item] !== zone;
                  return (
                    <div
                      key={item}
                      onClick={(e) => { e.stopPropagation(); if (!checked) removeFromZone(item); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        itemCorrect
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : itemWrong
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-red-50 cursor-pointer border border-gray-200'
                      }`}
                    >
                      {item} {!checked && <span className="text-gray-400 ml-1">×</span>}
                      {itemCorrect && <span className="ml-1">✓</span>}
                      {itemWrong && <span className="ml-1">✗</span>}
                    </div>
                  );
                })}
                {zoneItems.length === 0 && (
                  <p className="text-xs text-gray-300 italic">Перетащите сюда</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!checked && (
        <button
          onClick={checkAnswer}
          disabled={Object.keys(assignments).length < items.length}
          className="mt-4 px-5 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Проверить
        </button>
      )}

      {checked && (
        <div className={`mt-3 p-3 rounded-xl text-sm flex items-start gap-2 ${
          isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
        }`}>
          <span className="shrink-0 mt-0.5">{isCorrect ? '✅' : '❌'}</span>
          <span>{isCorrect ? 'Всё правильно!' : `Неверно. ${explanation || ''}`}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main export ────────────────────────────────────────
export interface DragDropQuestion {
  question: string | BilingualText;
  type: 'drag_drop';
  subtype: 'ordering' | 'zones';
  items: (string | BilingualText)[];
  correct_order?: number[];
  zones?: (string | BilingualText)[] | null;
  correct_answer?: Record<string, string>;
  explanation?: string | BilingualText;
}

interface QuizDragDropProps {
  data: DragDropQuestion;
  lang: Lang;
  questionIndex: number;
  onResult: (questionIndex: number, isCorrect: boolean) => void;
}

export function QuizDragDrop({ data, lang, questionIndex, onResult }: QuizDragDropProps) {
  if (data.subtype === 'ordering' && data.correct_order) {
    return (
      <DragDropOrdering
        question={bl(data.question, lang)}
        items={data.items.map(item => bl(item, lang))}
        correctOrder={data.correct_order}
        explanation={bl(data.explanation, lang)}
        questionIndex={questionIndex}
        onResult={onResult}
      />
    );
  }

  if (data.subtype === 'zones' && data.zones && data.correct_answer) {
    return (
      <DragDropZones
        question={bl(data.question, lang)}
        items={data.items.map(item => bl(item, lang))}
        zones={data.zones.map(zone => bl(zone, lang))}
        correctAnswer={data.correct_answer}
        explanation={bl(data.explanation, lang)}
        questionIndex={questionIndex}
        onResult={onResult}
      />
    );
  }

  return <p className="text-red-500 text-sm">Неизвестный тип drag & drop</p>;
}
