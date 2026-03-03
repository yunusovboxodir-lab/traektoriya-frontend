import { useState, useMemo } from 'react';
import { useLangStore, type Lang } from '../../stores/langStore';
import type { SectionCoursesResponse, CourseItem } from '../../api/learning';

/** Pick right language from bilingual text */
function bl(v: string | { ru: string; uz?: string | null } | undefined | null, lang: Lang): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return (lang === 'uz' && v.uz) ? v.uz : v.ru;
}

interface VillageViewProps {
  data: SectionCoursesResponse;
  onBack: () => void;
  onOpenCourse: (courseId: string) => void;
}

// ============================================================
// House layout positions for 5-7 houses (normalized to 500x300 SVG)
// ============================================================

const HOUSE_SLOTS: Record<number, Array<{ x: number; y: number }>> = {
  1: [{ x: 250, y: 150 }],
  2: [{ x: 160, y: 130 }, { x: 340, y: 150 }],
  3: [{ x: 120, y: 120 }, { x: 260, y: 90 }, { x: 380, y: 140 }],
  4: [{ x: 100, y: 100 }, { x: 230, y: 70 }, { x: 360, y: 110 }, { x: 200, y: 200 }],
  5: [{ x: 90, y: 80 }, { x: 220, y: 55 }, { x: 360, y: 85 }, { x: 150, y: 190 }, { x: 310, y: 200 }],
  6: [{ x: 75, y: 75 }, { x: 200, y: 50 }, { x: 340, y: 70 }, { x: 100, y: 185 }, { x: 250, y: 195 }, { x: 390, y: 180 }],
  7: [{ x: 60, y: 65 }, { x: 170, y: 42 }, { x: 280, y: 60 }, { x: 400, y: 48 }, { x: 110, y: 180 }, { x: 250, y: 195 }, { x: 370, y: 175 }],
};

// Fallback for 8+ (repeat the 7 pattern)
function getSlots(count: number): Array<{ x: number; y: number }> {
  if (count <= 0) return [];
  const clamped = Math.min(count, 7);
  const base = HOUSE_SLOTS[clamped] || HOUSE_SLOTS[7];
  if (count <= 7) return base;
  // For 8+, append extras spaced evenly
  const extra: Array<{ x: number; y: number }> = [];
  for (let i = 7; i < count; i++) {
    extra.push({ x: 80 + (i % 4) * 110, y: 240 });
  }
  return [...base, ...extra];
}

// ============================================================
// Build dashed path through houses in order
// ============================================================

function buildRoadPath(positions: Array<{ x: number; y: number }>): string {
  if (positions.length < 2) return '';
  let d = `M ${positions[0].x},${positions[0].y + 40}`;
  for (let i = 1; i < positions.length; i++) {
    d += ` L ${positions[i].x},${positions[i].y + 40}`;
  }
  return d;
}

// ============================================================
// SVG HOUSE
// ============================================================

interface HouseProps {
  x: number;
  y: number;
  index: number;
  course: CourseItem;
  lang: Lang;
  isHovered: boolean;
  onHover: (idx: number | null) => void;
  onClick: () => void;
}

