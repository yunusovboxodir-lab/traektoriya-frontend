// QuizSingleChoice — single choice quiz question component

interface QuizSingleChoiceProps {
  question: string;
  options: string[];
  questionIndex: number;
  selectedAnswer?: number;
  onAnswer: (questionIndex: number, answerIndex: number) => void;
  submitted?: boolean;
  correctAnswer?: number;
  explanation?: string;
}

export function QuizSingleChoice({
  question,
  options,
  questionIndex,
  selectedAnswer,
  onAnswer,
  submitted,
  correctAnswer,
  explanation,
}: QuizSingleChoiceProps) {
  return (
    <div>
      <p className="font-medium text-gray-800 mb-3 text-[15px]">
        <span className="text-blue-500 font-bold mr-1">{questionIndex + 1}.</span> {question}
      </p>
      <div className="space-y-2">
        {options.map((opt, oi) => {
          const isSelected = selectedAnswer === oi;
          const letter = String.fromCharCode(65 + oi);
          const isCorrect = submitted && correctAnswer === oi;
          const isWrong = submitted && isSelected && correctAnswer !== oi;

          return (
            <button
              key={oi}
              onClick={() => !submitted && onAnswer(questionIndex, oi)}
              disabled={submitted}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-200 border ${
                isCorrect
                  ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                  : isWrong
                  ? 'bg-red-50 border-red-300 shadow-sm'
                  : isSelected
                  ? 'bg-blue-50 border-blue-300 shadow-sm shadow-blue-100'
                  : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-gray-50'
              } ${submitted ? 'cursor-default' : ''}`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                isCorrect
                  ? 'bg-emerald-500 text-white'
                  : isWrong
                  ? 'bg-red-500 text-white'
                  : isSelected
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {isCorrect ? '✓' : isWrong ? '✗' : letter}
              </span>
              <span className={`text-sm ${
                isCorrect ? 'text-emerald-800 font-medium' :
                isWrong ? 'text-red-800' :
                isSelected ? 'text-blue-800 font-medium' : 'text-gray-700'
              }`}>{opt}</span>
            </button>
          );
        })}
      </div>
      {submitted && explanation && (
        <div className="mt-3 p-3 bg-blue-50 rounded-xl text-sm text-blue-800 flex items-start gap-2">
          <span className="shrink-0 mt-0.5">💡</span>
          <span>{explanation}</span>
        </div>
      )}
    </div>
  );
}
