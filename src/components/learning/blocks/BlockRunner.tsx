import { useState, useCallback, useEffect } from 'react';
import type { LessonBlock, BlockLessonData } from '../../../api/learning';
import { useBlockSession } from './useBlockSession';
import { BlockProgressBar, BlockBottomBar } from './BlockProgress';
import { BlockCinematicScene } from './BlockCinematicScene';
import { BlockKeyPoint } from './BlockKeyPoint';
import { BlockSwipeCards } from './BlockSwipeCards';
import { BlockSorting } from './BlockSorting';
import { BlockFillBlank } from './BlockFillBlank';
import { BlockDialogueChoice } from './BlockDialogueChoice';
import { BlockQuiz } from './BlockQuiz';
import { BlockResults } from './BlockResults';

interface Props {
  lessonData: BlockLessonData;
  onComplete: (score: number, timeSeconds: number) => void;
}

export function BlockRunner({ lessonData, onComplete }: Props) {
  const { blocks, title, accent, accentSoft } = lessonData;
  const [canAdvance, setCanAdvance] = useState(false);

  const session = useBlockSession(blocks, () => {
    // Block session completed — results block handles display
  });

  const { currentIndex, advance, recordAnswer, correct, total, getElapsedSeconds } = session;
  const currentBlock = blocks[currentIndex];
  const isLastBlock = currentIndex === blocks.length - 1;
  const isCinematic = currentBlock?.type === 'cinematic_scene';
  const isResultsBlock = currentBlock?.type === 'results';

  // Reset canAdvance on block change
  useEffect(() => {
    setCanAdvance(false);
  }, [currentIndex]);

  const handleReady = useCallback(() => {
    setCanAdvance(true);
  }, []);

  const handleNext = useCallback(() => {
    if (!canAdvance && !isCinematic) return;
    advance();
  }, [canAdvance, isCinematic, advance]);

  const handleCinematicAdvance = useCallback(() => {
    // Cinematic scene auto-advances via CTA button
    advance();
  }, [advance]);

  const handleFinish = useCallback(() => {
    const score = total > 0 ? Math.round((correct / total) * 100) : 100;
    onComplete(score, getElapsedSeconds());
  }, [correct, total, getElapsedSeconds, onComplete]);

  // Auto-ready for key_point blocks
  useEffect(() => {
    if (currentBlock?.type === 'key_point') {
      setCanAdvance(true);
    }
  }, [currentBlock]);

  // Cinematic scene — fullscreen, no progress bar
  if (isCinematic && currentBlock.type === 'cinematic_scene') {
    return (
      <BlockCinematicScene
        data={currentBlock.data}
        accent={accent}
        onAdvance={handleCinematicAdvance}
      />
    );
  }

  // Results block — special rendering with stats
  if (isResultsBlock && currentBlock.type === 'results') {
    return (
      <div className="min-h-screen bg-[#f0f2f5]">
        <BlockProgressBar
          title={title}
          current={currentIndex}
          total={blocks.length}
          accent={accent}
        />
        <div className="pt-4 pb-20">
          <BlockResults
            data={currentBlock.data}
            title={title}
            correct={correct}
            total={total}
            elapsedSeconds={getElapsedSeconds()}
            accent={accent}
            onFinish={handleFinish}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <BlockProgressBar
        title={title}
        current={currentIndex}
        total={blocks.length}
        accent={accent}
      />

      <div className="pt-1 pb-20 max-w-[420px] mx-auto">
        <BlockContent
          block={currentBlock}
          accent={accent}
          accentSoft={accentSoft}
          onAnswer={recordAnswer}
          onReady={handleReady}
        />
      </div>

      <BlockBottomBar
        current={currentIndex}
        total={blocks.length}
        canAdvance={canAdvance}
        isLast={isLastBlock}
        onNext={handleNext}
        accent={accent}
      />
    </div>
  );
}

/** Renders the appropriate block component based on type */
function BlockContent({
  block,
  accent,
  accentSoft,
  onAnswer,
  onReady,
}: {
  block: LessonBlock;
  accent: string;
  accentSoft: string;
  onAnswer: (isCorrect: boolean) => void;
  onReady: () => void;
}) {
  switch (block.type) {
    case 'key_point':
      return <BlockKeyPoint data={block.data} accent={accent} accentSoft={accentSoft} onReady={onReady} />;
    case 'swipe_cards':
      return <BlockSwipeCards data={block.data} accent={accent} accentSoft={accentSoft} onAnswer={onAnswer} onReady={onReady} />;
    case 'sorting':
      return <BlockSorting data={block.data} accent={accent} accentSoft={accentSoft} onAnswer={onAnswer} onReady={onReady} />;
    case 'fill_blank':
      return <BlockFillBlank data={block.data} accent={accent} accentSoft={accentSoft} onAnswer={onAnswer} onReady={onReady} />;
    case 'dialogue_choice':
      return <BlockDialogueChoice data={block.data} accent={accent} accentSoft={accentSoft} onAnswer={onAnswer} onReady={onReady} />;
    case 'quiz':
      return <BlockQuiz data={block.data} accent={accent} accentSoft={accentSoft} onAnswer={onAnswer} onReady={onReady} />;
    default:
      return <div className="p-4 text-center text-gray-400">Unknown block type</div>;
  }
}
