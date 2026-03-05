import { useState } from 'react';
import type { LessonData, LessonDataQuizOption } from '../../api/learning';

// ============================================================
// LESSON DATA VIEW — renders rich v2 lesson content:
//   Scene | Infographic | Dialogue Exercise | Quiz
// ============================================================

type Tab = 'scene' | 'infographic' | 'dialogue' | 'quiz';

const TAB_CONFIG: { key: Tab; icon: string; label: string; labelUz: string }[] = [
  { key: 'scene', icon: '🎬', label: 'Сцена', labelUz: 'Sahna' },
  { key: 'infographic', icon: '📊', label: 'Схема', labelUz: 'Sxema' },
  { key: 'dialogue', icon: '💬', label: 'Диалог', labelUz: 'Dialog' },
  { key: 'quiz', icon: '✅', label: 'Квиз', labelUz: 'Viktorina' },
];

interface Props {
  data: LessonData;
  lang?: 'ru' | 'uz';
  onComplete: () => void;
}

export function LessonDataView({ data, lang = 'ru', onComplete }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('scene');
  const [visitedTabs, setVisitedTabs] = useState<Set<Tab>>(new Set(['scene']));

  const accent = data.accent || '#3b82f6';

  // Filter tabs to only those with data
  const availableTabs = TAB_CONFIG.filter(t => {
    if (t.key === 'scene') return !!data.scene;
    if (t.key === 'infographic') return !!data.infographic;
    if (t.key === 'dialogue') return !!data.dialogueLesson;
    if (t.key === 'quiz') return !!data.quiz;
    return false;
  });

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setVisitedTabs(prev => new Set([...prev, tab]));
  };

  const allVisited = availableTabs.every(t => visitedTabs.has(t.key));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
          {lang === 'uz' ? 'Interaktiv material' : 'Интерактивный материал'}
        </p>
        <h3 className="text-base font-bold text-gray-800">{data.subtitle || data.title}</h3>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
        {availableTabs.map(tab => {
          const isActive = activeTab === tab.key;
          const isVisited = visitedTabs.has(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white shadow-sm text-gray-900'
                  : isVisited
                  ? 'text-gray-600 hover:bg-white/50'
                  : 'text-gray-400 hover:bg-white/50'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span className="hidden sm:inline">{lang === 'uz' ? tab.labelUz : tab.label}</span>
              {isVisited && !isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="animate-fadeIn min-h-[300px]">
        {activeTab === 'scene' && data.scene && (
          <SceneView scene={data.scene} accent={accent} />
        )}
        {activeTab === 'infographic' && data.infographic && (
          <InfographicView infographic={data.infographic} accent={accent} />
        )}
        {activeTab === 'dialogue' && data.dialogueLesson && (
          <DialogueView dialogue={data.dialogueLesson} />
        )}
        {activeTab === 'quiz' && data.quiz && (
          <LessonQuizView quiz={data.quiz} accent={accent} />
        )}
      </div>

      {/* Continue button */}
      <div className="pt-2 flex justify-center">
        <button
          onClick={onComplete}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            allVisited
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-200'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {allVisited
            ? (lang === 'uz' ? 'Davom etish' : 'Продолжить')
            : (lang === 'uz' ? `Barcha bo'limlarni ko'ring` : 'Просмотрите все разделы')
          }
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}


// ============================================================
// SCENE — immersive narrative with dialogue bubbles
// ============================================================

function SceneView({ scene }: { scene: NonNullable<LessonData['scene']>; accent: string }) {
  return (
    <div className="space-y-4">
      {/* Location & time card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-white">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📍</span>
          <div>
            <p className="font-bold text-sm">{scene.location}</p>
            <p className="text-gray-400 text-xs mt-0.5">{scene.time}</p>
          </div>
        </div>
      </div>

      {/* Crisis */}
      <div className="bg-red-50 border border-red-100 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <span className="text-lg">🔥</span>
          <p className="text-sm text-red-800 leading-relaxed">{scene.crisis}</p>
        </div>
      </div>

      {/* Context */}
      <p className="text-sm text-gray-600 leading-relaxed px-1">{scene.context}</p>

      {/* Dialogue bubbles */}
      {scene.dialogue && scene.dialogue.length > 0 && (
        <div className="space-y-3">
          {scene.dialogue.map((msg, i) => {
            const isRight = msg.side === 'right';
            const bubbleColor = msg.color || (isRight ? '#3b82f6' : '#6b7280');
            return (
              <div key={i} className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${isRight ? 'items-end' : 'items-start'}`}>
                  <p className="text-[10px] font-medium text-gray-500 mb-1 px-1" style={{ color: bubbleColor }}>
                    {msg.speaker}
                  </p>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isRight
                        ? 'rounded-br-md bg-blue-500 text-white'
                        : 'rounded-bl-md bg-gray-100 text-gray-800'
                    }`}
                    style={isRight ? { backgroundColor: bubbleColor } : {}}
                  >
                    {msg.line}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stakes */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <span className="text-lg">⚡</span>
        <div>
          <p className="text-xs font-bold text-amber-800 mb-0.5">
            Что на кону:
          </p>
          <p className="text-sm text-amber-700 leading-relaxed">{scene.stakes}</p>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// INFOGRAPHIC — org chart / metrics dashboard
// ============================================================

function InfographicView({ infographic, accent }: { infographic: NonNullable<LessonData['infographic']>; accent: string }) {
  // Group nodes by level
  const levels = new Map<number, typeof infographic.nodes>();
  for (const node of infographic.nodes) {
    const lvl = node.level ?? 0;
    if (!levels.has(lvl)) levels.set(lvl, []);
    levels.get(lvl)!.push(node);
  }
  const sortedLevels = [...levels.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-gray-800 text-center">{infographic.title}</h4>

      {/* Org tree */}
      {sortedLevels.length > 0 && (
        <div className="space-y-3">
          {sortedLevels.map(([level, nodes]) => (
            <div key={level} className="flex flex-wrap justify-center gap-2">
              {nodes.map(node => (
                <div
                  key={node.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs"
                  style={{
                    borderColor: node.color || accent,
                    backgroundColor: `${node.color || accent}10`,
                  }}
                >
                  {node.icon && <span className="text-base">{node.icon}</span>}
                  <div>
                    <span className="font-bold" style={{ color: node.color || accent }}>
                      {node.label}
                    </span>
                    {node.name && <span className="text-gray-600 ml-1">{node.name}</span>}
                    {node.kpi != null && (
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        node.kpi >= 90 ? 'bg-emerald-100 text-emerald-700'
                        : node.kpi >= 75 ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                        {node.kpi}%
                      </span>
                    )}
                  </div>
                  {node.detail && <span className="text-gray-500">{node.detail}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Metrics grid */}
      {infographic.metrics && infographic.metrics.length > 0 && (
        <div className={`grid gap-2 ${infographic.metrics.length <= 2 ? 'grid-cols-2' : infographic.metrics.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {infographic.metrics.map((m, i) => {
            const colors = [
              'from-blue-50 to-indigo-50 border-blue-100',
              'from-emerald-50 to-teal-50 border-emerald-100',
              'from-amber-50 to-orange-50 border-amber-100',
              'from-violet-50 to-purple-50 border-violet-100',
            ];
            const textColors = ['text-blue-700', 'text-emerald-700', 'text-amber-700', 'text-violet-700'];
            return (
              <div key={i} className={`bg-gradient-to-br ${colors[i % 4]} border rounded-xl p-3 text-center`}>
                <p className={`text-xl font-bold ${textColors[i % 4]}`}>
                  {m.value}<span className="text-xs font-normal ml-0.5">{m.unit}</span>
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{m.label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ============================================================
// DIALOGUE EXERCISE — interactive right/wrong scenarios
// ============================================================

function DialogueView({ dialogue }: { dialogue: NonNullable<LessonData['dialogueLesson']> }) {
  const [currentExchange, setCurrentExchange] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const exchange = dialogue.exchanges[currentExchange];
  if (!exchange) return null;

  const isRevealed = revealed.has(currentExchange);

  const handleReveal = () => {
    setRevealed(prev => new Set([...prev, currentExchange]));
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-sm font-bold text-gray-800">{dialogue.title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{dialogue.scenario}</p>
      </div>

      {/* Exchange counter */}
      <div className="flex items-center justify-center gap-1.5">
        {dialogue.exchanges.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentExchange(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentExchange ? 'w-6 bg-blue-500' : revealed.has(i) ? 'bg-blue-300' : 'bg-gray-200'
            }`}
          />
        ))}
        <span className="text-xs text-gray-400 ml-2">{currentExchange + 1}/{dialogue.exchanges.length}</span>
      </div>

      {/* Situation */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ситуация</p>
        <p className="text-sm text-gray-800 leading-relaxed">{exchange.situation}</p>
      </div>

      {!isRevealed ? (
        /* Reveal button */
        <button
          onClick={handleReveal}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
        >
          <span>Как правильно?</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      ) : (
        /* Wrong & Right answers */
        <div className="space-y-3 animate-fadeIn">
          {/* Wrong */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs font-bold text-red-400 mb-1.5">{exchange.wrong.speaker || '❌ Неверно'}</p>
            <p className="text-sm text-red-800 leading-relaxed">{exchange.wrong.text}</p>
            {exchange.wrong.consequence && (
              <p className="text-xs text-red-500 mt-1 italic">{exchange.wrong.consequence}</p>
            )}
          </div>

          {/* Right */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <p className="text-xs font-bold text-emerald-500 mb-1.5">{exchange.right.speaker || '✅ Верно'}</p>
            <p className="text-sm text-emerald-800 leading-relaxed">{exchange.right.text}</p>
            {exchange.right.outcome && (
              <p className="text-xs text-emerald-600 mt-1 italic">{exchange.right.outcome}</p>
            )}
          </div>

          {/* Lesson */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
            <span className="text-base">💡</span>
            <p className="text-xs text-blue-800 leading-relaxed font-medium">{exchange.lesson}</p>
          </div>

          {/* Next exchange */}
          {currentExchange < dialogue.exchanges.length - 1 && (
            <button
              onClick={() => setCurrentExchange(currentExchange + 1)}
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              Следующая ситуация
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}


// ============================================================
// LESSON QUIZ — single choice questions from lesson_data
// ============================================================

function LessonQuizView({ quiz }: { quiz: NonNullable<LessonData['quiz']>; accent: string }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState<Set<number>>(new Set());

  const question = quiz.questions[currentQ];
  if (!question) return null;

  const selectedOption = selected[currentQ];
  const isAnswered = !!selectedOption;
  const isExplained = showExplanation.has(currentQ);

  const handleSelect = (optionId: string) => {
    if (isAnswered) return;
    setSelected(prev => ({ ...prev, [currentQ]: optionId }));
    setShowExplanation(prev => new Set([...prev, currentQ]));
  };

  const answeredCount = Object.keys(selected).length;
  const correctCount = Object.entries(selected).reduce((acc, [qi, optId]) => {
    const q = quiz.questions[Number(qi)];
    const opt = q?.options.find((o: LessonDataQuizOption) => o.id === optId);
    return acc + (opt?.correct ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-sm font-bold text-gray-800">{quiz.title}</h4>
        <p className="text-xs text-gray-400 mt-0.5">
          {answeredCount}/{quiz.questions.length} | {correctCount} {correctCount === 1 ? 'correct' : 'correct'}
        </p>
      </div>

      {/* Question counter */}
      <div className="flex items-center justify-center gap-1.5">
        {quiz.questions.map((_, i) => {
          const isSelected = !!selected[i];
          const q = quiz.questions[i];
          const opt = q?.options.find((o: LessonDataQuizOption) => o.id === selected[i]);
          const isCorrect = opt?.correct;
          return (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentQ
                  ? 'w-6 bg-blue-500'
                  : isSelected
                  ? isCorrect ? 'bg-emerald-400' : 'bg-red-400'
                  : 'bg-gray-200'
              }`}
            />
          );
        })}
      </div>

      {/* Question */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-sm text-gray-800 leading-relaxed font-medium">{question.text}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((opt, i) => {
          const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
          const isThis = selectedOption === opt.id;
          const isCorrectOpt = opt.correct;

          let optionStyle = 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50';
          if (isAnswered) {
            if (isCorrectOpt) {
              optionStyle = 'bg-emerald-50 border-emerald-300';
            } else if (isThis && !isCorrectOpt) {
              optionStyle = 'bg-red-50 border-red-300';
            } else {
              optionStyle = 'bg-gray-50 border-gray-200 opacity-60';
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={isAnswered}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${optionStyle}`}
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                isAnswered && isCorrectOpt
                  ? 'bg-emerald-500 text-white'
                  : isAnswered && isThis && !isCorrectOpt
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {isAnswered && isCorrectOpt ? '✓' : isAnswered && isThis && !isCorrectOpt ? '✗' : letters[i]}
              </span>
              <div className="flex-1">
                <p className="text-sm text-gray-700 leading-relaxed">{opt.text}</p>
                {isExplained && isAnswered && (isThis || isCorrectOpt) && opt.explanation && (
                  <p className={`text-xs mt-1.5 leading-relaxed ${isCorrectOpt ? 'text-emerald-600' : 'text-red-600'}`}>
                    {opt.explanation}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Next question */}
      {isAnswered && currentQ < quiz.questions.length - 1 && (
        <button
          onClick={() => setCurrentQ(currentQ + 1)}
          className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
        >
          Следующий вопрос
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* All done */}
      {answeredCount === quiz.questions.length && (
        <div className="text-center py-2">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            correctCount === quiz.questions.length
              ? 'bg-emerald-100 text-emerald-700'
              : correctCount >= quiz.questions.length / 2
              ? 'bg-blue-100 text-blue-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {correctCount === quiz.questions.length ? '🏆' : correctCount >= quiz.questions.length / 2 ? '👍' : '📚'}
            {correctCount}/{quiz.questions.length} правильно
          </div>
        </div>
      )}
    </div>
  );
}
