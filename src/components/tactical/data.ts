/**
 * Tactical Map mock data — 4 зоны × 24 посёлка × 3 дома = 72 раздела.
 * Источник: handoff Claude Design (tactical-map.jsx).
 *
 * TODO (этап 4): заменить на динамическое маппинг из реальных
 * курсов через src/utils/mapSectionsToNodes.ts.
 */
import type { MapEdge, MapNode, MapZone, StateStyle, NodeState } from './types';

export const ZONES: MapZone[] = [
  { id: 'stazher', label: 'СТАЖЁР',  sub: 'ТЕРРИТОРИЯ 1', count: 5, x: 0.02, w: 0.24, cx: 0.14, cy: 0.50, accent: 'oklch(0.74 0.13 200)' },
  { id: 'praktik', label: 'ПРАКТИК', sub: 'ТЕРРИТОРИЯ 2', count: 6, x: 0.26, w: 0.24, cx: 0.39, cy: 0.50, accent: 'oklch(0.78 0.14 75)'  },
  { id: 'expert',  label: 'ЭКСПЕРТ', sub: 'ТЕРРИТОРИЯ 3', count: 7, x: 0.50, w: 0.24, cx: 0.63, cy: 0.50, accent: 'oklch(0.74 0.11 155)' },
  { id: 'master',  label: 'МАСТЕР',  sub: 'ТЕРРИТОРИЯ 4', count: 6, x: 0.74, w: 0.24, cx: 0.86, cy: 0.50, accent: 'oklch(0.85 0.13 88)'  },
];

interface NodeDef {
  id: string;
  code: string;
  title: string;
  state: NodeState;
  houses: { s: NodeState }[];
}

function layoutNodes(zoneIdx: number, defs: NodeDef[], positions: [number, number][]): MapNode[] {
  return defs.map((d, i) => ({
    ...d,
    zone: zoneIdx,
    x: positions[i][0],
    y: positions[i][1],
  }));
}

const RAW_NODES: MapNode[] = [
  // === СТАЖЁР ===
  ...layoutNodes(0, [
    { id: 'v1', code: 'СТ-01', title: 'Старт', state: 'done',
      houses: [{ s: 'done' }, { s: 'done' }, { s: 'done' }] },
    { id: 'v2', code: 'СТ-02', title: 'CRM', state: 'done',
      houses: [{ s: 'done' }, { s: 'done' }, { s: 'done' }] },
    { id: 'v3', code: 'СТ-03', title: 'Регламент', state: 'done',
      houses: [{ s: 'done' }, { s: 'done' }, { s: 'done' }] },
    { id: 'v4', code: 'СТ-04', title: 'Поле и SKU', state: 'active',
      houses: [{ s: 'done' }, { s: 'done' }, { s: 'active' }] },
    { id: 'v5', code: 'СТ-05', title: 'Документы', state: 'new',
      houses: [{ s: 'new' }, { s: 'new' }, { s: 'new' }] },
  ], [
    [0.06, 0.30], [0.16, 0.36], [0.10, 0.55], [0.20, 0.62], [0.22, 0.40],
  ]),

  // === ПРАКТИК ===
  ...layoutNodes(1, [
    { id: 'v6',  code: 'ПР-01', title: 'Продажи', state: 'done',
      houses: [{ s: 'done' }, { s: 'done' }, { s: 'done' }] },
    { id: 'v7',  code: 'ПР-02', title: 'Pricing', state: 'active',
      houses: [{ s: 'done' }, { s: 'active' }, { s: 'new' }] },
    { id: 'v8',  code: 'ПР-03', title: 'Аналитика', state: 'active',
      houses: [{ s: 'active' }, { s: 'new' }, { s: 'new' }] },
    { id: 'v9',  code: 'ПР-04', title: 'Команда', state: 'new',
      houses: [{ s: 'new' }, { s: 'new' }, { s: 'new' }] },
    { id: 'v10', code: 'ПР-05', title: 'Промо', state: 'new',
      houses: [{ s: 'new' }, { s: 'new' }, { s: 'new' }] },
    { id: 'v11', code: 'ПР-06', title: 'Маржа', state: 'locked',
      houses: [{ s: 'locked' }, { s: 'locked' }, { s: 'locked' }] },
  ], [
    [0.29, 0.32], [0.36, 0.40], [0.31, 0.55], [0.41, 0.58], [0.46, 0.45], [0.42, 0.30],
  ]),

  // === ЭКСПЕРТ ===
  ...layoutNodes(2, [
    { id: 'v12', code: 'ЭК-01', title: 'Стратегия', state: 'new',
      houses: [{ s: 'new' }, { s: 'new' }, { s: 'new' }] },
    { id: 'v13', code: 'ЭК-02', title: 'Финансы', state: 'active',
      houses: [{ s: 'active' }, { s: 'new' }, { s: 'new' }] },
    { id: 'v14', code: 'ЭК-03', title: 'Trade-маркет.', state: 'locked',
      houses: [{ s: 'locked' }, { s: 'locked' }, { s: 'locked' }] },
    { id: 'v15', code: 'ЭК-04', title: 'KPI и спрос', state: 'locked',
      houses: [{ s: 'locked' }, { s: 'locked' }, { s: 'locked' }] },
    { id: 'v16', code: 'ЭК-05', title: 'Каналы', state: 'locked',
      houses: [{ s: 'locked' }, { s: 'locked' }, { s: 'locked' }] },
    { id: 'v17', code: 'ЭК-06', title: 'Закупки', state: 'locked',
      houses: [{ s: 'locked' }, { s: 'locked' }, { s: 'locked' }] },
    { id: 'v18', code: 'ЭК-07', title: 'Логистика', state: 'locked',
      houses: [{ s: 'locked' }, { s: 'locked' }, { s: 'locked' }] },
  ], [
    [0.53, 0.30], [0.58, 0.42], [0.54, 0.58], [0.62, 0.62], [0.66, 0.46], [0.71, 0.36], [0.69, 0.58],
  ]),

  // === МАСТЕР ===
  ...layoutNodes(3, [
    { id: 'v19', code: 'МР-01', title: 'Управление', state: 'locked',
      houses: [{ s: 'locked' }, { s: 'locked' }, { s: 'locked' }] },
    { id: 'v20', code: 'МР-02', title: 'Корп. стратег.', state: 'locked',
      houses: [{ s: 'locked' }, { s: 'locked' }, { s: 'locked' }] },
    { id: 'v21', code: 'МР-03', title: 'Лидерство', state: 'locked',
      houses: [{ s: 'locked' }, { s: 'locked' }, { s: 'locked' }] },
    { id: 'v22', code: 'МР-04', title: 'Менторство', state: 'locked',
      houses: [{ s: 'locked' }, { s: 'locked' }, { s: 'locked' }] },
    { id: 'v23', code: 'МР-05', title: 'M&A', state: 'locked',
      houses: [{ s: 'locked' }, { s: 'locked' }, { s: 'locked' }] },
    { id: 'v24', code: 'МР-∞', title: 'Visionary', state: 'mastered',
      houses: [{ s: 'mastered' }, { s: 'mastered' }, { s: 'mastered' }] },
  ], [
    [0.78, 0.32], [0.82, 0.45], [0.76, 0.58], [0.86, 0.62], [0.90, 0.50], [0.94, 0.34],
  ]),
];

