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
 * Desktop: 4 zones side-by-side (1200×700)
 * Mobile:  4 zones stacked vertically (400×1200) — fills phone screen
 * Organic wavy borders separate the zones.
 * SVG background + HTML overlay for 3D CSS buildings.
 */

interface Props {
  data: LearningMapResponse;
  onOpenSection: (sectionId: string) => void;
}

// ============================================================
// ZONE CONFIG
// ============================================================

interface ZoneConfig {
  level: string;
  label: string;
  color: string;
  colorDark: string;
  glowColor: string;
  // Desktop positions (1200×700 viewport)
  cx: number; cy: number;
  buildingSlots: Array<{ dx: number; dy: number }>;
  // Mobile positions (400×1200 viewport) — zones stacked vertically
  mcx: number; mcy: number;
  mobileBuildingSlots: Array<{ dx: number; dy: number }>;
  // House colors
  wallColor: string;
  wallSideColor: string;
  roofHouseColor: string;
  doorColor: string;
}

// Desktop dimensions
const DW = 1200;
const DH = 700;

// Mobile dimensions
const MW = 400;
const MH = 1200;

const ZONES: ZoneConfig[] = [
  {
    level: 'trainee',
    label: 'Стажёр',
    color: '#4CAF50',
    colorDark: '#1b3d20',
    glowColor: 'rgba(76,175,80,0.35)',
    // Desktop: left column
    cx: 155, cy: 350,
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
    // Mobile: top zone (y=0..300)
    mcx: 200, mcy: 150,
    mobileBuildingSlots: [
      { dx: -130, dy: -90 },
      { dx: 0, dy: -100 },
      { dx: 130, dy: -85 },
      { dx: -100, dy: 0 },
      { dx: 50, dy: -10 },
      { dx: 140, dy: 15 },
      { dx: -60, dy: 80 },
      { dx: 80, dy: 90 },
    ],
    wallColor: '#a8d5a2',
    wallSideColor: '#8bc185',
    roofHouseColor: '#2e7d32',
    doorColor: '#5d4037',
  },
  {
    level: 'practitioner',
    label: 'Практик',
    color: '#2196F3',
    colorDark: '#152d45',
    glowColor: 'rgba(33,150,243,0.35)',
    // Desktop: bottom-middle
    cx: 620, cy: 505,
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
    // Mobile: second zone (y=300..600)
    mcx: 200, mcy: 450,
    mobileBuildingSlots: [
      { dx: -130, dy: -90 },
      { dx: 0, dy: -100 },
      { dx: 130, dy: -85 },
      { dx: -100, dy: 0 },
      { dx: 50, dy: -10 },
      { dx: 140, dy: 15 },
      { dx: -60, dy: 80 },
      { dx: 80, dy: 90 },
    ],
    wallColor: '#a0c4e8',
    wallSideColor: '#85b0d8',
    roofHouseColor: '#1565c0',
    doorColor: '#4e342e',
  },
  {
    level: 'expert',
    label: 'Эксперт',
    color: '#FF9800',
    colorDark: '#3a2810',
    glowColor: 'rgba(255,152,0,0.35)',
    // Desktop: top-middle
    cx: 620, cy: 155,
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
    // Mobile: third zone (y=600..900)
    mcx: 200, mcy: 750,
    mobileBuildingSlots: [
      { dx: -130, dy: -90 },
      { dx: 0, dy: -100 },
      { dx: 130, dy: -85 },
      { dx: -100, dy: 0 },
      { dx: 50, dy: -10 },
      { dx: 140, dy: 15 },
      { dx: -60, dy: 80 },
      { dx: 80, dy: 90 },
    ],
    wallColor: '#f5d6a8',
    wallSideColor: '#e8c088',
    roofHouseColor: '#e65100',
    doorColor: '#5d4037',
  },
  {
    level: 'master',
    label: 'Мастер',
    color: '#F44336',
    colorDark: '#3a1515',
    glowColor: 'rgba(244,67,54,0.35)',
    // Desktop: right column
    cx: 1065, cy: 350,
    buildingSlots: [
      { dx: -60, dy: -220 },
      { dx: 50, dy: -150 },
      { dx: -70, dy: -60 },
      { dx: 40, dy: -10 },
      { dx: -50, dy: 80 },
      { dx: 55, dy: 160 },
    ],
    // Mobile: bottom zone (y=900..1200)
    mcx: 200, mcy: 1050,
    mobileBuildingSlots: [
      { dx: -130, dy: -90 },
      { dx: 0, dy: -100 },
      { dx: 130, dy: -85 },
      { dx: -100, dy: 0 },
      { dx: 50, dy: -10 },
      { dx: 140, dy: 15 },
    ],
    wallColor: '#e8a8a0',
    wallSideColor: '#d89088',
    roofHouseColor: '#b71c1c',
    doorColor: '#4e342e',
  },
];

