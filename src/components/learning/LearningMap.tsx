import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  LEVEL_NAMES,
  LEVEL_COLORS,
  type LearningMapResponse,
  type SectionMap,
} from '../../api/learning';

/**
 * Interactive Learning Map — 3D isometric city
 *
 * The entire map is divided into 4 territory zones (no empty space).
 * Organic wavy borders separate the zones like a political map.
 * SVG background + HTML overlay for 3D CSS buildings.
 * Responsive: works on desktop and mobile.
 */

interface Props {
  data: LearningMapResponse;
  onOpenSection: (sectionId: string) => void;
}

// ============================================================
// ZONE CONFIG — 4 zones filling the entire 1200×700 map
// ============================================================

interface ZoneConfig {
  level: string;
  label: string;
  color: string;
  colorDark: string;     // darker shade for fill
  glowColor: string;
  cx: number; cy: number; // center for label & buildings
  buildingSlots: Array<{ dx: number; dy: number }>;
  // House colors per zone
  wallColor: string;       // front wall
  wallSideColor: string;   // side wall (slightly darker)
  roofHouseColor: string;  // roof tile color
  doorColor: string;       // door
}

// Map dimensions
const W = 1200;
const H = 700;

// Territory boundaries (approx):
//   Trainee:      x=0..310,   y=0..700    → center (155, 350)
//   Expert:       x=310..930, y=0..310     → center (620, 155)
//   Practitioner: x=310..930, y=310..700   → center (620, 505)
//   Master:       x=930..1200, y=0..700    → center (1065, 350)

const ZONES: ZoneConfig[] = [
  {
    level: 'trainee',
    label: 'Стажёр',
    color: '#4CAF50',
    colorDark: '#1b3d20',
    glowColor: 'rgba(76,175,80,0.35)',
    cx: 155, cy: 350,
    wallColor: '#a8d5a2',
    wallSideColor: '#8bc185',
    roofHouseColor: '#2e7d32',
    doorColor: '#5d4037',
    buildingSlots: [
      { dx: -80, dy: -220 },
      { dx: 50, dy: -170 },
      { dx: -60, dy: -100 },
      { dx: 70, dy: -60 },
      { dx: -90, dy: 20 },
      { dx: 40, dy: 60 },
      { dx: -50, dy: 140 },
      { dx: 60, dy: 200 },
    ],
  },
  {
    level: 'practitioner',
    label: 'Практик',
    color: '#2196F3',
    colorDark: '#152d45',
    glowColor: 'rgba(33,150,243,0.35)',
    cx: 620, cy: 505,
    wallColor: '#a0c4e8',
    wallSideColor: '#85b0d8',
    roofHouseColor: '#1565c0',
    doorColor: '#4e342e',
    buildingSlots: [
      { dx: -230, dy: -120 },
      { dx: -80, dy: -130 },
      { dx: 80, dy: -110 },
      { dx: 230, dy: -120 },
      { dx: -200, dy: 0 },
      { dx: -40, dy: 10 },
      { dx: 120, dy: -10 },
      { dx: 240, dy: 20 },
    ],
  },
  {
    level: 'expert',
    label: 'Эксперт',
    color: '#FF9800',
    colorDark: '#3a2810',
    glowColor: 'rgba(255,152,0,0.35)',
    cx: 620, cy: 155,
    wallColor: '#f5d6a8',
    wallSideColor: '#e8c088',
    roofHouseColor: '#e65100',
    doorColor: '#5d4037',
    buildingSlots: [
      { dx: -230, dy: -80 },
      { dx: -80, dy: -90 },
      { dx: 80, dy: -70 },
      { dx: 230, dy: -80 },
      { dx: -200, dy: 40 },
      { dx: -40, dy: 50 },
      { dx: 120, dy: 30 },
      { dx: 240, dy: 45 },
    ],
  },
  {
    level: 'master',
    label: 'Мастер',
    color: '#F44336',
    colorDark: '#3a1515',
    glowColor: 'rgba(244,67,54,0.35)',
    cx: 1065, cy: 350,
    wallColor: '#e8a8a0',
    wallSideColor: '#d89088',
    roofHouseColor: '#b71c1c',
    doorColor: '#4e342e',
    buildingSlots: [
      { dx: -60, dy: -220 },
      { dx: 50, dy: -150 },
      { dx: -70, dy: -60 },
      { dx: 40, dy: -10 },
      { dx: -50, dy: 80 },
      { dx: 55, dy: 160 },
    ],
  },
];

