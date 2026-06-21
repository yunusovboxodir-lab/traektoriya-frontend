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

// 4 зоны = 4 территории по сюжетной географии world-map-v4.png. cx/cy — якорь подписи
// территории НАД её землёй (нормировано к полной карте). Раскладка узлов — TIER_ANCHORS ниже.
export const LEARNING_ZONES: MapZone[] = [
  { id: 'stazher', label: 'СТАЖЁР',  sub: 'ТЕРРИТОРИЯ 1', count: 0, x: 0.02, w: 0.24, cx: 0.11, cy: 0.50, accent: 'oklch(0.74 0.13 200)' },
  { id: 'praktik', label: 'ПРАКТИК', sub: 'ТЕРРИТОРИЯ 2', count: 0, x: 0.26, w: 0.24, cx: 0.42, cy: 0.34, accent: 'oklch(0.78 0.14 75)' },
  { id: 'expert',  label: 'ЭКСПЕРТ', sub: 'ТЕРРИТОРИЯ 3', count: 0, x: 0.50, w: 0.24, cx: 0.66, cy: 0.27, accent: 'oklch(0.74 0.11 155)' },
  { id: 'master',  label: 'МАСТЕР',  sub: 'ТЕРРИТОРИЯ 4', count: 0, x: 0.74, w: 0.24, cx: 0.88, cy: 0.11, accent: 'oklch(0.85 0.13 88)' },
];

// СЮЖЕТНАЯ раскладка по реальной географии world-map-v4.png (норм. 0..1).
// Путь героя — диагональ: снизу-слева → центр-океан → правое побережье → горы справа-сверху.
// Каждый тир = набор якорей-блобов {x,y,r} НА реальной суше/воде своей территории.
// Курсы раскидываются по блобам (round-robin) с круговым джиттером внутри — органичные
// кластеры-локации, а не сетка и не цепочка.
type Blob = { x: number; y: number; r: number };

const TIER_ANCHORS: Record<number, Blob[]> = {
  // T1 Стажёр — стартовый материк-остров снизу-слева (песчаная суша)
  0: [
    { x: 0.06, y: 0.60, r: 0.045 },
    { x: 0.13, y: 0.65, r: 0.05 },
    { x: 0.09, y: 0.73, r: 0.045 },
    { x: 0.18, y: 0.60, r: 0.045 },
    { x: 0.15, y: 0.72, r: 0.04 },
    { x: 0.05, y: 0.68, r: 0.035 },
  ],
  // T2 Практик — базы на воде: архипелаг в центральном океане
  1: [
    { x: 0.33, y: 0.50, r: 0.035 },
    { x: 0.40, y: 0.58, r: 0.04 },
    { x: 0.45, y: 0.50, r: 0.035 },
    { x: 0.43, y: 0.68, r: 0.04 },
    { x: 0.36, y: 0.42, r: 0.03 },
    { x: 0.50, y: 0.60, r: 0.035 },
  ],
  // T3 Эксперт — западное побережье правого континента (выход из океана на сушу): дуга
  2: [
    { x: 0.62, y: 0.38, r: 0.035 },
    { x: 0.66, y: 0.46, r: 0.04 },
    { x: 0.63, y: 0.55, r: 0.04 },
    { x: 0.69, y: 0.61, r: 0.038 },
    { x: 0.67, y: 0.34, r: 0.03 },
    { x: 0.71, y: 0.50, r: 0.035 },
  ],
  // T4 Мастер — правый континент со снежными горами; сложность растёт к правому-верхнему углу
  3: [
    { x: 0.82, y: 0.42, r: 0.045 },
    { x: 0.86, y: 0.34, r: 0.045 },
    { x: 0.90, y: 0.46, r: 0.04 },
    { x: 0.88, y: 0.24, r: 0.04 },
    { x: 0.93, y: 0.32, r: 0.038 },
    { x: 0.94, y: 0.18, r: 0.035 }, // самые сложные уроки — верхний-правый угол
  ],
};

const frac = (x: number) => x - Math.floor(x);

// Детерминированное размещение i-го курса: круговой джиттер внутри его якоря-блоба.
function placeOnAnchors(blobs: Blob[], i: number): [number, number] {
  const blob = blobs[i % blobs.length];
  const ang = frac(Math.sin((i + 1) * 12.9898) * 43758.5453) * Math.PI * 2;
  const rad = Math.sqrt(frac(Math.sin((i + 1) * 78.233) * 43758.5453)) * blob.r;
  const x = Math.min(0.97, Math.max(0.03, blob.x + Math.cos(ang) * rad));
  const y = Math.min(0.97, Math.max(0.03, blob.y + Math.sin(ang) * rad));
  return [x, y];
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

  // 6. КАЖДЫЙ КУРС = свой узел-локация, размещён по якорям-блобам своей территории.
  const nodes: MapNode[] = [];
  for (const [lvlKey, lvlCourses] of Object.entries(byLevel)) {
    const zoneIdx = LEVEL_TO_ZONE[lvlKey];
    const blobs = TIER_ANCHORS[zoneIdx] ?? TIER_ANCHORS[0];
    lvlCourses.forEach((c, cIdx) => {
      const [x, y] = placeOnAnchors(blobs, cIdx); // сюжетный кластер-локация на своей земле
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