const LEVEL_ORDER: Record<string, number> = {
  trainee: 0,
  practitioner: 1,
  expert: 2,
  master: 3,
};

// ============================================================
// Territory borders — desktop layout
// ============================================================

function wavyVerticalBorder(x: number, seed: number, h: number): string {
  const pts: Array<{ x: number; y: number }> = [];
  let s = seed;
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * h;
    s = (s * 16807 + 7) % 2147483647;
    const jitter = ((s / 2147483647) - 0.5) * 50;
    pts.push({ x: x + jitter, y });
  }
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i]; const next = pts[i + 1];
    const cpx1 = curr.x; const cpy1 = curr.y + (next.y - curr.y) * 0.5;
    const cpx2 = next.x; const cpy2 = curr.y + (next.y - curr.y) * 0.5;
    d += ` C ${cpx1.toFixed(1)},${cpy1.toFixed(1)} ${cpx2.toFixed(1)},${cpy2.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`;
  }
  return d;
}

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
    const curr = pts[i]; const next = pts[i + 1];
    const cpx1 = curr.x + (next.x - curr.x) * 0.5; const cpy1 = curr.y;
    const cpx2 = curr.x + (next.x - curr.x) * 0.5; const cpy2 = next.y;
    d += ` C ${cpx1.toFixed(1)},${cpy1.toFixed(1)} ${cpx2.toFixed(1)},${cpy2.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`;
  }
  return d;
}

function wavyHorizontalFull(y: number, w: number, seed: number): string {
  return wavyHorizontalBorder(y, 0, w, seed);
}

function extractPoints(path: string): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  const regex = /(-?\d+\.?\d*),(-?\d+\.?\d*)/g;
  let match;
  const allPairs: Array<{ x: number; y: number }> = [];
  while ((match = regex.exec(path)) !== null) {
    allPairs.push({ x: parseFloat(match[1]), y: parseFloat(match[2]) });
  }
  if (allPairs.length > 0) {
    pts.push(allPairs[0]);
    for (let i = 1; i < allPairs.length; i += 3) {
      if (i + 2 < allPairs.length) pts.push(allPairs[i + 2]);
    }
  }
  return pts;
}

function pointsToPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return '';
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
  }
  return d + ' Z';
}

// Desktop territory layout
function buildDesktopTerritories() {
  const b1x = 310; const b2x = 930; const b3y = 310;
  const border1 = wavyVerticalBorder(b1x, 42, DH);
  const border2 = wavyVerticalBorder(b2x, 137, DH);
  const border3 = wavyHorizontalBorder(b3y, b1x, b2x, 256);
  const b1pts = extractPoints(border1);
  const b2pts = extractPoints(border2);
  const b3pts = extractPoints(border3);
  const b3reversed = [...b3pts].reverse();

  const t0 = [{ x: 0, y: 0 }, ...b1pts, { x: 0, y: DH }];
  const t1 = [
    ...b3pts,
    ...b2pts.filter(p => p.y >= b3y - 30),
    { x: b2pts[b2pts.length - 1]?.x ?? b2x, y: DH },
    { x: b1pts[b1pts.length - 1]?.x ?? b1x, y: DH },
    ...[...b1pts].reverse().filter(p => p.y >= b3y - 30),
  ];
  const t2 = [
    { x: b1pts[0]?.x ?? b1x, y: 0 },
    { x: b2pts[0]?.x ?? b2x, y: 0 },
    ...b2pts.filter(p => p.y <= b3y + 30),
    ...b3reversed,
    ...b1pts.filter(p => p.y <= b3y + 30).reverse(),
  ];
  const t3 = [{ x: DW, y: 0 }, ...b2pts, { x: DW, y: DH }];

  return {
    borders: [border1, border2, border3],
    territories: [pointsToPath(t0), pointsToPath(t1), pointsToPath(t2), pointsToPath(t3)],
  };
}

