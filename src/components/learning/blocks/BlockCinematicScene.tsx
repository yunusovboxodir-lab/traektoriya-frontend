import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { BlockCinematicSceneData, CinematicCharacter } from '../../../api/learning';
import { getAtmosphere } from './atmospheres';

const TYPING_SPEED_MS = 50; // per character — user requested slower

interface Props {
  data: BlockCinematicSceneData;
  accent: string;
  onAdvance: () => void;
}

export function BlockCinematicScene({ data, accent, onAdvance }: Props) {
  const atmo = useMemo(() => getAtmosphere(data.atmosphere), [data.atmosphere]);
  const [step, setStep] = useState(0);
  // 0 = fade in
  // 1 = show location + shelves
  // 2 = show characters
  // 3..N = dialogues (one per dialogue entry)
  // N+1 = problem flash (if exists)
  // N+2 = crisis overlay

  const [typingText, setTypingText] = useState('');
  const [activeDialogueIdx, setActiveDialogueIdx] = useState(-1);
  const typingRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Calculate step milestones
  const dialogueStepStart = 3;
  const dialogueCount = data.dialogues.length;
  const problemFlashStep = dialogueStepStart + dialogueCount;
  const crisisStep = data.problemFlash
    ? problemFlashStep + 1
    : problemFlashStep;

  // Type text character by character
  const typeText = useCallback((text: string, onDone?: () => void) => {
    setTypingText('');
    let i = 0;
    if (typingRef.current) clearInterval(typingRef.current);
    typingRef.current = setInterval(() => {
      setTypingText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        if (typingRef.current) clearInterval(typingRef.current);
        onDone?.();
      }
    }, TYPING_SPEED_MS);
  }, []);

  // Auto-advance steps based on dialogue timings
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Step 1: location + shelves (600ms)
    timers.push(setTimeout(() => setStep(1), 600));

    // Step 2: characters (1400ms)
    timers.push(setTimeout(() => setStep(2), 1400));

    // Step 3+: dialogues with delays
    let accDelay = 2200; // base delay before first dialogue
    data.dialogues.forEach((d, i) => {
      const delay = i === 0 ? accDelay : accDelay;
      timers.push(setTimeout(() => {
        setStep(dialogueStepStart + i);
        setActiveDialogueIdx(i);
        typeText(d.text);
      }, delay));
      // estimate how long typing will take + 500ms pause
      accDelay += d.delayMs || (d.text.length * TYPING_SPEED_MS + 1000);
    });

    // Problem flash
    if (data.problemFlash) {
      timers.push(setTimeout(() => setStep(problemFlashStep), accDelay));
      accDelay += data.problemFlash.delayMs || 1500;
    }

    // Crisis overlay
    timers.push(setTimeout(() => setStep(crisisStep), accDelay));

    return () => {
      timers.forEach(clearTimeout);
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, [data, typeText, dialogueStepStart, problemFlashStep, crisisStep]);

  // Get active dialogue character side
  const activeDialogue = activeDialogueIdx >= 0 ? data.dialogues[activeDialogueIdx] : null;
  const activeChar = activeDialogue
    ? data.characters.find(c => c.id === activeDialogue.characterId)
    : null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden" style={{ fontFamily: "'Georgia', serif" }}>
      {/* Top cinematic bar */}
      <div className="h-11 bg-black shrink-0" />

      {/* Main scene */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0" style={{ background: atmo.gradient }} />

        {/* Light effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[70%]"
             style={{ background: `linear-gradient(180deg, ${atmo.lightColor} 0%, transparent 100%)` }}>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[120px] h-[3px] rounded-sm"
               style={{ background: `rgba(255,255,255,${atmo.lightOpacity})`, boxShadow: '0 0 20px rgba(255,255,255,0.05)' }} />
        </div>

        {/* Shelves (store atmospheres) */}
        {atmo.shelves && (
          <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 w-[85%] max-w-[360px]"
               style={{ opacity: step >= 1 ? 1 : 0, transition: 'opacity 0.8s ease' }}>
            {Array.from({ length: atmo.shelves.rows }).map((_, row) => (
              <div key={row}>
                <ShelfProducts
                  count={atmo.shelves!.productsPerRow}
                  colors={atmo.productColors}
                  chaos={atmo.shelves!.chaos}
                />
                <div className="h-1.5 rounded-sm mb-0.5"
                     style={{ background: `linear-gradient(90deg, ${atmo.shelves!.shelfColor}, #4b5563, ${atmo.shelves!.shelfColor})` }} />
              </div>
            ))}
          </div>
        )}

        {/* Characters */}
        {data.characters.map(char => (
          <CharacterSilhouette
            key={char.id}
            character={char}
            visible={step >= 2}
          />
        ))}

        {/* Location tag */}
        <div
          className="absolute top-4 left-6 transition-opacity duration-1000"
          style={{ opacity: step >= 1 ? 1 : 0 }}
        >
          <div className="text-white/30 text-[9px] tracking-[3px] uppercase">{data.location.day}</div>
          <div className="text-white text-[28px] font-black tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            {data.location.time}
          </div>
          <div className="text-white/20 text-[9px] tracking-[2px]">{data.location.subtitle}</div>
        </div>

        {/* Dialogue bubbles */}
        {activeChar && step >= dialogueStepStart && step < (data.problemFlash ? problemFlashStep : crisisStep) && (
          <div
            className={`absolute max-w-[260px] bg-black/90 rounded-[14px] p-3.5 transition-opacity duration-500
              ${activeChar.side === 'left'
                ? 'bottom-[220px] left-5 border border-red-500/30 rounded-bl'
                : 'bottom-[220px] right-5 border border-blue-400/30 rounded-br'
              }`}
            style={{ animation: 'fadeIn 0.5s ease' }}
          >
            <div className={`text-[9px] font-bold tracking-[1px] mb-1.5 ${
              activeChar.side === 'left' ? 'text-red-500' : 'text-blue-400'
            }`}>
              {activeChar.name.toUpperCase()} {activeChar.role ? `(${activeChar.role.toUpperCase()})` : ''}
            </div>
            <div className="text-gray-200 text-[13px] leading-relaxed italic" style={{ fontFamily: 'Georgia, serif' }}>
              {'\u00AB'}{typingText}<span className="animate-pulse">|</span>{'\u00BB'}
            </div>
          </div>
        )}

        {/* Problem flash */}
        {data.problemFlash && step >= problemFlashStep && step < crisisStep && (
          <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 w-[90%]
                          bg-red-500/[0.08] border border-red-500/20 rounded-xl
                          py-2.5 px-3.5 text-center text-red-500/80 text-[11px] font-semibold"
               style={{ animation: 'fadeIn 0.8s ease' }}>
            {data.problemFlash.text}
          </div>
        )}

        {/* Crisis overlay */}
        {step >= crisisStep && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center"
               style={{ animation: 'fadeIn 0.8s ease' }}>
            <div className="bg-[rgba(8,4,0,0.97)] border border-red-500/40 rounded-2xl
                            p-7 max-w-[340px] w-[88%] text-center">
              <div className="text-4xl mb-2">{data.crisis.emoji}</div>
              <div className="text-red-500 text-[13px] font-extrabold tracking-[3px] mb-3">
                {data.crisis.badge}
              </div>
              <div className="text-white text-xl font-black mb-2" style={{ fontFamily: 'Georgia, serif' }}
                   dangerouslySetInnerHTML={{ __html: data.crisis.headline }} />
              <div className="text-gray-400 text-xs leading-relaxed mb-4">
                {data.crisis.description}
              </div>
              <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-lg
                              p-2.5 text-amber-500 text-xs font-semibold mb-4">
                {data.crisis.stakes}
              </div>
              <button
                onClick={onAdvance}
                className="w-full py-3.5 rounded-xl text-white text-sm font-bold
                           transition-transform active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${accent}, #a855f7)` }}
              >
                {data.crisis.cta}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom cinematic bar */}
      <div className="h-11 bg-black shrink-0" />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

/** Shelf product boxes */
function ShelfProducts({ count, colors, chaos }: { count: number; colors: string[]; chaos: boolean }) {
  const products = useMemo(() => {
    return Array.from({ length: count }, () => ({
      height: 14 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: chaos ? (Math.random() - 0.5) * 30 : 0,
      opacity: 0.4 + Math.random() * 0.3,
    }));
  }, [count, colors, chaos]);

  return (
    <div className="flex gap-[3px] justify-center mb-1">
      {products.map((p, i) => (
        <div
          key={i}
          className="w-[18px] rounded-sm"
          style={{
            height: `${p.height}px`,
            background: p.color,
            opacity: p.opacity,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/** Character silhouette SVG */
function CharacterSilhouette({ character, visible }: { character: CinematicCharacter; visible: boolean }) {
  const fill = character.color || '#1e3a5f';

  return (
    <div
      className={`absolute bottom-[110px] transition-all duration-800
        ${character.side === 'left' ? 'left-[12%]' : 'right-[12%]'}`}
      style={{ opacity: visible ? 1 : 0 }}
    >
      <svg width="50" height="80" viewBox="0 0 50 80">
        <circle cx="25" cy="14" r="12" fill={fill} />
        <path d="M5 80 Q25 46 45 80" fill={fill} />
        {/* Extra detail — clipboard for specific characters */}
        {character.detail === 'clipboard' && (
          <>
            <rect x="8" y="40" width="14" height="18" rx="2" fill="#334155" stroke="#4b5563" strokeWidth="1" />
            <line x1="12" y1="46" x2="18" y2="46" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />
            <line x1="12" y1="50" x2="20" y2="50" stroke="#60a5fa" strokeWidth="1" opacity="0.4" />
          </>
        )}
        {/* Emoji in head */}
        {character.emoji && (
          <text x="18" y="18" fontSize="12">{character.emoji}</text>
        )}
      </svg>
      <div className="text-center text-white/40 text-[9px] mt-0.5">{character.name}</div>
    </div>
  );
}
