import { useState, useMemo } from 'react';
import {
  LEVEL_NAMES,
  LEVEL_COLORS,
  type LearningMapResponse,
  type SectionMap,
} from '../../api/learning';

/**
 * Interactive Learning Map — city-inspired SVG map
 * 4 zones: Стажёр (green), Практик (blue), Эксперт (orange), Мастер (red)
 *
 * Each section that spans multiple levels appears as a building in EACH zone it covers.
 * Building states:
 *   - 🟢 Green glow  = completed (all courses at this level done)
 *   - 🔥 Orange glow = AI recommended (has pending learning tasks)
 *   - 🔵 Dim/dark    = not started yet
 */

interface Props {
  data: LearningMapResponse;
  onOpenSection: (sectionId: string) => void;
}

// Zone layout config
interface ZoneConfig {
  level: string;
  label: string;
  color: string;
  glowColor: string;
  bgGradient: [string, string];
  cx: number; cy: number;
  // Building positions within zone — up to 8 slots
  buildingSlots: Array<{ dx: number; dy: number }>;
}

const ZONES: ZoneConfig[] = [
  {
    level: 'trainee',
    label: 'Стажёр',
    color: '#4CAF50',
    glowColor: 'rgba(76,175,80,0.4)',
    bgGradient: ['#1a3a1f', '#2d5a33'],
    cx: 200, cy: 300,
    buildingSlots: [
      { dx: -100, dy: -50 },
      { dx: -30, dy: -70 },
      { dx: 50, dy: -45 },
      { dx: 110, dy: -55 },
      { dx: -70, dy: 15 },
      { dx: 10, dy: 25 },
      { dx: 80, dy: 10 },
      { dx: -20, dy: -15 },
    ],
  },
  {
    level: 'practitioner',
    label: 'Практик',
    color: '#2196F3',
    glowColor: 'rgba(33,150,243,0.4)',
    bgGradient: ['#1a2a3f', '#2a4060'],
    cx: 480, cy: 430,
    buildingSlots: [
      { dx: -110, dy: -40 },
      { dx: -40, dy: -65 },
      { dx: 40, dy: -50 },
      { dx: 110, dy: -35 },
      { dx: -80, dy: 20 },
      { dx: 0, dy: 30 },
      { dx: 75, dy: 15 },
      { dx: -30, dy: -5 },
    ],
  },
  {
    level: 'expert',
    label: 'Эксперт',
    color: '#FF9800',
    glowColor: 'rgba(255,152,0,0.4)',
    bgGradient: ['#3a2a10', '#5a4020'],
    cx: 800, cy: 310,
    buildingSlots: [
      { dx: -100, dy: -45 },
      { dx: -25, dy: -65 },
      { dx: 55, dy: -40 },
      { dx: 115, dy: -50 },
      { dx: -65, dy: 20 },
      { dx: 15, dy: 25 },
      { dx: 85, dy: 10 },
      { dx: -30, dy: -10 },
    ],
  },
  {
    level: 'master',
    label: 'Мастер',
    color: '#F44336',
    glowColor: 'rgba(244,67,54,0.4)',
    bgGradient: ['#3a1515', '#5a2020'],
    cx: 1060, cy: 220,
    buildingSlots: [
      { dx: -80, dy: -40 },
      { dx: -10, dy: -60 },
      { dx: 60, dy: -35 },
      { dx: -45, dy: 15 },
      { dx: 30, dy: 20 },
      { dx: -70, dy: -10 },
    ],
  },
];

const LEVEL_ORDER: Record<string, number> = {
  trainee: 0,
  practitioner: 1,
  expert: 2,
  master: 3,
};

// Building data for each zone
interface ZoneBuilding {
  section: SectionMap;
  levelInZone: string;
  // Status
  isCompleted: boolean;
  isAiRecommended: boolean;
  hasProgress: boolean;
  progressPct: number;
  coursesInLevel: number;
  coursesCompletedInLevel: number;
}

/**
 * Distribute sections across zones.
 * A section spanning trainee→expert will produce a building in trainee, practitioner, AND expert zones.
 */
