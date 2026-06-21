/**
 * mapLearningToNodes — конвертирует данные learning API в Tactical Map.
 *
 * Архитектура:
 *  1. learningApi.getMap() → 10 секций
 *  2. Для каждой секции: learningApi.getSectionCourses(id) → 4 уровня курсов
 *  3. Курсы агрегируются по уровню (trainee→T1, practitioner→T2, expert→T3, master→T4)
 *  4. Внутри уровня курсы группируются по 3 → посёлок (24 посёлка из ~72 курсов)
 *  5. Состояние посёлка = aggregate состояний курсов
 *
 * Соответствие статусов:
 *   'completed'   → 'done'
 *   'in_progress' → 'active'
 *   'available'   → 'new'
 *   'locked'      → 'locked'
 *   100% + perfect score → 'mastered' (опционально)
 */
import { learningApi } from '../api/learning';
import type {
  LearningMapResponse,
  SectionCoursesResponse,
  BilingualText,
} from '../api/learning';
import type { MapEdge, MapHouse, MapNode, MapZone, NodeState } from '../components/tactical/types';

// 4 зоны = 4 ТЕРРИТОРИИ по географии world-map-v4.png. Как в стратегиях/RPG-картах:
// у каждой территории — очерченный контур (poly), а базы (узлы) равномерно ЗАПОЛНЯЮТ
// его форму. cx/cy — якорь подписи территории (норм. к полной карте).
export const LEARNING_ZONES: MapZone[] = [
  {
    id: 'stazher', label: 'СТАЖЁР', sub: 'ТЕРРИТОРИЯ 1', count: 0, x: 0.02, w: 0.24,
    cx: 0.11, cy: 0.50, accent: 'oklch(0.74 0.13 200)',
    // Стартовый материк-остров снизу-слева
    poly: [[0.04, 0.57], [0.11, 0.52], [0.20, 0.55], [0.235, 0.64], [0.215, 0.75], [0.14, 0.83], [0.055, 0.79], [0.02, 0.67]],
  },
  {
    id: 'praktik', label: 'ПРАКТИК', sub: 'ТЕРРИТОРИЯ 2', count: 0, x: 0.26, w: 0.24,
    cx: 0.41, cy: 0.355, accent: 'oklch(0.78 0.14 75)',
    // Морская зона — базы-архипелаг в центральном океане
    poly: [[0.31, 0.45], [0.40, 0.40], [0.50, 0.44], [0.535, 0.54], [0.50, 0.66], [0.42, 0.72], [0.325, 0.66], [0.29, 0.55]],
  },
  {
    id: 'expert', label: 'ЭКСПЕРТ', sub: 'ТЕРРИТОРИЯ 3', count: 0, x: 0.50, w: 0.24,
    cx: 0.655, cy: 0.275, accent: 'oklch(0.74 0.11 155)',
    // Западное побережье правого континента
    poly: [[0.595, 0.35], [0.68, 0.31], [0.745, 0.40], [0.735, 0.52], [0.70, 0.645], [0.625, 0.685], [0.575, 0.575], [0.565, 0.44]],
  },
  {
    id: 'master', label: 'МАСТЕР', sub: 'ТЕРРИТОРИЯ 4', count: 0, x: 0.74, w: 0.24,
    cx: 0.875, cy: 0.115, accent: 'oklch(0.85 0.13 88)',
    // Правый континент со снежными горами; сложнейшее — к верхнему-правому углу
    poly: [[0.80, 0.20], [0.885, 0.14], [0.965, 0.21], [0.985, 0.35], [0.955, 0.51], [0.90, 0.63], [0.815, 0.585], [0.775, 0.42], [0.78, 0.28]],
  },
];

const frac = (x: number) => x - Math.floor(x);

// Точка внутри полигона (ray-casting). poly — норм. точки контура территории.
function pointInPoly(px: number, py: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    const intersect = (yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Равномерное ЗАПОЛНЕНИЕ контура базами: детерминированная джиттер-сетка по bbox,
// оставляем точки внутри полигона, i-й курс берёт равномерно распределённую точку.
// Так базы повторяют форму территории (как в стратегиях), без сетки/цепочки/слипания.
function placeInPolygon(poly: [number, number][], i: number, n: number): [number, number] {
  let x0 = 1, x1 = 0, y0 = 1, y1 = 0;
  for (const [x, y] of poly) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const cols = Math.max(4, Math.ceil(Math.sqrt(n) * 1.9));
  const rows = cols;
  const pts: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = r * cols + c + 1;
      const jx = (frac(Math.sin(k * 12.9898) * 43758.5453) - 0.5) * 0.85;
      const jy = (frac(Math.sin(k * 78.233) * 43758.5453) - 0.5) * 0.85;
      const gx = x0 + (x1 - x0) * ((c + 0.5 + jx) / cols);
      const gy = y0 + (y1 - y0) * ((r + 0.5 + jy) / rows);
      if (pointInPoly(gx, gy, poly)) pts.push([gx, gy]);
    }
  }
  if (pts.length === 0) return [(x0 + x1) / 2, (y0 + y1) / 2];
  const idx = Math.floor((i + 0.5) * (pts.length / Math.max(1, n))) % pts.length;
  return pts[idx];
}

