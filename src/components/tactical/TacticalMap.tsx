/**
 * TacticalMap — SVG карта обучения с 4 зонами × 24 поселениями.
 * Адаптировано из tactical-map.jsx (handoff Claude Design 2026-05-01).
 */
import { useMemo } from 'react';
import type { MapNode, MapEdge as MapEdgeType, MapZone, TerritoryMode } from './types';
import { NODES as DEFAULT_NODES, EDGES as DEFAULT_EDGES, ZONES as DEFAULT_ZONES, STATE_STYLES } from './data';

interface MapNodeProps {
  node: MapNode;
  selected: boolean;
  onSelect: (node: MapNode) => void;
}

function MapNodeComponent({ node, selected, onSelect }: MapNodeProps) {
  const s = STATE_STYLES[node.state];
  const r = node.state === 'mastered' ? 22 : 18;

  const renderGlyph = () => {
    if (node.state === 'done') {
      return <path d="M -5 0 L -1 4 L 6 -5" stroke={s.stroke} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    }
    if (node.state === 'new') {
      return <path d="M -6 -2 L 0 5 L 6 -2" stroke={s.stroke} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    }
    if (node.state === 'active') {
      return <path d="M 0 -6 L 5 0 L 0 6 L -5 0 Z" stroke={s.stroke} strokeWidth="2" fill={s.stroke} fillOpacity="0.4" strokeLinejoin="round" />;
    }
    if (node.state === 'locked') {
      return (
        <g stroke={s.stroke} strokeWidth="1.6" fill="none">
          <rect x="-4.5" y="-1.5" width="9" height="7" rx="1" fill={s.stroke} fillOpacity="0.22" />
          <path d="M -3 -1.5 V -4 a 3 3 0 0 1 6 0 V -1.5" />
        </g>
      );
    }
    if (node.state === 'mastered') {
      return <path d="M 0 -8 L 2.4 -2.4 L 8 -2.4 L 3.2 1.6 L 4.8 7 L 0 4 L -4.8 7 L -3.2 1.6 L -8 -2.4 L -2.4 -2.4 Z"
        fill={s.stroke} fillOpacity="0.55" stroke={s.stroke} strokeWidth="1.3" strokeLinejoin="round" />;
    }
    return null;
  };

  // «Живой» пульс на текущем фронтире (в процессе / доступно), чтобы карта дышала
  // и подсказывала, куда идти дальше. Заблокированные/пройденные — статичны.
  const pulsing = node.state === 'active' || node.state === 'new';

  return (
    <g
      transform={`translate(${node._px ?? 0}, ${node._py ?? 0})`}
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(node)}
    >
      {pulsing && (
        <circle r={r} fill="none" stroke={s.stroke} strokeWidth="2" opacity="0.55">
          <animate attributeName="r" values={`${r};${r + 12};${r}`} dur={node.state === 'active' ? '1.8s' : '2.6s'} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.55;0;0.55" dur={node.state === 'active' ? '1.8s' : '2.6s'} repeatCount="indefinite" />
        </circle>
      )}
      {selected && <circle r={r + 6} fill="none" stroke={s.stroke} strokeWidth="1" opacity="0.5" />}
      <circle r={r} fill={s.fill} stroke={s.stroke} strokeWidth={selected ? 2 : 1.5} />
      <g>{renderGlyph()}</g>
      <text textAnchor="middle" y={r + 13}
        fontSize="9.5"
        fontFamily="Inter, sans-serif"
        fontWeight={selected ? 600 : 500}
        fill="oklch(0.85 0.02 250)"
        style={{ pointerEvents: 'none' }}>{node.title}</text>
    </g>
  );
}

interface MapEdgeProps {
  from: MapNode;
  to: MapNode;
  dim: boolean;
}

function MapEdgeComponent({ from, to, dim }: MapEdgeProps) {
  const fromState = from.state;
  const toState = to.state;
  let color = 'oklch(0.55 0.04 250)';
  if (fromState === 'done' && toState === 'done') color = 'oklch(0.70 0.13 200)';
  else if (fromState === 'done' && (toState === 'active' || toState === 'new')) color = 'oklch(0.78 0.15 220)';
  else if (fromState === 'active' || toState === 'active') color = 'oklch(0.78 0.14 75)';
  else if (toState === 'locked') color = 'oklch(0.40 0.02 250)';

  const fpx = from._px ?? 0;
  const fpy = from._py ?? 0;
  const tpx = to._px ?? 0;
  const tpy = to._py ?? 0;

  const dx = tpx - fpx;
  const dy = tpy - fpy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const bend = Math.min(dist * 0.25, 80);
  const mx = (fpx + tpx) / 2;
  const my = (fpy + tpy) / 2 - bend * Math.sign(fpy - tpy || 1) * 0.3 - 18;
  const d = `M ${fpx} ${fpy} Q ${mx} ${my} ${tpx} ${tpy}`;

  return (
    <g opacity={dim ? 0.2 : 0.7}>
      <path d={d} fill="none" stroke={color} strokeWidth="1"
        strokeDasharray="2 5" strokeLinecap="round" />
    </g>
  );
}

interface ZoneColumnProps {
  zone: MapZone;
  idx: number;
  W: number;
  H: number;
  focusZone: number | null;
  mode?: TerritoryMode;
  sourceZones: MapZone[];
}