function House({ x, y, index, course, lang, isHovered, onHover, onClick }: HouseProps) {
  const isCompleted = course.status === 'completed';
  const isAvailable = course.status === 'available';
  const isLocked = course.status === 'locked';

  // Colors based on state
  let wallColor = '#b0bec5'; // locked grey
  let roofColor = '#78909c';
  let doorColor = '#546e7a';
  let windowColor = '#cfd8dc';
  let numberBg = '#90a4ae';
  let opacity = 0.55;

  if (isCompleted) {
    wallColor = '#c8e6c9';
    roofColor = '#43a047';
    doorColor = '#5d4037';
    windowColor = '#a5d6a7';
    numberBg = '#43a047';
    opacity = 1;
  } else if (isAvailable) {
    wallColor = '#bbdefb';
    roofColor = '#1e88e5';
    doorColor = '#5d4037';
    windowColor = '#90caf9';
    numberBg = '#1e88e5';
    opacity = 1;
  }

  const scale = isHovered && !isLocked ? 1.12 : 1;
  const translateY = isHovered && !isLocked ? -5 : 0;

  // House dimensions
  const hW = 50; // body width
  const hH = 42; // body height
  const roofH = 22; // roof peak height

  return (
    <g
      style={{
        cursor: isLocked ? 'not-allowed' : 'pointer',
        opacity,
        transform: `translate(${x - hW / 2}px, ${y - hH - roofH + translateY}px) scale(${scale})`,
        transformOrigin: `${hW / 2}px ${hH + roofH}px`,
        transition: 'transform 0.25s ease, opacity 0.3s',
      }}
      onMouseEnter={() => !isLocked && onHover(index)}
      onMouseLeave={() => onHover(null)}
      onClick={() => !isLocked && onClick()}
    >
      {/* Glow for current available house */}
      {isAvailable && (
        <ellipse
          cx={hW / 2} cy={hH + roofH + 6}
          rx={hW / 2 + 8} ry={8}
          fill="#1e88e5" opacity={0.2}
        >
          <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2s" repeatCount="indefinite" />
        </ellipse>
      )}

      {/* Roof — triangle */}
      <polygon
        points={`0,${roofH} ${hW / 2},0 ${hW},${roofH}`}
        fill={roofColor}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth={1}
      />
      {/* Roof right slope shade */}
      <polygon
        points={`${hW / 2},0 ${hW},${roofH} ${hW / 2},${roofH}`}
        fill="rgba(0,0,0,0.1)"
      />

      {/* Body — rectangle */}
      <rect
        x={0} y={roofH}
        width={hW} height={hH}
        fill={wallColor}
        stroke="rgba(0,0,0,0.12)"
        strokeWidth={1}
        rx={1}
      />

      {/* Windows (2x2 grid) */}
      {[0, 1, 2, 3].map((wi) => {
        const wx = 6 + (wi % 2) * 22;
        const wy = roofH + 6 + Math.floor(wi / 2) * 14;
        return (
          <rect
            key={wi}
            x={wx} y={wy}
            width={10} height={9}
            fill={windowColor}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth={0.5}
            rx={1}
          />
        );
      })}

      {/* Door */}
      <rect
        x={hW / 2 - 5} y={roofH + hH - 14}
        width={10} height={14}
        fill={doorColor}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth={0.5}
        rx={1}
      />
      {/* Door knob */}
      <circle
        cx={hW / 2 + 3} cy={roofH + hH - 7}
        r={1.2}
        fill="#ffc107"
      />

      {/* Number badge above roof */}
      <circle
        cx={hW / 2} cy={-6}
        r={10}
        fill={numberBg}
        stroke="#fff"
        strokeWidth={1.5}
      />
      <text
        x={hW / 2} y={-2}
        textAnchor="middle"
        fill="#fff"
        fontSize={11}
        fontWeight="bold"
      >
        {index + 1}
      </text>

      {/* Completed checkmark */}
      {isCompleted && (
        <g transform={`translate(${hW - 4}, ${roofH - 2})`}>
          <circle r={7} fill="#43a047" stroke="#fff" strokeWidth={1} />
          <text x={0} y={3.5} textAnchor="middle" fill="#fff" fontSize={9} fontWeight="bold">✓</text>
        </g>
      )}

      {/* Lock icon for locked */}
      {isLocked && (
        <text
          x={hW / 2} y={roofH + hH / 2 + 4}
          textAnchor="middle"
          fontSize={16}
          opacity={0.5}
        >
          🔒
        </text>
      )}

      {/* Tooltip on hover */}
      {isHovered && (
        <g>
          <rect
            x={-30} y={-40}
            width={hW + 60} height={26}
            rx={6}
            fill="rgba(15,23,42,0.92)"
          />
          <text
            x={hW / 2} y={-23}
            textAnchor="middle"
            fill="#fff"
            fontSize={10}
            fontWeight="500"
          >
            {bl(course.title, lang).length > 28
              ? bl(course.title, lang).slice(0, 26) + '…'
              : bl(course.title, lang)}
          </text>
        </g>
      )}
    </g>
  );
}

// ============================================================
// VILLAGE VIEW COMPONENT
// ============================================================

