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
  onOpenSection: (sectionId: string, isVillage: boolean, level?: string) => void;
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
    // Desktop: TRAINEE/SPRING — column 1 (x: 0-300), 9 stations along zigzag rails
    cx: 150, cy: 350,
    buildingSlots: [
      { dx: -90, dy: -270 }, { dx: 70, dy: -200 },
      { dx: -85, dy: -130 }, { dx: 80, dy: -60 },
      { dx: -90, dy: 10 },   { dx: 75, dy: 80 },
      { dx: -85, dy: 150 },  { dx: 80, dy: 220 },
      { dx: -90, dy: 290 },
    ],
    // Mobile: top zone — grid 3 cols × 3 rows
    mcx: 200, mcy: 150,
    mobileBuildingSlots: [
      { dx: -130, dy: -100 }, { dx: 0, dy: -110 }, { dx: 130, dy: -100 },
      { dx: -130, dy: 0 },    { dx: 0, dy: 0 },    { dx: 130, dy: 0 },
      { dx: -130, dy: 100 },  { dx: 0, dy: 110 },  { dx: 130, dy: 100 },
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
    // Desktop: PRACTITIONER/SUMMER — column 2 (x: 300-600), 7 stations along zigzag rails
    cx: 450, cy: 350,
    buildingSlots: [
      { dx: -90, dy: -270 }, { dx: 70, dy: -180 },
      { dx: -85, dy: -90 },  { dx: 80, dy: 0 },
      { dx: -90, dy: 90 },   { dx: 75, dy: 180 },
      { dx: -85, dy: 270 },
    ],
    // Mobile: second zone — grid 3 cols × 3 rows (9 slots)
    mcx: 200, mcy: 450,
    mobileBuildingSlots: [
      { dx: -130, dy: -100 }, { dx: 0, dy: -110 }, { dx: 130, dy: -100 },
      { dx: -130, dy: 0 },    { dx: 0, dy: 0 },    { dx: 130, dy: 0 },
      { dx: -130, dy: 100 },  { dx: 0, dy: 110 },  { dx: 130, dy: 100 },
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
    // Desktop: EXPERT/AUTUMN — column 3 (x: 600-900), 5 stations along zigzag rails
    cx: 750, cy: 350,
    buildingSlots: [
      { dx: -90, dy: -240 }, { dx: 70, dy: -120 },
      { dx: -85, dy: 0 },    { dx: 80, dy: 120 },
      { dx: -90, dy: 240 },
    ],
    // Mobile: third zone — grid 3 cols × 2 rows
    mcx: 200, mcy: 750,
    mobileBuildingSlots: [
      { dx: -130, dy: -50 }, { dx: 0, dy: -60 }, { dx: 130, dy: -50 },
      { dx: -130, dy: 60 },  { dx: 0, dy: 70 },  { dx: 130, dy: 60 },
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
    // Desktop: MASTER/WINTER — column 4 (x: 900-1200), 7 stations along zigzag rails
    cx: 1050, cy: 350,
    buildingSlots: [
      { dx: -90, dy: -270 }, { dx: 70, dy: -180 },
      { dx: -85, dy: -90 },  { dx: 80, dy: 0 },
      { dx: -90, dy: 90 },   { dx: 75, dy: 180 },
      { dx: -85, dy: 270 },
    ],
    // Mobile: bottom zone — grid 3 cols × 3 rows
    mcx: 200, mcy: 1050,
    mobileBuildingSlots: [
      { dx: -130, dy: -100 }, { dx: 0, dy: -110 }, { dx: 130, dy: -100 },
      { dx: -130, dy: 0 },    { dx: 0, dy: 0 },    { dx: 130, dy: 0 },
      { dx: -130, dy: 100 },  { dx: 0, dy: 110 },  { dx: 130, dy: 100 },
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

// Label positions — landscape-integrated (Master on mountain, etc.)
const LABEL_OFFSETS: Record<string, { dx: number; dy: number; mdx: number; mdy: number }> = {
  trainee:      { dx: 0, dy: 290, mdx: 0, mdy: 120 },
  practitioner: { dx: 0, dy: 145, mdx: 0, mdy: 120 },
  expert:       { dx: 0, dy: -130, mdx: 0, mdy: -120 },
  master:       { dx: 15, dy: -10, mdx: 0, mdy: -80 },
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
    const jitter = ((s / 2147483647) - 0.5) * 30;
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
    const jitter = ((s / 2147483647) - 0.5) * 30;
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

// Desktop territory layout — 4 vertical columns (Spring → Summer → Autumn → Winter)
function buildDesktopTerritories() {
  const b1x = 300; const b2x = 600; const b3x = 900;
  const border1 = wavyVerticalBorder(b1x, 42, DH);
  const border2 = wavyVerticalBorder(b2x, 137, DH);
  const border3 = wavyVerticalBorder(b3x, 256, DH);
  const b1pts = extractPoints(border1);
  const b2pts = extractPoints(border2);
  const b3pts = extractPoints(border3);

  // Trainee — left column (0 → border1)
  const t0 = [{ x: 0, y: 0 }, ...b1pts, { x: 0, y: DH }];
  // Practitioner — column between border1 and border2
  const t1 = [
    { x: b1pts[0]?.x ?? b1x, y: 0 },
    { x: b2pts[0]?.x ?? b2x, y: 0 },
    ...b2pts,
    { x: b1pts[b1pts.length - 1]?.x ?? b1x, y: DH },
    ...[...b1pts].reverse(),
  ];
  // Expert — column between border2 and border3
  const t2 = [
    { x: b2pts[0]?.x ?? b2x, y: 0 },
    { x: b3pts[0]?.x ?? b3x, y: 0 },
    ...b3pts,
    { x: b2pts[b2pts.length - 1]?.x ?? b2x, y: DH },
    ...[...b2pts].reverse(),
  ];
  // Master — right column (border3 → DW)
  const t3 = [{ x: DW, y: 0 }, ...b3pts, { x: DW, y: DH }];

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

// (road utilities removed — buildings now placed on a fixed grid per zone)

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
            {/* Seasonal sky-to-ground gradients */}
            {/* SPRING — Trainee (light green grass, warm sky) */}
            <linearGradient id="pat-trainee" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a3d3eb" />
              <stop offset="40%" stopColor="#cfeae0" />
              <stop offset="60%" stopColor="#7fc88a" />
              <stop offset="100%" stopColor="#5ba86a" />
            </linearGradient>
            {/* SUMMER — Practitioner (vivid blue sky, lush green) */}
            <linearGradient id="pat-practitioner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7cc1ec" />
              <stop offset="45%" stopColor="#b6e0f0" />
              <stop offset="60%" stopColor="#88c270" />
              <stop offset="100%" stopColor="#4c8d4d" />
            </linearGradient>
            {/* AUTUMN — Expert (warm orange sky, golden ground) */}
            <linearGradient id="pat-expert" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5b86a" />
              <stop offset="40%" stopColor="#f6cf91" />
              <stop offset="60%" stopColor="#c98640" />
              <stop offset="100%" stopColor="#8b5524" />
            </linearGradient>
            {/* WINTER — Master (deep night sky, snowy ground) */}
            <linearGradient id="pat-master" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a2a4a" />
              <stop offset="40%" stopColor="#3b4d70" />
              <stop offset="60%" stopColor="#cfd9e4" />
              <stop offset="100%" stopColor="#aab8c8" />
            </linearGradient>
            {/* River gradient (Summer) */}
            <linearGradient id="riverGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5fa3d6" />
              <stop offset="100%" stopColor="#3779b3" />
            </linearGradient>
            <filter id="zone-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
            </filter>
          </defs>

          {/* Territory base fills */}
          {ZONES.map((zone, zi) => {
            const isCurrent = zone.level === user.current_level;
            return (
              <g key={zone.level}>
                <path d={territory.territories[zi]} fill={`url(#pat-${zone.level})`} />
                {isCurrent && (
                  <path d={territory.territories[zi]} fill={zone.glowColor} filter="url(#zone-glow)" opacity={0.25}>
                    <animate attributeName="opacity" values="0.15;0.3;0.15" dur="3s" repeatCount="indefinite" />
                  </path>
                )}
              </g>
            );
          })}

          {/* === Seasonal landscape + rails + train === */}
          {!isMobile ? (
            <g>
              {/* ============ SPRING — TRAINEE (x: 0-300) ============ */}
              {/* Bushes/grass tufts */}
              <ellipse cx="40" cy="635" rx="55" ry="14" fill="#3e7a3e" opacity="0.85" />
              <ellipse cx="260" cy="650" rx="50" ry="13" fill="#3e7a3e" opacity="0.8" />
              <ellipse cx="155" cy="675" rx="80" ry="14" fill="#357036" opacity="0.7" />
              {/* Spring trees — light green */}
              <g>
                <rect x="22" y="80" width="6" height="20" fill="#5d3a1f" />
                <circle cx="25" cy="70" r="22" fill="#7cc26a" />
                <circle cx="18" cy="62" r="14" fill="#8ed378" opacity="0.9" />
                <circle cx="33" cy="65" r="13" fill="#94db7d" opacity="0.85" />
              </g>
              <g>
                <rect x="270" y="140" width="6" height="22" fill="#5d3a1f" />
                <circle cx="273" cy="130" r="20" fill="#7cc26a" />
                <circle cx="280" cy="120" r="13" fill="#94db7d" opacity="0.9" />
              </g>
              <g>
                <rect x="15" y="360" width="6" height="20" fill="#5d3a1f" />
                <circle cx="18" cy="350" r="18" fill="#7cc26a" />
              </g>
              <g>
                <rect x="275" y="475" width="6" height="22" fill="#5d3a1f" />
                <circle cx="278" cy="465" r="19" fill="#7cc26a" />
                <circle cx="285" cy="458" r="12" fill="#94db7d" opacity="0.85" />
              </g>
              {/* Flowers */}
              <circle cx="60" cy="640" r="2.5" fill="#ffd54f" />
              <circle cx="80" cy="650" r="2" fill="#ff8a80" />
              <circle cx="200" cy="660" r="2.5" fill="#ce93d8" />
              <circle cx="225" cy="655" r="2" fill="#ffd54f" />
              {/* Sun */}
              <circle cx="245" cy="55" r="22" fill="#ffe066" opacity="0.85" />
              <circle cx="245" cy="55" r="14" fill="#fff3b0" />

              {/* SPRING rails — vertical zigzag */}
              <path d="M 150 30 Q 70 110 150 200 Q 230 290 150 380 Q 70 470 150 560 Q 230 650 150 700"
                    fill="none" stroke="#3a2818" strokeWidth="14" strokeLinecap="round" opacity="0.65" />
              <path d="M 150 30 Q 70 110 150 200 Q 230 290 150 380 Q 70 470 150 560 Q 230 650 150 700"
                    fill="none" stroke="#5d3a1f" strokeWidth="10" strokeLinecap="round" opacity="0.5" />
              {/* Rail ties */}
              {Array.from({ length: 18 }).map((_, i) => {
                const t = i / 17; const y = 30 + t * 670;
                return <line key={`tt-${i}`} x1={138} y1={y} x2={162} y2={y} stroke="#3a2818" strokeWidth="2" opacity="0.5" />;
              })}

              {/* Spring train — small, bright pink/red */}
              <g transform="translate(150, 600)">
                <rect x="-22" y="-18" width="44" height="20" rx="4" fill="#e8523c" stroke="#7a1e10" strokeWidth="1.2" />
                <rect x="-18" y="-15" width="10" height="9" fill="#ffe082" />
                <rect x="-2" y="-15" width="10" height="9" fill="#ffe082" />
                <rect x="14" y="-12" width="6" height="9" fill="#1a1a1a" />
                <circle cx="-12" cy="6" r="5" fill="#1a1a1a" />
                <circle cx="-12" cy="6" r="2" fill="#888" />
                <circle cx="12" cy="6" r="5" fill="#1a1a1a" />
                <circle cx="12" cy="6" r="2" fill="#888" />
                {/* Smoke stack */}
                <rect x="14" y="-26" width="4" height="11" fill="#3a2818" />
                <circle cx="20" cy="-32" r="5" fill="#e0e0e0" opacity="0.8" />
                <circle cx="26" cy="-38" r="4" fill="#e0e0e0" opacity="0.6" />
              </g>

              {/* ============ SUMMER — PRACTITIONER (x: 300-600) ============ */}
              {/* River curve */}
              <path d="M 305 480 Q 380 510 455 490 Q 540 470 595 510 L 595 540 Q 540 500 455 520 Q 380 540 305 510 Z"
                    fill="url(#riverGrad)" opacity="0.85" />
              {/* River reflections */}
              <line x1="320" y1="500" x2="345" y2="500" stroke="#a8d8f0" strokeWidth="1.5" opacity="0.6" />
              <line x1="490" y1="510" x2="520" y2="510" stroke="#a8d8f0" strokeWidth="1.5" opacity="0.6" />
              {/* Summer trees — vivid green, fuller */}
              <g>
                <rect x="320" y="100" width="7" height="22" fill="#4a2c12" />
                <circle cx="324" cy="90" r="24" fill="#4a9c3e" />
                <circle cx="316" cy="80" r="15" fill="#5fb24a" opacity="0.9" />
                <circle cx="334" cy="83" r="14" fill="#5fb24a" opacity="0.85" />
              </g>
              <g>
                <rect x="565" y="130" width="7" height="22" fill="#4a2c12" />
                <circle cx="568" cy="118" r="22" fill="#4a9c3e" />
                <circle cx="578" cy="108" r="14" fill="#5fb24a" opacity="0.9" />
              </g>
              <g>
                <rect x="320" y="610" width="7" height="22" fill="#4a2c12" />
                <circle cx="324" cy="600" r="20" fill="#4a9c3e" />
              </g>
              <g>
                <rect x="568" y="630" width="7" height="22" fill="#4a2c12" />
                <circle cx="572" cy="620" r="22" fill="#4a9c3e" />
              </g>
              {/* Sailboat on river */}
              <g transform="translate(420, 488)">
                <path d="M -10 8 L 10 8 L 7 13 L -7 13 Z" fill="#5d3a1f" />
                <path d="M 0 -10 L 0 8 L -8 8 Z" fill="#fff" stroke="#5d3a1f" strokeWidth="0.8" />
              </g>
              {/* Sun */}
              <circle cx="540" cy="55" r="20" fill="#ffe066" opacity="0.9" />
              <circle cx="540" cy="55" r="13" fill="#fff3b0" />

              {/* SUMMER rails — zigzag avoiding river */}
              <path d="M 450 30 Q 370 100 450 180 Q 530 260 450 340 L 450 460 L 450 700"
                    fill="none" stroke="#3a2818" strokeWidth="14" strokeLinecap="round" opacity="0.65" />
              <path d="M 450 30 Q 370 100 450 180 Q 530 260 450 340 L 450 460 L 450 700"
                    fill="none" stroke="#5d3a1f" strokeWidth="10" strokeLinecap="round" opacity="0.5" />
              {Array.from({ length: 18 }).map((_, i) => {
                const t = i / 17; const y = 30 + t * 670;
                return <line key={`pt-${i}`} x1={438} y1={y} x2={462} y2={y} stroke="#3a2818" strokeWidth="2" opacity="0.5" />;
              })}

              {/* Summer train — blue passenger */}
              <g transform="translate(450, 250)">
                <rect x="-26" y="-20" width="52" height="22" rx="3" fill="#2c5fa8" stroke="#1a3d70" strokeWidth="1.2" />
                <rect x="-22" y="-16" width="9" height="10" fill="#a8d8f0" />
                <rect x="-9" y="-16" width="9" height="10" fill="#a8d8f0" />
                <rect x="4" y="-16" width="9" height="10" fill="#a8d8f0" />
                <rect x="17" y="-16" width="6" height="10" fill="#1a1a1a" />
                <circle cx="-15" cy="6" r="5" fill="#1a1a1a" />
                <circle cx="-15" cy="6" r="2" fill="#888" />
                <circle cx="15" cy="6" r="5" fill="#1a1a1a" />
                <circle cx="15" cy="6" r="2" fill="#888" />
              </g>

              {/* ============ AUTUMN — EXPERT (x: 600-900) ============ */}
              {/* Autumn trees — orange/red */}
              <g>
                <rect x="615" y="80" width="7" height="22" fill="#3a1f08" />
                <circle cx="618" cy="68" r="22" fill="#d35400" />
                <circle cx="610" cy="58" r="14" fill="#e67e22" opacity="0.9" />
                <circle cx="626" cy="60" r="13" fill="#f39c12" opacity="0.9" />
              </g>
              <g>
                <rect x="870" y="100" width="7" height="22" fill="#3a1f08" />
                <circle cx="873" cy="88" r="22" fill="#c0392b" />
                <circle cx="882" cy="78" r="14" fill="#e67e22" opacity="0.9" />
                <circle cx="864" cy="80" r="12" fill="#d35400" opacity="0.85" />
              </g>
              <g>
                <rect x="615" y="610" width="7" height="22" fill="#3a1f08" />
                <circle cx="619" cy="600" r="20" fill="#d35400" />
                <circle cx="610" cy="592" r="12" fill="#e67e22" opacity="0.9" />
              </g>
              <g>
                <rect x="868" y="635" width="7" height="22" fill="#3a1f08" />
                <circle cx="871" cy="624" r="20" fill="#c0392b" />
                <circle cx="880" cy="616" r="12" fill="#f39c12" opacity="0.85" />
              </g>
              {/* Falling leaves */}
              <circle cx="700" cy="200" r="2.5" fill="#e67e22" />
              <circle cx="780" cy="350" r="2" fill="#d35400" />
              <circle cx="730" cy="450" r="2.5" fill="#f39c12" />
              <circle cx="820" cy="280" r="2" fill="#c0392b" />
              {/* Setting sun (bigger, oranger) */}
              <circle cx="840" cy="60" r="25" fill="#ff7043" opacity="0.85" />
              <circle cx="840" cy="60" r="17" fill="#ffab40" />

              {/* AUTUMN rails */}
              <path d="M 750 30 Q 670 110 750 200 Q 830 290 750 380 Q 670 470 750 560 Q 830 650 750 700"
                    fill="none" stroke="#3a2818" strokeWidth="14" strokeLinecap="round" opacity="0.65" />
              <path d="M 750 30 Q 670 110 750 200 Q 830 290 750 380 Q 670 470 750 560 Q 830 650 750 700"
                    fill="none" stroke="#5d3a1f" strokeWidth="10" strokeLinecap="round" opacity="0.5" />
              {Array.from({ length: 18 }).map((_, i) => {
                const t = i / 17; const y = 30 + t * 670;
                return <line key={`et-${i}`} x1={738} y1={y} x2={762} y2={y} stroke="#3a2818" strokeWidth="2" opacity="0.5" />;
              })}

              {/* Autumn train — brown freight */}
              <g transform="translate(750, 420)">
                <rect x="-26" y="-22" width="52" height="24" rx="3" fill="#7a3b1a" stroke="#3d1c0a" strokeWidth="1.2" />
                <rect x="-22" y="-18" width="44" height="14" fill="#5a2a12" stroke="#3d1c0a" strokeWidth="0.8" />
                <line x1="-22" y1="-12" x2="22" y2="-12" stroke="#3d1c0a" strokeWidth="0.8" />
                <line x1="-22" y1="-6" x2="22" y2="-6" stroke="#3d1c0a" strokeWidth="0.8" />
                <circle cx="-15" cy="6" r="5" fill="#1a1a1a" />
                <circle cx="-15" cy="6" r="2" fill="#888" />
                <circle cx="15" cy="6" r="5" fill="#1a1a1a" />
                <circle cx="15" cy="6" r="2" fill="#888" />
              </g>

              {/* ============ WINTER — MASTER (x: 900-1200) ============ */}
              {/* Snow piles */}
              <ellipse cx="950" cy="660" rx="60" ry="16" fill="#ffffff" opacity="0.9" />
              <ellipse cx="1080" cy="675" rx="80" ry="18" fill="#ffffff" opacity="0.85" />
              <ellipse cx="1180" cy="660" rx="50" ry="14" fill="#ffffff" opacity="0.9" />
              {/* Pine trees with snow */}
              <g>
                <polygon points="930,150 950,80 970,150" fill="#1d4228" />
                <polygon points="932,135 950,90 968,135" fill="#235a30" opacity="0.85" />
                <polygon points="935,80 950,80 965,80 950,72" fill="#ffffff" />
                <rect x="947" y="150" width="6" height="14" fill="#3a1f08" />
              </g>
              <g>
                <polygon points="1170,160 1190,90 1210,160" fill="#1d4228" />
                <polygon points="1172,140 1190,100 1208,140" fill="#235a30" opacity="0.85" />
                <polygon points="1175,90 1205,90 1190,80" fill="#ffffff" />
                <rect x="1187" y="160" width="6" height="14" fill="#3a1f08" />
              </g>
              <g>
                <polygon points="930,540 950,470 970,540" fill="#1d4228" />
                <polygon points="935,475 965,475 950,465" fill="#ffffff" />
                <rect x="947" y="540" width="6" height="14" fill="#3a1f08" />
              </g>
              <g>
                <polygon points="1170,560 1190,490 1210,560" fill="#1d4228" />
                <polygon points="1175,495 1205,495 1190,485" fill="#ffffff" />
                <rect x="1187" y="560" width="6" height="14" fill="#3a1f08" />
              </g>
              {/* Moon */}
              <circle cx="1140" cy="55" r="20" fill="#fff8e1" opacity="0.95" />
              <circle cx="1148" cy="50" r="3" fill="#dcd6c0" opacity="0.6" />
              <circle cx="1135" cy="63" r="2" fill="#dcd6c0" opacity="0.6" />
              {/* Stars */}
              <circle cx="970" cy="40" r="1.5" fill="#ffffff" />
              <circle cx="1020" cy="60" r="1" fill="#ffffff" />
              <circle cx="1080" cy="35" r="1.5" fill="#ffffff" />
              <circle cx="1200" cy="80" r="1" fill="#ffffff" />
              {/* Snowflakes */}
              <circle cx="990" cy="200" r="1.2" fill="#ffffff" opacity="0.7" />
              <circle cx="1100" cy="280" r="1" fill="#ffffff" opacity="0.6" />
              <circle cx="1020" cy="350" r="1.5" fill="#ffffff" opacity="0.8" />
              <circle cx="1170" cy="400" r="1" fill="#ffffff" opacity="0.7" />
              <circle cx="950" cy="450" r="1.3" fill="#ffffff" opacity="0.7" />

              {/* WINTER rails */}
              <path d="M 1050 30 Q 970 110 1050 200 Q 1130 290 1050 380 Q 970 470 1050 560 Q 1130 650 1050 700"
                    fill="none" stroke="#1a2030" strokeWidth="14" strokeLinecap="round" opacity="0.7" />
              <path d="M 1050 30 Q 970 110 1050 200 Q 1130 290 1050 380 Q 970 470 1050 560 Q 1130 650 1050 700"
                    fill="none" stroke="#3a4560" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
              {Array.from({ length: 18 }).map((_, i) => {
                const t = i / 17; const y = 30 + t * 670;
                return <line key={`mt-${i}`} x1={1038} y1={y} x2={1062} y2={y} stroke="#1a2030" strokeWidth="2" opacity="0.6" />;
              })}

              {/* Winter train — dark blue with snow on top */}
              <g transform="translate(1050, 350)">
                <rect x="-26" y="-20" width="52" height="22" rx="3" fill="#1d3a6b" stroke="#0d1f3d" strokeWidth="1.2" />
                <rect x="-26" y="-22" width="52" height="3" fill="#ffffff" opacity="0.9" />
                <rect x="-22" y="-15" width="9" height="9" fill="#a8c8e8" />
                <rect x="-9" y="-15" width="9" height="9" fill="#a8c8e8" />
                <rect x="4" y="-15" width="9" height="9" fill="#a8c8e8" />
                <rect x="17" y="-15" width="6" height="9" fill="#1a1a1a" />
                <circle cx="-15" cy="6" r="5" fill="#1a1a1a" />
                <circle cx="-15" cy="6" r="2" fill="#888" />
                <circle cx="15" cy="6" r="5" fill="#1a1a1a" />
                <circle cx="15" cy="6" r="2" fill="#888" />
              </g>
            </g>
          ) : (
            <g>
              {/* Mobile — simplified seasonal landscape (4 horizontal stripes) */}
              {/* Spring */}
              <circle cx="350" cy="50" r="18" fill="#ffe066" opacity="0.85" />
              <g>
                <rect x="30" y="220" width="5" height="18" fill="#5d3a1f" />
                <circle cx="32" cy="210" r="16" fill="#7cc26a" />
              </g>
              {/* Summer */}
              <path d="M 0 540 Q 100 555 200 545 Q 300 535 400 555 L 400 580 Q 300 560 200 570 Q 100 580 0 565 Z"
                    fill="url(#riverGrad)" opacity="0.85" />
              <g>
                <rect x="350" y="320" width="5" height="18" fill="#4a2c12" />
                <circle cx="352" cy="310" r="16" fill="#4a9c3e" />
              </g>
              {/* Autumn */}
              <g>
                <rect x="40" y="620" width="5" height="18" fill="#3a1f08" />
                <circle cx="42" cy="610" r="16" fill="#d35400" />
              </g>
              <circle cx="345" cy="660" r="16" fill="#ff7043" opacity="0.85" />
              {/* Winter */}
              <ellipse cx="200" cy="1170" rx="180" ry="14" fill="#ffffff" opacity="0.85" />
              <g>
                <polygon points="40,990 60,930 80,990" fill="#1d4228" />
                <polygon points="45,935 75,935 60,925" fill="#ffffff" />
              </g>
              <g>
                <polygon points="320,1010 340,950 360,1010" fill="#1d4228" />
                <polygon points="325,955 355,955 340,945" fill="#ffffff" />
              </g>
              <circle cx="350" cy="930" r="14" fill="#fff8e1" opacity="0.95" />
            </g>
          )}

          {/* Territory borders */}
          {territory.borders.map((b, i) => (
            <path key={`border-${i}`} d={b} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="8 6" strokeLinecap="round" />
          ))}

          {/* Road removed — buildings distributed evenly across each zone */}
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

                const isVillage = !!bld.section.is_village;
                const stateClass = bld.isCompleted ? 'building-wrapper--completed'
                  : bld.isAiRecommended ? 'building-wrapper--ai'
                  : bld.hasProgress ? 'building-wrapper--progress' : '';
                const villageClass = isVillage ? ' building-wrapper--village' : '';

                const winRows = Math.min(Math.ceil(bHeight / 16), 3);

                return (
                  <div
                    key={bKey}
                    className="building-positioner"
                    style={{ left: `${(bx / W) * 100}%`, top: `${(by / H) * 100}%` }}
                    onClick={() => onOpenSection(bld.section.section_id, !!bld.section.is_village, bld.levelInZone)}
                    onMouseEnter={() => {
                      setHoveredBuilding(bKey);
                      setTooltip({ x: bx, y: by - bHeight - 30, building: bld, zoneColor: zone.color });
                    }}
                    onMouseLeave={() => { setHoveredBuilding(null); setTooltip(null); }}
                  >
                    <div
                      className={`building-wrapper ${stateClass}${villageClass}`}
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
                      <div className={isVillage ? 'face-top face-top--house' : 'face-top'} />
                    </div>

                    {!bld.isCompleted && bld.hasProgress && (
                      <div className="building-progress">
                        <div className="building-progress-fill" style={{ width: `${bld.progressPct}%`, backgroundColor: zone.color }} />
                      </div>
                    )}
                    {bld.isCompleted && <div className="building-badge">✓</div>}
                    {bld.isAiRecommended && !bld.isCompleted && <div className="building-icon">🔥</div>}
                    {isVillage && !bld.isAiRecommended && !bld.isCompleted && (
                      <div className="building-icon" style={{ opacity: 0.85 }}>🏘️</div>
                    )}
                    {bld.section.icon && !isVillage && !bld.isAiRecommended && !bld.isCompleted && (
                      <div className="building-icon" style={{ opacity: 0.7 }}>{bld.section.icon}</div>
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>

        {/* ===== LAYER 3: Zone Labels (HTML — on top of houses) ===== */}
        <div className="absolute inset-0 pointer-events-none z-10" style={{ '--map-scale': mapScale } as React.CSSProperties}>
          {ZONES.map((zone) => {
            const buildings = zoneData.get(zone.level) || [];
            const isCurrent = zone.level === user.current_level;
            const center = getZoneCenter(zone);
            const offset = LABEL_OFFSETS[zone.level] || { dx: 0, dy: 0, mdx: 0, mdy: 0 };
            const labelX = center.x + (isMobile ? offset.mdx : offset.dx);
            const labelY = center.y + (isMobile ? offset.mdy : offset.dy);
            const W_ = isMobile ? MW : DW;
            const H_ = isMobile ? MH : DH;
            return (
              <div
                key={`html-label-${zone.level}`}
                className="absolute select-none"
                style={{
                  left: `${(labelX / W_) * 100}%`,
                  top: `${(labelY / H_) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Main label */}
                <div
                  style={{
                    color: zone.color,
                    fontSize: isMobile ? '16px' : '28px',
                    fontWeight: 800,
                    letterSpacing: isMobile ? '2px' : '4px',
                    textTransform: 'uppercase' as const,
                    textShadow: `0 2px 8px rgba(0,0,0,0.8)`,
                    opacity: isCurrent ? 1 : 0.7,
                    textAlign: 'center' as const,
                    lineHeight: 1,
                  }}
                >
                  {zone.label}
                </div>
                {/* Decorative line */}
                <div
                  style={{
                    width: isMobile ? '50px' : '100px',
                    height: '1.5px',
                    background: `linear-gradient(90deg, transparent, ${zone.color}, transparent)`,
                    margin: `${isMobile ? 3 : 5}px auto`,
                    opacity: isCurrent ? 0.6 : 0.3,
                  }}
                />
                {/* Subtitle */}
                <div
                  style={{
                    color: zone.color,
                    fontSize: isMobile ? '9px' : '12px',
                    letterSpacing: '1.5px',
                    textAlign: 'center' as const,
                    opacity: isCurrent ? 0.7 : 0.45,
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  {buildings.length} {buildings.length === 1 ? 'раздел' : buildings.length < 5 ? 'раздела' : 'разделов'}
                </div>
              </div>
            );
          })}
        </div>

        {/* ===== LAYER 4: Tooltip ===== */}
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