// Mobile territory layout — 4 horizontal stripes
function buildMobileTerritories() {
  const by1 = 300; const by2 = 600; const by3 = 900;
  const border1 = wavyHorizontalFull(by1, MW, 42);
  const border2 = wavyHorizontalFull(by2, MW, 137);
  const border3 = wavyHorizontalFull(by3, MW, 256);
  const b2pts = extractPoints(border2);
  const b3pts = extractPoints(border3);

  // Build territory polygons
  const b1pts2 = extractPoints(border1);
  const t0fix = [{ x: 0, y: 0 }, { x: MW, y: 0 }, ...[...b1pts2].reverse()];
  const t1fix = [...b1pts2, ...[...b2pts].reverse(), { x: 0, y: by2 }];
  const t2fix = [...extractPoints(border2), ...[...b3pts].reverse()];
  const t3fix = [...extractPoints(border3), { x: MW, y: MH }, { x: 0, y: MH }];

  return {
    borders: [border1, extractPoints(border2).length > 0 ? wavyHorizontalFull(by2, MW, 137) : '', wavyHorizontalFull(by3, MW, 256)],
    territories: [pointsToPath(t0fix), pointsToPath(t1fix), pointsToPath(t2fix), pointsToPath(t3fix)],
  };
}

// Precompute
const DESKTOP_TERRITORY = buildDesktopTerritories();
const MOBILE_TERRITORY = buildMobileTerritories();

// ============================================================
// Smooth Catmull-Rom path + nearest-neighbor ordering
// ============================================================

