import { motion } from 'framer-motion';

/**
 * Minecraft-style pixel art characters for cinematic scenes.
 * Each character is built from pixel rectangles (like MC skins).
 * Style: "Traektoriya Blocks" — inspired by Minecraft but corporate FMCG.
 */

const PX = 3; // pixel size in SVG units

// Skin tone palettes
const SKIN = {
  light: { base: '#d4a574', shadow: '#b8895c', highlight: '#e8c49a' },
  medium: { base: '#c4956a', shadow: '#a87a52', highlight: '#d8b088' },
  dark: { base: '#8b6b4a', shadow: '#6f5438', highlight: '#a07f5c' },
};

// Character presets for different roles
const CHARACTER_PRESETS: Record<string, CharacterSkin> = {
  sales_rep: {
    hair: { color: '#1a1a2e', style: 'short' },
    skin: SKIN.medium,
    shirt: { primary: '#1e40af', secondary: '#1d4ed8', collar: '#ffffff' },
    pants: '#1e293b',
    shoes: '#0f172a',
    badge: '#f59e0b',
    accessory: 'clipboard',
  },
  sales_rep_female: {
    hair: { color: '#2d1f14', style: 'long' },
    skin: SKIN.light,
    shirt: { primary: '#7c3aed', secondary: '#6d28d9', collar: '#f5f3ff' },
    pants: '#1e293b',
    shoes: '#4a1d7a',
    badge: '#f59e0b',
    accessory: 'tablet',
  },
  supervisor: {
    hair: { color: '#374151', style: 'neat' },
    skin: SKIN.light,
    shirt: { primary: '#991b1b', secondary: '#b91c1c', collar: '#fef2f2' },
    pants: '#1f2937',
    shoes: '#111827',
    badge: '#10b981',
    tie: '#fbbf24',
    accessory: 'phone',
  },
  hr_manager: {
    hair: { color: '#92400e', style: 'short' },
    skin: SKIN.light,
    shirt: { primary: '#0f766e', secondary: '#14b8a6', collar: '#ffffff' },
    pants: '#334155',
    shoes: '#1e293b',
    badge: '#3b82f6',
    accessory: 'clipboard',
  },
  store_keeper: {
    hair: { color: '#1a1a2e', style: 'short' },
    skin: SKIN.dark,
    shirt: { primary: '#065f46', secondary: '#047857', collar: '#d1fae5' },
    pants: '#374151',
    shoes: '#1f2937',
    apron: '#92400e',
    accessory: 'box',
  },
  regional_manager: {
    hair: { color: '#1f2937', style: 'neat' },
    skin: SKIN.light,
    shirt: { primary: '#1e293b', secondary: '#334155', collar: '#e2e8f0' },
    pants: '#0f172a',
    shoes: '#000000',
    badge: '#ef4444',
    tie: '#dc2626',
    accessory: 'laptop',
  },
  customer: {
    hair: { color: '#44403c', style: 'short' },
    skin: SKIN.medium,
    shirt: { primary: '#525252', secondary: '#737373', collar: '#a3a3a3' },
    pants: '#3f3f46',
    shoes: '#27272a',
    accessory: 'none',
  },
};

interface CharacterSkin {
  hair: { color: string; style: 'short' | 'long' | 'neat' };
  skin: { base: string; shadow: string; highlight: string };
  shirt: { primary: string; secondary: string; collar: string };
  pants: string;
  shoes: string;
  badge?: string;
  tie?: string;
  apron?: string;
  accessory: string;
}

interface Props {
  type?: string;
  isActive?: boolean;
  size?: number;
}

