import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import type { BlockCinematicSceneData, CinematicCharacter } from '../../../api/learning';
import { getAtmosphere } from './atmospheres';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';
import { useLottieLoader } from '../../../hooks/useLottieLoader';
import { getCharacterLottie } from './cinematicAnimations';

const Lottie = lazy(() => import('lottie-react'));

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

  const dialogueStepStart = 2;
  const dialogueCount = data.dialogues.length;
  const problemFlashStep = dialogueStepStart + dialogueCount;
  const crisisStep = data.problemFlash ? problemFlashStep + 1 : problemFlashStep;

  const typeText = useCallback((text: string, onDone?: () => void) => {
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
        onDone?.();
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
    return () => {
      clearTimeout(timer);
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (isTyping) { skipTyping(); return; }
    if (step < dialogueStepStart) {
      if (dialogueCount > 0) {
        setStep(dialogueStepStart);
        setActiveDialogueIdx(0);
        typeText(bl(data.dialogues[0].text, lang));
      }
      return;
    }
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
    if (step === problemFlashStep && data.problemFlash) {
      setStep(crisisStep);
    }
  }, [step, isTyping, skipTyping, dialogueStepStart, dialogueCount, problemFlashStep, crisisStep, data, lang, typeText]);

  const activeDialogue = activeDialogueIdx >= 0 ? data.dialogues[activeDialogueIdx] : null;
  const activeChar = activeDialogue ? data.characters.find(c => c.id === activeDialogue.characterId) : null;
  const showTapHint = !isTyping && step >= 1 && step < crisisStep;

  return (
    <div
      className="fixed inset-0 z-[200] bg-[#0a0e1a] flex flex-col overflow-hidden cursor-pointer select-none"
      style={{ fontFamily: "'Georgia', serif" }}
      onClick={handleClick}
    >
      <div className="h-8 bg-black shrink-0" />

      <div className="flex-1 relative overflow-hidden">
        {/* Background with depth layers */}
        <div className="absolute inset-0" style={{ background: atmo.gradient }} />
        <div className="absolute inset-0 opacity-30" style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(100,140,200,0.15), transparent 70%)',
        }} />

        {/* Ambient light from top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[60%]" style={{
          background: `linear-gradient(180deg, ${atmo.lightColor} 0%, transparent 100%)`,
          opacity: 0.6,
        }}>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[160px] h-[4px] rounded-full" style={{
            background: `rgba(255,255,255,${atmo.lightOpacity * 1.5})`,
            boxShadow: `0 0 30px rgba(255,255,255,0.08), 0 0 60px ${atmo.lightColor}`,
          }} />
        </div>

        {/* Floor gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-[35%]" style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
        }} />

        {/* Shelves (enhanced) */}
        {atmo.shelves && (
          <div className="absolute bottom-[120px] left-1/2 -translate-x-1/2 w-[80%] max-w-[500px]"
               style={{ opacity: step >= 1 ? 1 : 0, transition: 'opacity 1s ease 0.3s' }}>
            <EnhancedShelves
              rows={atmo.shelves.rows}
              productsPerRow={atmo.shelves.productsPerRow}
              colors={atmo.productColors}
              chaos={atmo.shelves.chaos}
              shelfColor={atmo.shelves.shelfColor}
            />
          </div>
        )}

        {/* Characters with Lottie */}
        {data.characters.map((char, idx) => (
          <CharacterWithLottie
            key={char.id}
            character={char}
            visible={step >= 1}
            isActive={activeChar?.id === char.id}
            lang={lang}
            entranceDelay={idx * 200}
          />
        ))}

        {/* Location tag */}
        <div className="absolute top-5 left-7 transition-all duration-1000"
             style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? 'translateY(0)' : 'translateY(-10px)' }}>
          <div className="text-white/30 text-xs tracking-[3px] uppercase">{bl(data.location.day, lang)}</div>
          <div className="text-white text-4xl font-black tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            {bl(data.location.time, lang)}
          </div>
          <div className="text-white/25 text-xs tracking-[2px] mt-0.5">{bl(data.location.subtitle, lang)}</div>
        </div>

        {/* Dialogue bubble (enhanced) */}
        {activeChar && step >= dialogueStepStart && step < (data.problemFlash ? problemFlashStep : crisisStep) && (
          <DialogueBubble
            character={activeChar}
            text={typingText}
            isTyping={isTyping}
            lang={lang}
          />
        )}

        {/* Problem flash */}
        {data.problemFlash && step >= problemFlashStep && step < crisisStep && (
          <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 w-[90%] max-w-[500px]
                          bg-red-500/[0.08] border border-red-500/20 rounded-xl backdrop-blur-sm
                          py-4 px-5 text-center text-red-400 text-base font-semibold"
               style={{ animation: 'slideUp 0.6s ease' }}>
            {bl(data.problemFlash.text, lang)}
          </div>
        )}

        {/* Crisis overlay */}
        {step >= crisisStep && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center"
               onClick={(e) => e.stopPropagation()}
               style={{ animation: 'fadeIn 0.8s ease' }}>
            <div className="bg-gradient-to-b from-[#1a0a0a] to-[#0a0408] border border-red-500/30 rounded-2xl
                            shadow-[0_0_60px_rgba(220,38,38,0.1)] p-8 max-w-[440px] w-[90%] text-center"
                 style={{ animation: 'scaleIn 0.5s ease 0.3s both' }}>
              <div className="text-5xl mb-3" style={{ animation: 'pulse 2s infinite' }}>{data.crisis.emoji}</div>
              <div className="text-red-500 text-sm font-extrabold tracking-[3px] mb-3">
                {bl(data.crisis.badge, lang)}
              </div>
              <div className="text-white text-2xl font-black mb-3" style={{ fontFamily: 'Georgia, serif' }}
                   dangerouslySetInnerHTML={{ __html: bl(data.crisis.headline, lang) }} />
              <div className="text-gray-400 text-sm leading-relaxed mb-5">
                {bl(data.crisis.description, lang)}
              </div>
              <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-lg
                              p-3 text-amber-400 text-sm font-semibold mb-5">
                {bl(data.crisis.stakes, lang)}
              </div>
              <button
                onClick={onAdvance}
                className="w-full py-4 rounded-xl text-white text-base font-bold
                           shadow-lg transition-all active:scale-[0.97] hover:brightness-110"
                style={{ background: `linear-gradient(135deg, ${accent}, #a855f7)` }}
              >
                {bl(data.crisis.cta, lang)}
              </button>
            </div>
          </div>
        )}

        {/* Tap hint */}
        {showTapHint && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/20 text-sm tracking-wider animate-pulse">
            {isTyping ? '' : 'Нажмите, чтобы продолжить'}
          </div>
        )}
      </div>

      <div className="h-8 bg-black shrink-0" />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes breathe { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.02); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </div>
  );
}