const LEVEL_TO_ZONE: Record<string, number> = {
  trainee: 0,
  practitioner: 1,
  expert: 2,
  master: 3,
};

interface FlatCourse {
  course_id: string;
  title: string;
  level: string;
  status: string;
  section_id: string;
  section_title: string;
}

function bilToStr(t: BilingualText | string | undefined, lang: 'ru' | 'uz' = 'ru'): string {
  if (!t) return '';
  if (typeof t === 'string') return t;
  return t[lang] || t.ru || t.uz || '';
}

function courseStatusToNodeState(status: string): NodeState {
  switch (status) {
    case 'completed': return 'done';
    case 'in_progress': return 'active';
    case 'available': return 'new';
    case 'locked':
    default: return 'locked';
  }
}

interface MapData {
  nodes: MapNode[];
  zones: MapZone[];
  edges: MapEdge[];
  totalCourses: number;
  doneCourses: number;
  loading?: boolean;
}

/**
 * Загружает все курсы пользователя через learning API и строит карту.
 * Делает ~11 параллельных запросов (1 map + N sections).
 */
export async function loadLearningMapData(role?: string, lang: 'ru' | 'uz' = 'ru'): Promise<MapData> {
  // 1. Получаем общую карту
  const mapRes = await learningApi.getMap(role || 'sales_rep');
  const map: LearningMapResponse = mapRes.data;

  // 2. Берём только секции с total > 0 (где есть курсы)
  const sectionsWithCourses = map.sections.filter((s) => (s.progress?.total ?? 0) > 0);

  if (sectionsWithCourses.length === 0) {
    return { nodes: [], zones: LEARNING_ZONES, edges: [], totalCourses: 0, doneCourses: 0 };
  }

  // 3. Параллельно загружаем курсы каждой секции
  const sectionsData = await Promise.all(
    sectionsWithCourses.map((s) =>
      learningApi.getSectionCourses(s.section_id)
        .then((r) => r.data)
        .catch(() => null)
    )
  );

  // 4. Flatten все курсы с привязкой к section + level
  const flatCourses: FlatCourse[] = [];
  for (let i = 0; i < sectionsData.length; i++) {
    const sec: SectionCoursesResponse | null = sectionsData[i];
    if (!sec) continue;
    const sectionMeta = sectionsWithCourses[i];
    const sectionTitle = bilToStr(sectionMeta.title, lang);
    for (const levelGroup of sec.levels ?? []) {
      const lvl = levelGroup.level;
      for (const c of levelGroup.courses ?? []) {
        // CourseItem использует поле id (а не course_id)
        const courseId = (c as { id?: string; course_id?: string }).id || (c as { course_id?: string }).course_id || '';
        flatCourses.push({
          course_id: courseId,
          title: bilToStr(c.title as unknown as BilingualText, lang),
          level: lvl,
          status: (c as { status?: string }).status ?? 'locked',
          section_id: sectionMeta.section_id,
          section_title: sectionTitle,
        });
      }
    }
  }

  // 5. Группируем по уровню
  const byLevel: Record<string, FlatCourse[]> = {
    trainee: [],
    practitioner: [],
    expert: [],
    master: [],
  };
  for (const c of flatCourses) {
    if (byLevel[c.level]) byLevel[c.level].push(c);
  }

  // 6. КАЖДЫЙ КУРС = база, равномерно заполняющая контур своей территории.
  const nodes: MapNode[] = [];
  for (const [lvlKey, lvlCourses] of Object.entries(byLevel)) {
    const zoneIdx = LEVEL_TO_ZONE[lvlKey];
    const poly = LEARNING_ZONES[zoneIdx]?.poly ?? LEARNING_ZONES[0].poly!;
    const n = lvlCourses.length;
    lvlCourses.forEach((c, cIdx) => {
      const [x, y] = placeInPolygon(poly, cIdx, n); // база внутри контура территории
      const st = courseStatusToNodeState(c.status);
      const title = c.title.length > 22 ? c.title.substring(0, 20) + '…' : c.title;
      const codePrefix = ['СТ', 'ПР', 'ЭК', 'МР'][zoneIdx] ?? 'XX';
      const houses: MapHouse[] = [{ s: st, course_id: c.course_id, course_title: c.title }];

      nodes.push({
        id: `n${zoneIdx}-${cIdx}`,
        code: `${codePrefix}-${String(cIdx + 1).padStart(2, '0')}`,
        title,
        state: st,
        houses,
        zone: zoneIdx,
        x,
        y,
        sections: 1,
        done: (st === 'done' || st === 'mastered') ? 1 : 0,
      });
    });
  }

  // 7. Линий между узлами нет — как на реальной карте (только пины-локации).
  const edges: MapEdge[] = [];

  // 8. Обновим count в zones
  const zonesUpdated = LEARNING_ZONES.map((z, i) => ({
    ...z,
    count: nodes.filter((n) => n.zone === i).length,
  }));

  // 9. Total/Done по реальным курсам
  const totalCourses = flatCourses.length;
  const doneCourses = flatCourses.filter((c) => c.status === 'completed').length;

  return {
    nodes,
    zones: zonesUpdated,
    edges,
    totalCourses,
    doneCourses,
  };
}
