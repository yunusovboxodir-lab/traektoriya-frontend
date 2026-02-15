import { useState, useMemo } from 'react';
import {
  LEVEL_NAMES,
  LEVEL_COLORS,
  type LearningMapResponse,
  type SectionMap,
} from '../../api/learning';

/**
 * Interactive Learning Map — 3D-city-inspired SVG map
 * 4 zones: Trainee (green), Practitioner (blue), Expert (orange), Master (red)
 * Each zone contains "buildings" representing learning sections.
 */

interface Props {
  data: LearningMapResponse;
  onOpenSection: (sectionId: string) => void;
}

// Zone layout config — positions on the SVG canvas (1200x700 viewport)
interface ZoneConfig {
  level: string;
  label: string;
  color: string;
  glowColor: string;
  bgGradient: [string, string];
  // Zone polygon bounds
  cx: number; cy: number;
  // Building positions (relative to zone center)
  buildingSlots: Array<{ dx: number; dy: number }>;
}

const ZONES: ZoneConfig[] = [
  {
    level: 'trainee',
    label: 'Стажёр',
    color: '#4CAF50',
    glowColor: 'rgba(76,175,80,0.4)',
    bgGradient: ['#1a3a1f', '#2d5a33'],
    cx: 200, cy: 280,
    buildingSlots: [
      { dx: -90, dy: -30 },
      { dx: 0, dy: -50 },
      { dx: 90, dy: -20 },
      { dx: -45, dy: 40 },
      { dx: 60, dy: 50 },
    ],
  },
  {
    level: 'practitioner',
    label: 'Практик',
    color: '#2196F3',
    glowColor: 'rgba(33,150,243,0.4)',
    bgGradient: ['#1a2a3f', '#2a4060'],
    cx: 500, cy: 420,
    buildingSlots: [
      { dx: -100, dy: -30 },
      { dx: -20, dy: -55 },
      { dx: 80, dy: -20 },
      { dx: -60, dy: 35 },
      { dx: 50, dy: 45 },
    ],
  },
  {
    level: 'expert',
    label: 'Эксперт',
    color: '#FF9800',
    glowColor: 'rgba(255,152,0,0.4)',
    bgGradient: ['#3a2a10', '#5a4020'],
    cx: 800, cy: 300,
    buildingSlots: [
      { dx: -80, dy: -40 },
      { dx: 20, dy: -55 },
      { dx: 100, dy: -25 },
      { dx: -40, dy: 30 },
      { dx: 70, dy: 40 },
    ],
  },
  {
    level: 'master',
    label: 'Мастер',
    color: '#F44336',
    glowColor: 'rgba(244,67,54,0.4)',
    bgGradient: ['#3a1515', '#5a2020'],
    cx: 1050, cy: 200,
    buildingSlots: [
      { dx: -60, dy: -30 },
      { dx: 30, dy: -45 },
      { dx: -20, dy: 25 },
      { dx: 60, dy: 15 },
    ],
  },
];

// Map sections to zones by their level_range.start
function mapSectionsToZones(sections: SectionMap[]): Map<string, SectionMap[]> {
  const map = new Map<string, SectionMap[]>();
  for (const zone of ZONES) {
    map.set(zone.level, []);
  }
  for (const sec of sections) {
    const level = sec.level_range.start;
    const arr = map.get(level);
    if (arr) {
      arr.push(sec);
    } else {
      // Fallback to trainee
      map.get('trainee')?.push(sec);
    }
  }
  return map;
}