/** Enhanced shelf with 3D-like product boxes */
function EnhancedShelves({ rows, productsPerRow, colors, chaos, shelfColor }: {
  rows: number; productsPerRow: number; colors: string[]; chaos: boolean; shelfColor: string;
}) {
  const shelves = useMemo(() => {
    return Array.from({ length: rows }, () =>
      Array.from({ length: productsPerRow }, () => ({
        height: 20 + Math.random() * 14,
        width: 16 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: chaos ? (Math.random() - 0.5) * 20 : 0,
        opacity: 0.5 + Math.random() * 0.4,
        labelHeight: 3 + Math.random() * 4,
      }))
    );
  }, [rows, productsPerRow, colors, chaos]);

  return (
    <div className="space-y-0.5">
      {shelves.map((row, rIdx) => (
        <div key={rIdx}>
          <div className="flex gap-[2px] justify-center items-end mb-0">
            {row.map((p, i) => (
              <div key={i} className="relative rounded-t-sm" style={{
                width: `${p.width}px`,
                height: `${p.height}px`,
                background: `linear-gradient(180deg, ${p.color}dd, ${p.color}88)`,
                opacity: p.opacity,
                transform: `rotate(${p.rotation}deg)`,
                boxShadow: `inset -2px 0 3px rgba(0,0,0,0.3), 0 -1px 2px rgba(255,255,255,0.05)`,
              }}>
                {/* Label stripe */}
                <div className="absolute left-[2px] right-[2px] rounded-sm" style={{
                  top: `${p.height * 0.3}px`,
                  height: `${p.labelHeight}px`,
                  background: 'rgba(255,255,255,0.15)',
                }} />
              </div>
            ))}
          </div>
          {/* Shelf board with 3D effect */}
          <div className="h-[6px] rounded-sm relative" style={{
            background: `linear-gradient(180deg, ${shelfColor}, #374151, ${shelfColor}80)`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.4), 0 1px 1px rgba(255,255,255,0.05) inset',
          }}>
            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{
              background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.3))',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Character with Lottie animation (fallback to SVG) */
function CharacterWithLottie({ character, visible, isActive, lang, entranceDelay }: {
  character: CinematicCharacter;
  visible: boolean;
  isActive: boolean;
  lang: 'ru' | 'uz';
  entranceDelay: number;
}) {
  const config = getCharacterLottie(character.detail);
  const { data: idleData, error: idleError } = useLottieLoader(config.idle);
  const { data: talkData } = useLottieLoader(config.talking);

  const lottieAvailable = !idleError && idleData;

  return (
    <div
      className={`absolute bottom-[100px] ${character.side === 'left' ? 'left-[6%]' : 'right-[6%]'}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.8s ease ${entranceDelay}ms, transform 0.8s ease ${entranceDelay}ms`,
      }}
    >
      <div className="relative" style={{
        transform: isActive ? 'scale(1.08)' : 'scale(1)',
        filter: isActive ? 'brightness(1.3) drop-shadow(0 0 20px rgba(100,150,255,0.3))' : 'brightness(0.85)',
        transition: 'transform 0.4s ease, filter 0.4s ease',
      }}>
        {lottieAvailable ? (
          <Suspense fallback={<CharacterSilhouetteSVG character={character} />}>
            <div className="w-[120px] h-[180px] relative">
              {/* Idle layer */}
              <div className="absolute inset-0" style={{
                opacity: isActive ? 0 : 1,
                transition: 'opacity 0.4s ease',
              }}>
                <Lottie animationData={idleData} loop style={{ width: '100%', height: '100%' }} />
              </div>
              {/* Talking layer */}
              {talkData && (
                <div className="absolute inset-0" style={{
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                }}>
                  <Lottie animationData={talkData} loop style={{ width: '100%', height: '100%' }} />
                </div>
              )}
            </div>
          </Suspense>
        ) : (
          <CharacterSilhouetteSVG character={character} />
        )}
      </div>

      {/* Character name */}
      <div className="text-center mt-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          character.side === 'left'
            ? 'text-red-300/70 bg-red-500/10'
            : 'text-blue-300/70 bg-blue-500/10'
        }`}>
          {bl(character.name, lang)}
        </span>
      </div>
    </div>
  );
}

/** SVG fallback silhouette (enhanced from original) */
function CharacterSilhouetteSVG({ character }: { character: CinematicCharacter }) {
  const fill = character.color || '#3b5998';
  return (
    <svg width="100" height="160" viewBox="0 0 100 160">
      {/* Head */}
      <circle cx="50" cy="28" r="18" fill={fill} opacity="0.9" />
      {/* Neck */}
      <rect x="44" y="44" width="12" height="10" rx="3" fill={fill} opacity="0.8" />
      {/* Body */}
      <path d="M25 60 Q30 54 50 54 Q70 54 75 60 L78 110 Q78 118 70 118 L30 118 Q22 118 22 110 Z"
            fill={fill} opacity="0.85" />
      {/* Left arm */}
      <path d="M28 64 L14 100 Q12 106 16 108 L22 106 L32 74" fill={fill} opacity="0.7" />
      {/* Right arm */}
      <path d="M72 64 L86 100 Q88 106 84 108 L78 106 L68 74" fill={fill} opacity="0.7" />
      {/* Left leg */}
      <path d="M32 116 L28 152 Q27 158 34 158 L40 158 L42 118" fill={fill} opacity="0.75" />
      {/* Right leg */}
      <path d="M58 116 L62 152 Q63 158 66 158 L72 158 L68 118" fill={fill} opacity="0.75" />
      {/* Emoji */}
      {character.emoji && <text x="40" y="34" fontSize="16">{character.emoji}</text>}
      {/* Detail */}
      {character.detail === 'clipboard' && (
        <g opacity="0.7">
          <rect x="10" y="78" width="18" height="24" rx="3" fill="#334155" stroke="#4b5563" strokeWidth="1.5" />
          <line x1="14" y1="86" x2="24" y2="86" stroke="#60a5fa" strokeWidth="1.5" opacity="0.6" />
          <line x1="14" y1="91" x2="22" y2="91" stroke="#60a5fa" strokeWidth="1.5" opacity="0.4" />
          <line x1="14" y1="96" x2="20" y2="96" stroke="#60a5fa" strokeWidth="1.5" opacity="0.3" />
        </g>
      )}
    </svg>
  );
}

/** Enhanced dialogue bubble */
function DialogueBubble({ character, text, isTyping, lang }: {
  character: CinematicCharacter;
  text: string;
  isTyping: boolean;
  lang: 'ru' | 'uz';
}) {
  const isLeft = character.side === 'left';
  const borderColor = isLeft ? 'rgba(220,38,38,0.25)' : 'rgba(59,130,246,0.25)';
  const nameColor = isLeft ? 'text-red-400' : 'text-blue-400';

  return (
    <div
      className={`absolute max-w-[400px] rounded-2xl p-5 backdrop-blur-md
        ${isLeft ? 'bottom-[220px] left-5' : 'bottom-[220px] right-5'}`}
      style={{
        background: `linear-gradient(135deg, rgba(10,10,20,0.92), rgba(15,15,30,0.95))`,
        border: `1px solid ${borderColor}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)`,
        animation: 'scaleIn 0.4s ease',
      }}
    >
      {/* Accent glow line at top */}
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full" style={{
        background: isLeft
          ? 'linear-gradient(90deg, transparent, rgba(220,38,38,0.4), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)',
      }} />

      {/* Name + role */}
      <div className="flex items-center gap-2 mb-3">
        {character.emoji && (
          <span className="text-lg">{character.emoji}</span>
        )}
        <span className={`text-xs font-bold tracking-[2px] ${nameColor}`}>
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
        {isTyping && <span className="inline-block w-[2px] h-[18px] bg-white/60 ml-0.5 animate-pulse align-text-bottom" />}
        <span className="text-white/40">{'\u00BB'}</span>
      </div>

      {/* Tail */}
      <div className={`absolute bottom-[-8px] ${isLeft ? 'left-6' : 'right-6'}`}>
        <svg width="16" height="10" viewBox="0 0 16 10">
          <path d={isLeft ? 'M0 0 L8 10 L16 0' : 'M0 0 L8 10 L16 0'} fill="rgba(10,10,20,0.92)" />
        </svg>
      </div>
    </div>
  );
}
