/**
 * Human silhouette character for cinematic scenes.
 * Clean shadow figure — no emoji, no pixel art.
 *
 * 7 character types with distinct silhouettes:
 * - Body proportions differ by role
 * - Accessories shown as silhouette shapes
 * - Active state: subtle glow + breathing animation
 */

import { motion } from 'framer-motion';

interface Props {
  skinId: string;
  isActive?: boolean;
  /** Accent color for active glow */
  accentColor?: string;
  width?: number;
  height?: number;
}

interface SilhouetteConfig {
  /** Shoulder width relative to base (0-1) */
  shoulderWidth: number;
  /** Head size relative to base (0-1) */
  headSize: number;
  /** Body type affects torso shape */
  build: 'slim' | 'medium' | 'broad';
  /** Hair length affects head silhouette */
  hairLength: 'none' | 'short' | 'medium';
  /** Accessory silhouette */
  accessory?: 'tablet' | 'clipboard' | 'folder' | 'laptop' | 'phone' | 'keys' | 'notebook';
  /** Optional hat/cap */
  hat?: boolean;
}

const silhouetteConfigs: Record<string, SilhouetteConfig> = {
  sales_rep: {
    shoulderWidth: 0.7,
    headSize: 0.85,
    build: 'medium',
    hairLength: 'short',
    accessory: 'tablet',
  },
  supervisor: {
    shoulderWidth: 0.8,
    headSize: 0.9,
    build: 'broad',
    hairLength: 'short',
    accessory: 'notebook',
  },
  hr_manager: {
    shoulderWidth: 0.65,
    headSize: 0.85,
    build: 'slim',
    hairLength: 'medium',
    accessory: 'folder',
  },
  store_keeper: {
    shoulderWidth: 0.75,
    headSize: 0.9,
    build: 'broad',
    hairLength: 'none',
    accessory: 'clipboard',
  },
  regional_manager: {
    shoulderWidth: 0.75,
    headSize: 0.85,
    build: 'medium',
    hairLength: 'short',
    accessory: 'laptop',
  },
  store_director: {
    shoulderWidth: 0.7,
    headSize: 0.9,
    build: 'medium',
    hairLength: 'medium',
    accessory: 'keys',
  },
  trainee: {
    shoulderWidth: 0.6,
    headSize: 0.8,
    build: 'slim',
    hairLength: 'short',
    accessory: 'phone',
    hat: true,
  },
};

function getConfig(skinId: string): SilhouetteConfig {
  return silhouetteConfigs[skinId] || silhouetteConfigs.sales_rep;
}