function buildZoneData(sections: SectionMap[]): Map<string, ZoneBuilding[]> {
  const map = new Map<string, ZoneBuilding[]>();
  for (const zone of ZONES) {
    map.set(zone.level, []);
  }

  for (const sec of sections) {
    const startIdx = LEVEL_ORDER[sec.level_range.start] ?? 0;
    const endIdx = LEVEL_ORDER[sec.level_range.end] ?? 3;

    for (let i = startIdx; i <= endIdx; i++) {
      const level = ZONES[i]?.level;
      if (!level) continue;

      // Find level-specific data from section.levels array
      const levelData = sec.levels?.find((l) => l.level === level);
      const coursesTotal = levelData?.courses_total ?? 0;
      const coursesCompleted = levelData?.courses_completed ?? 0;
      const isLevelCompleted = coursesTotal > 0 && coursesCompleted >= coursesTotal;
      const pct = coursesTotal > 0 ? (coursesCompleted / coursesTotal) * 100 : 0;

      // Only add if there are courses at this level
      if (coursesTotal > 0) {
        map.get(level)?.push({
          section: sec,
          levelInZone: level,
          isCompleted: isLevelCompleted,
          isAiRecommended: sec.ai_recommended_count > 0,
          hasProgress: coursesCompleted > 0,
          progressPct: pct,
          coursesInLevel: coursesTotal,
          coursesCompletedInLevel: coursesCompleted,
        });
      }
    }
  }

  return map;
}

