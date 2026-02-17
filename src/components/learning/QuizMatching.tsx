import { useState, useRef, useEffect, useCallback } from 'react';

const PAIR_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700', line: '#3b82f6' },
  { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-700', line: '#10b981' },
  { bg: 'bg-violet-100', border: 'border-violet-400', text: 'text-violet-700', line: '#8b5cf6' },
  { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-700', line: '#f59e0b' },
  { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-700', line: '#f43f5e' },
  { bg: 'bg-cyan-100', border: 'border-cyan-400', text: 'text-cyan-700', line: '#06b6d4' },
];

export interface MatchingQuestion {
  question: string;
  type: 'matching';
  left: string[];
  right: string[];
  correct_pairs: [number, number][];
  explanation?: string;
}

interface QuizMatchingProps {
  data: MatchingQuestion;
  questionIndex: number;
  onResult: (questionIndex: number, isCorrect: boolean) => void;
}

export function QuizMatching({ data, questionIndex, onResult }: QuizMatchingProps) {
  // pairs: { leftIdx, rightIdx }[]
  const [pairs, setPairs] = useState<{ left: number; right: number }[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; color: string }[]>([]);

  // Compute SVG lines from pairs
  const computeLines = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines: typeof lines = [];

    pairs.forEach((pair, i) => {
      const leftEl = leftRefs.current[pair.left];
      const rightEl = rightRefs.current[pair.right];
      if (!leftEl || !rightEl) return;

      const lr = leftEl.getBoundingClientRect();
      const rr = rightEl.getBoundingClientRect();

      newLines.push({
        x1: lr.right - containerRect.left,
        y1: lr.top + lr.height / 2 - containerRect.top,
        x2: rr.left - containerRect.left,
        y2: rr.top + rr.height / 2 - containerRect.top,
        color: PAIR_COLORS[i % PAIR_COLORS.length].line,
      });
    });

    setLines(newLines);
  }, [pairs]);

  useEffect(() => {
    computeLines();
    window.addEventListener('resize', computeLines);
    return () => window.removeEventListener('resize', computeLines);
  }, [computeLines]);

  const getPairIndex = (side: 'left' | 'right', idx: number) =>
    pairs.findIndex(p => p[side] === idx);

  const handleLeftClick = (idx: number) => {
    if (checked) return;
    // If already paired, remove
    const existingIdx = getPairIndex('left', idx);
    if (existingIdx !== -1) {
      setPairs(prev => prev.filter((_, i) => i !== existingIdx));
      return;
    }
    setSelectedLeft(idx);
  };

  const handleRightClick = (idx: number) => {
    if (checked || selectedLeft === null) return;

    // Remove any existing pair for this left or right
    setPairs(prev => {
      const filtered = prev.filter(p => p.left !== selectedLeft && p.right !== idx);
      return [...filtered, { left: selectedLeft, right: idx }];
    });
    setSelectedLeft(null);
  };

  const reset = () => {
    setPairs([]);
    setSelectedLeft(null);
  };

  const checkAnswer = () => {
    const correct = data.correct_pairs.every(([cl, cr]) =>
      pairs.some(p => p.left === cl && p.right === cr)
    ) && pairs.length === data.correct_pairs.length;

    setIsCorrect(correct);
    setChecked(true);
    onResult(questionIndex, correct);
  };

  return (
    <div>
      <p className="font-medium text-gray-800 mb-1 text-[15px]">
        <span className="text-blue-500 font-bold mr-1">{questionIndex + 1}.</span> {data.question}
      </p>
      <p className="text-xs text-gray-400 mb-3">Нажмите элемент слева, затем справа, чтобы соединить пары</p>

      <div ref={containerRef} className="relative">
        {/* SVG lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
          {lines.map((line, i) => (
            <line
              key={i}
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              stroke={line.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={0.7}
            />
          ))}
        </svg>

        <div className="flex gap-4">
          {/* Left column */}
          <div className="flex-1 space-y-2">
            {data.left.map((item, i) => {
              const pairIdx = getPairIndex('left', i);
              const isPaired = pairIdx !== -1;
              const isActive = selectedLeft === i;
              const color = isPaired ? PAIR_COLORS[pairIdx % PAIR_COLORS.length] : null;

              // Check correctness
              let itemStatus: 'correct' | 'wrong' | null = null;
              if (checked && isPaired) {
                const pair = pairs[pairIdx];
                const isItemCorrect = data.correct_pairs.some(([cl, cr]) => cl === pair.left && cr === pair.right);
                itemStatus = isItemCorrect ? 'correct' : 'wrong';
              }

              return (
                <div
                  key={i}
                  ref={el => { leftRefs.current[i] = el; }}
                  onClick={() => handleLeftClick(i)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border-2 cursor-pointer ${
                    itemStatus === 'correct'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                      : itemStatus === 'wrong'
                      ? 'bg-red-50 border-red-400 text-red-700'
                      : isActive
                      ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-md'
                      : isPaired && color
                      ? `${color.bg} ${color.border} ${color.text}`
                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                  } ${checked ? 'cursor-default' : ''}`}
                >
                  {item}
                </div>
              );
            })}
          </div>

          {/* Right column */}
          <div className="flex-1 space-y-2">
            {data.right.map((item, i) => {
              const pairIdx = getPairIndex('right', i);
              const isPaired = pairIdx !== -1;
              const color = isPaired ? PAIR_COLORS[pairIdx % PAIR_COLORS.length] : null;

              let itemStatus: 'correct' | 'wrong' | null = null;
              if (checked && isPaired) {
                const pair = pairs[pairIdx];
                const isItemCorrect = data.correct_pairs.some(([cl, cr]) => cl === pair.left && cr === pair.right);
                itemStatus = isItemCorrect ? 'correct' : 'wrong';
              }

              return (
                <div
                  key={i}
                  ref={el => { rightRefs.current[i] = el; }}
                  onClick={() => handleRightClick(i)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                    itemStatus === 'correct'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                      : itemStatus === 'wrong'
                      ? 'bg-red-50 border-red-400 text-red-700'
                      : isPaired && color
                      ? `${color.bg} ${color.border} ${color.text}`
                      : selectedLeft !== null
                      ? 'bg-white border-blue-200 text-gray-700 cursor-pointer hover:bg-blue-50 hover:border-blue-400'
                      : 'bg-white border-gray-200 text-gray-700'
                  } ${checked ? 'cursor-default' : ''}`}
                >
                  {item}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      {!checked && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={checkAnswer}
            disabled={pairs.length < data.left.length}
            className="px-5 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Проверить
          </button>
          {pairs.length > 0 && (
            <button
              onClick={reset}
              className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Сбросить
            </button>
          )}
        </div>
      )}

      {checked && (
        <div className={`mt-3 p-3 rounded-xl text-sm flex items-start gap-2 ${
          isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
        }`}>
          <span className="shrink-0 mt-0.5">{isCorrect ? '✅' : '❌'}</span>
          <span>{isCorrect ? 'Все пары соединены правильно!' : `Неверно. ${data.explanation || ''}`}</span>
        </div>
      )}
    </div>
  );
}
