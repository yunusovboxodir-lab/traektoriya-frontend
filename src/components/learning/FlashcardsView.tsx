import { useState } from 'react';
import { useLangStore } from '../../stores/langStore';
import { bl } from '../../utils/bilingual';
import type { BilingualText } from '../../api/learning';

interface FlashCard {
  front: string | BilingualText;
  back: string | BilingualText;
}

interface FlashcardsViewProps {
  cards: FlashCard[];
  onComplete: () => void;
}

export function FlashcardsView({ cards, onComplete }: FlashcardsViewProps) {
  const lang = useLangStore((s) => s.lang);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [remembered, setRemembered] = useState<Set<number>>(new Set());
  const [toRepeat, setToRepeat] = useState<Set<number>>(new Set());

  const currentCard = cards[currentIdx];
  const total = cards.length;

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleRemember = () => {
    setRemembered(prev => new Set(prev).add(currentIdx));
    goNext();
  };

  const handleRepeat = () => {
    setToRepeat(prev => new Set(prev).add(currentIdx));
    goNext();
  };

  const goNext = () => {
    setIsFlipped(false);
    if (currentIdx < total - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const isLastCard = currentIdx === total - 1 && (remembered.has(currentIdx) || toRepeat.has(currentIdx));

  if (isLastCard) {
    return (
      <div className="animate-fadeIn text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl">
          🃏
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Карточки повторены!</h3>
        <div className="flex justify-center gap-4 mb-6">
          <div className="bg-emerald-50 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{remembered.size}</p>
            <p className="text-xs text-emerald-500">Запомнил</p>
          </div>
          <div className="bg-amber-50 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{toRepeat.size}</p>
            <p className="text-xs text-amber-500">На повторение</p>
          </div>
        </div>
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-200 transition-all"
        >
          Продолжить
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-lg">
          🃏
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">Карточки для повторения</h3>
          <p className="text-xs text-gray-400">Нажмите на карточку, чтобы перевернуть</p>
        </div>
        <span className="text-sm font-bold text-gray-400 tabular-nums">
          {currentIdx + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      <div
        onClick={handleFlip}
        className="cursor-pointer perspective-1000 mb-6"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full transition-transform duration-500 preserve-3d"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
            minHeight: '200px',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-8 flex items-center justify-center backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-semibold">Вопрос</p>
              <p className="text-lg font-bold text-gray-800 leading-relaxed">{bl(currentCard.front, lang)}</p>
              <p className="text-xs text-gray-300 mt-4">Нажмите, чтобы увидеть ответ →</p>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-100 p-8 flex items-center justify-center backface-hidden"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="text-center">
              <p className="text-xs text-blue-400 uppercase tracking-wider mb-3 font-semibold">Ответ</p>
              <p className="text-lg font-bold text-blue-800 leading-relaxed">{bl(currentCard.back, lang)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {isFlipped && (
        <div className="flex gap-3 justify-center animate-fadeIn">
          <button
            onClick={handleRemember}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <span>✅</span> Помню
          </button>
          <button
            onClick={handleRepeat}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors shadow-sm"
          >
            <span>🔄</span> Повторить
          </button>
        </div>
      )}
    </div>
  );
}