export function VillageView({ data, onBack, onOpenCourse }: VillageViewProps) {
  const lang = useLangStore((s) => s.lang);
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);
  const [showList, setShowList] = useState(false);

  // Flatten all courses from all levels into ordered list
  const allCourses = useMemo(() => {
    const courses: CourseItem[] = [];
    for (const level of data.levels) {
      if (level.courses) {
        for (const c of level.courses) {
          courses.push(c);
        }
      }
    }
    return courses;
  }, [data.levels]);

  const completedCount = allCourses.filter((c) => c.status === 'completed').length;
  const totalCount = allCourses.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const slots = getSlots(allCourses.length);
  const roadPath = useMemo(() => buildRoadPath(slots.slice(0, allCourses.length)), [slots, allCourses.length]);

  if (showList) {
    // Fallback list view
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setShowList(false)} className="mb-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 group">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Назад к посёлку
        </button>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 mb-5 text-white">
          <h2 className="text-lg font-bold">{bl(data.section.title, lang)}</h2>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 bg-slate-700 rounded-full h-2">
              <div className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-emerald-400 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-sm text-emerald-400 font-bold">{completedCount}/{totalCount}</span>
          </div>
        </div>

        <div className="space-y-2">
          {allCourses.map((course, idx) => (
            <div
              key={course.id}
              onClick={() => course.status !== 'locked' && onOpenCourse(course.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                course.status === 'locked'
                  ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
                  : course.status === 'completed'
                  ? 'bg-green-50 border-green-200 cursor-pointer hover:shadow'
                  : 'bg-white border-blue-200 cursor-pointer hover:shadow-md hover:border-blue-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${
                course.status === 'completed' ? 'bg-green-500' : course.status === 'available' ? 'bg-blue-500' : 'bg-gray-400'
              }`}>
                {course.status === 'completed' ? '✓' : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm truncate ${course.status === 'completed' ? 'text-gray-500' : 'text-gray-800'}`}>
                  {bl(course.title, lang)}
                </p>
                <span className="text-xs text-gray-400">{course.duration_minutes} мин</span>
              </div>
              {course.status === 'locked' && <span className="text-sm">🔒</span>}
              {course.quiz_score != null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${course.quiz_score >= 80 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                  {course.quiz_score}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 group">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {lang === 'uz' ? 'Xaritaga' : 'На карту'}
        </button>
        <button
          onClick={() => setShowList(true)}
          className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
        >
          ☰ {lang === 'uz' ? "Ro'yxat" : 'Списком'}
        </button>
      </div>

      {/* Village card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* Village title bar */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-700/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏘️</span>
              <h2 className="text-white font-bold text-lg">{bl(data.section.title, lang)}</h2>
            </div>
            {bl(data.section.description, lang) && (
              <p className="text-slate-400 text-xs mt-1 max-w-md">{bl(data.section.description, lang)}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-emerald-400 text-xl font-bold tabular-nums">{completedCount}/{totalCount}</div>
            <div className="text-slate-500 text-[10px] uppercase tracking-wider">{lang === 'uz' ? 'bajarilgan' : 'пройдено'}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-5 py-2.5 border-b border-slate-700/30">
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-emerald-400 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* SVG Village scene */}
        <div className="relative px-2 py-4 sm:px-4 sm:py-6">
          <svg
            viewBox="0 0 500 300"
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background gradient */}
            <defs>
              <radialGradient id="village-glow" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="rgba(30,136,229,0.08)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect x={0} y={0} width={500} height={300} fill="url(#village-glow)" />

            {/* Stars */}
            {Array.from({ length: 20 }).map((_, i) => (
              <circle
                key={`star-${i}`}
                cx={25 + (i * 137 + 43) % 450}
                cy={10 + (i * 89 + 17) % 50}
                r={0.6 + (i % 3) * 0.3}
                fill="#fff"
                opacity={0.15 + (i % 5) * 0.05}
              />
            ))}

            {/* Dashed road connecting houses */}
            <path
              d={roadPath}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={2}
              strokeDasharray="6 4"
              strokeLinecap="round"
            />

            {/* Road dots at house bases */}
            {slots.slice(0, allCourses.length).map((pos, i) => (
              <circle
                key={`dot-${i}`}
                cx={pos.x}
                cy={pos.y + 40}
                r={3}
                fill={allCourses[i]?.status === 'completed' ? '#43a047' : 'rgba(255,255,255,0.2)'}
                stroke={allCourses[i]?.status === 'completed' ? '#81c784' : 'rgba(255,255,255,0.1)'}
                strokeWidth={0.8}
              />
            ))}

            {/* Houses */}
            {allCourses.map((course, idx) => {
              const pos = slots[idx];
              if (!pos) return null;
              return (
                <House
                  key={course.id}
                  x={pos.x}
                  y={pos.y}
                  index={idx}
                  course={course}
                  lang={lang}
                  isHovered={hoveredHouse === idx}
                  onHover={setHoveredHouse}
                  onClick={() => onOpenCourse(course.id)}
                />
              );
            })}

            {/* Ground elements — grass patches */}
            {[
              { x: 40, y: 260 }, { x: 150, y: 270 }, { x: 300, y: 255 },
              { x: 420, y: 265 }, { x: 230, y: 280 },
            ].map((g, i) => (
              <g key={`grass-${i}`} opacity={0.25}>
                <ellipse cx={g.x} cy={g.y} rx={12} ry={4} fill="#66bb6a" />
                <ellipse cx={g.x + 8} cy={g.y - 2} rx={8} ry={3} fill="#43a047" />
              </g>
            ))}

            {/* Small tree decorations */}
            {[{ x: 460, y: 130 }, { x: 30, y: 230 }, { x: 470, y: 240 }].map((t, i) => (
              <g key={`tree-${i}`} opacity={0.35}>
                <rect x={t.x - 1.5} y={t.y} width={3} height={10} fill="#795548" rx={1} />
                <circle cx={t.x} cy={t.y - 4} r={7} fill="#43a047" />
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>{lang === 'uz' ? "O'tilgan" : 'Пройден'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span>{lang === 'uz' ? 'Mavjud' : 'Доступен'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-400 opacity-50" />
          <span>{lang === 'uz' ? 'Qulflangan' : 'Заблокирован'}</span>
        </div>
        <div className="h-3 border-l border-gray-300 mx-1" />
        <span className="text-gray-400">{lang === 'uz' ? 'Bosing — darsni ochish' : 'Клик — открыть урок'}</span>
      </div>
    </div>
  );
}
