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
// Регионы-материки на world-map-v4.png (bbox нормировано к полной карте) —
// узлы РАЗБРАСЫВАЮТСЯ внутри своего материка как отдельные локации (не цепочкой).
const TIER_REGIONS: Record<number, { x0: number; x1: number; y0: number; y1: number }> = {
  0: { x0: 0.04, x1: 0.26, y0: 0.60, y1: 0.93 }, // Стажёр — материк снизу-слева
  1: { x0: 0.47, x1: 0.63, y0: 0.33, y1: 0.60 }, // Практик — центральный континент
  2: { x0: 0.72, x1: 0.91, y0: 0.36, y1: 0.78 }, // Эксперт — правый континент
  3: { x0: 0.80, x1: 0.97, y0: 0.09, y1: 0.33 }, // Мастер — снежные пики справа-сверху
};

const frac = (x: number) => x - Math.floor(x);

// Детерминированный «посев» n точек в регионе: джиттер-сетка → разброс без слипания.
function scatter(region: { x0: number; x1: number; y0: number; y1: number }, i: number, n: number): [number, number] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
  const rows = Math.max(1, Math.ceil(n / cols));
  const col = i % cols;
  const row = Math.floor(i / cols);
  const jx = frac(Math.sin((i + 1) * 12.9898) * 43758.5453) * 2 - 1;
  const jy = frac(Math.sin((i + 1) * 78.233) * 43758.5453) * 2 - 1;
  const lx = Math.min(0.97, Math.max(0.03, (col + 0.5) / cols + jx * (0.34 / cols)));
  const ly = Math.min(0.97, Math.max(0.03, (row + 0.5) / rows + jy * (0.34 / rows)));
  return [region.x0 + (region.x1 - region.x0) * lx, region.y0 + (region.y1 - region.y0) * ly];
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
    const region = TIER_REGIONS[zoneIdx] ?? TIER_REGIONS[0];
    const n = lvlCourses.length;
    lvlCourses.forEach((c, cIdx) => {
      const [x, y] = scatter(region, cIdx, n); // разброс по материку (отдельные локации)
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