export function MinecraftCharacter({ type = 'sales_rep', isActive = false, size = 1 }: Props) {
  const skin = CHARACTER_PRESETS[type] || CHARACTER_PRESETS.sales_rep;
  const s = PX * size;

  return (
    <svg
      width={16 * s}
      height={32 * s}
      viewBox={`0 0 ${16 * PX} ${32 * PX}`}
      style={{ imageRendering: 'pixelated' }}
    >
      {/* === HEAD (8x8 pixels, centered) === */}
      <g>
        {/* Hair top */}
        {renderPixelRow(4, 0, skin.hair.color, [0, 1, 1, 1, 1, 1, 1, 0])}
        {renderPixelRow(4, 1, skin.hair.color, [1, 1, 1, 1, 1, 1, 1, 1])}

        {/* Hair style variations */}
        {skin.hair.style === 'long' && (
          <>
            {renderPixel(3, 2, skin.hair.color)}
            {renderPixel(3, 3, skin.hair.color)}
            {renderPixel(3, 4, skin.hair.color)}
            {renderPixel(3, 5, skin.hair.color)}
            {renderPixel(3, 6, skin.hair.color)}
            {renderPixel(12, 2, skin.hair.color)}
            {renderPixel(12, 3, skin.hair.color)}
            {renderPixel(12, 4, skin.hair.color)}
            {renderPixel(12, 5, skin.hair.color)}
            {renderPixel(12, 6, skin.hair.color)}
          </>
        )}
        {skin.hair.style === 'neat' && (
          <>
            {renderPixelRow(4, 2, skin.hair.color, [1, 1, 0, 0, 0, 0, 1, 1])}
          </>
        )}
        {skin.hair.style === 'short' && (
          <>
            {renderPixelRow(4, 2, skin.hair.color, [1, 0, 0, 0, 0, 0, 0, 1])}
          </>
        )}

        {/* Face - forehead */}
        {renderPixelRow(4, 2, skin.skin.base, [0, 1, 1, 1, 1, 1, 1, 0])}
        {renderPixelRow(4, 3, skin.skin.base, [1, 1, 1, 1, 1, 1, 1, 1])}

        {/* Eyes row */}
        {renderPixel(5, 4, skin.skin.base)}
        {renderPixel(6, 4, '#1a1a2e')} {/* Left eye */}
        {renderPixel(7, 4, skin.skin.base)}
        {renderPixel(8, 4, skin.skin.base)}
        {renderPixel(9, 4, '#1a1a2e')} {/* Right eye */}
        {renderPixel(10, 4, skin.skin.base)}
        {renderPixel(4, 4, skin.skin.shadow)}
        {renderPixel(11, 4, skin.skin.shadow)}

        {/* Eye highlights (white pixel in each eye) */}
        {renderPixel(6, 4, '#ffffff', 0.5)}
        {renderPixel(9, 4, '#ffffff', 0.5)}

        {/* Nose & cheeks */}
        {renderPixelRow(4, 5, skin.skin.base, [1, 1, 1, 1, 1, 1, 1, 1])}
        {renderPixel(7, 5, skin.skin.shadow)} {/* Nose shadow */}
        {renderPixel(8, 5, skin.skin.shadow)}

        {/* Mouth row */}
        {renderPixelRow(4, 6, skin.skin.base, [1, 1, 1, 1, 1, 1, 1, 1])}
        {renderPixel(7, 6, '#8b4513')} {/* Mouth */}
        {renderPixel(8, 6, '#8b4513')}

        {/* Chin */}
        {renderPixelRow(4, 7, skin.skin.base, [0, 1, 1, 1, 1, 1, 1, 0])}
        {renderPixel(5, 7, skin.skin.shadow)}
        {renderPixel(10, 7, skin.skin.shadow)}
      </g>

      {/* === BODY (8x12 pixels) === */}
      <g>
        {/* Collar / Neck */}
        {renderPixelRow(5, 8, skin.skin.base, [0, 1, 1, 1, 1, 1, 0, 0])}
        {renderPixelRow(4, 9, skin.shirt.collar, [0, 1, 1, 1, 1, 1, 1, 0])}

        {/* Shirt body */}
        {Array.from({ length: 8 }, (_, i) => (
          <g key={`shirt-${i}`}>
            {renderPixelRow(4, 10 + i, skin.shirt.primary, [1, 1, 1, 1, 1, 1, 1, 1])}
            {/* Shirt shadow on sides */}
            {renderPixel(4, 10 + i, skin.shirt.secondary)}
            {renderPixel(11, 10 + i, skin.shirt.secondary)}
          </g>
        ))}

        {/* Tie */}
        {skin.tie && (
          <>
            {renderPixel(7, 9, skin.tie)}
            {renderPixel(8, 9, skin.tie)}
            {renderPixel(7, 10, skin.tie)}
            {renderPixel(8, 10, skin.tie)}
            {renderPixel(7, 11, skin.tie)}
            {renderPixel(8, 11, skin.tie)}
            {renderPixel(7, 12, skin.tie)}
            {renderPixel(8, 12, skin.tie)}
            {renderPixel(8, 13, skin.tie)}
            {renderPixel(8, 14, skin.tie)}
          </>
        )}

        {/* Badge */}
        {skin.badge && (
          <>
            {renderPixel(5, 10, skin.badge)}
            {renderPixel(6, 10, skin.badge)}
            {renderPixel(5, 11, skin.badge)}
            {renderPixel(6, 11, skin.badge)}
          </>
        )}

        {/* Apron */}
        {skin.apron && (
          <>
            {renderPixelRow(5, 12, skin.apron, [0, 1, 1, 1, 1, 1, 0, 0])}
            {renderPixelRow(5, 13, skin.apron, [0, 1, 1, 1, 1, 1, 0, 0])}
            {renderPixelRow(5, 14, skin.apron, [0, 1, 1, 1, 1, 1, 0, 0])}
            {renderPixelRow(5, 15, skin.apron, [0, 1, 1, 1, 1, 1, 0, 0])}
            {renderPixelRow(5, 16, skin.apron, [0, 1, 1, 1, 1, 1, 0, 0])}
            {renderPixelRow(5, 17, skin.apron, [0, 1, 1, 1, 1, 1, 0, 0])}
          </>
        )}

        {/* Belt */}
        {renderPixelRow(4, 17, '#1e293b', [1, 1, 1, 1, 1, 1, 1, 1])}
        {renderPixel(7, 17, '#fbbf24')} {/* Belt buckle */}
        {renderPixel(8, 17, '#fbbf24')}
      </g>

      {/* === ARMS (2x10 pixels each) === */}
      {/* Left arm */}
      <motion.g
        animate={isActive
          ? { rotate: [-5, -15, -5, -20, -5] }
          : { rotate: 0 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: `${4 * PX}px ${9 * PX}px` }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <g key={`la-${i}`}>
            {renderPixel(2, 9 + i, skin.shirt.primary)}
            {renderPixel(3, 9 + i, skin.shirt.secondary)}
          </g>
        ))}
        {/* Hand */}
        {renderPixel(2, 17, skin.skin.base)}
        {renderPixel(3, 17, skin.skin.shadow)}
        {renderPixel(2, 18, skin.skin.base)}
        {renderPixel(3, 18, skin.skin.shadow)}
      </motion.g>

      {/* Right arm */}
      <motion.g
        animate={isActive
          ? { rotate: [5, 15, 5, 20, 5] }
          : { rotate: 0 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        style={{ transformOrigin: `${12 * PX}px ${9 * PX}px` }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <g key={`ra-${i}`}>
            {renderPixel(12, 9 + i, skin.shirt.primary)}
            {renderPixel(13, 9 + i, skin.shirt.secondary)}
          </g>
        ))}
        {/* Hand */}
        {renderPixel(12, 17, skin.skin.base)}
        {renderPixel(13, 17, skin.skin.shadow)}
        {renderPixel(12, 18, skin.skin.base)}
        {renderPixel(13, 18, skin.skin.shadow)}
      </motion.g>

      {/* === LEGS (2x10 pixels each, 2px gap) === */}
      <motion.g
        animate={isActive ? { y: [0, -1, 0] } : { y: 0 }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {/* Left leg */}
        {Array.from({ length: 6 }, (_, i) => (
          <g key={`ll-${i}`}>
            {renderPixel(5, 18 + i, skin.pants)}
            {renderPixel(6, 18 + i, skin.pants)}
          </g>
        ))}
        {/* Right leg */}
        {Array.from({ length: 6 }, (_, i) => (
          <g key={`rl-${i}`}>
            {renderPixel(9, 18 + i, skin.pants)}
            {renderPixel(10, 18 + i, skin.pants)}
          </g>
        ))}
        {/* Shoes */}
        {renderPixel(4, 24, skin.shoes)}
        {renderPixel(5, 24, skin.shoes)}
        {renderPixel(6, 24, skin.shoes)}
        {renderPixel(7, 24, skin.shoes)}
        {renderPixel(8, 24, skin.shoes)}
        {renderPixel(9, 24, skin.shoes)}
        {renderPixel(10, 24, skin.shoes)}
        {renderPixel(11, 24, skin.shoes)}
      </motion.g>

      {/* === ACCESSORIES === */}
      {skin.accessory === 'clipboard' && (
        <g>
          {/* Clipboard held in left hand */}
          {renderPixel(0, 13, '#94a3b8')}
          {renderPixel(1, 13, '#94a3b8')}
          {renderPixel(0, 14, '#f8fafc')}
          {renderPixel(1, 14, '#f8fafc')}
          {renderPixel(0, 15, '#f8fafc')}
          {renderPixel(1, 15, '#f8fafc')}
          {renderPixel(0, 16, '#f8fafc')}
          {renderPixel(1, 16, '#f8fafc')}
          {renderPixel(0, 17, '#f8fafc')}
          {renderPixel(1, 17, '#f8fafc')}
          {/* Lines on clipboard */}
          {renderPixel(0, 14, '#3b82f6', 0.5)}
          {renderPixel(0, 15, '#3b82f6', 0.4)}
          {renderPixel(0, 16, '#ef4444', 0.4)}
        </g>
      )}
      {skin.accessory === 'phone' && (
        <g>
          {renderPixel(14, 11, '#1e293b')}
          {renderPixel(15, 11, '#1e293b')}
          {renderPixel(14, 12, '#3b82f6', 0.4)}
          {renderPixel(15, 12, '#3b82f6', 0.4)}
          {renderPixel(14, 13, '#3b82f6', 0.3)}
          {renderPixel(15, 13, '#3b82f6', 0.3)}
          {renderPixel(14, 14, '#1e293b')}
          {renderPixel(15, 14, '#1e293b')}
        </g>
      )}
      {skin.accessory === 'tablet' && (
        <g>
          {renderPixel(14, 12, '#374151')}
          {renderPixel(15, 12, '#374151')}
          {renderPixel(14, 13, '#60a5fa', 0.3)}
          {renderPixel(15, 13, '#60a5fa', 0.3)}
          {renderPixel(14, 14, '#60a5fa', 0.25)}
          {renderPixel(15, 14, '#60a5fa', 0.25)}
          {renderPixel(14, 15, '#60a5fa', 0.2)}
          {renderPixel(15, 15, '#60a5fa', 0.2)}
          {renderPixel(14, 16, '#374151')}
          {renderPixel(15, 16, '#374151')}
        </g>
      )}
      {skin.accessory === 'box' && (
        <g>
          {Array.from({ length: 3 }, (_, r) =>
            Array.from({ length: 3 }, (_, c) =>
              <rect key={`box-${r}-${c}`} x={(0 + c) * PX} y={(13 + r) * PX}
                width={PX} height={PX} fill={r === 0 ? '#b45309' : '#92400e'} />
            )
          )}
        </g>
      )}
      {skin.accessory === 'laptop' && (
        <g>
          {renderPixelRow(0, 13, '#374151', [1, 1, 1])}
          {renderPixelRow(0, 14, '#1e293b', [1, 1, 1])}
          {renderPixel(0, 14, '#60a5fa', 0.3)}
          {renderPixel(1, 14, '#60a5fa', 0.25)}
          {renderPixelRow(0, 15, '#475569', [1, 1, 1])}
        </g>
      )}

      {/* Ground shadow */}
      <ellipse cx={8 * PX} cy={25 * PX} rx={5 * PX} ry={PX} fill="rgba(0,0,0,0.2)" />
    </svg>
  );
}

/** Render a single pixel */
function renderPixel(x: number, y: number, color: string, opacity = 1) {
  return <rect x={x * PX} y={y * PX} width={PX} height={PX} fill={color} opacity={opacity} />;
}

/** Render a row of pixels from a pattern (1 = filled, 0 = skip) */
function renderPixelRow(startX: number, y: number, color: string, pattern: number[]) {
  return (
    <>
      {pattern.map((p, i) => p ? (
        <rect key={`${startX + i}-${y}`} x={(startX + i) * PX} y={y * PX}
          width={PX} height={PX} fill={color} />
      ) : null)}
    </>
  );
}

/** Get available character types */
export function getCharacterTypes() {
  return Object.keys(CHARACTER_PRESETS);
}

/** Get preset by type */
export function getCharacterPreset(type: string) {
  return CHARACTER_PRESETS[type] || CHARACTER_PRESETS.sales_rep;
}
