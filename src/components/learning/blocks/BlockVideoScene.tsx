import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BlockVideoSceneData } from '../../../api/learning';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';

interface Props {
  data: BlockVideoSceneData;
  accent: string;
  onAdvance: () => void;
}

/**
 * BlockVideoScene — Hybrid block:
 * 1. Plays a VidTSX-rendered MP4 video (fullscreen, cinematic)
 * 2. On video end → crossfade to interactive crisis overlay
 * 3. User clicks CTA → advances to next block (exercises, quizzes)
 */
export function BlockVideoScene({ data, accent, onAdvance }: Props) {
  const lang = useLangStore(s => s.lang);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<'loading' | 'playing' | 'crisis'>('loading');
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const handleCanPlay = useCallback(() => {
    setPhase('playing');
    videoRef.current?.play().catch(() => {
      // Autoplay blocked — show play button
    });
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (v && v.duration) {
      setProgress(v.currentTime / v.duration);
    }
  }, []);

  const handleVideoEnd = useCallback(() => {
    if (data.crisis) {
      setPhase('crisis');
    } else {
      onAdvance();
    }
  }, [data.crisis, onAdvance]);

  const handleSkipVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (data.crisis) {
      setPhase('crisis');
    } else {
      onAdvance();
    }
  }, [data.crisis, onAdvance]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden select-none">

      {/* Video layer */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          src={data.videoUrl}
          poster={data.posterUrl}
          muted={isMuted}
          playsInline
          preload="auto"
          onCanPlay={handleCanPlay}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnd}
          className="w-full h-full object-cover"
          style={{
            opacity: phase === 'crisis' ? 0.15 : 1,
            transition: 'opacity 1.2s ease-out',
            filter: phase === 'crisis' ? 'blur(8px) brightness(0.3)' : 'none',
          }}
        />
      </div>

      {/* Loading state */}
      <AnimatePresence>
        {phase === 'loading' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/80 z-10"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center">
              <motion.div
                className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/60 mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <div className="text-white/40 text-sm">Загрузка сцены...</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video controls overlay */}
      {phase === 'playing' && (
        <>
          {/* Progress bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-10">
            <motion.div
              className="h-full rounded-r-full"
              style={{
                width: `${progress * 100}%`,
                background: `linear-gradient(90deg, ${accent}, #a855f7)`,
              }}
            />
          </div>

          {/* Skip button */}
          <motion.button
            className="absolute bottom-6 right-6 z-10 px-4 py-2 rounded-lg
              bg-white/10 backdrop-blur-sm border border-white/15
              text-white/60 text-sm font-medium hover:bg-white/20 transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
            onClick={handleSkipVideo}
          >
            Пропустить →
          </motion.button>

          {/* Mute toggle */}
          <button
            className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full
              bg-white/10 backdrop-blur-sm border border-white/15
              flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors"
            onClick={toggleMute}
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>
        </>
      )}

      {/* Crisis overlay — appears after video ends */}
      <AnimatePresence>
        {phase === 'crisis' && data.crisis && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          >
            <motion.div
              className="bg-gradient-to-b from-[#1a0a0a]/95 to-[#0a0408]/95
                border border-red-500/30 rounded-2xl backdrop-blur-xl
                shadow-[0_0_80px_rgba(220,38,38,0.12)] p-8 max-w-[480px] w-[90%] text-center"
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 0.4 }}
            >
              {/* Pulsing emoji */}
              <motion.div
                className="text-5xl mb-4"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                {data.crisis.emoji}
              </motion.div>

              {/* Badge */}
              <motion.div
                className="text-red-500 text-sm font-extrabold tracking-[3px] mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {bl(data.crisis.badge, lang)}
              </motion.div>

              {/* Headline */}
              <motion.div
                className="text-white text-2xl font-black mb-3 leading-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                dangerouslySetInnerHTML={{ __html: bl(data.crisis.headline, lang) }}
              />

              {/* Description */}
              <motion.div
                className="text-gray-400 text-sm leading-relaxed mb-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
              >
                {bl(data.crisis.description, lang)}
              </motion.div>

              {/* Stakes */}
              <motion.div
                className="bg-amber-500/[0.08] border border-amber-500/20 rounded-lg
                  p-3 text-amber-400 text-sm font-semibold mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
              >
                {bl(data.crisis.stakes, lang)}
              </motion.div>

              {/* CTA button */}
              <motion.button
                onClick={onAdvance}
                className="w-full py-4 rounded-xl text-white text-base font-bold shadow-lg
                  active:scale-95 transition-transform"
                style={{ background: `linear-gradient(135deg, ${accent}, #a855f7)` }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, type: 'spring', damping: 15 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {bl(data.crisis.cta, lang)}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