const LEVEL_ORDER: Record<string, number> = {
  trainee: 0,
  practitioner: 1,
  expert: 2,
  master: 3,
};

// ============================================================
// Territory borders — wavy lines dividing the entire map into 4
// ============================================================

/**
 * 3 organic border lines that divide the map into 4 territories:
 *   border1: vertical wavy line between trainee | practitioner+expert+master (x ≈ 300)
 *   border2: vertical wavy line between practitioner+expert | master (x ≈ 920)
 *   border3: horizontal wavy line between practitioner | expert (y ≈ 350, in middle column)
 *
 * Layout (roughly):
 *   ┌─────────┬────────────────┬─────────┐
 *   │         │    Эксперт     │         │
 *   │ Стажёр  ├────────────────┤ Мастер  │
 *   │         │    Практик     │         │
 *   └─────────┴────────────────┴─────────┘
 */

// Wavy vertical border: top→bottom with jitter
function wavyVerticalBorder(x: number, seed: number): string {
  const pts: Array<{ x: number; y: number }> = [];
  let s = seed;
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * H;
    s = (s * 16807 + 7) % 2147483647;
    const jitter = ((s / 2147483647) - 0.5) * 50;
    pts.push({ x: x + jitter, y });
  }
  // smooth path
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const cpx1 = curr.x;
    const cpy1 = curr.y + (next.y - curr.y) * 0.5;
    const cpx2 = next.x;
    const cpy2 = curr.y + (next.y - curr.y) * 0.5;
    d += ` C ${cpx1.toFixed(1)},${cpy1.toFixed(1)} ${cpx2.toFixed(1)},${cpy2.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`;
  }
  return d;
}

// Wavy horizontal border: left→right with jitter
function wavyHorizontalBorder(y: number, xStart: number, xEnd: number, seed: number): string {
  const pts: Array<{ x: number; y: number }> = [];
  let s = seed;
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const x = xStart + (i / steps) * (xEnd - xStart);
    s = (s * 16807 + 7) % 2147483647;
    const jitter = ((s / 2147483647) - 0.5) * 45;
    pts.push({ x, y: y + jitter });
  }
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const cpx1 = curr.x + (next.x - curr.x) * 0.5;
    const cpy1 = curr.y;
    const cpx2 = curr.x + (next.x - curr.x) * 0.5;
    const cpy2 = next.y;
    d += ` C ${cpx1.toFixed(1)},${cpy1.toFixed(1)} ${cpx2.toFixed(1)},${cpy2.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`;
  }
  return d;
}