export function SilhouetteCharacter({
  skinId,
  isActive = false,
  accentColor = '#6366f1',
  width = 120,
  height = 200,
}: Props) {
  const config = getConfig(skinId);
  const baseColor = '#0a0e1a';
  const edgeColor = isActive ? accentColor : 'rgba(255,255,255,0.08)';
  const glowColor = isActive ? `${accentColor}40` : 'transparent';

  // Head dimensions
  const headR = 16 * config.headSize;
  const headCx = 60;
  const headCy = 28;

  // Shoulder / torso
  const shoulderHalf = 28 * config.shoulderWidth;
  const torsoTop = headCy + headR + 4;
  const waist = config.build === 'broad' ? shoulderHalf * 0.75
    : config.build === 'slim' ? shoulderHalf * 0.55
    : shoulderHalf * 0.65;

  return (
    <motion.svg
      width={width}
      height={height}
      viewBox="0 0 120 200"
      animate={isActive ? { y: [0, -2, 0] } : { y: 0 }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        {/* Glow filter for active state */}
        <filter id={`glow-${skinId}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feFlood floodColor={accentColor} floodOpacity="0.3" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Edge highlight gradient */}
        <linearGradient id={`edge-${skinId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={edgeColor} />
          <stop offset="50%" stopColor="transparent" />
          <stop offset="100%" stopColor={edgeColor} />
        </linearGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="60" cy="194" rx="25" ry="4"
        fill={isActive ? `${accentColor}20` : 'rgba(255,255,255,0.04)'} />

      <g filter={isActive ? `url(#glow-${skinId})` : undefined}>

        {/* === HEAD === */}
        <circle cx={headCx} cy={headCy} r={headR}
          fill={baseColor}
          stroke={edgeColor}
          strokeWidth={isActive ? 1.2 : 0.5}
        />

        {/* Hair bump */}
        {config.hairLength === 'medium' && (
          <ellipse cx={headCx} cy={headCy - headR + 2} rx={headR + 2} ry={6}
            fill={baseColor} stroke={edgeColor} strokeWidth={0.3} />
        )}
        {config.hairLength === 'short' && (
          <ellipse cx={headCx} cy={headCy - headR + 3} rx={headR - 2} ry={4}
            fill={baseColor} stroke={edgeColor} strokeWidth={0.3} />
        )}

        {/* Cap */}
        {config.hat && (
          <>
            <ellipse cx={headCx} cy={headCy - headR + 2} rx={headR + 4} ry={5}
              fill={baseColor} stroke={edgeColor} strokeWidth={0.5} />
            <rect x={headCx - headR - 6} y={headCy - headR - 1} width={headR + 8} height={3}
              fill={baseColor} stroke={edgeColor} strokeWidth={0.3} rx={1} />
          </>
        )}

        {/* === NECK === */}
        <rect x={headCx - 5} y={headCy + headR - 2} width={10} height={8}
          fill={baseColor} />

        {/* === TORSO === */}
        <path d={`
          M ${headCx - shoulderHalf} ${torsoTop}
          Q ${headCx - shoulderHalf - 4} ${torsoTop + 2} ${headCx - shoulderHalf} ${torsoTop + 5}
          L ${headCx - waist} ${torsoTop + 55}
          L ${headCx + waist} ${torsoTop + 55}
          L ${headCx + shoulderHalf} ${torsoTop + 5}
          Q ${headCx + shoulderHalf + 4} ${torsoTop + 2} ${headCx + shoulderHalf} ${torsoTop}
          Z
        `}
          fill={baseColor}
          stroke={edgeColor}
          strokeWidth={isActive ? 1 : 0.4}
        />

        {/* === LEFT ARM === */}
        <motion.g
          style={{ transformOrigin: `${headCx - shoulderHalf}px ${torsoTop + 2}px` }}
          animate={isActive ? { rotate: [-3, -8, -3] } : { rotate: 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d={`
            M ${headCx - shoulderHalf - 2} ${torsoTop + 2}
            L ${headCx - shoulderHalf - 12} ${torsoTop + 50}
            Q ${headCx - shoulderHalf - 13} ${torsoTop + 55} ${headCx - shoulderHalf - 10} ${torsoTop + 55}
            L ${headCx - shoulderHalf - 2} ${torsoTop + 55}
            L ${headCx - shoulderHalf + 4} ${torsoTop + 2}
            Z
          `}
            fill={baseColor}
            stroke={edgeColor}
            strokeWidth={0.4}
          />
          <AccessorySilhouette
            type={config.accessory}
            side="left"
            x={headCx - shoulderHalf - 16}
            y={torsoTop + 35}
            color={baseColor}
            edgeColor={edgeColor}
          />
        </motion.g>

        {/* === RIGHT ARM === */}
        <motion.g
          style={{ transformOrigin: `${headCx + shoulderHalf}px ${torsoTop + 2}px` }}
          animate={isActive ? { rotate: [2, 6, 2] } : { rotate: 0 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        >
          <path d={`
            M ${headCx + shoulderHalf + 2} ${torsoTop + 2}
            L ${headCx + shoulderHalf + 12} ${torsoTop + 50}
            Q ${headCx + shoulderHalf + 13} ${torsoTop + 55} ${headCx + shoulderHalf + 10} ${torsoTop + 55}
            L ${headCx + shoulderHalf + 2} ${torsoTop + 55}
            L ${headCx + shoulderHalf - 4} ${torsoTop + 2}
            Z
          `}
            fill={baseColor}
            stroke={edgeColor}
            strokeWidth={0.4}
          />
        </motion.g>

        {/* === LEGS === */}
        <motion.g
          animate={isActive ? { y: [0, -1, 0] } : { y: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Left leg */}
          <path d={`
            M ${headCx - waist} ${torsoTop + 54}
            L ${headCx - waist - 4} ${torsoTop + 100}
            L ${headCx - waist + 8} ${torsoTop + 100}
            L ${headCx - 3} ${torsoTop + 54}
            Z
          `}
            fill={baseColor}
            stroke={edgeColor}
            strokeWidth={0.3}
          />
          {/* Left shoe */}
          <ellipse cx={headCx - waist + 2} cy={torsoTop + 100} rx={8} ry={3}
            fill={baseColor} stroke={edgeColor} strokeWidth={0.3} />

          {/* Right leg */}
          <path d={`
            M ${headCx + 3} ${torsoTop + 54}
            L ${headCx + waist - 8} ${torsoTop + 100}
            L ${headCx + waist + 4} ${torsoTop + 100}
            L ${headCx + waist} ${torsoTop + 54}
            Z
          `}
            fill={baseColor}
            stroke={edgeColor}
            strokeWidth={0.3}
          />
          {/* Right shoe */}
          <ellipse cx={headCx + waist - 2} cy={torsoTop + 100} rx={8} ry={3}
            fill={baseColor} stroke={edgeColor} strokeWidth={0.3} />
        </motion.g>

      </g>

      {/* Active glow ring */}
      {isActive && (
        <motion.ellipse cx="60" cy="194" rx="35" ry="6"
          fill="none"
          stroke={accentColor}
          strokeWidth={0.8}
          opacity={0.3}
          animate={{ rx: [35, 38, 35], opacity: [0.3, 0.15, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.svg>
  );
}

/** Accessory shapes rendered as pure silhouettes */
function AccessorySilhouette({ type, side, x, y, color, edgeColor }: {
  type?: string; side: string; x: number; y: number; color: string; edgeColor: string;
}) {
  if (!type) return null;

  switch (type) {
    case 'tablet':
      return <rect x={x} y={y} width={14} height={20} rx={1}
        fill={color} stroke={edgeColor} strokeWidth={0.5} />;
    case 'clipboard':
      return (
        <g>
          <rect x={x} y={y} width={13} height={18} rx={1}
            fill={color} stroke={edgeColor} strokeWidth={0.5} />
          <rect x={x + 3} y={y - 2} width={7} height={3} rx={1}
            fill={color} stroke={edgeColor} strokeWidth={0.4} />
        </g>
      );
    case 'folder':
      return (
        <g>
          <rect x={x} y={y} width={16} height={20} rx={1}
            fill={color} stroke={edgeColor} strokeWidth={0.5} />
          <rect x={x} y={y} width={8} height={3} rx={1}
            fill={color} stroke={edgeColor} strokeWidth={0.4} />
        </g>
      );
    case 'laptop':
      return (
        <g>
          <rect x={x} y={y} width={18} height={12} rx={1}
            fill={color} stroke={edgeColor} strokeWidth={0.5} />
          <rect x={x - 1} y={y + 12} width={20} height={2} rx={0.5}
            fill={color} stroke={edgeColor} strokeWidth={0.4} />
        </g>
      );
    case 'phone':
      return <rect x={x + 3} y={y} width={8} height={14} rx={1.5}
        fill={color} stroke={edgeColor} strokeWidth={0.5} />;
    case 'keys':
      return (
        <g>
          <circle cx={x + 6} cy={y + 4} r={3}
            fill={color} stroke={edgeColor} strokeWidth={0.5} />
          <rect x={x + 5} y={y + 7} width={2} height={8}
            fill={color} stroke={edgeColor} strokeWidth={0.3} />
        </g>
      );
    case 'notebook':
      return <rect x={x} y={y} width={12} height={16} rx={1}
        fill={color} stroke={edgeColor} strokeWidth={0.5} />;
    default:
      return null;
  }
}

/** Get all available silhouette character types */
export function getSilhouetteTypes(): string[] {
  return Object.keys(silhouetteConfigs);
}
