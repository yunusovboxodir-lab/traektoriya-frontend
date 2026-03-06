import { useState, useCallback, useEffect, useRef } from 'react';
import type { LessonBlock, BlockLessonData, NarrationResponse } from '../../../api/learning';
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
  narration?: NarrationResponse | null;
  onComplete: (score: number, timeSeconds: number) => void;
}

export function BlockRunner({ lessonData, narration, onComplete }: Props) {
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

  // ===== AUDIO NARRATION =====
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);

  const hasNarration = narration && narration.slides && narration.slides.length > 0;
  const totalTracks = narration?.slides?.length || 0;

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setAudioProgress(audio.currentTime / audio.duration);
        setAudioDuration(audio.duration);
      }
    };
    const onEnded = () => {
      // Auto-play next track
      if (currentTrack < totalTracks - 1) {
        setCurrentTrack(prev => prev + 1);
      } else {
        setIsPlaying(false);
        setAudioProgress(0);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentTrack, totalTracks]);

  // Load and play when track changes
  useEffect(() => {
    if (!audioRef.current || !narration?.slides || !isPlaying) return;
    const track = narration.slides[currentTrack];
    if (track) {
      audioRef.current.src = track.audio_url;
      audioRef.current.play().catch(() => setIsPlaying(false));
      setAudioProgress(0);
    }
  }, [currentTrack]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAudio = useCallback(() => {
    if (!audioRef.current || !hasNarration) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const track = narration!.slides[currentTrack];
      if (track) {
        audioRef.current.src = track.audio_url;
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
        setShowAudioPanel(true);
      }
    }
  }, [isPlaying, hasNarration, narration, currentTrack]);

  const skipTrack = useCallback((dir: 1 | -1) => {
    const next = currentTrack + dir;
    if (next >= 0 && next < totalTracks) {
      setCurrentTrack(next);
      if (!isPlaying) {
        setIsPlaying(true);
      }
    }
  }, [currentTrack, totalTracks, isPlaying]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };
  // ===== END AUDIO =====

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

  // Floating audio player (shown on all block types)
  const FloatingAudioPlayer = hasNarration ? (
    <>
      {/* FAB button - always visible when narration available */}
      <button
        onClick={() => {
          if (!showAudioPanel) {
            setShowAudioPanel(true);
            toggleAudio();
          } else {
            toggleAudio();
          }
        }}
        className={`fixed z-[300] rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${
          isCinematic
            ? 'bottom-6 right-6 w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20'
            : 'bottom-24 right-4 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
        title={isPlaying ? 'Пауза' : 'Озвучка урока'}
      >
        {isPlaying ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        )}
      </button>

      {/* Expanded audio panel */}
      {showAudioPanel && (
        <div className={`fixed z-[299] transition-all duration-300 ${
          isCinematic
            ? 'bottom-24 right-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 text-white min-w-[260px]'
            : 'bottom-40 right-4 bg-white shadow-2xl border border-gray-200 rounded-2xl px-4 py-3 min-w-[260px]'
        }`}>
          {/* Close button */}
          <button
            onClick={() => setShowAudioPanel(false)}
            className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              isCinematic ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            &times;
          </button>

          {/* Title */}
          <div className={`text-xs font-medium mb-2 ${isCinematic ? 'text-white/60' : 'text-gray-400'}`}>
            Озвучка урока
          </div>

          {/* Progress bar */}
          <div className={`h-1 rounded-full mb-2 ${isCinematic ? 'bg-white/10' : 'bg-gray-200'}`}>
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-200"
              style={{ width: `${audioProgress * 100}%` }}
            />
          </div>

          {/* Time & track info */}
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isCinematic ? 'text-white/50' : 'text-gray-400'}`}>
              {formatTime(audioDuration * audioProgress)} / {formatTime(audioDuration)}
            </span>
            <span className={`text-xs ${isCinematic ? 'text-white/50' : 'text-gray-400'}`}>
              {currentTrack + 1} / {totalTracks}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-2">
            <button
              onClick={() => skipTrack(-1)}
              disabled={currentTrack === 0}
              className={`p-1 rounded-full transition ${currentTrack === 0 ? 'opacity-30' : 'hover:bg-white/10'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>

            <button
              onClick={toggleAudio}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                isCinematic ? 'bg-white/20 hover:bg-white/30' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            <button
              onClick={() => skipTrack(1)}
              disabled={currentTrack >= totalTracks - 1}
              className={`p-1 rounded-full transition ${currentTrack >= totalTracks - 1 ? 'opacity-30' : 'hover:bg-white/10'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  ) : null;

  // Cinematic scene — fullscreen, no progress bar
  if (isCinematic && currentBlock.type === 'cinematic_scene') {
    return (
      <>
        <BlockCinematicScene
          data={currentBlock.data}
          accent={accent}
          onAdvance={handleCinematicAdvance}
        />
        {FloatingAudioPlayer}
      </>
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
        {FloatingAudioPlayer}
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
      {FloatingAudioPlayer}
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