// Build territory clip paths for each zone
function buildTerritoryPaths(): {
  border1: string;
  border2: string;
  border3: string;
  territories: string[];
} {
  const b1x = 310;  // left vertical border
  const b2x = 930;  // right vertical border
  const b3y = 310;  // horizontal border (middle)

  const border1 = wavyVerticalBorder(b1x, 42);
  const border2 = wavyVerticalBorder(b2x, 137);
  const border3 = wavyHorizontalBorder(b3y, b1x, b2x, 256);

  // Extract points from border paths for composing territory shapes
  // We'll use the raw border paths + edges of the viewBox

  // Parse a path into points (rough extraction from "M x,y C ... x,y" — last point of each segment)
  function extractPoints(path: string): Array<{ x: number; y: number }> {
    const pts: Array<{ x: number; y: number }> = [];
    const regex = /(-?\d+\.?\d*),(-?\d+\.?\d*)/g;
    let match;
    // Get every coordinate pair (last pair of each C segment is the endpoint)
    const allPairs: Array<{ x: number; y: number }> = [];
    while ((match = regex.exec(path)) !== null) {
      allPairs.push({ x: parseFloat(match[1]), y: parseFloat(match[2]) });
    }
    // For M + C format: first pair is M, then groups of 3 (cp1, cp2, end)
    if (allPairs.length > 0) {
      pts.push(allPairs[0]); // M point
      for (let i = 1; i < allPairs.length; i += 3) {
        if (i + 2 < allPairs.length) {
          pts.push(allPairs[i + 2]); // end point of C
        }
      }
    }
    return pts;
  }

  const b1pts = extractPoints(border1); // vertical left border points (top→bottom)
  const b2pts = extractPoints(border2); // vertical right border points (top→bottom)
  const b3pts = extractPoints(border3); // horizontal middle border points (left→right)

  // Helper: points to smooth path
  function pointsToPath(pts: Array<{ x: number; y: number }>): string {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
    }
    d += ' Z';
    return d;
  }

  // Territory 0 — TRAINEE (left column: 0,0 → b1 top→bottom → 0,H)
  const t0: Array<{ x: number; y: number }> = [
    { x: 0, y: 0 },
    ...b1pts,
    { x: 0, y: H },
  ];

  // Territory 1 — PRACTITIONER (bottom-middle: b1 bottom→top → b3 left→right → b2 at b3y→bottom → W_b2, H → 0, H)
  // Practitioner = below b3, between b1 and b2
  const b1reversed = [...b1pts].reverse();
  const t1: Array<{ x: number; y: number }> = [
    ...b3pts, // top edge (horizontal border, left→right)
    ...b2pts.filter(p => p.y >= b3y - 30), // right border, from horizontal down
    { x: b2pts[b2pts.length - 1]?.x ?? b2x, y: H }, // bottom-right
    { x: b1pts[b1pts.length - 1]?.x ?? b1x, y: H }, // bottom-left
    ...b1reversed.filter(p => p.y >= b3y - 30), // left border, from bottom up to horizontal
  ];

  // Territory 2 — EXPERT (top-middle: 0_top → b1 top → b3 → b2 top → top-right)
  // Expert = above b3, between b1 and b2
  const b3reversed = [...b3pts].reverse();
  const t2: Array<{ x: number; y: number }> = [
    { x: b1pts[0]?.x ?? b1x, y: 0 }, // top-left
    { x: b2pts[0]?.x ?? b2x, y: 0 }, // top-right
    ...b2pts.filter(p => p.y <= b3y + 30), // right border top→horizontal
    ...b3reversed, // horizontal border right→left
    ...b1pts.filter(p => p.y <= b3y + 30).reverse(), // left border horizontal→top
  ];

  // Territory 3 — MASTER (right column: b2 top→bottom → W,H → W,0)
  const t3: Array<{ x: number; y: number }> = [
    { x: W, y: 0 },
    ...b2pts,
    { x: W, y: H },
  ];

  return {
    border1,
    border2,
    border3,
    territories: [
      pointsToPath(t0),
      pointsToPath(t1),
      pointsToPath(t2),
      pointsToPath(t3),
    ],
  };
}

// ============================================================
// Building data distribution
// ============================================================

interface ZoneBuilding {
  section: SectionMap;
  levelInZone: string;
  isCompleted: boolean;
  isAiRecommended: boolean;
  hasProgress: boolean;
  progressPct: number;
  coursesInLevel: number;
  coursesCompletedInLevel: number;
}

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

      const levelData = sec.levels?.find((l) => l.level === level);
      const coursesTotal = levelData?.courses_total ?? 0;
      const coursesCompleted = levelData?.courses_completed ?? 0;
      const isLevelCompleted = coursesTotal > 0 && coursesCompleted >= coursesTotal;
      const pct = coursesTotal > 0 ? (coursesCompleted / coursesTotal) * 100 : 0;

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

