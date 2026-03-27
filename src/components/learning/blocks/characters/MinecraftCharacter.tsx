/**
 * Minecraft-style pixel-art SVG character renderer.
 *
 * Proportions (Minecraft skin style):
 * - Head: 32x32px (large, blocky)
 * - Body: 32x48px
 * - Arms: 16x48px each
 * - Legs: 16x48px each
 * Total canvas: 120x180px
 *
 * All shapes use sharp pixel edges (no border-radius).
 * Shading via darker color on right/bottom sides (2-3px strips).
 */

import { motion } from 'framer-motion';
import { getCharacterSkin } from './index';

interface Props {
  skinId: string;
  emoji?: string;
  isActive?: boolean;
  /** Override skin color (from lesson data) */
  colorOverride?: string;
  width?: number;
  height?: number;
}

export function MinecraftCharacter({
  skinId,
  emoji,
  isActive = false,
  colorOverride,
  width = 120,
  height = 180,
}: Props) {
  const skin = getCharacterSkin(skinId);
  const face = emoji || skin.defaultEmoji;
  const shirt = colorOverride || skin.clothing.shirt;
  const shirtShade = colorOverride
    ? adjustBrightness(colorOverride, -30)
    : skin.clothing.shirtShade;

  return (
    <svg width={width} height={height} viewBox="0 0 120 180" style={{ imageRendering: 'pixelated' }}>
      <defs>
        {/* Pixel grid pattern for texture */}
        <pattern id={`pixel-${skinId}`} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="transparent" />
          <rect width="1" height="1" fill="rgba(0,0,0,0.03)" />
        </pattern>
      </defs>

      {/* Shadow on ground */}
      <ellipse cx="60" cy="176" rx="30" ry="4" fill="rgba(0,0,0,0.25)" />

      {/* === LEGS === */}
      <motion.g
        animate={isActive ? { y: [0, -1, 0, 1, 0] } : { y: 0 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      >
        {/* Left leg */}
        <rect x="36" y="128" width="16" height="40" fill={skin.clothing.pants} />
        <rect x="48" y="128" width="4" height="40" fill={skin.clothing.pantsShade} />
        <rect x="36" y="164" width="4" height="4" fill={skin.clothing.pantsShade} />
        {/* Left shoe */}
        <rect x="32" y="164" width="22" height="10" fill={skin.clothing.shoes} />
        <rect x="50" y="164" width="4" height="10" fill={skin.clothing.shoesShade} />
        <rect x="32" y="164" width="22" height="3" fill={skin.clothing.shoesShade} />
        {/* Shoe highlight */}
        <rect x="34" y="166" width="8" height="2" fill="rgba(255,255,255,0.08)" />

        {/* Right leg */}
        <rect x="56" y="128" width="16" height="40" fill={skin.clothing.pants} />
        <rect x="68" y="128" width="4" height="40" fill={skin.clothing.pantsShade} />
        <rect x="56" y="164" width="4" height="4" fill={skin.clothing.pantsShade} />
        {/* Right shoe */}
        <rect x="54" y="164" width="22" height="10" fill={skin.clothing.shoes} />
        <rect x="72" y="164" width="4" height="10" fill={skin.clothing.shoesShade} />
        <rect x="54" y="164" width="22" height="3" fill={skin.clothing.shoesShade} />
        <rect x="56" y="166" width="8" height="2" fill="rgba(255,255,255,0.08)" />
      </motion.g>

      {/* === BODY / TORSO === */}
      {/* Main body */}
      <rect x="36" y="80" width="36" height="52" fill={shirt} />
      {/* Right shade */}
      <rect x="68" y="80" width="4" height="52" fill={shirtShade} />
      {/* Bottom shade */}
      <rect x="36" y="128" width="36" height="4" fill={shirtShade} />
      {/* Pixel texture overlay */}
      <rect x="36" y="80" width="36" height="52" fill={`url(#pixel-${skinId})`} />

      {/* Shirt collar */}
      <rect x="44" y="80" width="20" height="6" fill={skin.clothing.shirt} />
      <rect x="48" y="80" width="12" height="4" fill={skin.skin.head} opacity="0.6" />

      {/* Overlay (jacket/apron/vest) */}
      {skin.clothing.overlay && (
        <>
          <rect x="32" y="82" width="8" height="46" fill={skin.clothing.overlay} />
          <rect x="68" y="82" width="8" height="46" fill={skin.clothing.overlay} />
          <rect x="36" y="82" width="4" height="46" fill={skin.clothing.overlay} opacity="0.7" />
          <rect x="64" y="82" width="8" height="46" fill={skin.clothing.overlay} opacity="0.7" />
          {/* Overlay shade */}
          <rect x="72" y="82" width="4" height="46" fill={skin.clothing.overlayShade || skin.clothing.overlay} />
        </>
      )}

      {/* Tie */}
      {skin.accessories.includes('tie') && (
        <>
          <rect x="52" y="82" width="4" height="4" fill="#dc2626" />
          <rect x="51" y="86" width="6" height="20" fill="#b91c1c" />
          <rect x="52" y="106" width="4" height="6" fill="#991b1b" />
          {/* Tie knot */}
          <rect x="50" y="82" width="8" height="4" fill="#ef4444" />
        </>
      )}

      {/* Badge */}
      {skin.accessories.includes('badge') && (
        <>
          <rect x="40" y="88" width="12" height="8" fill="#f8fafc" />
          <rect x="42" y="90" width="8" height="2" fill="#3b82f6" />
          <rect x="42" y="93" width="6" height="1" fill="#94a3b8" />
          <rect x="40" y="88" width="12" height="1" fill="#dc2626" />
        </>
      )}

      {/* === LEFT ARM === */}
      <motion.g
        style={{ transformOrigin: '34px 82px' }}
        animate={isActive
          ? { rotate: [-8, -30, -12, -25, -8] }
          : { rotate: 0 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="18" y="80" width="16" height="44" fill={shirt} />
        <rect x="18" y="80" width="4" height="44" fill={shirtShade} />
        <rect x="18" y="120" width="4" height="4" fill={shirtShade} />
        {/* Hand */}
        <rect x="18" y="120" width="16" height="8" fill={skin.skin.head} />
        <rect x="18" y="120" width="4" height="8" fill={skin.skin.headShade} />
        {/* Pixel texture */}
        <rect x="18" y="80" width="16" height="44" fill={`url(#pixel-${skinId})`} />

        {/* Accessory in left hand */}
        {skin.accessories.includes('clipboard') && (
          <g>
            <rect x="8" y="100" width="18" height="26" fill="#e2e8f0" />
            <rect x="8" y="100" width="18" height="3" fill="#94a3b8" />
            <rect x="12" y="106" width="10" height="2" fill="#3b82f6" opacity="0.6" />
            <rect x="12" y="110" width="8" height="2" fill="#3b82f6" opacity="0.4" />
            <rect x="12" y="114" width="10" height="2" fill="#3b82f6" opacity="0.3" />
            <rect x="12" y="118" width="6" height="2" fill="#dc2626" opacity="0.4" />
          </g>
        )}
        {skin.accessories.includes('tablet') && (
          <g>
            <rect x="8" y="102" width="20" height="28" rx="0" fill="#1e293b" />
            <rect x="10" y="104" width="16" height="22" fill="#0f172a" />
            <rect x="12" y="106" width="12" height="4" fill="#3b82f6" opacity="0.3" />
            <rect x="12" y="112" width="8" height="2" fill="#22c55e" opacity="0.3" />
            <rect x="12" y="116" width="10" height="6" fill="#1e40af" opacity="0.2" />
          </g>
        )}
        {skin.accessories.includes('folder') && (
          <g>
            <rect x="6" y="98" width="22" height="30" fill="#dc2626" />
            <rect x="6" y="98" width="22" height="4" fill="#b91c1c" />
            <rect x="8" y="104" width="18" height="22" fill="#fecaca" />
            <rect x="10" y="108" width="14" height="2" fill="#374151" opacity="0.4" />
            <rect x="10" y="112" width="10" height="2" fill="#374151" opacity="0.3" />
            <rect x="10" y="116" width="12" height="2" fill="#374151" opacity="0.3" />
          </g>
        )}
        {skin.accessories.includes('box') && (
          <g>
            <rect x="4" y="104" width="26" height="22" fill="#92400e" />
            <rect x="4" y="104" width="26" height="4" fill="#b45309" />
            <rect x="14" y="104" width="4" height="22" fill="#b45309" opacity="0.5" />
            <rect x="4" y="114" width="26" height="2" fill="#78350f" />
          </g>
        )}
      </motion.g>

      {/* === RIGHT ARM === */}
      <motion.g
        style={{ transformOrigin: '74px 82px' }}
        animate={isActive
          ? { rotate: [5, 20, 8, 18, 5] }
          : { rotate: 0 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
      >
        <rect x="74" y="80" width="16" height="44" fill={shirt} />
        <rect x="86" y="80" width="4" height="44" fill={shirtShade} />
        <rect x="74" y="120" width="4" height="4" fill={shirtShade} />
        {/* Hand */}
        <rect x="74" y="120" width="16" height="8" fill={skin.skin.head} />
        <rect x="86" y="120" width="4" height="8" fill={skin.skin.headShade} />
        <rect x="74" y="80" width="16" height="44" fill={`url(#pixel-${skinId})`} />

        {/* Accessory in right hand */}
        {skin.accessories.includes('phone') && (
          <g>
            <rect x="80" y="104" width="14" height="24" fill="#1e293b" />
            <rect x="82" y="106" width="10" height="18" fill="#0f172a" />
            <rect x="84" y="108" width="6" height="8" fill="#3b82f6" opacity="0.25" />
            <rect x="84" y="118" width="6" height="2" fill="#475569" />
          </g>
        )}
        {skin.accessories.includes('notebook') && (
          <g>
            <rect x="80" y="100" width="18" height="24" fill="#1e3a5f" />
            <rect x="80" y="100" width="18" height="3" fill="#172554" />
            <rect x="82" y="106" width="14" height="2" fill="rgba(255,255,255,0.15)" />
            <rect x="82" y="110" width="10" height="2" fill="rgba(255,255,255,0.1)" />
            <rect x="82" y="114" width="12" height="2" fill="rgba(255,255,255,0.1)" />
            {/* Pen */}
            <rect x="96" y="98" width="2" height="28" fill="#f59e0b" />
            <rect x="96" y="98" width="2" height="4" fill="#0f172a" />
          </g>
        )}
        {skin.accessories.includes('laptop') && (
          <g>
            {/* Laptop base */}
            <rect x="76" y="114" width="26" height="16" fill="#374151" />
            <rect x="76" y="114" width="26" height="2" fill="#4b5563" />
            {/* Screen */}
            <rect x="76" y="96" width="26" height="20" fill="#1e293b" />
            <rect x="78" y="98" width="22" height="16" fill="#0f172a" />
            <rect x="80" y="100" width="10" height="4" fill="#3b82f6" opacity="0.3" />
            <rect x="80" y="106" width="16" height="2" fill="#22c55e" opacity="0.2" />
            <rect x="80" y="110" width="8" height="2" fill="#f59e0b" opacity="0.2" />
          </g>
        )}
        {skin.accessories.includes('pricetag') && (
          <g>
            <rect x="82" y="106" width="16" height="12" fill="#fef3c7" />
            <rect x="82" y="106" width="16" height="2" fill="#f59e0b" />
            <rect x="84" y="110" width="8" height="2" fill="#374151" opacity="0.5" />
            <rect x="84" y="114" width="10" height="2" fill="#dc2626" opacity="0.6" />
          </g>
        )}
        {skin.accessories.includes('keys') && (
          <g>
            <circle cx="88" cy="118" r="4" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
            <rect x="86" y="120" width="4" height="10" fill="#d97706" />
            <rect x="84" y="126" width="8" height="4" fill="#b45309" />
            <rect x="84" y="126" width="4" height="2" fill="#92400e" />
          </g>
        )}
      </motion.g>

      {/* === NECK === */}
      <rect x="48" y="68" width="12" height="14" fill={skin.skin.head} />
      <rect x="56" y="68" width="4" height="14" fill={skin.skin.headShade} />

      {/* === HEAD === */}
      <g>
        {/* Main head block */}
        <rect x="28" y="4" width="52" height="52" fill={skin.skin.head} />
        {/* Right shade */}
        <rect x="76" y="4" width="4" height="52" fill={skin.skin.headShade} />
        {/* Bottom shade */}
        <rect x="28" y="52" width="52" height="4" fill={skin.skin.headShade} />
        {/* Pixel texture */}
        <rect x="28" y="4" width="52" height="52" fill={`url(#pixel-${skinId})`} />

        {/* Hair */}
        <Hair style={skin.skin.hairStyle} color={skin.skin.hair} />

        {/* Eyes (pixel blocks) */}
        <rect x="38" y="28" width="8" height="8" fill="#f8fafc" />
        <rect x="42" y="30" width="4" height="4" fill={skin.skin.eyes} />
        <rect x="43" y="31" width="2" height="2" fill="#000" />
        {/* Eye highlight */}
        <rect x="44" y="30" width="2" height="2" fill="rgba(255,255,255,0.6)" />

        <rect x="58" y="28" width="8" height="8" fill="#f8fafc" />
        <rect x="60" y="30" width="4" height="4" fill={skin.skin.eyes} />
        <rect x="61" y="31" width="2" height="2" fill="#000" />
        <rect x="62" y="30" width="2" height="2" fill="rgba(255,255,255,0.6)" />

        {/* Eyebrows */}
        <rect x="36" y="24" width="12" height="3" fill={skin.skin.eyebrows} />
        <rect x="56" y="24" width="12" height="3" fill={skin.skin.eyebrows} />

        {/* Nose (subtle) */}
        <rect x="50" y="36" width="4" height="4" fill={skin.skin.headShade} opacity="0.5" />

        {/* Mouth */}
        <rect x="44" y="44" width="16" height="3" fill={skin.skin.headShade} opacity="0.6" />
        <rect x="46" y="44" width="12" height="2" fill="#c4705a" opacity="0.5" />

        {/* Face emoji overlay (if active) */}
        {isActive && face && (
          <text x="54" y="42" fontSize="20" textAnchor="middle" dominantBaseline="central"
            opacity="0" className="pointer-events-none">
            {face}
          </text>
        )}
      </g>

      {/* Cap accessory */}
      {skin.accessories.includes('cap') && (
        <g>
          <rect x="24" y="0" width="60" height="8" fill="#1e40af" />
          <rect x="20" y="4" width="68" height="6" fill="#1e40af" />
          <rect x="20" y="4" width="68" height="2" fill="#3b82f6" />
          {/* Cap brim */}
          <rect x="16" y="8" width="40" height="4" fill="#1e3a8a" />
        </g>
      )}
    </svg>
  );
}

/** Pixel-art hair styles */
function Hair({ style, color }: { style: string; color: string }) {
  const shade = adjustBrightness(color, -20);

  switch (style) {
    case 'short':
      return (
        <g>
          <rect x="26" y="0" width="56" height="16" fill={color} />
          <rect x="26" y="0" width="56" height="4" fill={shade} />
          <rect x="26" y="12" width="8" height="20" fill={color} />
          <rect x="74" y="12" width="8" height="20" fill={color} />
        </g>
      );
    case 'medium':
      return (
        <g>
          <rect x="24" y="0" width="60" height="18" fill={color} />
          <rect x="24" y="0" width="60" height="4" fill={shade} />
          <rect x="24" y="14" width="10" height="30" fill={color} />
          <rect x="74" y="14" width="10" height="30" fill={color} />
          <rect x="24" y="40" width="8" height="8" fill={shade} />
          <rect x="76" y="40" width="8" height="8" fill={shade} />
        </g>
      );
    case 'long':
      return (
        <g>
          <rect x="22" y="0" width="64" height="20" fill={color} />
          <rect x="22" y="0" width="64" height="4" fill={shade} />
          <rect x="22" y="16" width="12" height="48" fill={color} />
          <rect x="74" y="16" width="12" height="48" fill={color} />
          <rect x="22" y="58" width="10" height="6" fill={shade} />
          <rect x="76" y="58" width="10" height="6" fill={shade} />
        </g>
      );
    case 'buzz':
      return (
        <g>
          <rect x="28" y="0" width="52" height="10" fill={color} />
          <rect x="28" y="0" width="52" height="3" fill={shade} />
          <rect x="28" y="8" width="4" height="12" fill={color} opacity="0.7" />
          <rect x="76" y="8" width="4" height="12" fill={color} opacity="0.7" />
        </g>
      );
    case 'parted':
      return (
        <g>
          <rect x="26" y="0" width="56" height="16" fill={color} />
          <rect x="26" y="0" width="56" height="4" fill={shade} />
          {/* Part line */}
          <rect x="48" y="2" width="2" height="12" fill={shade} />
          <rect x="26" y="12" width="8" height="24" fill={color} />
          <rect x="74" y="12" width="8" height="24" fill={color} />
        </g>
      );
    default:
      return (
        <g>
          <rect x="28" y="0" width="52" height="12" fill={color} />
        </g>
      );
  }
}

/** Darken/lighten a hex color */
function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}
