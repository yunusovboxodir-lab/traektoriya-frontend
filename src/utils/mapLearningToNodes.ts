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

// 4 зоны (статичны, имена/позиции из handoff)
export const LEARNING_ZONES: MapZone[] = [
  { id: 'stazher', label: 'СТАЖЁР',  sub: 'ТЕРРИТОРИЯ 1', count: 0, x: 0.02, w: 0.24, cx: 0.14, cy: 0.50, accent: 'oklch(0.74 0.13 200)' },
  { id: 'praktik', label: 'ПРАКТИК', sub: 'ТЕРРИТОРИЯ 2', count: 0, x: 0.26, w: 0.24, cx: 0.39, cy: 0.50, accent: 'oklch(0.78 0.14 75)' },
  { id: 'expert',  label: 'ЭКСПЕРТ', sub: 'ТЕРРИТОРИЯ 3', count: 0, x: 0.50, w: 0.24, cx: 0.63, cy: 0.50, accent: 'oklch(0.74 0.11 155)' },
  { id: 'master',  label: 'МАСТЕР',  sub: 'ТЕРРИТОРИЯ 4', count: 0, x: 0.74, w: 0.24, cx: 0.86, cy: 0.50, accent: 'oklch(0.85 0.13 88)' },
];

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

function aggregateState(houses: MapHouse[]): NodeState {
  const states = houses.map((h) => h.s);
  if (states.every((s) => s === 'done' || s === 'mastered')) return 'done';
  if (states.some((s) => s === 'active')) return 'active';
  if (states.some((s) => s === 'new')) return 'new';
  if (states.every((s) => s === 'locked')) return 'locked';
  return 'new';
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

  // 6. В каждом уровне группируем по 3 → посёлки. Layout по сетке 2-3 ряда внутри зоны.
  const nodes: MapNode[] = [];
  for (const [lvlKey, lvlCourses] of Object.entries(byLevel)) {
    const zoneIdx = LEVEL_TO_ZONE[lvlKey];
    const villagesInZone: FlatCourse[][] = [];
    for (let i = 0; i < lvlCourses.length; i += 3) {
      villagesInZone.push(lvlCourses.slice(i, i + 3));
    }
    // Размещаем посёлки извилистой ТРОПОЙ по территории (путь, а не сетка):
    // спускаемся сверху вниз по зоне, по горизонтали — синусоида (лево↔право).
    const villageCount = villagesInZone.length;
    villagesInZone.forEach((group, vIdx) => {
      const zone = LEARNING_ZONES[zoneIdx];
      const t = villageCount > 1 ? vIdx / (villageCount - 1) : 0.5; // 0..1 вниз по зоне
      const localY = 0.14 + t * 0.72;                               // 14%..86%
      const localX = 0.5 + 0.30 * Math.sin(vIdx * 1.15);            // центр ±30%, чередование
      const x = zone.x + zone.w * localX;
      const y = Math.min(0.92, localY);

      // Дома (3 курса в группе)
      const houses: MapHouse[] = group.map((c) => ({
        s: courseStatusToNodeState(c.status),
        course_id: c.course_id,
        course_title: c.title,
      }));
      // Pad до 3 если меньше
      while (houses.length < 3) houses.push({ s: 'locked' });

      const state = aggregateState(houses);
      // Заголовок посёлка = первый курс (укорочённый) или название секции
      const firstCourse = group[0];
      const villageTitle = firstCourse
        ? firstCourse.title.length > 22
          ? firstCourse.title.substring(0, 20) + '…'
          : firstCourse.title
        : `Группа ${vIdx + 1}`;

      const codePrefix = ['СТ', 'ПР', 'ЭК', 'МР'][zoneIdx] ?? 'XX';
      const code = `${codePrefix}-${String(vIdx + 1).padStart(2, '0')}`;

      nodes.push({
        id: `n${zoneIdx}-${vIdx}`,
        code,
        title: villageTitle,
        state,
        houses,
        zone: zoneIdx,
        x,
        y,
        sections: 3,
        done: houses.filter((h) => h.s === 'done' || h.s === 'mastered').length,
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
