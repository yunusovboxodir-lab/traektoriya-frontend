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

// 4 зоны = 4 материка на карте world-map-v4.png. cx/cy — якорь подписи территории
// НАД её материком (нормировано к полной карте). Путь узлов — TIER_PATHS ниже.
export const LEARNING_ZONES: MapZone[] = [
  { id: 'stazher', label: 'СТАЖЁР',  sub: 'ТЕРРИТОРИЯ 1', count: 0, x: 0.02, w: 0.24, cx: 0.16, cy: 0.54, accent: 'oklch(0.74 0.13 200)' },
  { id: 'praktik', label: 'ПРАКТИК', sub: 'ТЕРРИТОРИЯ 2', count: 0, x: 0.26, w: 0.24, cx: 0.54, cy: 0.31, accent: 'oklch(0.78 0.14 75)' },
  { id: 'expert',  label: 'ЭКСПЕРТ', sub: 'ТЕРРИТОРИЯ 3', count: 0, x: 0.50, w: 0.24, cx: 0.82, cy: 0.37, accent: 'oklch(0.74 0.11 155)' },
  { id: 'master',  label: 'МАСТЕР',  sub: 'ТЕРРИТОРИЯ 4', count: 0, x: 0.74, w: 0.24, cx: 0.89, cy: 0.07, accent: 'oklch(0.85 0.13 88)' },
];

// Путевые точки на СУШЕ (нормировано к полной карте 0..1). Узлы тиров садятся сюда —
// чтобы стоять на материках, а не висеть над океаном. Первый заход, точки нужно
// калибровать по реальной карте (итерация по скринам владельца).
const TIER_PATHS: Record<number, [number, number][]> = {
  0: [[0.09, 0.70], [0.13, 0.80], [0.19, 0.86], [0.23, 0.77], [0.21, 0.66], [0.15, 0.62]], // Стажёр — материк снизу-слева (ок)
  1: [[0.49, 0.58], [0.52, 0.50], [0.55, 0.43], [0.585, 0.37], [0.60, 0.45], [0.565, 0.53]], // Практик — центр. континент (поднял из воды)
  2: [[0.75, 0.64], [0.78, 0.56], [0.82, 0.49], [0.85, 0.43], [0.81, 0.50], [0.77, 0.58]], // Эксперт — правый континент (на сушу)
  3: [[0.83, 0.30], [0.87, 0.24], [0.90, 0.18], [0.92, 0.12], [0.88, 0.16], [0.85, 0.24]], // Мастер — снежные пики справа-сверху
};

// Точка на ломаной-тропе при параметре t∈[0,1] (интерполяция между путевыми точками)
function pointOnPath(path: [number, number][], t: number): [number, number] {
  if (path.length === 1) return path[0];
  const segs = path.length - 1;
  const p = Math.max(0, Math.min(1, t)) * segs;
  const i = Math.min(Math.floor(p), segs - 1);
  const f = p - i;
  const a = path[i];
  const b = path[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
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

  // 6. КАЖДЫЙ КУРС = свой узел-локация, размещён вдоль тропы своего материка.
  const nodes: MapNode[] = [];
  for (const [lvlKey, lvlCourses] of Object.entries(byLevel)) {
    const zoneIdx = LEVEL_TO_ZONE[lvlKey];
    const path = TIER_PATHS[zoneIdx] ?? TIER_PATHS[0];
    const n = lvlCourses.length;
    lvlCourses.forEach((c, cIdx) => {
      const tt = n > 1 ? cIdx / (n - 1) : 0.5;        // 0..1 вдоль тропы материка
      const [x, y] = pointOnPath(path, tt);
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

  // 7. Edges — последовательные внутри зоны + межзональные мосты
  const edges: MapEdge[] = [];
  for (let zi = 0; zi < 4; zi++) {
    const zoneNodes = nodes.filter((n) => n.zone === zi);
    for (let i = 0; i < zoneNodes.length - 1; i++) {
      edges.push([zoneNodes[i].id, zoneNodes[i + 1].id]);
    }
    // Мост к следующей зоне
    if (zi < 3) {
      const lastInZone = zoneNodes[zoneNodes.length - 1];
      const firstInNext = nodes.find((n) => n.zone === zi + 1);
      if (lastInZone && firstInNext) {
        edges.push([lastInZone.id, firstInNext.id]);
      }
    }
  }

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