// Compute aggregate done/sections
RAW_NODES.forEach((v) => {
  v.sections = v.houses.length;
  v.done = v.houses.filter((h) => h.s === 'done' || h.s === 'mastered').length;
});

export const NODES: MapNode[] = RAW_NODES;

export const EDGES: MapEdge[] = [
  ['v1', 'v2'], ['v2', 'v3'], ['v3', 'v4'], ['v3', 'v5'], ['v4', 'v5'],
  ['v4', 'v6'], ['v5', 'v7'],
  ['v6', 'v7'], ['v6', 'v8'], ['v7', 'v9'], ['v8', 'v9'], ['v9', 'v10'], ['v10', 'v11'], ['v8', 'v11'],
  ['v10', 'v12'], ['v11', 'v13'],
  ['v12', 'v13'], ['v12', 'v14'], ['v13', 'v15'], ['v14', 'v15'],
  ['v15', 'v16'], ['v14', 'v17'], ['v16', 'v17'], ['v15', 'v18'], ['v17', 'v18'],
  ['v17', 'v19'], ['v18', 'v20'],
  ['v19', 'v20'], ['v19', 'v21'], ['v20', 'v22'], ['v21', 'v22'],
  ['v22', 'v23'], ['v23', 'v24'], ['v22', 'v24'],
];

export const STATE_STYLES: Record<NodeState, StateStyle> = {
  done: { stroke: 'oklch(0.78 0.15 155)', fill: 'oklch(0.32 0.10 155)', glyph: '✓', label: 'Пройден' },
  active: { stroke: 'oklch(0.82 0.15 75)', fill: 'oklch(0.34 0.12 75)', glyph: '◆', label: 'В процессе' },
  new: { stroke: 'oklch(0.78 0.15 220)', fill: 'oklch(0.30 0.10 220)', glyph: '▲', label: 'Новый курс' },
  locked: { stroke: 'oklch(0.50 0.02 250)', fill: 'oklch(0.22 0.02 250)', glyph: '🔒', label: 'Заблокирован' },
  mastered: { stroke: 'oklch(0.85 0.15 90)', fill: 'oklch(0.40 0.13 90)', glyph: '★', label: 'Мастер' },
};