export function LearningMap({ data, onOpenSection }: Props) {
  const { user, sections } = data;
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; building: ZoneBuilding; zoneColor: string;
  } | null>(null);

  const zoneData = useMemo(() => buildZoneData(sections), [sections]);
  const currentLevelIdx = ZONES.findIndex((z) => z.level === user.current_level);

  // Seeded star positions (deterministic)
  const stars = useMemo(() => {
    const result: Array<{ x: number; y: number; r: number; o: number }> = [];
    let seed = 42;
    for (let i = 0; i < 50; i++) {
      seed = (seed * 16807 + 7) % 2147483647;
      const x = (seed % 1200);
      seed = (seed * 16807 + 7) % 2147483647;
      const y = (seed % 600);
      seed = (seed * 16807 + 7) % 2147483647;
      const r = 0.3 + (seed % 15) / 10;
      seed = (seed * 16807 + 7) % 2147483647;
      const o = 0.1 + (seed % 40) / 100;
      result.push({ x, y, r, o });
    }
    return result;
  }, []);

  return (
    <div className="relative w-full">
      {/* User progress bar */}
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
            {/* Glow filters for each zone */}
            {ZONES.map((zone) => (
              <filter key={`glow-${zone.level}`} id={`glow-${zone.level}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
              </filter>
            ))}
            {/* Fire glow for AI recommended */}
            <filter id="glow-fire" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
            </filter>
            {/* Green glow for completed */}
            <filter id="glow-done" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
            </filter>
          </defs>

          {/* Stars */}
          {stars.map((s, i) => (
            <circle key={`s${i}`} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />
          ))}

          {/* Terrain layers */}
          <path d="M0,580 Q200,540 400,560 T800,550 T1200,570 L1200,600 L0,600 Z" fill="#0a1018" opacity="0.6" />
          <path d="M0,560 Q300,520 600,545 T1200,530 L1200,600 L0,600 Z" fill="#0d1520" opacity="0.4" />

          {/* Mountains */}
          <path
            d="M-20,400 L80,250 L150,320 L250,200 L350,300 L420,220 L500,350 L600,180 L700,280 L800,150 L900,250 L1000,180 L1100,260 L1220,350 L1220,600 L-20,600Z"
            fill="#111a25" opacity="0.5"
          />
          <path
            d="M-20,450 L100,350 L200,400 L320,310 L450,380 L550,300 L680,370 L800,280 L950,350 L1100,300 L1220,380 L1220,600 L-20,600Z"
            fill="#152030" opacity="0.4"
          />

          {/* Road connecting zones */}
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
          {/* Glowing road overlay */}
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

          {/* === ZONES === */}
          {ZONES.map((zone) => {
            const buildings = zoneData.get(zone.level) || [];
            const isCurrent = zone.level === user.current_level;
            // All zones are visually accessible
            const isUnlocked = true;

            return (
              <g key={zone.level} opacity={isUnlocked ? 1 : 0.4}>
                {/* Zone glow for current level */}
                {isCurrent && (
                  <circle
                    cx={zone.cx}
                    cy={zone.cy}
                    r={130}
                    fill={zone.glowColor}
                    filter={`url(#glow-${zone.level})`}
                  >
                    <animate attributeName="opacity" values="0.3;0.55;0.3" dur="3s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Zone platform */}
                <ellipse
                  cx={zone.cx}
                  cy={zone.cy + 45}
                  rx={150}
                  ry={55}
                  fill={zone.bgGradient[0]}
                  stroke={zone.color}
                  strokeWidth={isCurrent ? 2 : 0.5}
                  opacity={0.5}
                />

                {/* Zone label */}
                <text
                  x={zone.cx}
                  y={zone.cy + 85}
                  textAnchor="middle"
                  fill={zone.color}
                  fontSize="16"
                  fontWeight="bold"
                  className="select-none"
                  style={{ textShadow: `0 0 10px ${zone.glowColor}` }}
                >
                  {zone.label}
                </text>

                {/* Zone building count */}
                <text
                  x={zone.cx}
                  y={zone.cy + 100}
                  textAnchor="middle"
                  fill={zone.color}
                  fontSize="10"
                  opacity={0.6}
                  className="select-none"
                >
                  {buildings.length} {buildings.length === 1 ? 'раздел' : buildings.length < 5 ? 'раздела' : 'разделов'}
                </text>

                {/* === BUILDINGS === */}
                {buildings.map((bld, bIdx) => {
                  const slot = zone.buildingSlots[bIdx % zone.buildingSlots.length];
                  const bx = zone.cx + slot.dx;
                  const by = zone.cy + slot.dy;
                  const bKey = `${bld.section.section_id}-${zone.level}`;
                  const isHovered = hoveredBuilding === bKey;

                  // Building height varies by course count
                  const bHeight = 30 + Math.min(bld.coursesInLevel, 5) * 5;
                  const bWidth = 28 + Math.min(bld.coursesInLevel, 5) * 2;

                  // Building state colors
                  let bodyColor = '#1e2d40'; // dark (not started)
                  let roofColor = '#283848';
                  let windowColor = '#111820';
                  let windowOpacity = 0.3;
                  let buildingStroke = zone.color;
                  let buildingStrokeWidth = 0.8;

                  if (bld.isCompleted) {
                    // ✅ Completed — green glow
                    bodyColor = '#1a4a25';
                    roofColor = '#2a6a35';
                    windowColor = '#4CAF50';
                    windowOpacity = 0.9;
                    buildingStroke = '#4CAF50';
                    buildingStrokeWidth = 1.5;
                  } else if (bld.isAiRecommended) {
                    // 🔥 AI recommended — lit up / orange fire
                    bodyColor = '#4a3010';
                    roofColor = '#5a4020';
                    windowColor = '#FF9800';
                    windowOpacity = 1;
                    buildingStroke = '#FF9800';
                    buildingStrokeWidth = 1.5;
                  } else if (bld.hasProgress) {
                    // 🔵 In progress — partially lit
                    bodyColor = '#1a2d45';
                    roofColor = '#2a4060';
                    windowColor = zone.glowColor;
                    windowOpacity = 0.7;
                    buildingStroke = zone.color;
                    buildingStrokeWidth = 1;
                  }
                  // else: dark/not started — defaults above

                  if (isHovered) {
                    buildingStroke = '#fff';
                    buildingStrokeWidth = 2;
                  }

                  // Window grid
                  const windowRows = Math.min(Math.ceil(bHeight / 14), 3);
                  const windowCols = 2;

                  return (
                    <g
                      key={bKey}
                      className="cursor-pointer"
                      onClick={() => onOpenSection(bld.section.section_id)}
                      onMouseEnter={() => {
                        setHoveredBuilding(bKey);
                        setTooltip({ x: bx, y: by - bHeight - 15, building: bld, zoneColor: zone.color });
                      }}
                      onMouseLeave={() => {
                        setHoveredBuilding(null);
                        setTooltip(null);
                      }}
                    >
                      {/* Completed glow */}
                      {bld.isCompleted && (
                        <circle cx={bx} cy={by - bHeight / 2} r={25} fill="rgba(76,175,80,0.3)" filter="url(#glow-done)">
                          <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* AI recommended fire glow */}
                      {bld.isAiRecommended && !bld.isCompleted && (
                        <circle cx={bx} cy={by - bHeight / 2} r={25} fill="rgba(255,152,0,0.35)" filter="url(#glow-fire)">
                          <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* Building shadow */}
                      <ellipse cx={bx} cy={by + 4} rx={bWidth / 2 + 3} ry={5} fill="#000" opacity="0.3" />

                      {/* Building body */}
                      <rect
                        x={bx - bWidth / 2}
                        y={by - bHeight}
                        width={bWidth}
                        height={bHeight}
                        rx={2}
                        fill={bodyColor}
                        stroke={buildingStroke}
                        strokeWidth={buildingStrokeWidth}
                      />

                      {/* Roof */}
                      <polygon
                        points={`${bx - bWidth / 2 - 4},${by - bHeight} ${bx},${by - bHeight - 14} ${bx + bWidth / 2 + 4},${by - bHeight}`}
                        fill={roofColor}
                        stroke={buildingStroke}
                        strokeWidth="0.5"
                      />

                      {/* Windows */}
                      {Array.from({ length: windowRows * windowCols }).map((_, w) => {
                        const row = Math.floor(w / windowCols);
                        const col = w % windowCols;
                        const wx = bx - bWidth / 4 + col * (bWidth / 2);
                        const wy = by - bHeight + 8 + row * 12;
                        return (
                          <rect
                            key={w}
                            x={wx - 3}
                            y={wy}
                            width={5}
                            height={7}
                            rx={1}
                            fill={windowColor}
                            opacity={windowOpacity}
                          >
                            {/* Flickering effect for AI recommended */}
                            {bld.isAiRecommended && !bld.isCompleted && (
                              <animate
                                attributeName="opacity"
                                values={`${windowOpacity};${windowOpacity * 0.4};${windowOpacity}`}
                                dur={`${1.5 + w * 0.3}s`}
                                repeatCount="indefinite"
                              />
                            )}
                          </rect>
                        );
                      })}

                      {/* Progress bar under building */}
                      {!bld.isCompleted && bld.hasProgress && (
                        <>
                          <rect x={bx - bWidth / 2} y={by + 6} width={bWidth} height={3} rx={1.5} fill="#1a2030" />
                          <rect x={bx - bWidth / 2} y={by + 6} width={bWidth * bld.progressPct / 100} height={3} rx={1.5} fill={zone.color} />
                        </>
                      )}

                      {/* Completed badge */}
                      {bld.isCompleted && (
                        <g>
                          <circle cx={bx + bWidth / 2 - 2} cy={by - bHeight - 10} r={7} fill="#4CAF50" stroke="#fff" strokeWidth="1" />
                          <text x={bx + bWidth / 2 - 2} y={by - bHeight - 6} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">✓</text>
                        </g>
                      )}

                      {/* AI fire icon */}
                      {bld.isAiRecommended && !bld.isCompleted && (
                        <text x={bx} y={by - bHeight - 16} textAnchor="middle" fontSize="13">
                          🔥
                        </text>
                      )}

                      {/* Section icon */}
                      {bld.section.icon && !bld.isAiRecommended && !bld.isCompleted && (
                        <text x={bx} y={by - bHeight - 16} textAnchor="middle" fontSize="12" opacity={0.7}>
                          {bld.section.icon}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left: `${(tooltip.x / 1200) * 100}%`,
              top: `${(tooltip.y / 600) * 100}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-gray-900/95 backdrop-blur border border-gray-600 rounded-xl px-4 py-3 shadow-xl min-w-[200px]">
              <div className="flex items-center gap-2">
                {tooltip.building.section.icon && (
                  <span className="text-lg">{tooltip.building.section.icon}</span>
                )}
                <p className="text-white font-bold text-sm">{tooltip.building.section.title.ru}</p>
              </div>
              <p className="text-gray-400 text-xs mt-1">
                Уровень: {LEVEL_NAMES[tooltip.building.levelInZone]}
              </p>

              {/* Status badge */}
              <div className="mt-2">
                {tooltip.building.isCompleted ? (
                  <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">✓ Пройдено</span>
                ) : tooltip.building.isAiRecommended ? (
                  <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">🔥 AI задача</span>
                ) : tooltip.building.hasProgress ? (
                  <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">📖 В процессе</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full">Не начато</span>
                )}
              </div>

              {/* Progress */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{tooltip.building.coursesCompletedInLevel}/{tooltip.building.coursesInLevel} курсов</span>
                  <span>{Math.round(tooltip.building.progressPct)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${tooltip.building.progressPct}%`,
                      backgroundColor: tooltip.building.isCompleted
                        ? '#4CAF50'
                        : tooltip.zoneColor,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-gray-500">
        {ZONES.map((zone) => (
          <div key={zone.level} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: zone.color }} />
            <span className="text-gray-300">{zone.label}</span>
          </div>
        ))}
        <div className="h-3 border-l border-gray-600 mx-1" />
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-green-500/60 rounded-sm" />
          <span>Пройдено</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🔥</span>
          <span>AI задача</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-gray-700 rounded-sm border border-gray-500" />
          <span>Не начато</span>
        </div>
      </div>
    </div>
  );
}