function ZoneColumn({ zone, idx, W, H, focusZone }: ZoneColumnProps) {
  const tcx = zone.cx * W;
  const tcy = zone.cy * H;
  const dim = focusZone !== null && focusZone !== idx;
  const tint = ['oklch(0.75 0.10 220)', 'oklch(0.78 0.12 75)', 'oklch(0.75 0.12 155)', 'oklch(0.82 0.13 90)'][idx];

  // Подпись территории стоит НАД её материком (не колонка). Мягкое свечение региона.
  return (
    <g opacity={dim ? 0.3 : 1} style={{ pointerEvents: 'none' }}>
      <circle cx={tcx} cy={tcy + 42} r={86} fill={tint} opacity="0.05" />
      <text x={tcx} y={tcy} textAnchor="middle"
        fontSize="13" fontFamily="JetBrains Mono, monospace"
        letterSpacing="0.26em" fontWeight="700" fill={tint}>{zone.label}</text>
      <text x={tcx} y={tcy + 15} textAnchor="middle"
        fontSize="8" fontFamily="JetBrains Mono, monospace"
        letterSpacing="0.18em" opacity="0.6"
        fill="oklch(0.7 0.02 250)">{`T-0${idx + 1} · ${zone.count} РАЗД.`}</text>
    </g>
  );
}

function WorldMap({ W, H }: { W: number; H: number }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      <defs>
        <radialGradient id="mapVignette" cx="50%" cy="50%" r="75%">
          <stop offset="55%" stopColor="oklch(0.10 0.02 250)" stopOpacity="0" />
          <stop offset="100%" stopColor="oklch(0.06 0.02 250)" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <image href="/tactical/world-map-v4.png"
        x="0" y="0" width={W} height={H}
        preserveAspectRatio="xMidYMid slice"
        style={{ filter: 'saturate(0.55) brightness(0.78) contrast(1.10)', opacity: 0.88 }} />
      <rect width={W} height={H} fill="oklch(0.20 0.06 235)" opacity="0.22"
        style={{ mixBlendMode: 'multiply' }} />
      <rect width={W} height={H} fill="url(#mapVignette)" />
    </g>
  );
}

interface TacticalMapProps {
  focusZone: number | null;
  selectedId: string | null;
  onSelect: (node: MapNode) => void;
  territoryMode?: TerritoryMode;
  /** Динамические узлы (из learning API). Если не переданы — mock из data.ts. */
  nodes?: MapNode[];
  /** Динамические рёбра. Если не переданы — mock. */
  edges?: MapEdgeType[];
  /** Динамические зоны (с обновлёнными count). Если не переданы — mock. */
  zones?: MapZone[];
}

export function TacticalMap({
  focusZone,
  selectedId,
  onSelect,
  territoryMode = 'biome',
  nodes,
  edges,
  zones,
}: TacticalMapProps) {
  const W = 1100;
  const H = 580;

  const sourceNodes = nodes ?? DEFAULT_NODES;
  const sourceEdges = edges ?? DEFAULT_EDGES;
  const sourceZones = zones ?? DEFAULT_ZONES;

  // Полный маппинг к координатам карты-картинки → узлы стоят ровно на суше
  const placed = useMemo(
    () => sourceNodes.map((n) => ({ ...n, _px: n.x * W, _py: n.y * H })),
    [sourceNodes]
  );
  const byId = useMemo(
    () => Object.fromEntries(placed.map((n) => [n.id, n])),
    [placed]
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="55%" r="70%">
          <stop offset="0%" stopColor="oklch(0.26 0.06 220)" stopOpacity="0.55" />
          <stop offset="60%" stopColor="oklch(0.13 0.03 240)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="oklch(0.08 0.02 250)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#bgGlow)" />

      <WorldMap W={W} H={H} />

      {sourceZones.map((z, i) => (
        <ZoneColumn key={z.id} zone={z} idx={i} W={W} H={H} focusZone={focusZone} mode={territoryMode} sourceZones={sourceZones} />
      ))}

      <g>
        {sourceEdges.map(([a, b]: MapEdgeType) => {
          const fa = byId[a];
          const fb = byId[b];
          if (!fa || !fb) return null;
          const dim = focusZone !== null && fa.zone !== focusZone && fb.zone !== focusZone;
          return <MapEdgeComponent key={a + b} from={fa} to={fb} dim={dim} />;
        })}
      </g>

      <g>
        {placed.map((n) => (
          <MapNodeComponent key={n.id} node={n} selected={selectedId === n.id} onSelect={onSelect} />
        ))}
      </g>

      {/* Corner brackets */}
      {[[0, 0], [W, 0], [0, H], [W, H]].map(([cx, cy], i) => {
        const dx = cx === 0 ? 1 : -1;
        const dy = cy === 0 ? 1 : -1;
        return (
          <g key={i} stroke="oklch(0.7 0.06 220)" strokeWidth="1" opacity="0.5" fill="none">
            <line x1={cx} y1={cy} x2={cx + dx * 16} y2={cy} />
            <line x1={cx} y1={cy} x2={cx} y2={cy + dy * 16} />
          </g>
        );
      })}
    </svg>
  );
}