export function LearningMap({ data, onOpenSection }: Props) {
  const { user, sections } = data;
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; section: SectionMap;
  } | null>(null);

  const sectionsByZone = useMemo(() => mapSectionsToZones(sections), [sections]);

  const currentLevelIdx = ZONES.findIndex((z) => z.level === user.current_level);

  return (
    <div className="relative w-full">
      {/* User progress bar — compact */}
      <div className="flex items-center justify-between mb-4 bg-gray-900/80 backdrop-blur rounded-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <div
            className="px-3 py-1 rounded-full text-white font-bold text-sm"
            style={{ backgroundColor: LEVEL_COLORS[user.current_level] || '#666' }}
          >
            {LEVEL_NAMES[user.current_level] || user.current_level}
          </div>
          <span className="text-white/70 text-sm">{user.name}</span>
        </div>
        {user.level_progress.next && (
          <div className="flex items-center gap-2">
            <div className="w-32 bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${user.level_progress.percentage_to_next}%`,
                  backgroundColor: LEVEL_COLORS[user.current_level],
                }}
              />
            </div>
            <span className="text-white/60 text-xs">
              {Math.round(user.level_progress.percentage_to_next)}% до {LEVEL_NAMES[user.level_progress.next]}
            </span>
          </div>
        )}
      </div>

      {/* SVG Map */}
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #0f1923 0%, #1a2634 40%, #0d1520 100%)' }}
      >
        <svg
          viewBox="0 0 1200 600"
          className="w-full h-auto"
          style={{ minHeight: '400px' }}
        >
          <defs>
            {/* Glow filters */}
            {ZONES.map((zone) => (
              <filter key={`glow-${zone.level}`} id={`glow-${zone.level}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
              </filter>
            ))}
            {/* Star pattern for background */}
            <radialGradient id="star" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background stars */}
          {Array.from({ length: 40 }).map((_, i) => (
            <circle
              key={`star-${i}`}
              cx={Math.random() * 1200}
              cy={Math.random() * 600}
              r={Math.random() * 1.5 + 0.3}
              fill="#fff"
              opacity={Math.random() * 0.4 + 0.1}
            />
          ))}

          {/* Ground/terrain layer */}
          <path
            d="M0,580 Q200,540 400,560 T800,550 T1200,570 L1200,600 L0,600 Z"
            fill="#0a1018"
            opacity="0.6"
          />
          <path
            d="M0,560 Q300,520 600,545 T1200,530 L1200,600 L0,600 Z"
            fill="#0d1520"
            opacity="0.4"
          />

          {/* Mountain silhouettes (background) */}
          <path
            d="M-20,400 L80,250 L150,320 L250,200 L350,300 L420,220 L500,350 L600,180 L700,280 L800,150 L900,250 L1000,180 L1100,260 L1220,350 L1220,600 L-20,600Z"
            fill="#111a25"
            opacity="0.5"
          />
          <path
            d="M-20,450 L100,350 L200,400 L320,310 L450,380 L550,300 L680,370 L800,280 L950,350 L1100,300 L1220,380 L1220,600 L-20,600Z"
            fill="#152030"
            opacity="0.4"
          />

          {/* Road/path connecting zones */}
          <path
            d={`M ${ZONES[0].cx},${ZONES[0].cy}
                C ${ZONES[0].cx + 100},${ZONES[0].cy + 80} ${ZONES[1].cx - 100},${ZONES[1].cy - 50} ${ZONES[1].cx},${ZONES[1].cy}
                C ${ZONES[1].cx + 100},${ZONES[1].cy - 60} ${ZONES[2].cx - 100},${ZONES[2].cy + 40} ${ZONES[2].cx},${ZONES[2].cy}
                C ${ZONES[2].cx + 80},${ZONES[2].cy - 40} ${ZONES[3].cx - 80},${ZONES[3].cy + 30} ${ZONES[3].cx},${ZONES[3].cy}`}
            fill="none"
            stroke="#2a3a4a"
            strokeWidth="4"
            strokeDasharray="12 6"
            opacity="0.6"
          />
          {/* Glowing path overlay for unlocked portion */}
          {currentLevelIdx >= 0 && (
            <path
              d={`M ${ZONES[0].cx},${ZONES[0].cy}
                  ${currentLevelIdx >= 1 ? `C ${ZONES[0].cx + 100},${ZONES[0].cy + 80} ${ZONES[1].cx - 100},${ZONES[1].cy - 50} ${ZONES[1].cx},${ZONES[1].cy}` : ''}
                  ${currentLevelIdx >= 2 ? `C ${ZONES[1].cx + 100},${ZONES[1].cy - 60} ${ZONES[2].cx - 100},${ZONES[2].cy + 40} ${ZONES[2].cx},${ZONES[2].cy}` : ''}
                  ${currentLevelIdx >= 3 ? `C ${ZONES[2].cx + 80},${ZONES[2].cy - 40} ${ZONES[3].cx - 80},${ZONES[3].cy + 30} ${ZONES[3].cx},${ZONES[3].cy}` : ''}`}
              fill="none"
              stroke={LEVEL_COLORS[user.current_level]}
              strokeWidth="3"
              opacity="0.5"
            />
          )}

          {/* Zones */}
          {ZONES.map((zone, zoneIdx) => {
            const zoneSections = sectionsByZone.get(zone.level) || [];
            const isUnlocked = zoneIdx <= currentLevelIdx;
            const isCurrent = zone.level === user.current_level;

            return (
              <g key={zone.level} opacity={isUnlocked ? 1 : 0.35}>
                {/* Zone glow */}
                {isCurrent && (
                  <circle
                    cx={zone.cx}
                    cy={zone.cy}
                    r={120}
                    fill={zone.glowColor}
                    filter={`url(#glow-${zone.level})`}
                  >
                    <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Zone platform (isometric-style ground) */}
                <ellipse
                  cx={zone.cx}
                  cy={zone.cy + 40}
                  rx={140}
                  ry={50}
                  fill={zone.bgGradient[0]}
                  stroke={zone.color}
                  strokeWidth={isCurrent ? 2 : 0.5}
                  opacity={0.6}
                />

                {/* Zone label */}
                <text
                  x={zone.cx}
                  y={zone.cy + 80}
                  textAnchor="middle"
                  fill={zone.color}
                  fontSize="16"
                  fontWeight="bold"
                  className="select-none"
                  style={{ textShadow: `0 0 10px ${zone.glowColor}` }}
                >
                  {zone.label}
                </text>

                {/* Buildings (sections) */}
                {zoneSections.map((sec, secIdx) => {
                  const slot = zone.buildingSlots[secIdx % zone.buildingSlots.length];
                  const bx = zone.cx + slot.dx;
                  const by = zone.cy + slot.dy;
                  const isHovered = hoveredSection === sec.section_id;
                  const progress = sec.progress?.percentage || 0;
                  const completed = progress === 100;

                  return (
                    <g
                      key={sec.section_id}
                      className={sec.is_unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}
                      onClick={() => sec.is_unlocked && onOpenSection(sec.section_id)}
                      onMouseEnter={() => {
                        setHoveredSection(sec.section_id);
                        setTooltip({ x: bx, y: by - 60, section: sec });
                      }}
                      onMouseLeave={() => {
                        setHoveredSection(null);
                        setTooltip(null);
                      }}
                    >
                      {/* Building shadow */}
                      <ellipse
                        cx={bx}
                        cy={by + 25}
                        rx={20}
                        ry={6}
                        fill="#000"
                        opacity="0.3"
                      />

                      {/* Building body */}
                      <rect
                        x={bx - 16}
                        y={by - 20}
                        width={32}
                        height={40}
                        rx={3}
                        fill={completed ? zone.color : sec.is_unlocked ? '#2a3a50' : '#1a2030'}
                        stroke={isHovered ? '#fff' : zone.color}
                        strokeWidth={isHovered ? 2 : 0.8}
                        opacity={sec.is_unlocked ? 1 : 0.5}
                      >
                        {isHovered && (
                          <animate attributeName="stroke-opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
                        )}
                      </rect>

                      {/* Building roof (triangle) */}
                      <polygon
                        points={`${bx - 20},${by - 20} ${bx},${by - 38} ${bx + 20},${by - 20}`}
                        fill={completed ? zone.color : sec.is_unlocked ? '#354a60' : '#1a2838'}
                        stroke={zone.color}
                        strokeWidth="0.5"
                        opacity={sec.is_unlocked ? 1 : 0.5}
                      />

                      {/* Building windows (lit if unlocked) */}
                      {[0, 1, 2, 3].map((w) => (
                        <rect
                          key={w}
                          x={bx - 10 + (w % 2) * 14}
                          y={by - 12 + Math.floor(w / 2) * 14}
                          width={6}
                          height={8}
                          rx={1}
                          fill={sec.is_unlocked ? (completed ? '#fff' : zone.glowColor) : '#111'}
                          opacity={sec.is_unlocked ? 0.8 : 0.3}
                        />
                      ))}

                      {/* Progress indicator (small bar under building) */}
                      {sec.is_unlocked && progress > 0 && !completed && (
                        <>
                          <rect x={bx - 15} y={by + 24} width={30} height={3} rx={1.5} fill="#1a2030" />
                          <rect x={bx - 15} y={by + 24} width={30 * progress / 100} height={3} rx={1.5} fill={zone.color} />
                        </>
                      )}

                      {/* Completed checkmark */}
                      {completed && (
                        <circle cx={bx + 14} cy={by - 32} r={7} fill="#4CAF50" stroke="#fff" strokeWidth="1.5">
                          <text x={bx + 14} y={by - 29} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">
                            ✓
                          </text>
                        </circle>
                      )}

                      {/* Lock icon for locked sections */}
                      {!sec.is_unlocked && (
                        <text x={bx} y={by + 5} textAnchor="middle" fontSize="16" opacity="0.5">
                          🔒
                        </text>
                      )}

                      {/* Icon/emoji */}
                      {sec.is_unlocked && sec.icon && (
                        <text x={bx} y={by - 42} textAnchor="middle" fontSize="14">
                          {sec.icon}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Tooltip overlay (HTML for better text rendering) */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left: `${(tooltip.x / 1200) * 100}%`,
              top: `${(tooltip.y / 600) * 100}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-gray-900/95 backdrop-blur border border-gray-600 rounded-xl px-4 py-3 shadow-xl min-w-[180px]">
              <p className="text-white font-bold text-sm">{tooltip.section.title.ru}</p>
              <p className="text-gray-400 text-xs mt-1">
                {LEVEL_NAMES[tooltip.section.level_range.start]}
                {tooltip.section.level_range.start !== tooltip.section.level_range.end &&
                  ` → ${LEVEL_NAMES[tooltip.section.level_range.end]}`}
              </p>
              {tooltip.section.progress && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{tooltip.section.progress.completed}/{tooltip.section.progress.total} курсов</span>
                    <span>{Math.round(tooltip.section.progress.percentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${tooltip.section.progress.percentage}%`,
                        backgroundColor: tooltip.section.color || '#2196F3',
                      }}
                    />
                  </div>
                </div>
              )}
              {!tooltip.section.is_unlocked && (
                <p className="text-yellow-400 text-xs mt-2">🔒 Заблокировано</p>
              )}
              {tooltip.section.ai_recommended_count > 0 && (
                <p className="text-purple-400 text-xs mt-1">
                  ✨ AI рекомендует {tooltip.section.ai_recommended_count} курс(ов)
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-gray-500">
        {ZONES.map((zone, idx) => (
          <div key={zone.level} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: zone.color,
                opacity: idx <= currentLevelIdx ? 1 : 0.3,
              }}
            />
            <span className={idx <= currentLevelIdx ? 'text-gray-300' : 'text-gray-600'}>
              {zone.label}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-4">
          <div className="w-3 h-3 bg-gray-600 rounded-sm border border-dashed border-gray-400" />
          <span>Кликните на здание для входа</span>
        </div>
      </div>
    </div>
  );
}
