import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BlockCinematicSceneData, CinematicCharacter } from '../../../api/learning';
import { getAtmosphere } from './atmospheres';
import { SilhouetteCharacter } from './characters/SilhouetteCharacter';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';

const TYPING_SPEED_MS = 35;

interface Props {
  data: BlockCinematicSceneData;
  accent: string;
  onAdvance: () => void;
}

export function BlockCinematicScene({ data, accent, onAdvance }: Props) {
  const lang = useLangStore(s => s.lang);
  const atmo = useMemo(() => getAtmosphere(data.atmosphere), [data.atmosphere]);
  const [step, setStep] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeDialogueIdx, setActiveDialogueIdx] = useState(-1);
  const typingRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const fullTextRef = useRef('');

  const hasBackstory = !!data.backstory;
  const backstoryStep = 2;
  const dialogueStepStart = hasBackstory ? 3 : 2;
  const dialogueCount = data.dialogues.length;
  const problemFlashStep = dialogueStepStart + dialogueCount;
  const crisisStep = data.problemFlash ? problemFlashStep + 1 : problemFlashStep;
  const [backstoryVisible, setBackstoryVisible] = useState(false);

  const typeText = useCallback((text: string) => {
    setTypingText('');
    fullTextRef.current = text;
    setIsTyping(true);
    let i = 0;
    if (typingRef.current) clearInterval(typingRef.current);
    typingRef.current = setInterval(() => {
      setTypingText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        if (typingRef.current) clearInterval(typingRef.current);
        setIsTyping(false);
      }
    }, TYPING_SPEED_MS);
  }, []);

  const skipTyping = useCallback(() => {
    if (typingRef.current) clearInterval(typingRef.current);
    setTypingText(fullTextRef.current);
    setIsTyping(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setStep(1), 600);
    return () => { clearTimeout(timer); if (typingRef.current) clearInterval(typingRef.current); };
  }, []);

  const handleClick = useCallback(() => {
    if (isTyping) { skipTyping(); return; }

    // Step 1 → backstory or dialogue
    if (step < backstoryStep) {
      if (hasBackstory) {
        setStep(backstoryStep);
        setBackstoryVisible(true);
      } else if (dialogueCount > 0) {
        setStep(dialogueStepStart);
        setActiveDialogueIdx(0);
        typeText(bl(data.dialogues[0].text, lang));
      }
      return;
    }

    // Backstory → dialogue
    if (hasBackstory && step === backstoryStep) {
      setBackstoryVisible(false);
      if (dialogueCount > 0) {
        setStep(dialogueStepStart);
        setActiveDialogueIdx(0);
        typeText(bl(data.dialogues[0].text, lang));
      }
      return;
    }

    // Dialogue steps
    if (step >= dialogueStepStart && step < problemFlashStep) {
      const nextDIdx = step - dialogueStepStart + 1;
      if (nextDIdx < dialogueCount) {
        setStep(dialogueStepStart + nextDIdx);
        setActiveDialogueIdx(nextDIdx);
        typeText(bl(data.dialogues[nextDIdx].text, lang));
      } else if (data.problemFlash) {
        setStep(problemFlashStep);
      } else {
        setStep(crisisStep);
      }
      return;
    }
    if (step === problemFlashStep && data.problemFlash) setStep(crisisStep);
  }, [step, isTyping, skipTyping, backstoryStep, hasBackstory, dialogueStepStart, dialogueCount, problemFlashStep, crisisStep, data, lang, typeText]);

  const activeDialogue = activeDialogueIdx >= 0 ? data.dialogues[activeDialogueIdx] : null;
  const activeChar = activeDialogue ? data.characters.find(c => c.id === activeDialogue.characterId) : null;
  const showTapHint = !isTyping && step >= 1 && step < crisisStep;

  return (
    <div
      className="fixed inset-0 z-[200] bg-[#060a14] flex flex-col overflow-hidden cursor-pointer select-none"
      style={{ fontFamily: "'Georgia', serif" }}
      onClick={handleClick}
    >
      <div className="h-8 bg-black shrink-0" />

      <div className="flex-1 relative overflow-hidden">
        {/* Multi-layer background */}
        <div className="absolute inset-0" style={{ background: atmo.gradient }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(80,120,180,0.12), transparent 65%)',
        }} />
        <motion.div className="absolute inset-0"
          animate={{ opacity: [0.03, 0.06, 0.03] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.08), transparent 50%)' }}
        />

        {/* Ceiling light */}
        <motion.div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[55%]"
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: `linear-gradient(180deg, ${atmo.lightColor} 0%, transparent 100%)` }}
        >
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[160px] h-[4px] rounded-full" style={{
            background: `rgba(255,255,255,${atmo.lightOpacity * 1.5})`,
            boxShadow: `0 0 40px rgba(255,255,255,0.06), 0 0 80px ${atmo.lightColor}`,
          }} />
        </motion.div>

        {/* Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[30%]" style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
        }} />

        {/* Shelves */}
        {atmo.shelves && (
          <motion.div className="absolute bottom-[110px] left-1/2 -translate-x-1/2 w-[80%] max-w-[500px]"
            initial={{ opacity: 0, y: 20 }}
            animate={step >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.3 }}>
            <Shelves3D
              rows={atmo.shelves.rows}
              productsPerRow={atmo.shelves.productsPerRow}
              colors={atmo.productColors}
              chaos={atmo.shelves.chaos}
              shelfColor={atmo.shelves.shelfColor}
            />
          </motion.div>
        )}

        {/* Backstory overlay — sets the scene before dialogue */}
        <AnimatePresence>
          {backstoryVisible && data.backstory && (
            <motion.div
              className="absolute inset-0 z-[10] flex items-center justify-center px-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
            >
              {/* Dim background */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

              <motion.div
                className="relative max-w-[520px] w-full"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', damping: 22, stiffness: 180, delay: 0.15 }}
              >
                {/* Accent line */}
                <div className="w-12 h-[2px] rounded-full mb-5 mx-auto" style={{ background: accent }} />

                {/* Context label */}
                <div className="text-center text-white/30 text-xs tracking-[4px] uppercase mb-4">
                  {lang === 'uz' ? 'Vaziyat' : 'Ситуация'}
                </div>

                {/* Backstory text */}
                <div className="text-gray-200 text-lg leading-relaxed text-center"
                  style={{ fontFamily: "'Georgia', serif" }}>
                  {bl(data.backstory!, lang)}
                </div>

                {/* Tap hint */}
                <motion.div className="mt-8 text-center text-white/15 text-sm"
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  {lang === 'uz' ? 'Davom etish uchun bosing' : 'Нажмите, чтобы продолжить'}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Characters */}
        {data.characters.map((char, idx) => (
          <AnimatedCharacter
            key={char.id}
            character={char}
            visible={step >= 1}
            isActive={activeChar?.id === char.id}
            lang={lang}
            delay={idx * 0.25}
          />
        ))}

        {/* Location */}
        <motion.div className="absolute top-5 left-7"
          initial={{ opacity: 0, x: -20 }}
          animate={step >= 1 ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}>
          <div className="text-white/30 text-xs tracking-[3px] uppercase">{bl(data.location.day, lang)}</div>
          <div className="text-white text-4xl font-black tracking-tight">{bl(data.location.time, lang)}</div>
          <div className="text-white/25 text-xs tracking-[2px] mt-0.5">{bl(data.location.subtitle, lang)}</div>
        </motion.div>

        {/* Dialogue */}
        <AnimatePresence mode="wait">
          {activeChar && step >= dialogueStepStart && step < (data.problemFlash ? problemFlashStep : crisisStep) && (
            <DialogueBubble
              key={activeDialogueIdx}
              character={activeChar}
              text={typingText}
              isTyping={isTyping}
              lang={lang}
            />
          )}
        </AnimatePresence>

        {/* Problem flash */}
        <AnimatePresence>
          {data.problemFlash && step >= problemFlashStep && step < crisisStep && (
            <motion.div
              className="absolute bottom-[80px] left-1/2 w-[90%] max-w-[500px]
                bg-red-500/[0.08] border border-red-500/20 rounded-xl backdrop-blur-sm
                py-4 px-5 text-center text-red-400 text-base font-semibold"
              initial={{ opacity: 0, y: 30, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -10, x: '-50%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            >
              {bl(data.problemFlash.text, lang)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Crisis */}
        <AnimatePresence>
          {step >= crisisStep && (
            <motion.div
              className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="bg-gradient-to-b from-[#1a0a0a] to-[#0a0408] border border-red-500/30 rounded-2xl
                  shadow-[0_0_60px_rgba(220,38,38,0.1)] p-8 max-w-[440px] w-[90%] text-center"
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 150, delay: 0.2 }}
              >
                {/* Warning icon instead of emoji */}
                <motion.div className="flex justify-center mb-3"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path d="M24 4L2 44h44L24 4z" fill="none" stroke="#ef4444" strokeWidth="2.5"
                      strokeLinejoin="round" />
                    <line x1="24" y1="18" x2="24" y2="30" stroke="#ef4444" strokeWidth="2.5"
                      strokeLinecap="round" />
                    <circle cx="24" cy="36" r="1.5" fill="#ef4444" />
                  </svg>
                </motion.div>
                <div className="text-red-500 text-sm font-extrabold tracking-[3px] mb-3">
                  {bl(data.crisis.badge, lang)}
                </div>
                <div className="text-white text-2xl font-black mb-3"
                  dangerouslySetInnerHTML={{ __html: bl(data.crisis.headline, lang) }} />
                <div className="text-gray-400 text-sm leading-relaxed mb-5">
                  {bl(data.crisis.description, lang)}
                </div>
                <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-lg
                  p-3 text-amber-400 text-sm font-semibold mb-5">
                  {bl(data.crisis.stakes, lang)}
                </div>
                <motion.button
                  onClick={onAdvance}
                  className="w-full py-4 rounded-xl text-white text-base font-bold shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${accent}, #a855f7)` }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {bl(data.crisis.cta, lang)}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap hint */}
        {showTapHint && (
          <motion.div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/20 text-sm tracking-wider"
            animate={{ opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 2, repeat: Infinity }}>
            {isTyping ? '' : 'Нажмите, чтобы продолжить'}
          </motion.div>
        )}
      </div>

      <div className="h-8 bg-black shrink-0" />
    </div>
  );
}

/** 3D-like shelves with product boxes */
function Shelves3D({ rows, productsPerRow, colors, chaos, shelfColor }: {
  rows: number; productsPerRow: number; colors: string[]; chaos: boolean; shelfColor: string;
}) {
  const shelves = useMemo(() =>
    Array.from({ length: rows }, () =>
      Array.from({ length: productsPerRow }, () => ({
        h: 20 + Math.random() * 14,
        w: 14 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: chaos ? (Math.random() - 0.5) * 18 : 0,
        op: 0.5 + Math.random() * 0.4,
        label: 2 + Math.random() * 5,
      }))
    ), [rows, productsPerRow, colors, chaos]);

  return (
    <div className="space-y-0.5">
      {shelves.map((row, rIdx) => (
        <div key={rIdx}>
          <div className="flex gap-[2px] justify-center items-end">
            {row.map((p, i) => (
              <motion.div key={i} className="relative rounded-t-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: p.op, y: 0 }}
                transition={{ delay: rIdx * 0.15 + i * 0.02, duration: 0.5 }}
                style={{
                  width: `${p.w}px`, height: `${p.h}px`,
                  background: `linear-gradient(180deg, ${p.color}ee, ${p.color}88)`,
                  transform: `rotate(${p.rot}deg)`,
                  boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.35), 0 -1px 2px rgba(255,255,255,0.04)',
                }}>
                <div className="absolute left-[2px] right-[2px] rounded-sm" style={{
                  top: `${p.h * 0.3}px`, height: `${p.label}px`,
                  background: 'rgba(255,255,255,0.12)',
                }} />
              </motion.div>
            ))}
          </div>
          <div className="h-[6px] rounded-sm" style={{
            background: `linear-gradient(180deg, ${shelfColor}, #374151, ${shelfColor}80)`,
            boxShadow: '0 3px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
          }} />
        </div>
      ))}
    </div>
  );
}

/** Map character role text to silhouette skinId */
const ROLE_TO_SKIN: Record<string, string> = {
  'ТП': 'sales_rep', 'tp': 'sales_rep', 'sales_rep': 'sales_rep',
  'СВ': 'supervisor', 'sv': 'supervisor', 'supervisor': 'supervisor',
  'Товаровед': 'store_keeper', 'товаровед': 'store_keeper', 'store_keeper': 'store_keeper',
  'HR': 'hr_manager', 'hr': 'hr_manager', 'hr_manager': 'hr_manager',
  'РМ': 'regional_manager', 'rm': 'regional_manager', 'regional_manager': 'regional_manager',
  'Директор': 'store_director', 'директор': 'store_director', 'store_director': 'store_director',
  'Стажёр': 'trainee', 'стажёр': 'trainee', 'trainee': 'trainee',
};

function resolveSkinId(character: CinematicCharacter): string {
  // 1. If detail is a valid skinId, use it directly
  const validSkins = ['sales_rep', 'supervisor', 'hr_manager', 'store_keeper', 'regional_manager', 'store_director', 'trainee'];
  if (character.detail && validSkins.includes(character.detail)) return character.detail;
  // 2. Map from role text (RU or EN)
  const roleText = typeof character.role === 'string' ? character.role : character.role?.ru || '';
  const mapped = ROLE_TO_SKIN[roleText];
  if (mapped) return mapped;
  // 3. Fallback
  return 'sales_rep';
}

/** Animated silhouette character */
function AnimatedCharacter({ character, visible, isActive, lang, delay }: {
  character: CinematicCharacter; visible: boolean; isActive: boolean; lang: 'ru' | 'uz'; delay: number;
}) {
  const isLeft = character.side === 'left';
  const skinId = resolveSkinId(character);

  return (
    <motion.div
      className={`absolute bottom-[100px] ${isLeft ? 'left-[6%]' : 'right-[6%]'}`}
      initial={{ opacity: 0, y: 50 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ type: 'spring', damping: 20, stiffness: 120, delay }}
    >
      <motion.div
        animate={isActive
          ? { scale: 1.15, filter: 'drop-shadow(0 0 24px rgba(100,160,255,0.25))' }
          : { scale: 1, filter: 'drop-shadow(0 0 0 transparent)' }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      >
        <SilhouetteCharacter
          skinId={skinId}
          isActive={isActive}
          accentColor={isLeft ? '#ef4444' : '#3b82f6'}
          width={120}
          height={200}
        />
      </motion.div>

      <motion.div className="text-center mt-2"
        initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : {}}
        transition={{ delay: delay + 0.3 }}>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          isLeft ? 'text-red-300/70 bg-red-500/10' : 'text-blue-300/70 bg-blue-500/10'
        }`}>
          {bl(character.name, lang)}
        </span>
      </motion.div>
    </motion.div>
  );
}

/** Dialogue bubble with Framer Motion */
function DialogueBubble({ character, text, isTyping, lang }: {
  character: CinematicCharacter; text: string; isTyping: boolean; lang: 'ru' | 'uz';
}) {
  const isLeft = character.side === 'left';
  const borderColor = isLeft ? 'rgba(220,38,38,0.25)' : 'rgba(59,130,246,0.25)';
  const accentGlow = isLeft
    ? 'linear-gradient(90deg, transparent, rgba(220,38,38,0.4), transparent)'
    : 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)';

  return (
    <motion.div
      className={`absolute max-w-[400px] rounded-2xl p-5 backdrop-blur-md
        ${isLeft ? 'bottom-[220px] left-5' : 'bottom-[220px] right-5'}`}
      style={{
        background: 'linear-gradient(135deg, rgba(10,10,20,0.93), rgba(15,15,30,0.96))',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: 'spring', damping: 22, stiffness: 250 }}
    >
      {/* Accent glow */}
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full" style={{ background: accentGlow }} />

      {/* Name */}
      <div className="flex items-center gap-2 mb-3">
        {/* Silhouette icon instead of emoji */}
        <span className={`inline-block w-5 h-5 rounded-full ${isLeft ? 'bg-red-500/20 border border-red-500/30' : 'bg-blue-500/20 border border-blue-500/30'}`}>
          <svg viewBox="0 0 20 20" className="w-full h-full">
            <circle cx="10" cy="7" r="3" fill={isLeft ? '#ef4444' : '#3b82f6'} opacity="0.6" />
            <path d="M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6" fill={isLeft ? '#ef4444' : '#3b82f6'} opacity="0.4" />
          </svg>
        </span>
        <span className={`text-xs font-bold tracking-[2px] ${isLeft ? 'text-red-400' : 'text-blue-400'}`}>
          {bl(character.name, lang).toUpperCase()}
          {character.role && (
            <span className="text-white/30 ml-1 font-normal tracking-normal">
              ({bl(character.role, lang)})
            </span>
          )}
        </span>
      </div>

      {/* Text */}
      <div className="text-gray-100 text-[17px] leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
        <span className="text-white/40">{'\u00AB'}</span>
        <span className="italic">{text}</span>
        {isTyping && (
          <motion.span
            className="inline-block w-[2px] h-[18px] bg-white/60 ml-0.5 align-text-bottom"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
        <span className="text-white/40">{'\u00BB'}</span>
      </div>

      {/* Tail */}
      <div className={`absolute -bottom-2 ${isLeft ? 'left-6' : 'right-6'}`}>
        <svg width="16" height="10" viewBox="0 0 16 10">
          <path d="M0 0 L8 10 L16 0" fill="rgba(10,10,20,0.93)" />
        </svg>
      </div>
    </motion.div>
  );
}