// Precompute territory paths (static, same every render)
const TERRITORY = buildTerritoryPaths();

// ============================================================
// COMPONENT
// ============================================================

export function LearningMap({ data, onOpenSection }: Props) {
  const { user, sections } = data;
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; building: ZoneBuilding; zoneColor: string;
  } | null>(null);
  const [mapScale, setMapScale] = useState(1);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Responsive: compute scale based on actual container width vs design width
  const updateScale = useCallback(() => {
    if (mapContainerRef.current) {
      const containerW = mapContainerRef.current.clientWidth;
      const scale = Math.min(containerW / W, 1); // never upscale past 1
      setMapScale(scale);
    }
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  const zoneData = useMemo(() => buildZoneData(sections), [sections]);
  const currentLevelIdx = ZONES.findIndex((z) => z.level === user.current_level);

  // Deterministic stars
  const stars = useMemo(() => {
    const result: Array<{ x: number; y: number; r: number; o: number }> = [];
    let seed = 42;
    for (let i = 0; i < 60; i++) {
      seed = (seed * 16807 + 7) % 2147483647;
      const x = (seed % W);
      seed = (seed * 16807 + 7) % 2147483647;
      const y = (seed % H);
      seed = (seed * 16807 + 7) % 2147483647;
      const r = 0.3 + (seed % 12) / 10;
      seed = (seed * 16807 + 7) % 2147483647;
      const o = 0.15 + (seed % 35) / 100;
      result.push({ x, y, r, o });
    }
    return result;
  }, []);

  return (
    <div className="relative w-full">
      {/* ===== User progress bar ===== */}
      <div className="flex items-center justify-between mb-3 bg-gray-900/80 backdrop-blur rounded-xl px-4 py-2.5 sm:px-5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-white font-bold text-xs sm:text-sm"
            style={{ backgroundColor: LEVEL_COLORS[user.current_level] || '#666' }}
          >
            {LEVEL_NAMES[user.current_level] || user.current_level}
          </div>
          <span className="text-white/70 text-xs sm:text-sm hidden sm:inline">{user.name}</span>
        </div>
        {user.level_progress.next && (
          <div className="flex items-center gap-2">
            <div className="w-20 sm:w-32 bg-gray-700 rounded-full h-1.5 sm:h-2">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${user.level_progress.percentage_to_next}%`,
                  backgroundColor: LEVEL_COLORS[user.current_level],
                }}
              />
            </div>
            <span className="text-white/60 text-[10px] sm:text-xs whitespace-nowrap">
              {Math.round(user.level_progress.percentage_to_next)}% до {LEVEL_NAMES[user.level_progress.next]}
            </span>
          </div>
        )}
      </div>

      {/* ===== Map container ===== */}
      <div ref={mapContainerRef} className="relative w-full rounded-2xl overflow-hidden shadow-2xl">
        {/* ===== LAYER 1: SVG — territories + background ===== */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto block"
          style={{ minHeight: '280px' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {ZONES.map((zone) => (
              <filter key={`glow-${zone.level}`} id={`glow-${zone.level}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
              </filter>
            ))}
          </defs>

          {/* === Territory fills (entire map covered) === */}
          {ZONES.map((zone, zi) => {
            const isCurrent = zone.level === user.current_level;
            return (
              <g key={zone.level}>
                {/* Base territory fill */}
                <path
                  d={TERRITORY.territories[zi]}
                  fill={zone.colorDark}
                  opacity={0.7}
                />
                {/* Color overlay */}
                <path
                  d={TERRITORY.territories[zi]}
                  fill={zone.color}
                  opacity={isCurrent ? 0.15 : 0.07}
                />
                {/* Current zone glow */}
                {isCurrent && (
                  <path
                    d={TERRITORY.territories[zi]}
                    fill={zone.glowColor}
                    filter={`url(#glow-${zone.level})`}
                    opacity={0.25}
                  >
                    <animate attributeName="opacity" values="0.15;0.3;0.15" dur="3s" repeatCount="indefinite" />
                  </path>
                )}
              </g>
            );
          })}

          {/* === Stars (on top of territory fills) === */}
          {stars.map((s, i) => (
            <circle key={`s${i}`} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />
          ))}

          {/* === Territory borders (wavy lines) === */}
          <path d={TERRITORY.border1} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          <path d={TERRITORY.border2} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          <path d={TERRITORY.border3} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

          {/* === Road connecting zone centers (Trainee → Practitioner → Expert → Master) === */}
          {(() => {
            // Road order: Trainee(0) → Practitioner(1) → Expert(2) → Master(3)
            const roadZones = [ZONES[0], ZONES[1], ZONES[2], ZONES[3]];
            const roadPath = `M ${roadZones[0].cx},${roadZones[0].cy}
                C ${roadZones[0].cx + 100},${roadZones[0].cy + 80} ${roadZones[1].cx - 150},${roadZones[1].cy - 60} ${roadZones[1].cx},${roadZones[1].cy}
                C ${roadZones[1].cx + 50},${roadZones[1].cy - 180} ${roadZones[2].cx - 50},${roadZones[2].cy + 60} ${roadZones[2].cx},${roadZones[2].cy}
                C ${roadZones[2].cx + 150},${roadZones[2].cy + 80} ${roadZones[3].cx - 100},${roadZones[3].cy - 60} ${roadZones[3].cx},${roadZones[3].cy}`;
            return (
              <path
                d={roadPath}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="3"
                strokeDasharray="10 5"
              />
            );
          })()}
          {/* Progress road glow */}
          {currentLevelIdx >= 0 && (() => {
            const rz = [ZONES[0], ZONES[1], ZONES[2], ZONES[3]];
            let d = `M ${rz[0].cx},${rz[0].cy}`;
            if (currentLevelIdx >= 1) d += ` C ${rz[0].cx + 100},${rz[0].cy + 80} ${rz[1].cx - 150},${rz[1].cy - 60} ${rz[1].cx},${rz[1].cy}`;
            if (currentLevelIdx >= 2) d += ` C ${rz[1].cx + 50},${rz[1].cy - 180} ${rz[2].cx - 50},${rz[2].cy + 60} ${rz[2].cx},${rz[2].cy}`;
            if (currentLevelIdx >= 3) d += ` C ${rz[2].cx + 150},${rz[2].cy + 80} ${rz[3].cx - 100},${rz[3].cy - 60} ${rz[3].cx},${rz[3].cy}`;
            return (
              <path
                d={d}
                fill="none"
                stroke={LEVEL_COLORS[user.current_level]}
                strokeWidth="2"
                opacity="0.4"
              />
            );
          })()}

          {/* === Zone labels (centered in each territory) === */}
          {ZONES.map((zone) => {
            const buildings = zoneData.get(zone.level) || [];
            const isCurrent = zone.level === user.current_level;
            return (
              <g key={`label-${zone.level}`}>
                <text
                  x={zone.cx}
                  y={zone.cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={zone.color}
                  fontSize="20"
                  fontWeight="bold"
                  className="select-none"
                  opacity={isCurrent ? 0.9 : 0.55}
                  style={{ textShadow: `0 0 15px ${zone.glowColor}` }}
                >
                  {zone.label}
                </text>
                <text
                  x={zone.cx}
                  y={zone.cy + 20}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={zone.color}
                  fontSize="11"
                  opacity={0.35}
                  className="select-none"
                >
                  {buildings.length} {buildings.length === 1 ? 'раздел' : buildings.length < 5 ? 'раздела' : 'разделов'}
                </text>
              </g>
            );
          })}
        </svg>

        {/* ===== LAYER 2: 3D House Buildings (HTML overlay) ===== */}
        <div className="learning-map-3d-layer" style={{ '--map-scale': mapScale } as React.CSSProperties}>
          <div style={{ perspective: '800px', width: '100%', height: '100%', position: 'relative' }}>
            {ZONES.map((zone) => {
              const buildings = zoneData.get(zone.level) || [];
              return buildings.map((bld, bIdx) => {
                const slot = zone.buildingSlots[bIdx % zone.buildingSlots.length];
                const bx = zone.cx + slot.dx;
                const by = zone.cy + slot.dy;
                const bKey = `${bld.section.section_id}-${zone.level}`;

                const bHeight = 28 + Math.min(bld.coursesInLevel, 5) * 5;
                const bWidth = 24 + Math.min(bld.coursesInLevel, 5) * 3;
                const bDepth = Math.max(16, Math.round(bWidth * 0.55));
                const doorHeight = Math.max(8, Math.round(bHeight * 0.25));

                // Default: zone-colored house
                let wallColor = zone.wallColor;
                let wallSideColor = zone.wallSideColor;
                let roofColor = zone.roofHouseColor;
                let doorColor = zone.doorColor;
                let windowColor = '#ffeaa7'; // warm yellow lit windows
                let windowOpacity = 0.85;
                let strokeColor = 'rgba(0,0,0,0.12)';
                let glowColor = 'transparent';

                if (bld.isCompleted) {
                  // Completed: bright green house
                  wallColor = '#c8e6c9';
                  wallSideColor = '#a5d6a7';
                  roofColor = '#2e7d32';
                  windowColor = '#81c784';
                  windowOpacity = 0.95;
                  strokeColor = '#4CAF50';
                  glowColor = 'rgba(76,175,80,0.5)';
                } else if (bld.isAiRecommended) {
                  // AI recommended: warm orange house
                  wallColor = '#ffe0b2';
                  wallSideColor = '#ffcc80';
                  roofColor = '#e65100';
                  windowColor = '#ffb74d';
                  windowOpacity = 0.95;
                  strokeColor = '#FF9800';
                  glowColor = 'rgba(255,152,0,0.5)';
                } else if (bld.hasProgress) {
                  // In progress: slightly brighter than default
                  windowColor = '#fff9c4';
                  windowOpacity = 0.9;
                  strokeColor = zone.color;
                  glowColor = zone.glowColor;
                } else {
                  // Not started: darker, dimmer
                  wallColor = '#9e9e9e';
                  wallSideColor = '#878787';
                  roofColor = '#616161';
                  doorColor = '#5d4037';
                  windowColor = '#b0bec5';
                  windowOpacity = 0.35;
                  strokeColor = 'rgba(0,0,0,0.1)';
                }

                if (hoveredBuilding === bKey) {
                  strokeColor = '#ffffff';
                }

                const stateClass = bld.isCompleted
                  ? 'building-wrapper--completed'
                  : bld.isAiRecommended
                  ? 'building-wrapper--ai'
                  : '';

                const winRows = Math.min(Math.ceil(bHeight / 16), 3);
                const winCols = 2;

                const leftPct = (bx / W) * 100;
                const topPct = (by / H) * 100;

                return (
                  <div
                    key={bKey}
                    className="building-positioner"
                    style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    onClick={() => onOpenSection(bld.section.section_id)}
                    onMouseEnter={() => {
                      setHoveredBuilding(bKey);
                      setTooltip({ x: bx, y: by - bHeight - 30, building: bld, zoneColor: zone.color });
                    }}
                    onMouseLeave={() => {
                      setHoveredBuilding(null);
                      setTooltip(null);
                    }}
                  >
                    <div
                      className={`building-wrapper ${stateClass}`}
                      style={{
                        width: `${bWidth}px`,
                        height: `${bHeight}px`,
                        '--b-width': `${bWidth}px`,
                        '--b-height': `${bHeight}px`,
                        '--b-depth': `${bDepth}px`,
                        '--door-height': `${doorHeight}px`,
                        '--wall-color': wallColor,
                        '--wall-side-color': wallSideColor,
                        '--roof-color': roofColor,
                        '--door-color': doorColor,
                        '--stroke-color': strokeColor,
                        '--window-color': windowColor,
                        '--window-opacity': windowOpacity,
                        '--win-rows': winRows,
                        '--win-cols': winCols,
                        '--glow-color': glowColor,
                      } as React.CSSProperties}
                    >
                      <div className="face-front">
                        <div className="building-windows">
                          {Array.from({ length: winRows * winCols }).map((_, w) => (
                            <div key={w} className="building-window" />
                          ))}
                        </div>
                        <div className="building-door" />
                      </div>
                      <div className="face-side" />
                      <div className="face-top" />
                    </div>

                    {!bld.isCompleted && bld.hasProgress && (
                      <div className="building-progress">
                        <div
                          className="building-progress-fill"
                          style={{ width: `${bld.progressPct}%`, backgroundColor: zone.color }}
                        />
                      </div>
                    )}

                    {bld.isCompleted && <div className="building-badge">✓</div>}

                    {bld.isAiRecommended && !bld.isCompleted && (
                      <div className="building-icon">🔥</div>
                    )}

                    {bld.section.icon && !bld.isAiRecommended && !bld.isCompleted && (
                      <div className="building-icon" style={{ opacity: 0.7 }}>
                        {bld.section.icon}
                      </div>
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>

        {/* ===== LAYER 3: Tooltip ===== */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left: `${(tooltip.x / W) * 100}%`,
              top: `${(tooltip.y / H) * 100}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-gray-900/95 backdrop-blur border border-gray-600 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-xl min-w-[160px] sm:min-w-[200px]">
              <div className="flex items-center gap-2">
                {tooltip.building.section.icon && (
                  <span className="text-base sm:text-lg">{tooltip.building.section.icon}</span>
                )}
                <p className="text-white font-bold text-xs sm:text-sm">{tooltip.building.section.title.ru}</p>
              </div>
              <p className="text-gray-400 text-[10px] sm:text-xs mt-1">
                Уровень: {LEVEL_NAMES[tooltip.building.levelInZone]}
              </p>
              <div className="mt-1.5 sm:mt-2">
                {tooltip.building.isCompleted ? (
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">✓ Пройдено</span>
                ) : tooltip.building.isAiRecommended ? (
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">🔥 AI задача</span>
                ) : tooltip.building.hasProgress ? (
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">📖 В процессе</span>
                ) : (
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full">Не начато</span>
                )}
              </div>
              <div className="mt-1.5 sm:mt-2">
                <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 mb-1">
                  <span>{tooltip.building.coursesCompletedInLevel}/{tooltip.building.coursesInLevel} курсов</span>
                  <span>{Math.round(tooltip.building.progressPct)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1 sm:h-1.5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${tooltip.building.progressPct}%`,
                      backgroundColor: tooltip.building.isCompleted ? '#4CAF50' : tooltip.zoneColor,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== Legend ===== */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-3 sm:mt-4 text-[10px] sm:text-xs text-gray-500">
        {ZONES.map((zone) => (
          <div key={zone.level} className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: zone.color }} />
            <span className="text-gray-300">{zone.label}</span>
          </div>
        ))}
        <div className="h-3 border-l border-gray-600 mx-0.5 sm:mx-1" />
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500/60 rounded-sm" />
          <span>Пройдено</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="text-xs sm:text-sm">🔥</span>
          <span>AI задача</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-700 rounded-sm border border-gray-500" />
          <span>Не начато</span>
        </div>
      </div>
    </div>
  );
}