function smoothCatmullRom(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const t = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * t;
    const cp1y = p1.y + (p2.y - p0.y) * t;
    const cp2x = p2.x - (p3.x - p1.x) * t;
    const cp2y = p2.y - (p3.y - p1.y) * t;
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

// Order zone buildings by nearest-neighbor for shortest path
function nearestNeighborOrder(pts: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  if (pts.length <= 2) return pts;
  const remaining = [...pts];
  const result: Array<{ x: number; y: number }> = [remaining.shift()!];
  while (remaining.length > 0) {
    const last = result[result.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const dx = remaining[i].x - last.x;
      const dy = remaining[i].y - last.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    }
    result.push(remaining.splice(bestIdx, 1)[0]);
  }
  return result;
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
  for (const zone of ZONES) map.set(zone.level, []);

  for (const sec of sections) {
    const startIdx = LEVEL_ORDER[sec.level_range.start] ?? 0;
    const endIdx = LEVEL_ORDER[sec.level_range.end] ?? 3;
    for (let i = startIdx; i <= endIdx; i++) {
      const level = ZONES[i]?.level;
      if (!level) continue;
      const levelData = sec.levels?.find((l) => l.level === level);
      const coursesTotal = levelData?.courses_total ?? 0;
      const coursesCompleted = levelData?.courses_completed ?? 0;
      const pct = coursesTotal > 0 ? (coursesCompleted / coursesTotal) * 100 : 0;
      if (coursesTotal > 0) {
        map.get(level)?.push({
          section: sec, levelInZone: level,
          isCompleted: coursesTotal > 0 && coursesCompleted >= coursesTotal,
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
  const [isMobile, setIsMobile] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const updateScale = useCallback(() => {
    if (mapContainerRef.current) {
      const containerW = mapContainerRef.current.clientWidth;
      const mobile = containerW < 640;
      setIsMobile(mobile);
      const designW = mobile ? MW : DW;
      setMapScale(Math.min(containerW / designW, 1));
    }
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  const zoneData = useMemo(() => buildZoneData(sections), [sections]);

  // Current layout params
  const W = isMobile ? MW : DW;
  const H = isMobile ? MH : DH;
  const territory = isMobile ? MOBILE_TERRITORY : DESKTOP_TERRITORY;

  // Get zone position based on layout
  const getZoneCenter = (zone: ZoneConfig) => isMobile ? { x: zone.mcx, y: zone.mcy } : { x: zone.cx, y: zone.cy };
  const getSlots = (zone: ZoneConfig) => isMobile ? zone.mobileBuildingSlots : zone.buildingSlots;

  // Collect ALL building points for road (with nearest-neighbor ordering per zone)
  const allBuildingPts = useMemo(() => {
    const pts: Array<{ x: number; y: number; zoneIdx: number }> = [];
    for (let zi = 0; zi < ZONES.length; zi++) {
      const zone = ZONES[zi];
      const center = getZoneCenter(zone);
      const slots = getSlots(zone);
      const buildings = zoneData.get(zone.level) || [];
      const count = Math.max(buildings.length, 1);
      const rawPts: Array<{ x: number; y: number }> = [];
      for (let bi = 0; bi < count; bi++) {
        const slot = slots[bi % slots.length];
        rawPts.push({ x: center.x + slot.dx, y: center.y + slot.dy });
      }
      // Nearest-neighbor within zone
      const ordered = nearestNeighborOrder(rawPts);
      for (const p of ordered) pts.push({ ...p, zoneIdx: zi });
    }
    return pts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneData, isMobile]);

  // Completed count for road coloring
  const completedCount = useMemo(() => {
    let count = 0;
    for (let zi = 0; zi < ZONES.length; zi++) {
      const buildings = zoneData.get(ZONES[zi].level) || [];
      for (const bld of buildings) {
        if (bld.isCompleted) count++;
        else return count;
      }
      if (!buildings.every(b => b.isCompleted)) return count;
    }
    return count;
  }, [zoneData]);

  // Stars
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
  }, [W, H]);

  const roadPath = useMemo(() => smoothCatmullRom(allBuildingPts), [allBuildingPts]);

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
        {/* ===== LAYER 1: SVG ===== */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto block"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {ZONES.map((zone) => (
              <filter key={`glow-${zone.level}`} id={`glow-${zone.level}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
              </filter>
            ))}
          </defs>

          {/* Territory fills */}
          {ZONES.map((zone, zi) => {
            const isCurrent = zone.level === user.current_level;
            return (
              <g key={zone.level}>
                <path d={territory.territories[zi]} fill={zone.colorDark} opacity={0.7} />
                <path d={territory.territories[zi]} fill={zone.color} opacity={isCurrent ? 0.15 : 0.07} />
                {isCurrent && (
                  <path d={territory.territories[zi]} fill={zone.glowColor} filter={`url(#glow-${zone.level})`} opacity={0.25}>
                    <animate attributeName="opacity" values="0.15;0.3;0.15" dur="3s" repeatCount="indefinite" />
                  </path>
                )}
              </g>
            );
          })}

          {/* Stars */}
          {stars.map((s, i) => (
            <circle key={`s${i}`} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />
          ))}

          {/* Territory borders */}
          {territory.borders.map((b, i) => (
            <path key={`border-${i}`} d={b} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          ))}

          {/* Road trajectory through every building */}
          <path d={roadPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" strokeDasharray="8 4" />
          {allBuildingPts.map((pt, i) => (
            <circle
              key={`rd-${i}`}
              cx={pt.x} cy={pt.y} r={3.5}
              fill={i < completedCount ? '#4CAF50' : 'rgba(255,255,255,0.25)'}
              stroke={i < completedCount ? '#81c784' : 'rgba(255,255,255,0.1)'}
              strokeWidth={1}
            />
          ))}

          {/* Zone labels */}
          {ZONES.map((zone) => {
            const buildings = zoneData.get(zone.level) || [];
            const isCurrent = zone.level === user.current_level;
            const center = getZoneCenter(zone);
            return (
              <g key={`label-${zone.level}`}>
                <text
                  x={center.x} y={center.y}
                  textAnchor="middle" dominantBaseline="central"
                  fill={zone.color} fontSize={isMobile ? 18 : 20} fontWeight="bold"
                  className="select-none" opacity={isCurrent ? 0.9 : 0.55}
                  style={{ textShadow: `0 0 15px ${zone.glowColor}` }}
                >
                  {zone.label}
                </text>
                <text
                  x={center.x} y={center.y + (isMobile ? 18 : 20)}
                  textAnchor="middle" dominantBaseline="central"
                  fill={zone.color} fontSize="11" opacity={0.35} className="select-none"
                >
                  {buildings.length} {buildings.length === 1 ? 'раздел' : buildings.length < 5 ? 'раздела' : 'разделов'}
                </text>
              </g>
            );
          })}
        </svg>

        {/* ===== LAYER 2: 3D Houses (HTML overlay) ===== */}
        <div className="learning-map-3d-layer" style={{ '--map-scale': mapScale } as React.CSSProperties}>
          <div style={{ perspective: '800px', width: '100%', height: '100%', position: 'relative' }}>
            {ZONES.map((zone) => {
              const buildings = zoneData.get(zone.level) || [];
              const center = getZoneCenter(zone);
              const slots = getSlots(zone);
              return buildings.map((bld, bIdx) => {
                const slot = slots[bIdx % slots.length];
                const bx = center.x + slot.dx;
                const by = center.y + slot.dy;
                const bKey = `${bld.section.section_id}-${zone.level}`;

                const bHeight = 28 + Math.min(bld.coursesInLevel, 5) * 5;
                const bWidth = 24 + Math.min(bld.coursesInLevel, 5) * 3;
                const bDepth = Math.max(16, Math.round(bWidth * 0.55));
                const doorHeight = Math.max(8, Math.round(bHeight * 0.25));

                let wallColor = zone.wallColor;
                let wallSideColor = zone.wallSideColor;
                let roofColor = zone.roofHouseColor;
                let doorColor = zone.doorColor;
                let windowColor = '#ffeaa7';
                let windowOpacity = 0.85;
                let strokeColor = 'rgba(0,0,0,0.12)';
                let glowColor = 'transparent';

                if (bld.isCompleted) {
                  wallColor = '#c8e6c9'; wallSideColor = '#a5d6a7'; roofColor = '#2e7d32';
                  windowColor = '#81c784'; windowOpacity = 0.95; strokeColor = '#4CAF50';
                  glowColor = 'rgba(76,175,80,0.5)';
                } else if (bld.isAiRecommended) {
                  wallColor = '#ffe0b2'; wallSideColor = '#ffcc80'; roofColor = '#e65100';
                  windowColor = '#ffb74d'; windowOpacity = 0.95; strokeColor = '#FF9800';
                  glowColor = 'rgba(255,152,0,0.5)';
                } else if (bld.hasProgress) {
                  windowColor = '#fff9c4'; windowOpacity = 0.9; strokeColor = zone.color;
                  glowColor = zone.glowColor;
                } else {
                  wallColor = '#9e9e9e'; wallSideColor = '#878787'; roofColor = '#616161';
                  doorColor = '#5d4037'; windowColor = '#b0bec5'; windowOpacity = 0.35;
                  strokeColor = 'rgba(0,0,0,0.1)';
                }

                if (hoveredBuilding === bKey) strokeColor = '#ffffff';

                const stateClass = bld.isCompleted ? 'building-wrapper--completed'
                  : bld.isAiRecommended ? 'building-wrapper--ai' : '';

                const winRows = Math.min(Math.ceil(bHeight / 16), 3);

                return (
                  <div
                    key={bKey}
                    className="building-positioner"
                    style={{ left: `${(bx / W) * 100}%`, top: `${(by / H) * 100}%` }}
                    onClick={() => onOpenSection(bld.section.section_id)}
                    onMouseEnter={() => {
                      setHoveredBuilding(bKey);
                      setTooltip({ x: bx, y: by - bHeight - 30, building: bld, zoneColor: zone.color });
                    }}
                    onMouseLeave={() => { setHoveredBuilding(null); setTooltip(null); }}
                  >
                    <div
                      className={`building-wrapper ${stateClass}`}
                      style={{
                        width: `${bWidth}px`, height: `${bHeight}px`,
                        '--b-width': `${bWidth}px`, '--b-height': `${bHeight}px`,
                        '--b-depth': `${bDepth}px`, '--door-height': `${doorHeight}px`,
                        '--wall-color': wallColor, '--wall-side-color': wallSideColor,
                        '--roof-color': roofColor, '--door-color': doorColor,
                        '--stroke-color': strokeColor, '--window-color': windowColor,
                        '--window-opacity': windowOpacity, '--win-rows': winRows, '--win-cols': 2,
                        '--glow-color': glowColor,
                      } as React.CSSProperties}
                    >
                      <div className="face-front">
                        <div className="building-windows">
                          {Array.from({ length: winRows * 2 }).map((_, w) => (
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
                        <div className="building-progress-fill" style={{ width: `${bld.progressPct}%`, backgroundColor: zone.color }} />
                      </div>
                    )}
                    {bld.isCompleted && <div className="building-badge">✓</div>}
                    {bld.isAiRecommended && !bld.isCompleted && <div className="building-icon">🔥</div>}
                    {bld.section.icon && !bld.isAiRecommended && !bld.isCompleted && (
                      <div className="building-icon" style={{ opacity: 0.7 }}>{bld.section.icon}</div>
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
