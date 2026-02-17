import { useState } from 'react';

interface Hotspot {
  x: number;     // % from left
  y: number;     // % from top
  radius: number; // % radius
  label: string;
  is_correct: boolean;
}

export interface HotspotQuestion {
  question: string;
  type: 'hotspot';
  image_url: string;
  hotspots: Hotspot[];
  min_correct: number;
  explanation?: string;
}

interface QuizHotspotProps {
  data: HotspotQuestion;
  questionIndex: number;
  onResult: (questionIndex: number, isCorrect: boolean) => void;
}

export function QuizHotspot({ data, questionIndex, onResult }: QuizHotspotProps) {
  const [clicked, setClicked] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  const toggleHotspot = (idx: number) => {
    if (checked) return;
    setClicked(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const checkAnswer = () => {
    const clickedCorrect = [...clicked].filter(i => data.hotspots[i].is_correct).length;
    const clickedWrong = [...clicked].filter(i => !data.hotspots[i].is_correct).length;
    const correct = clickedCorrect >= data.min_correct && clickedWrong === 0;
    setIsCorrect(correct);
    setChecked(true);
    setShowLabels(true);
    onResult(questionIndex, correct);
  };

  const correctCount = data.hotspots.filter(h => h.is_correct).length;
  const foundCount = [...clicked].filter(i => data.hotspots[i].is_correct).length;

  return (
    <div>
      <p className="font-medium text-gray-800 mb-1 text-[15px]">
        <span className="text-blue-500 font-bold mr-1">{questionIndex + 1}.</span> {data.question}
      </p>
      <p className="text-xs text-gray-400 mb-3">
        Нажмите на проблемные области на изображении (найдите минимум {data.min_correct} из {correctCount})
      </p>

      {/* Image with hotspots */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
        <img
          src={data.image_url}
          alt="Hotspot quiz"
          className="w-full h-auto"
          draggable={false}
        />

        {/* Hotspot overlays */}
        {data.hotspots.map((spot, i) => {
          const isClicked = clicked.has(i);
          const isCorrectSpot = spot.is_correct;

          let spotClass = '';
          if (checked) {
            if (isClicked && isCorrectSpot) spotClass = 'bg-emerald-400/40 border-emerald-500 ring-2 ring-emerald-300';
            else if (isClicked && !isCorrectSpot) spotClass = 'bg-red-400/40 border-red-500 ring-2 ring-red-300';
            else if (!isClicked && isCorrectSpot) spotClass = 'bg-amber-400/40 border-amber-500 animate-pulse';
            else spotClass = 'hidden';
          } else {
            spotClass = isClicked
              ? 'bg-blue-400/30 border-blue-500 ring-2 ring-blue-300 scale-110'
              : 'bg-transparent border-transparent hover:bg-white/20 hover:border-white/50';
          }

          return (
            <button
              key={i}
              onClick={() => toggleHotspot(i)}
              className={`absolute rounded-full border-2 transition-all duration-200 cursor-pointer ${spotClass}`}
              style={{
                left: `${spot.x - spot.radius}%`,
                top: `${spot.y - spot.radius}%`,
                width: `${spot.radius * 2}%`,
                height: `${spot.radius * 2}%`,
                // Ensure minimum clickable size
                minWidth: '32px',
                minHeight: '32px',
              }}
              title={showLabels ? spot.label : ''}
            >
              {/* Pulse animation for unclicked spots */}
              {!checked && !isClicked && (
                <span className="absolute inset-0 rounded-full border border-white/30 animate-ping" />
              )}

              {/* Label on check */}
              {showLabels && (isClicked || (checked && isCorrectSpot)) && (
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold bg-black/75 text-white px-1.5 py-0.5 rounded">
                  {spot.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Found counter */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-500">
          Отмечено: <span className="font-bold text-gray-700">{clicked.size}</span>
          {checked && ` (правильных: ${foundCount}/${correctCount})`}
        </span>

        {!checked && (
          <button
            onClick={checkAnswer}
            disabled={clicked.size === 0}
            className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Проверить
          </button>
        )}
      </div>

      {checked && (
        <div className={`mt-3 p-3 rounded-xl text-sm flex items-start gap-2 ${
          isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
        }`}>
          <span className="shrink-0 mt-0.5">{isCorrect ? '✅' : '❌'}</span>
          <span>{isCorrect ? 'Все проблемные области найдены!' : `${data.explanation || 'Не все области найдены верно.'}`}</span>
        </div>
      )}
    </div>
  );
}
