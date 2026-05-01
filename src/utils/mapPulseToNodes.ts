/**
 * mapPulseToNodes — конвертирует UserPulse в данные Tactical Map.
 * Берёт 8 компетенций (sort_order 1-8) и распределяет по 4 зонам:
 *   Stazher (1-2), Praktik (3-4), Expert (5-6), Master (7-8)
 * Состояние узла вычисляется из pulse_pct.
 */
import type { UserPulse, CompetencyPulse } from '../api/competencies';
import type { MapEdge, MapNode, MapZone, NodeState } from '../components/tactical/types';

// 4 зоны (статичны, имена/позиции из handoff)
export const PULSE_ZONES: MapZone[] = [
  { id: 'stazher', label: 'СТАЖЁР',  sub: 'ТЕРРИТОРИЯ 1', count: 2, x: 0.02, w: 0.24, cx: 0.14, cy: 0.50, accent: 'oklch(0.74 0.13 200)' },
  { id: 'praktik', label: 'ПРАКТИК', sub: 'ТЕРРИТОРИЯ 2', count: 2, x: 0.26, w: 0.24, cx: 0.39, cy: 0.50, accent: 'oklch(0.78 0.14 75)' },
  { id: 'expert',  label: 'ЭКСПЕРТ', sub: 'ТЕРРИТОРИЯ 3', count: 2, x: 0.50, w: 0.24, cx: 0.63, cy: 0.50, accent: 'oklch(0.74 0.11 155)' },
  { id: 'master',  label: 'МАСТЕР',  sub: 'ТЕРРИТОРИЯ 4', count: 2, x: 0.74, w: 0.24, cx: 0.86, cy: 0.50, accent: 'oklch(0.85 0.13 88)' },
];

// Позиции узлов в зоне (нормализованные [0..1])
// 2 узла в каждой зоне — компактное расположение
const POSITIONS_BY_ZONE: [number, number][][] = [
  [[0.10, 0.35], [0.18, 0.62]],     // Stazher
  [[0.32, 0.38], [0.40, 0.62]],     // Praktik
  [[0.56, 0.38], [0.64, 0.62]],     // Expert
  [[0.80, 0.38], [0.88, 0.62]],     // Master
];

function pulsePctToState(pct: number, accessible: boolean): NodeState {
  if (!accessible) return 'locked';
  if (pct >= 100) return 'mastered';
  if (pct >= 75) return 'done';
  if (pct >= 25) return 'active';
  return 'new';
}

interface MapData {
  nodes: MapNode[];
  zones: MapZone[];
  edges: MapEdge[];
  totalSections: number;
  doneSections: number;
}

export function mapPulseToNodes(pulse: UserPulse | null): MapData {
  if (!pulse || !pulse.competencies?.length) {
    return { nodes: [], zones: PULSE_ZONES, edges: [], totalSections: 0, doneSections: 0 };
  }

  // Сортируем по sort_order чтобы было детерминированно
  const sorted: CompetencyPulse[] = [...pulse.competencies].sort((a, b) => a.sort_order - b.sort_order);

  const nodes: MapNode[] = sorted.slice(0, 8).map((c, idx) => {
    // Зона по индексу: 0-1 → 0, 2-3 → 1, 4-5 → 2, 6-7 → 3
    const zoneIdx = Math.floor(idx / 2);
    const posInZone = idx % 2;
    const positions = POSITIONS_BY_ZONE[zoneIdx];
    const [x, y] = positions[posInZone] ?? [0.5, 0.5];

    // Делим первые 3 курса компетенции на 3 дома
    const totalCourses = c.courses_total ?? 0;
    const completedCourses = c.courses_completed ?? 0;
    // Каждый "дом" представляет ~1/3 общих курсов
    const houseSize = Math.max(1, Math.ceil(totalCourses / 3));
    const houses = [0, 1, 2].map((houseIdx): { s: NodeState } => {
      const reqMin = houseIdx * houseSize;
      const reqMax = Math.min((houseIdx + 1) * houseSize, totalCourses);
      if (totalCourses === 0) return { s: 'locked' };
      if (completedCourses >= reqMax) return { s: 'done' };
      if (completedCourses > reqMin) return { s: 'active' };
      return { s: 'new' };
    });

    const state = pulsePctToState(c.pulse_pct, totalCourses > 0);
    const code = `T${zoneIdx + 1}-${String(posInZone + 1).padStart(2, '0')}`;

    return {
      id: `c${c.competency_id}`,
      code,
      title: c.competency_name,
      state,
      houses,
      zone: zoneIdx,
      x,
      y,
      sections: 3,
      done: houses.filter((h) => h.s === 'done' || h.s === 'mastered').length,
    };
  });

  // Edges — связываем последовательные узлы (1→2→3→...→8)
  const edges: MapEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push([nodes[i].id, nodes[i + 1].id]);
  }
  // Дополнительно — кросс-зональные связи (последний узел зоны → первый следующей)
  for (let i = 1; i < nodes.length - 1; i += 2) {
    if (nodes[i + 1]) {
      edges.push([nodes[i].id, nodes[i + 1].id]);
    }
  }

  // Обновим count в zones по факту
  const zonesUpdated = PULSE_ZONES.map((z, i) => ({
    ...z,
    count: nodes.filter((n) => n.zone === i).length,
  }));

  // Подсчёт total/done по всем компетенциям (а не только первым 3 курсам)
  const totalSections = sorted.reduce((s, c) => s + (c.courses_total ?? 0), 0);
  const doneSections = sorted.reduce((s, c) => s + (c.courses_completed ?? 0), 0);

  return { nodes, zones: zonesUpdated, edges, totalSections, doneSections };
}
